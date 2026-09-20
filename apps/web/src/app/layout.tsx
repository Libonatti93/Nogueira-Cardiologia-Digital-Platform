import type { Metadata } from "next";
import { BackToTopButton } from "@/components/back-to-top-button";
import { CookieConsent } from "@/components/cookie-consent";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";
import { PromotionTicker } from "@/components/promotion-ticker";
import { SecurityTrustBadges } from "@/components/security/trust-badges";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { absoluteUrl, clinic, siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nogueiracardiologia.com.br"),
  title: "Nogueira Cardiologia | Cardiologista, Telemedicina e Check-up em Rio Preto",
  description:
    "Nogueira Cardiologia: consulta com cardiologista, telemedicina, atendimento virtual, portal do paciente, exames e prevenção cardiovascular em São José do Rio Preto.",
  applicationName: clinic.name,
  authors: [{ name: clinic.name, url: siteUrl }],
  creator: clinic.name,
  publisher: clinic.name,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: clinic.name,
    url: siteUrl,
    title: "Nogueira Cardiologia | Cardiologista em São José do Rio Preto",
    description: "Cardiologia clínica, prevenção, check-up, exames e telemedicina em São José do Rio Preto.",
    images: [{ url: absoluteUrl("/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nogueira Cardiologia | Cardiologista em São José do Rio Preto",
    description: "Cardiologia clínica, prevenção, check-up, exames e telemedicina em São José do Rio Preto.",
    images: [absoluteUrl("/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris3.png")],
  },
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
        <div className="public-chrome contents"><OrganizationSchema />
        <PromotionTicker /></div>
        {children}
        <div className="public-chrome contents"><PromotionTicker placement="footer" />
        <CookieConsent />
        <BackToTopButton />
        <SecurityTrustBadges variant="floating" />
        <FloatingWhatsappButton /></div>
      </body>
    </html>
  );
}
