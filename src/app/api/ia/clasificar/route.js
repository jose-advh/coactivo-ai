import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { expediente_id, textoExtraido } = await req.json();
  return NextResponse.json(await procesarIA({ expediente_id, textoExtraido }));
}

// Procesa texto con DeepSeek a través de OpenRouter
async function procesarIA({ expediente_id, textoExtraido }) {
  try {
    const textoLimitado = textoExtraido.slice(0, 10000);

    const prompt = `
Eres un abogado experto en cobro coactivo colombiano.
Analiza el siguiente texto y devuelve únicamente un objeto JSON.

Debes extraer:
- nombre del deudor
- entidad
- valor total
- fechas (resolución y ejecutoria)
- tipo de título
Y clasificar:
- VERDE = válido y ejecutoriado
- AMARILLO = inconsistencias menores
- ROJO = no válido

Formato exacto:

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

Texto:
"""
${textoLimitado}
"""`;

    console.log("Enviando texto a DeepSeek...");

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

    console.log("Status respuesta:", response.status);
    const data = await response.json();

    if (data?.error) {
      throw new Error(data.error.message || "Error en OpenRouter");
    }

    const textoIA = data?.choices?.[0]?.message?.content?.trim() || "{}";

    // Limpieza de respuesta
    const limpio = textoIA
      .replace(/```json|```/g, "")
      .replace(/[^\{]*({[\s\S]*})[^\}]*$/, "$1")
      .trim();

    let resultado;
    try {
      resultado = JSON.parse(limpio);
    } catch {
      resultado = {
        error: "Respuesta no parseable",
        semaforo: "rojo",
        observacion: "La IA no devolvió un JSON válido",
      };
    }

    // Actualizar expediente en Supabase
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
