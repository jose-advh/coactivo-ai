import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function extraerTextoPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const texto = pdfData.Pages.map((page) =>
          page.Texts.map((t) =>
            decodeURIComponent(t.R.map((r) => r.T).join(""))
          ).join(" ")
        ).join("\n");
        resolve(texto);
      } catch (e) {
        reject(e);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    if (!archivo_path || !user_id) {
      throw new Error("Faltan parámetros: archivo_path o user_id");
    }

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

        if (archivo_path.toLowerCase().endsWith(".pdf")) {
          textoExtraido = await extraerTextoPDF(buffer);
        } else if (archivo_path.toLowerCase().endsWith(".docx")) {
          const { value } = await mammoth.extractRawText({ buffer });
          textoExtraido = value;
        } else {
          throw new Error("Formato no soportado (solo PDF o DOCX)");
        }

        console.log("Texto extraído (primeros 500 caracteres):");
        console.log(textoExtraido.substring(0, 500));

        await supabaseAdmin
          .from("expedientes")
          .update({ semaforo: "procesado" })
          .eq("id", expediente.id);

        try {
          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";

          const response = await fetch(`${baseUrl}/api/ia/clasificar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              expediente_id: expediente.id,
              textoExtraido,
            }),
          });

          const result = await response.json();
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
