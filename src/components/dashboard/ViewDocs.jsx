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
 * Lista los expedientes del usuario logueado desde la tabla "expedientes".
 * Si un expediente tiene un mandamiento generado, muestra la opción de descargarlo.
 */
export const ViewDocs = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Obtiene los expedientes del usuario autenticado.
   */
  const fetchUserFiles = async () => {
    try {
      setLoading(true);

      // Obtener sesión actual
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user) return;

      // Consultar expedientes del usuario
      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select("id, archivo_path, observaciones, semaforo, mandamiento_path")
        .eq("user_id", user.id)
        .limit(10);

      if (error) throw error;

      // Formatear datos
      setFiles(
        (expedientes || []).map((exp) => ({
          id: exp.id,
          name: exp.archivo_path.split("/").pop(),
          path: exp.archivo_path,
          observaciones: exp.observaciones || "Sin observaciones registradas.",
          semaforo: exp.semaforo || "Sin semáforo",
          mandamientoPath: exp.mandamiento_path || null,
        }))
      );
    } catch (err) {
      console.error("Error al obtener expedientes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descarga un archivo del bucket correcto en Supabase Storage.
   *
   * Detecta automáticamente si el archivo pertenece a "expedientes" o "mandamientos".
   */
  const handleDownload = async (filePath) => {
    try {
      if (!filePath) throw new Error("Ruta de archivo no válida.");

      // Detectar bucket según la ruta o tipo de archivo
      const bucket = filePath.startsWith("mandamientos/")
        ? "mandamientos"
        : "expedientes";

      // Asegurar que no haya slashes iniciales
      const cleanPath = filePath.replace(/^\/+/, "");

      // Generar URL firmada
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 60 * 60);

      if (error) throw error;

      // Crear enlace temporal para descarga
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = cleanPath.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error al descargar archivo:", err.message);
    }
  };

  /**
   * Abre el modal con los detalles y observaciones de un expediente.
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

      {/* Mostrar estado de carga */}
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
              {/* Nombre del expediente */}
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
                  onClick={() => handleDownload(file.path)}
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

      {/* Modal de Observaciones */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!w-[90vw] !max-w-[90vw] max-h-[80vh] overflow-y-auto border rounded-2xl p-8">
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
              {/* Datos del expediente */}
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

              {/* Observaciones */}
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

          {/* Footer del modal */}
          <DialogFooter className="flex justify-end mt-8 space-x-4">
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 text-sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cerrar
            </Button>

            {/* Mostrar botón solo si existe mandamiento */}
            {selectedExpediente?.mandamientoPath && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm"
                onClick={() =>
                  handleDownload(selectedExpediente.mandamientoPath)
                }
              >
                Descargar mandamiento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
