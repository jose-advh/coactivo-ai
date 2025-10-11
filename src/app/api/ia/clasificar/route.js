import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function procesarIA({ expediente_id, textoExtraido }) {
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

Devuelve **únicamente JSON válido**, con este formato exacto, no añadas texto extra ni nada, solo el JSON!:

EN OBSERVACION DEBES AÑADIR UNA OBSERVACION SOBRE EL DOCUMENTO SOBRE SI ES VERDE, AMARILLO o ROJO!
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
${textoExtraido}
"""
`;

  try {
    // Llamado a la API de DeepSeek
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
    const textoIA = data?.choices?.[0]?.message?.content?.trim() || "{}";

    const limpio = textoIA
      .replace(/```json|```/g, "")
      .replace(/<\｜.*?\｜>/g, "")
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

    // Actualiza el expediente
    await supabaseAdmin
      .from("expedientes")
      .update({
        titulo: resultado.tipo_titulo,
        semaforo: resultado.semaforo?.toLowerCase() || "pendiente",
        observaciones: resultado.observacion || "",
      })
      .eq("id", expediente_id);

    return { ok: true, resultado };
  } catch (error) {
    console.error("Error en procesarIA:", error);
    return {
      ok: false,
      resultado: {
        semaforo: "rojo",
        observacion: "Error al conectar con la IA",
      },
    };
  }
}

// Endpoint HTTP
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await procesarIA(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error general en /ia/clasificar:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el documento",
    });
  }
}
