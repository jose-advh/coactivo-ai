"use client";

import Image from "next/image";
import { useState } from "react";
import { loginAbogado } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await loginAbogado(correo, password);

    if (error) {
      setModal({
        open: true,
        title: "Error ❌",
        message: error.message,
        type: "error",
      });
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <section className="w-[80%] h-[100dvh] w-[100%] bg-[url('/login-background.jpg')] flex justify-around items-center m-auto">
      <div className="w-[90%] sm:w-[70%] h-[70%] rounded-xl flex items-center m-auto shadow-lg">
        <article className="hidden sm:flex flex-col rounded-xl items-center justify-center  bg-[#9a5820] h-[100%] w-[50%]">
          <Image
            src="/login_man.svg"
            width={250}
            height={250}
            alt="Logo de CoactivoAI"
          />
        </article>
        <form
          className="w-[100%] md:w-[50%] h-[100%] rounded-xl flex flex-col backdrop-blur-3xl items-center justify-center gap-5"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-bold">¡Bienvenido de vuelta!</h2>
          <div className="flex flex-col w-[80%]">
            <label htmlFor="correoUsuario">Correo</label>
            <input
              type="email"
              id="correoUsuario"
              className="p-2 rounded bg-white outline-none border-none"
              value={correo}
              required
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="example@gmail.com"
            />
          </div>
          <div className="flex flex-col w-[80%]">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              className="rounded p-2 bg-white outline-none border-none "
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="**********"
            />
          </div>
          <p>
            ¿Aún no tienes una cuenta?{" "}
            <a href="/register" className="text-[#4169E1]">
              Crea una aquí
            </a>
          </p>
          <button
            type="submit"
            className="px-9 py-2 rounded cursor-pointer bg-[#9a5833] text-white"
          >
            Ingresar
          </button>
          <p>{msg}</p>
        </form>
      </div>

      {/* Modal */}
      <Dialog
        open={modal.open}
        onOpenChange={(open) => setModal({ ...modal, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={
                modal.type === "error" ? "text-red-600" : "text-green-600"
              }
            >
              {modal.title}
            </DialogTitle>
            <DialogDescription>{modal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setModal({ ...modal, open: false })}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
