// 📁 /lib/expedientes.js
import { supabase } from "@/lib/supabaseClient";

/**
 * Elimina un expediente por su ID.
 * Borra el registro de la tabla "expedientes" y su archivo asociado (si existe).
 */
export async function eliminarExpediente(expedienteId) {
  try {
    // Obtener el expediente para eliminar también el archivo del storage
    const { data: expediente, error: fetchError } = await supabase
      .from("expedientes")
      .select("archivo_path")
      .eq("id", expedienteId)
      .single();

    if (fetchError) throw fetchError;

    if (expediente?.archivo_path) {
      const filePath = expediente.archivo_path.replace(/^\/+/, "");
      const { error: storageError } = await supabase.storage
        .from("expedientes")
        .remove([filePath]);

      if (storageError)
        console.warn("Error al eliminar archivo:", storageError.message);
    }

    // Eliminar registro de la tabla
    const { error } = await supabase
      .from("expedientes")
      .delete()
      .eq("id", expedienteId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("Error al eliminar expediente:", err.message);
    return { success: false, error: err.message };
  }
}
