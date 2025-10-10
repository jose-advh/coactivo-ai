import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/build/pdf.worker.mjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    // 1️Crear registro inicial
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
        console.log("Descargando archivo:", archivo_path);

        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from("expedientes")
          .download(archivo_path);

        if (downloadError) throw downloadError;

        const arrayBuffer = await file.arrayBuffer();

        let textoExtraido = "";

        // Extracción PDF
        if (archivo_path.endsWith(".pdf")) {
          const pdfData = new Uint8Array(arrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
          const numPages = pdf.numPages;

          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            textoExtraido += pageText + "\n";
          }
        }

        // Extracción DOCX
        else if (archivo_path.endsWith(".docx")) {
          const { value } = await mammoth.extractRawText({
            buffer: arrayBuffer,
          });
          textoExtraido = value;
        } else {
          throw new Error("Formato no soportado, usa PDF o DOCX");
        }

        console.log("Texto extraído (primeros 500 caracteres):");
        console.log(textoExtraido.substring(0, 1000));
      } catch (error) {
        console.error("Error procesando archivo:", error);
      }
    })();

    return NextResponse.json({
      ok: true,
      mensaje: "Archivo recibido y procesando...",
    });
  } catch (error) {
    console.error("❌ Error general:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el archivo",
    });
  }
}
