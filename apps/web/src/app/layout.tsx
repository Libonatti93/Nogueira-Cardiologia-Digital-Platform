import type { Metadata } from "next";
import { BackToTopButton } from "@/components/back-to-top-button";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nogueiracardiologia.com.br"),
  title: "Nogueira Cardiologia | Cardiologista, Telemedicina e Check-up em Rio Preto",
  description:
    "Nogueira Cardiologia: consulta com cardiologista, telemedicina, atendimento virtual, portal do paciente, exames e prevenção cardiovascular em São José do Rio Preto.",
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
        <BackToTopButton />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
