import type { Metadata } from "next";
import { Inter, Kalam } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-kalam",
});

export const metadata: Metadata = {
  title: "Mis Notas",
  description: "Notas con sentimiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${kalam.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}