import { NextResponse } from "next/server";
import { procesarIA } from "../ia/clasificar/route";
import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/build/pdf.worker.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    // Crea el expediente inicial
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

    // Procesamiento asincrónico del archivo
    (async () => {
      try {
        console.log("Descargando archivo:", archivo_path);

        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from("expedientes")
          .download(archivo_path);

        if (downloadError) throw downloadError;

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let textoExtraido = "";

        // Extracción del texto
        if (archivo_path.endsWith(".pdf")) {
          const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
          let texto = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(" ");
            texto += pageText + "\n";
          }

          textoExtraido = texto;
        } else if (archivo_path.endsWith(".docx")) {
          const { value } = await mammoth.extractRawText({
            buffer: uint8Array,
          });
          textoExtraido = value;
        } else {
          throw new Error("Formato no soportado");
        }

        console.log("Texto extraído (primeros 500 caracteres):");
        console.log(textoExtraido.substring(0, 500));

        // Marca el expediente como procesado
        await supabaseAdmin
          .from("expedientes")
          .update({ semaforo: "procesado" })
          .eq("id", expediente.id);

        // Llamado a la API de deepseek
        try {
          const result = await procesarIA({
            expediente_id: expediente.id,
            textoExtraido,
          });

          console.log("Respuesta IA:", result);
        } catch (error) {
          console.error("Error procesando archivo:", error);
        }
      } catch (error) {
        console.error("Error procesando archivo:", error);
      }
    })();

    // Responde al cliente inmediatamente
    return NextResponse.json({
      ok: true,
      mensaje: "Archivo recibido y procesando en background...",
    });
  } catch (error) {
    console.error("Error general:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el archivo",
    });
  }
}
