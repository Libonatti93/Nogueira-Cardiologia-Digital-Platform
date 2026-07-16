import type { Metadata } from "next";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nogueira Cardiologia | Cardiologista em São José do Rio Preto",
  description:
    "Nogueira Cardiologia: consultas, portal do paciente, agenda médica e espaço educativo com orientações de prevenção cardiovascular em São José do Rio Preto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
