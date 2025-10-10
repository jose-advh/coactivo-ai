import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extract } from "pdf-extraction";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

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

    (async () => {
      try {
        console.log("Descargando archivo:", archivo_path);
        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from("expedientes")
          .download(archivo_path);

        if (downloadError) throw downloadError;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let textoExtraido = "";

        if (archivo_path.endsWith(".pdf")) {
          const { text } = await extract(buffer);
          textoExtraido = text;
        } else if (archivo_path.endsWith(".docx")) {
          const { value } = await mammoth.extractRawText({ buffer });
          textoExtraido = value;
        } else {
          throw new Error("Formato no soportado");
        }

        console.log("Texto extraído (primeros 500 caracteres):");
        console.log(textoExtraido.substring(0, 500));
      } catch (error) {
        console.error("Error procesando archivo:", error);
      }
    })();

    return NextResponse.json({
      ok: true,
      mensaje: "Archivo recibido y procesando...",
    });
  } catch (error) {
    console.error("Error general:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el archivo",
    });
  }
}
