"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { eliminarExpediente } from "@/lib/expedientes"; // Función de eliminación aislada (principio de responsabilidad única)
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
 * Componente: ViewDocs
 *
 * Responsabilidad única:
 * Renderizar la lista de expedientes del usuario autenticado y permitir acciones sobre ellos (descargar, ver observaciones y eliminar).
 */
export const ViewDocs = () => {
  // Estados del componente
  const [files, setFiles] = useState([]); // Almacena los expedientes obtenidos
  const [loading, setLoading] = useState(true); // Controla el estado de carga
  const [selectedExpediente, setSelectedExpediente] = useState(null); // Expediente actual mostrado en el modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal de observaciones
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Estado del modal de eliminación
  const [expedienteToDelete, setExpedienteToDelete] = useState(null); // Expediente pendiente de eliminar

  /**
   * Obtiene los expedientes asociados al usuario autenticado desde la base de datos.
   *
   * Regla de Clean Code: función con una sola responsabilidad — leer datos desde Supabase.
   */
  const fetchUserFiles = async () => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data: expedientes, error } = await supabase
        .from("expedientes")
        .select("id, archivo_path, observaciones, semaforo, mandamiento_path")
        .eq("user_id", user.id)
        .limit(10);

      if (error) throw error;

      // Transformación de datos crudos a un formato legible para el componente
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
   * Genera un enlace firmado para descargar un archivo del bucket correspondiente.
   *
   * Principio: separar la lógica de negocio de la presentación.
   */
  const handleDownload = async (filePath) => {
    try {
      const bucket = filePath.startsWith("mandamientos/")
        ? "mandamientos"
        : "expedientes";

      const cleanPath = filePath.replace(/^\/+/, "");

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 60 * 60);

      if (error) throw error;

      // Descarga controlada sin recargar la página
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
   * Muestra el modal de observaciones para el expediente seleccionado.
   */
  const handleOpenObservaciones = (expediente) => {
    setSelectedExpediente(expediente);
    setIsModalOpen(true);
  };

  /**
   * Elimina el expediente seleccionado de la base de datos y actualiza la lista.
   *
   * Regla de Clean Code: manejar errores de forma clara, sin mezclar lógica de UI y negocio.
   */
  const handleDeleteExpediente = async () => {
    if (!expedienteToDelete) return;

    const result = await eliminarExpediente(expedienteToDelete.id);

    if (result.success) {
      // Se elimina visualmente de la lista tras confirmación
      setFiles((prev) =>
        prev.filter((file) => file.id !== expedienteToDelete.id)
      );
      setDeleteModalOpen(false);
    } else {
      alert("Error al eliminar: " + result.error);
    }
  };

  // Efecto: se ejecuta una vez al montar el componente
  useEffect(() => {
    fetchUserFiles();
  }, []);

  /**
   * Render principal.
   *
   * Principio: la UI debe ser declarativa, limpia y con bloques bien delimitados.
   */
  return (
    <div className="w-full md:w-[100%] bg-white rounded-xl shadow-md border border-gray-200 p-4">
      <h2 className="text-lg text-center font-semibold mb-3 text-gray-800">
        Mis expedientes
      </h2>

      {/* Estado: cargando */}
      {loading ? (
        <p className="text-center text-gray-500 py-4">Cargando archivos...</p>
      ) : files.length === 0 ? (
        // Estado: lista vacía
        <p className="text-center text-gray-500 py-4">
          No tienes expedientes subidos.
        </p>
      ) : (
        // Estado: lista con expedientes disponibles
        <ul className="divide-y divide-gray-200">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-3 hover:bg-gray-50 transition-colors duration-200 px-2 rounded-lg overflow-hidden"
            >
              {/* Información del expediente */}
              <div className="flex flex-col mb-2 sm:mb-0">
                <span className="font-medium text-gray-700 truncate">
                  {file.name}
                </span>
              </div>

              {/* Acciones del expediente */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Descargar expediente */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 px-3 py-1"
                  onClick={() => handleDownload(file.path)}
                >
                  Descargar
                </Button>

                {/* Ver observaciones */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-400 hover:bg-gray-50 px-3 py-1"
                  onClick={() => handleOpenObservaciones(file)}
                >
                  Observaciones
                </Button>

                {/* Eliminar expediente */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50 px-3 py-1"
                  onClick={() => {
                    setExpedienteToDelete(file);
                    setDeleteModalOpen(true);
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de observaciones */}
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

          {/* Contenido del modal: datos y observaciones */}
          {selectedExpediente && (
            <div className="flex flex-col md:flex-row gap-8 mt-6">
              {/* Datos básicos */}
              <div className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-lg font-semibold text-gray-700 mb-4">
                  Datos del expediente
                </p>
                <p className="text-base text-gray-900 mb-2">
                  <b>Nombre:</b> {selectedExpediente.name}
                </p>
                <p className="text-base text-gray-900 mb-2">
                  <b>ID:</b> {selectedExpediente.id}
                </p>
                <p className="text-base text-gray-900">
                  <b>Semáforo:</b> {selectedExpediente.semaforo}
                </p>
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

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800 text-center">
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              ¿Estás seguro de que deseas eliminar este expediente?
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end space-x-3 mt-6">
            {/* Cancelar acción */}
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 text-sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </Button>

            {/* Confirmar eliminación */}
            <Button
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm"
              onClick={handleDeleteExpediente}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
