import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Crea un expediente y delega su procesamiento
export async function POST(req) {
  try {
    const body = await req.json();
    const { archivo_path, user_id } = body;

    if (!archivo_path || !user_id) {
      throw new Error("Faltan parámetros: archivo_path o user_id");
    }

    // Crear el expediente inicial en Supabase
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

    // Determinar URL base para llamar la API interna
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    // Ejecutar en background: enviar tarea a /api/procesar-archivo
    fetch("/api/procesar-archivo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expediente_id: expediente.id,
        archivo_path,
      }),
    }).catch((err) => console.error("Error al iniciar procesamiento:", err));

    return NextResponse.json({
      ok: true,
      mensaje: "Expediente creado y procesamiento iniciado.",
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
