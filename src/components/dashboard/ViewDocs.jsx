"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

/**
 * ViewDocs
 *
 * Componente que lista los archivos del usuario logueado
 * basándose en la tabla "expedientes" (no en carpetas del storage).
 *
 * - Muestra nombre del archivo y dos botones:
 *   1. Descargar: descarga el archivo del storage.
 *   2. Observaciones: pendiente de implementación.
 */
export const ViewDocs = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Obtiene los archivos del usuario actual desde la tabla "expedientes".
   * No se asume ninguna carpeta específica en el storage.
   */
  const fetchUserFiles = async () => {
    try {
      setLoading(true);

      // Obtener usuario actual
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user) return;

      // Consultar la tabla expedientes, solo los del usuario
      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select("id, archivo_path")
        .eq("user_id", user.id)
        .limit(10);

      if (error) throw error;

      // Mapear los archivos a un formato usable
      setFiles(
        (expedientes || []).map((exp) => ({
          id: exp.id,
          name: exp.archivo_path.split("/").pop(), // obtener solo el nombre del archivo
          path: exp.archivo_path,
        }))
      );
    } catch (err) {
      console.error("Error al obtener expedientes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descarga el archivo seleccionado desde Supabase Storage.
   * @param {string} filePath - Ruta completa del archivo en el bucket.
   * @param {string} fileName - Nombre con el que se descargará.
   */
  const handleDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from("expedientes")
        .createSignedUrl(filePath, 60 * 60);

      if (error) throw error;

      // Crear enlace temporal y descargar
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = filePath;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error al descargar archivo:", err.message);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, []);

  return (
    <div className="w-full md:w-[100%] bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <h2 className="text-lg text-center font-semibold mb-3 text-gray-800">
        Mis expedientes
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 py-4">Cargando archivos...</p>
      ) : files.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No tienes expedientes subidos.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between py-3 hover:bg-gray-50 transition-colors duration-200 px-2 rounded-lg"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-700 truncate">
                  {file.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => handleDownload(file.path, file.name)}
                >
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-400 hover:bg-gray-50"
                  onClick={() => console.log("Observaciones pendiente")}
                >
                  Observaciones
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
