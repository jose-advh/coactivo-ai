"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadFile } from "@/lib/storage";

export const UploadFiles = () => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado del progreso y mensaje dinámico
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Preparando archivo...");

  // Simulación del progreso animado (puedes adaptarlo al progreso real si lo tienes)
  useEffect(() => {
    let timer;
    if (loading) {
      setProgress(0);
      setMessage("Preparando archivo...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setMessage("Completado ✅");
            setTimeout(() => setOpen(false), 1200);
            return 100;
          }
          if (p < 30) setMessage("Subiendo archivo...");
          else if (p < 70) setMessage("Procesando...");
          else if (p < 95) setMessage("Finalizando...");
          return p + 2 + Math.random() * 3;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [loading]);

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
      const { path } = await uploadFile(file, "expedientes");

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

      // La animación de progreso se encargará de cerrar la modal
      setFile(null);
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert("Hubo un error al subir o procesar el archivo.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón principal */}
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

      {/* Modal principal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90vw] max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-2xl backdrop-blur-lg bg-white/90">
          {loading ? (
            <>
              {/* 👇 Título oculto para accesibilidad */}
              <VisuallyHidden>
                <DialogTitle>Cargando archivo</DialogTitle>
              </VisuallyHidden>

              <motion.div
                className="flex flex-col items-center justify-center py-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                  className="w-14 h-14 border-4 border-t-transparent border-black rounded-full mb-6"
                />
                <p className="text-gray-700 font-medium text-center mb-4">
                  {message}
                </p>
                <Progress
                  value={progress}
                  className="w-full h-3 rounded-full"
                />
              </motion.div>
            </>
          ) : (
            <>
              <DialogTitle className="text-lg font-semibold text-gray-800 mb-4">
                Subir Archivo
              </DialogTitle>

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-2 w-full"
              />

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={loading}>
                  Confirmar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
