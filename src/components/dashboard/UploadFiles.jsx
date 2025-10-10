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

export const UploadFiles = () => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Selecciona un archivo primero");

    setLoading(true);

    try {
      const { path } = await uploadFile(file, "expedientes");
      await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivo_path: path,
          user_id: user.id,
        }),
      });

      alert(`Archivo subido!`);
      setOpen(false);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black w-[40%] md:w-[70%] h-[120px] flex justify-center items-center rounded-xl cursor-pointer transform hover:scale-105 transition duration-300"
      >
        <Image
          src="/icons/upload-icon.svg"
          width={60}
          height={60}
          alt="Logo de CoactivoAI"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
          </DialogHeader>

          <input
            type="file"
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
