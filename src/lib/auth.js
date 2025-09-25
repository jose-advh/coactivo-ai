import { supabase } from "./supabaseClient";

export async function registerAbogado(nombre, correo, password) {
  const correoLimpio = correo.trim();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: correoLimpio,
    password,
  });

  if (authError) return { error: authError };
  const user = authData.user;

  // Save

  const { error: insertError } = await supabase.from("abogados").insert([
    {
      nombre,
      correo,
      user_id: user.id,
    },
  ]);

  if (insertError) return { error: insertError };

  return { data: user };
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
