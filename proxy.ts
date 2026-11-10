import { NextResponse, type NextRequest } from "next/server";

/**
 * Proteção opcional por senha. Defina SITE_PASSWORD (e, se quiser, SITE_USER)
 * nas variáveis de ambiente da Vercel. Sem SITE_PASSWORD, o site fica aberto.
 */
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const user = process.env.SITE_USER ?? "radar";
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const [u, p] = atob(header.slice(6)).split(":");
    if (u === user && p === password) return NextResponse.next();
  }
  return new NextResponse("Acesso restrito", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Radar de Prospecção", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
