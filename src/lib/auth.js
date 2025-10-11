import { supabase } from "./supabaseClient";

export async function registerAbogado(nombre, correo, password) {
  const correoLimpio = correo.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: correoLimpio,
    password,
  });

  if (authError) throw authError;

  await fetch("/api/abogados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_usuario: authData.user.id,
      nombre,
      correo: correoLimpio,
    }),
  });

  return authData;
}

export async function loginAbogado(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function logoutAbogado() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
