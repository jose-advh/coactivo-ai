import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { procesarArchivo } from "@/lib/documents/procesarArchivos";
import { clasificarIA } from "@/lib/documents/clasificarIA";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint principal: crea un expediente y ejecuta todo el flujo
 * de procesamiento (descarga, extracción de texto y clasificación IA).
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    if (!archivo_path || !user_id) {
      throw new Error("Faltan parámetros: archivo_path o user_id");
    }

    // Crear expediente en Supabase
    const { data: expediente, error: insertError } = await supabaseAdmin
      .from("expedientes")
      .insert({
        user_id,
        archivo_path,
        semaforo: "procesando",
      })
      .select()
      .single();

    if (insertError) throw insertError;
    console.log(`Expediente ${expediente.id} creado.`);

    // Ejecutar procesamiento y clasificación en background
    (async () => {
      try {
        console.log(`Iniciando procesamiento de archivo: ${archivo_path}`);

        // Extraer texto del documento (PDF o DOCX)
        const textoExtraido = await procesarArchivo({
          expediente_id: expediente.id,
          archivo_path,
        });

        // Enviar a la IA para clasificar y actualizar expediente
        const resultadoIA = await clasificarIA({
          expediente_id: expediente.id,
          textoExtraido,
        });

        console.log("Resultado IA:", resultadoIA);
      } catch (err) {
        console.error("Error en ejecución background:", err);
        await supabaseAdmin
          .from("expedientes")
          .update({
            semaforo: "rojo",
            observaciones: "Error en procesamiento interno",
          })
          .eq("id", expediente.id);
      }
    })();

    // Responder inmediatamente al frontend
    return NextResponse.json({
      ok: true,
      mensaje: "Expediente creado y procesamiento en curso.",
      expediente_id: expediente.id,
    });
  } catch (error) {
    console.error("Error en /api/expedientes:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error al crear expediente",
      detalle: error.message,
    });
  }
}
