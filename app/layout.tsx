import type { Metadata, Viewport } from "next";
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar de Prospecção Criativa · Studio Nuff",
  description: "Ferramenta interna do Studio Nuff: oportunidades do dia, com evidência e gancho de abordagem.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FFD324",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
