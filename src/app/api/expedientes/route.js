import { NextResponse } from "next/server";
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
        const { data: file, error: downloadError } = await supabaseAdmin.storage
          .from("expedientes")
          .download(archivo_path);

        if (downloadError) throw downloadError;

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let textoExtraido = "";

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

        console.log(textoExtraido.substring(0, 500));

        await supabaseAdmin
          .from("expedientes")
          .update({
            semaforo: "procesado",
          })
          .eq("id", expediente.id);
      } catch (error) {
        await supabaseAdmin
          .from("expedientes")
          .update({ semaforo: "error" })
          .eq("id", expediente.id);
      }
    })();

    return NextResponse.json({
      ok: true,
      mensaje: "Archivo recibido y procesando...",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      mensaje: "Error interno al procesar el archivo",
    });
  }
}
