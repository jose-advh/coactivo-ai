import mammoth from "mammoth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PDFParser from "pdf2json";
export const runtime = "nodejs";

/**
 * Extrae el texto de un archivo PDF usando pdf2json.
 * @param {Buffer} buffer - Contenido del archivo PDF.
 * @returns {Promise<string>} - Texto extraído.
 */

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

/**
 * Procesa un archivo: descarga desde Supabase, extrae texto (PDF o DOCX),
 * actualiza el expediente, y llama a la IA para clasificar.
 *
 * @param {Object} params
 * @param {string} params.expediente_id - ID del expediente en Supabase.
 * @param {string} params.archivo_path - Ruta del archivo en el bucket.
 * @returns {Promise<{ ok: boolean, mensaje: string, detalle?: string }>}
 */
export async function procesarArchivo({ expediente_id, archivo_path }) {
  try {
    if (!expediente_id || !archivo_path) {
      throw new Error("Faltan parámetros: expediente_id o archivo_path");
    }

    console.log("Descargando archivo desde Supabase:", archivo_path);

    const { data: file, error: downloadError } = await supabaseAdmin.storage
      .from("expedientes")
      .download(archivo_path);

    if (downloadError) throw downloadError;

    if (downloadError) {
      console.error("❌ Error al descargar desde Supabase:", downloadError);
      throw downloadError;
    }

    if (!file) {
      console.error("❌ No se encontró el archivo en Supabase:", archivo_path);
      throw new Error("Archivo no encontrado");
    }

    console.log(
      "✅ Archivo descargado correctamente:",
      file.type,
      file.size || file.byteLength
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Buffer listo:", buffer.length, "bytes");

    let textoExtraido = "";
    if (archivo_path.toLowerCase().endsWith(".pdf")) {
      console.log("Intentando extraer texto PDF...");
      textoExtraido = await extraerTextoPDF(buffer);
      console.log("✅ PDF procesado con éxito");
    } else if (archivo_path.toLowerCase().endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({ buffer });
      textoExtraido = value;
    } else {
      throw new Error("Formato no soportado (solo PDF o DOCX)");
    }

    console.log("Texto extraído (primeros 500 caracteres):");
    console.log(textoExtraido.substring(0, 500));

    // Actualiza el estado en la base de datos
    await supabaseAdmin
      .from("expedientes")
      .update({ semaforo: "procesado" })
      .eq("id", expediente_id);

    // Importa la función de IA directamente en lugar de usar fetch
    const { clasificarIA } = await import("@/lib/ia/clasificarIA");

    // Ejecuta la IA directamente sin hacer una petición HTTP
    const result = await clasificarIA({ expediente_id, textoExtraido });

    console.log("Resultado de clasificación IA:", result);

    return {
      textoExtraido,
    };
  } catch (error) {
    console.error("Error en procesarArchivo:", error);
    return {
      ok: false,
      mensaje: "Error procesando archivo",
      detalle: error.message,
    };
  }
}
