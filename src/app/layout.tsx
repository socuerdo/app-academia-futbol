import type { Metadata } from "next";
import "./globals.css";
import { Barlow_Condensed, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Gestión de Asistencias - Escuelas de Fútbol",
  description: "Sistema multi-tenant de gestión de asistencias para clubes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", inter.variable, barlow.variable)}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
