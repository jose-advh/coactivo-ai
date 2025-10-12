import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json();
  return NextResponse.json(await procesarIA(body));
}

async function procesarIA({ expediente_id, textoExtraido }) {
  try {
    // Limitar texto
    const textoLimitado = textoExtraido.slice(0, 10000);

    const prompt = `
Eres un abogado experto en cobro coactivo colombiano.
Analiza el siguiente texto y devuelve únicamente un objeto JSON, sin explicaciones ni comentarios.

Debes extraer:
- nombre del deudor
- entidad
- valor total
- fechas (resolución y ejecutoria)
- tipo de título (resolución, sentencia, etc.)

Luego clasifica el título según:
- VERDE = válido y ejecutoriado
- AMARILLO = con inconsistencias menores
- ROJO = no válido

Devuelve **únicamente JSON válido**, con este formato exacto (sin texto adicional):

{
  "nombre": "",
  "entidad": "",
  "valor": "",
  "fecha_resolucion": "",
  "fecha_ejecutoria": "",
  "tipo_titulo": "",
  "semaforo": "",
  "observacion": ""
}

Texto para analizar:
"""
${textoLimitado}
"""
`;

    console.log("Enviando texto a DeepSeek...");

    // Llamado a la API de OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1:free",
          messages: [
            {
              role: "system",
              content: "Eres un abogado experto en cobro coactivo colombiano.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data?.error) {
      console.error("Error de OpenRouter:", data.error);
      throw new Error(data.error.message || "Error en OpenRouter");
    }

    const textoIA = data?.choices?.[0]?.message?.content?.trim() || "{}";

    console.log("Respuesta IA (cruda):", textoIA.substring(0, 200));

    // Limpieza del texto
    const limpio = textoIA
      .replace(/```json|```/g, "")
      .replace(/<\｜.*?\｜>/g, "")
      .replace(/[^\{]*({[\s\S]*})[^\}]*$/, "$1")
      .trim();

    let resultado;
    try {
      resultado = JSON.parse(limpio);
    } catch (err) {
      console.warn("No se pudo parsear JSON, respuesta sucia:", limpio);
      resultado = {
        error: "Respuesta no parseable",
        semaforo: "rojo",
        observacion: "La IA no devolvió un JSON válido",
      };
    }

    // Actualizar Supabase
    await supabaseAdmin
      .from("expedientes")
      .update({
        titulo: resultado.tipo_titulo || null,
        semaforo: resultado.semaforo?.toLowerCase() || "pendiente",
        observaciones: resultado.observacion || "",
      })
      .eq("id", expediente_id);

    console.log("Clasificación guardada en Supabase");

    return { ok: true, resultado };
  } catch (error) {
    console.error("Error en procesarIA:", error);
    return {
      ok: false,
      resultado: {
        semaforo: "rojo",
        observacion: "Error al conectar con la IA o procesar respuesta",
      },
    };
  }
}

//
