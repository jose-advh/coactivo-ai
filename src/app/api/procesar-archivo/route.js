import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PDFParser from "pdf2json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extrae texto de un archivo PDF usando pdf2json
async function extraerTextoPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      reject(errData.parserError)
    );

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

// Procesa el archivo y envía el texto a la IA
export async function POST(req) {
  try {
    const body = await req.json();
    const { expediente_id, archivo_path } = body;

    if (!expediente_id || !archivo_path) {
      throw new Error("Faltan parámetros: expediente_id o archivo_path");
    }

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
      .eq("id", expediente_id);

    // Llamar a la ruta de IA para clasificar
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    fetch(`${baseUrl}/api/ia/clasificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expediente_id, textoExtraido }),
    });

    const result = await response.json();
    console.log("Respuesta IA:", result);

    return NextResponse.json({ ok: true, mensaje: "Archivo procesado." });
  } catch (error) {
    console.error("Error en /api/procesar-archivo:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error procesando archivo",
      detalle: error.message,
    });
  }
}
