import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { clasificarIA } from "@/lib/ia/clasificarIA";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint principal: sube el archivo, crea expediente y ejecuta procesamiento en background.
 */
export async function POST(req) {
  try {
    // Recibir archivo y user_id desde FormData (más seguro que JSON)
    const formData = await req.formData();
    const file = formData.get("file");
    const user_id = formData.get("user_id");

    if (!file || !user_id) {
      throw new Error("Faltan parámetros: file o user_id");
    }

    // Generar nombre y ruta única del archivo
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const archivo_path = `${user_id}/${fileName}`;

    console.log("Subiendo archivo a Supabase Storage:", archivo_path);

    // Convertir el archivo en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo al bucket "expedientes"
    const { error: uploadError } = await supabaseAdmin.storage
      .from("expedientes")
      .upload(archivo_path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    console.log("Archivo subido correctamente a Storage.");

    // Crear expediente en la base de datos
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

    // Ejecutar procesamiento en background
    (async () => {
      try {
        console.log(`Iniciando procesamiento de archivo: ${archivo_path}`);

        const { textoExtraido } = await procesarArchivo({
          expediente_id: expediente.id,
          archivo_path,
        });

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

    // Responder inmediatamente
    return NextResponse.json({
      ok: true,
      mensaje: "Expediente creado y procesamiento en curso.",
      expediente_id: expediente.id,
      archivo_path,
    });
  } catch (error) {
    console.error("Error en /api/expedientes:", error);
    return NextResponse.json({
      ok: false,
      mensaje: "Error al crear expediente o subir archivo",
      detalle: error.message,
    });
  }
}
