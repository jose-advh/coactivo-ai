"use client";

import Image from "next/image";
import { useState } from "react";
import { registerAbogado } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UserRegister() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await registerAbogado(nombre, correo, password);

    if (error) {
      setModal({
        open: true,
        title: "Error ❌",
        message: error.message,
        type: "error",
      });
    } else {
      setModal({
        open: true,
        title: "¡Tu registro fue un éxito!",
        message:
          "Enviamos un correo de confirmación, revisalo para que puedas activar tu cuenta :)",
        type: "success",
      });

      setNombre("");
      setCorreo("");
      setPassword("");
    }
  };

  return (
    <section className="w-[100%] h-[100dvh] bg-[url('/login-background.jpg')] flex justify-around items-center m-auto">
      <div className="w-[90%] sm:w-[70%] h-[70%] rounded-xl flex items-center m-auto shadow">
        {/* Lado izquierdo */}
        <article className="hidden sm:flex flex-col items-center justify-center backdrop-blur-2xl bg-[#9a5820] h-[100%] w-[50%]">
          <Image
            src="/login_man.svg"
            width={250}
            height={250}
            alt="Imagen de hombre de negocios"
          />
        </article>

        {/* Formulario */}
        <form
          className="w-[100%] md:w-[50%] h-[100%] flex flex-col py-5 backdrop-blur-2xl items-center justify-center gap-5"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-bold">¡Crea tu Cuenta!</h2>

          <div className="flex flex-col w-[80%]">
            <label htmlFor="nombreUsuario">Nombre</label>
            <input
              type="text"
              id="nombreUsuario"
              className="p-2 rounded bg-white"
              placeholder="Mi Nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-[80%]">
            <label htmlFor="correoUsuario">Correo</label>
            <input
              type="email"
              id="correoUsuario"
              className="p-2 rounded bg-white"
              placeholder="example@gmail.com"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-[80%] relative">
            <label htmlFor="contraseña">Contraseña</label>
            <Image
              src="/icons/watch-password.png"
              width={24}
              height={24}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-[50%] right-[5%] cursor-pointer"
              alt="Ver contraseña"
            />
            <input
              type={showPassword ? "text" : "password"}
              id="contraseña"
              className="rounded p-2 bg-white"
              placeholder="**********"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <p>
            ¿Ya tienes una cuenta?{" "}
            <a href="/" className="text-[#4169E1]">
              Inicia Sesión
            </a>
          </p>

          <button
            type="submit"
            className="px-9 py-2 rounded cursor-pointer bg-[#9a5833] text-white"
          >
            Registrarme
          </button>
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
