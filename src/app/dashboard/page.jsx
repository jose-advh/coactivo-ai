"use client";

import Image from "next/image";
import { useState } from "react";
import { uploadFile } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function dashboard() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const handleUpload = async () => {
    try {
      const { path } = await uploadFile(file);
      console.log("Subido", path);
    } catch (err) {
      console.log("Error", err);
    }
  };

  return (
    <main className="w-[90%] min-h-screen m-auto py-5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black w-[40%] md:w-[12%] h-[120px] flex justify-center items-center rounded-xl cursor-pointer transform hover:scale-102 transition duration-300"
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
              {" "}
              Cancelar
            </Button>
            <Button onClick={handleUpload}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
