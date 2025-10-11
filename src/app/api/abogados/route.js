import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin.from("abogados").insert([
      {
        id_usuario: body.id_usuario,
        nombre: body.nombre,
        correo: body.correo,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Error insertando abogado:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
