import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Clasifica el contenido de un expediente usando la IA de DeepSeek vía OpenRouter.
 *
 * @param {Object} params
 * @param {string} params.expediente_id - ID del expediente en Supabase
 * @param {string} params.textoExtraido - Texto procesado desde el documento
 * @returns {Promise<{ ok: boolean, resultado: Object }>}
 */
export async function clasificarIA({ expediente_id, textoExtraido }) {
  console.log("IA");
}
