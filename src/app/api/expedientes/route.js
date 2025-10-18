import { NextResponse } from "next/server";
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
    console.log(`Expediente ${expediente.id} creado.`);

    // Llamar al worker remoto
    await fetch(process.env.WORKER_URL + "/procesar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expediente_id: expediente.id,
        archivo_path,
        user_id,
      }),
    });

    return NextResponse.json({ ok: true, expediente });
  } catch (err) {
    console.error("Error en Next API:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
