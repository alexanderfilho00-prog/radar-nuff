import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar de Prospecção",
  description: "Oportunidades diárias de branding, comunidade e filmes de campanha.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link href="/" className="brand">
              <span className="brand-dot" aria-hidden />
              Radar de Prospecção
            </Link>
            <nav>
              <Link href="/">Hoje</Link>
              <Link href="/relatorios">Histórico</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap site-footer">
          Rascunhos para revisão. Nada é enviado automaticamente.
        </footer>
      </body>
    </html>
  );
}
