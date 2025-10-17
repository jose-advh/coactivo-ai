"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * ViewDocs
 *
 * Componente que lista los archivos del usuario logueado
 * basándose en la tabla "expedientes" (no en carpetas del storage).
 *
 * - Muestra nombre del archivo y dos botones:
 *   1. Descargar: descarga el archivo del storage.
 *   2. Observaciones: abre un modal con la información del expediente.
 */
export const ViewDocs = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Obtiene los archivos del usuario actual desde la tabla "expedientes".
   */
  const fetchUserFiles = async () => {
    try {
      setLoading(true);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user) return;

      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select("id, archivo_path, observaciones, semaforo") // <- agregamos semaforo
        .eq("user_id", user.id)
        .limit(10);

      if (error) throw error;

      setFiles(
        (expedientes || []).map((exp) => ({
          id: exp.id,
          name: exp.archivo_path.split("/").pop(),
          path: exp.archivo_path,
          observaciones: exp.observaciones || "Sin observaciones registradas.",
          semaforo: exp.semaforo || "Sin semáforo",
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
   */
  const handleDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from("expedientes")
        .createSignedUrl(filePath, 60 * 60);

      if (error) throw error;

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

  /**
   * Abre el modal de observaciones para el expediente seleccionado.
   */
  const handleOpenObservaciones = (expediente) => {
    setSelectedExpediente(expediente);
    setIsModalOpen(true);
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
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3 hover:bg-gray-50 transition-colors duration-200 px-2 rounded-lg overflow-hidden"
            >
              {/* Nombre del archivo */}
              <div className="flex flex-col mb-2 sm:mb-0">
                <span className="font-medium text-gray-700 truncate">
                  {file.name}
                </span>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 px-3 py-1"
                  onClick={() => handleDownload(file.path, file.name)}
                >
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-400 hover:bg-gray-50 px-3 py-1"
                  onClick={() => handleOpenObservaciones(file)}
                >
                  Observaciones
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* === MODAL OBSERVACIONES === */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!w-[90vw] !max-w-[90vw] !min-w-[90vw] max-h-[80vh] overflow-y-auto border rounded-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-800 text-center">
              Observaciones del expediente
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Revisa las observaciones registradas en el expediente.
            </DialogDescription>
          </DialogHeader>

          {selectedExpediente && (
            <div className="flex flex-col md:flex-row gap-8 mt-6">
              {/* LADO IZQUIERDO */}
              <div className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-lg font-semibold text-gray-700 mb-4">
                  Datos del expediente
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Nombre del expediente:
                    </p>
                    <p className="text-base text-gray-900 break-words">
                      {selectedExpediente.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">ID:</p>
                    <p className="text-base text-gray-900">
                      {selectedExpediente.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Semáforo:
                    </p>
                    <p className="text-base text-gray-900">
                      {selectedExpediente.semaforo}
                    </p>
                  </div>
                </div>
              </div>

              {/* LADO DERECHO */}
              <div className="w-full md:w-1/2">
                <p className="text-lg font-semibold text-gray-700 mb-3">
                  Observaciones
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm min-h-[200px] overflow-y-auto">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
                    {selectedExpediente.observaciones}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end mt-8 space-x-4">
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 text-sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm"
              onClick={() => console.log("Descargar mandamiento pendiente")}
            >
              Descargar mandamiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
