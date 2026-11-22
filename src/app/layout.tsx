import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control de camiones",
  description: "Registro y control de camiones",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${manrope.variable} h-full antialiased`}>
      {/* pb-16 deja libre el final de la página para el distintivo de Netlify (abajo a la derecha). */}
      <body className="min-h-full flex flex-col pb-16">
        <Nav />
        {children}
      </body>
    </html>
  );
}
