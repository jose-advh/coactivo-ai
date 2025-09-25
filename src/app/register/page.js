"use client";

import Image from "next/image";
import { useState } from "react";
import { registerAbogado } from "@/lib/auth";

export default function userRegister() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await registerAbogado(nombre, correo, password);

    if (error) {
      setMsg("Error:" + error.message);
    } else {
      setMsg("Abogado registrado correctamente");
    }
  };

  return (
    <section className="w-[80%] h-[100dvh] flex justify-around items-center m-auto border-1 ">
      <div className="w-[80%] h-[70%] flex justify-around items-center m-auto border-1">
        <form
          className="w-[50%] flex flex-col items-center justify-center gap-5"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl">¡Un placer verte por aquí!</h2>
          <div className="flex flex-col w-[80%]">
            <label htmlFor="nombreUsuario">Nombre</label>
            <input
              type="text"
              id="nombreUsuario"
              className="p-2 rounded"
              placeholder="Mi Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-[80%]">
            <label htmlFor="correoUsuario">Correo</label>
            <input
              type="email"
              id="correoUsuario"
              className="p-2 rounded"
              placeholder="example@gmail.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>
          <div className="flex flex-col w-[80%]">
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              className="rounded p-2"
              placeholder="**********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p>
            ¿Ya tienes una cuenta? <a href="/">Inicia Sesión</a>
          </p>
          <button
            type="submit"
            className="border-1 px-7 py-2 rounded cursor-pointer"
          >
            Registrarme
          </button>
          <p>{msg}</p>
        </form>
        <article>
          <Image
            src="/logo-pv.png"
            width={250}
            height={250}
            alt="Logo de CoactivoAI"
          />
        </article>
      </div>
    </section>
  );
}
