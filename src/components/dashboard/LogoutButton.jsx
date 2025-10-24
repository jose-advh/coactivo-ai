"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutAbogado } from "@/lib/auth";

/**
 * Botón de cierre de sesión.
 * - Llama a Supabase Auth para cerrar sesión.
 * - Recarga la app y redirige al login.
 * - Muestra feedback visual mientras se ejecuta.
 */
export const LogoutButton = () => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      const { error } = await logoutAbogado();
      if (error) throw error;

      window.location.href = "/";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Hubo un problema al cerrar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="destructive"
      className="w-full sm:w-auto font-medium text-white transition-all hover:scale-[1.02]"
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
};
