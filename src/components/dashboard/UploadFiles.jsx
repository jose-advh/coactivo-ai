"use client";

import { useState } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/storage";

/**
 * Componente para subir archivos al bucket de Supabase.
 * - Permite seleccionar un archivo PDF o DOCX.
 * - Lo sube al bucket 'expedientes'.
 * - Envía la información a la API para procesarlo en segundo plano.
 */
export const UploadFiles = () => {
  const { user } = useUser(); // Hook que obtiene el usuario actual
  const [open, setOpen] = useState(false); // Control del modal
  const [file, setFile] = useState(null); // Archivo seleccionado
  const [loading, setLoading] = useState(false); // Estado de carga

  /**
   * Maneja el evento de carga del archivo
   * 1. Verifica que haya un archivo seleccionado.
   * 2. Lo sube al bucket de Supabase.
   * 3. Llama a la API de expedientes para procesarlo.
   */
  const handleUpload = async () => {
    if (!file) {
      alert("Selecciona un archivo primero.");
      return;
    }

    if (!user?.id) {
      alert("Usuario no autenticado.");
      return;
    }

    setLoading(true);

    try {
      // Subir archivo al bucket 'expedientes'
      const { path } = await uploadFile(file, "expedientes");

      // Enviar datos del archivo al backend para procesarlo
      const response = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivo_path: path,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.mensaje || "Error al procesar el expediente.");
      }

      alert("Archivo subido correctamente. Procesando en segundo plano...");
      setOpen(false);
      setFile(null);
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert("Hubo un error al subir o procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón principal para abrir el modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black w-[40%] md:w-[20%] h-[120px] flex justify-center items-center rounded-xl cursor-pointer transform hover:scale-105 transition duration-300"
      >
        <Image
          src="/icons/upload-icon.svg"
          width={60}
          height={60}
          alt="Subir archivo"
        />
      </button>

      {/* Modal para subir archivo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
          </DialogHeader>

          {/* Selector de archivo */}
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-4"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? "Subiendo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
