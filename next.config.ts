import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto: evita que Next la confunda con un
  // package-lock.json suelto en una carpeta superior.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
