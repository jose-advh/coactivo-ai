import { NextResponse } from "next/server";
import { procesarIA } from "../ia/clasificar/route";
import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    if (!archivo_path || !user_id) {
      throw new Error("Faltan parámetros: archivo_path o user_id");
    }

    // Crear el expediente inicial
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

    // Procesamiento asíncrono
    (async () => {
      try {
        console.log("📥 Descargando archivo:", archivo_path);

        // Descargar el archivo desde el storage
        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from("expedientes")
          .download(archivo_path);

        if (downloadError) throw downloadError;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let textoExtraido = "";

        // Extracción del texto según tipo de archivo
        if (archivo_path.toLowerCase().endsWith(".pdf")) {
          const { default: pdfParse } = await import("pdf-parse");
          const parsed = await pdfParse(buffer);
          textoExtraido = parsed.text;
        } else if (archivo_path.toLowerCase().endsWith(".docx")) {
          const { value } = await mammoth.extractRawText({ buffer });
          textoExtraido = value;
        } else {
          throw new Error("Formato no soportado (solo PDF o DOCX)");
        }

        console.log("Texto extraído (primeros 500 caracteres):");
        console.log(textoExtraido.substring(0, 500));

        // Marcar expediente como procesado (antes de IA)
        await supabaseAdmin
          .from("expedientes")
          .update({ semaforo: "procesado" })
          .eq("id", expediente.id);

        // Clasificación con DeepSeek
        try {
          const result = await procesarIA({
            expediente_id: expediente.id,
            textoExtraido,
          });

          console.log("Respuesta IA:", result);
        } catch (iaError) {
          console.error("Error llamando a IA:", iaError);
          await supabaseAdmin
            .from("expedientes")
            .update({ semaforo: "error_ia" })
            .eq("id", expediente.id);
        }
      } catch (error) {
        console.error("Error procesando archivo:", error);
        await supabaseAdmin
          .from("expedientes")
          .update({ semaforo: "error" })
          .eq("id", expediente.id);
      }
    })();

    // Respuesta inmediata al cliente
    return NextResponse.json({
      ok: true,
      mensaje: "Archivo recibido y procesando en background...",
    });
  } catch (error) {
    console.error("Error general:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el archivo",
      detalle: error.message,
    });
  }
}
