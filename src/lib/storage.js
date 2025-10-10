import { supabase } from "./supabaseClient";

export async function uploadFile(file, bucket = "expedientes") {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  return { path: data.path };
}
