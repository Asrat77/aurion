import { NextResponse, type NextRequest } from "next/server";

const CHANNEL = process.env.NEXT_PUBLIC_CHANNEL ?? "express";
const OPERATIONS_ORIGIN = process.env.NEXT_PUBLIC_OPERATIONS_ORIGIN?.replace(/\/$/, "");

const BACKOFFICE_ROUTES = [ /^\/admin(?:\/.*)?$/, /^\/vendor(?:\/.*)?$/ ];

const ALLOWED: Record<string, RegExp[]> = {
  express: [ /^\/$/, /^\/store(?:\/.*)?$/, /^\/checkout(?:\/.*)?$/, /^\/orders(?:\/.*)?$/, /^\/wishlist(?:\/.*)?$/, /^\/account(?:\/.*)?$/, /^\/messages(?:\/.*)?$/, /^\/buyer-protection(?:\/.*)?$/, /^\/source(?:\/.*)?$/, /^\/contact(?:\/.*)?$/, /^\/sell(?:\/.*)?$/, ...(!OPERATIONS_ORIGIN ? BACKOFFICE_ROUTES : []) ],
  business: [ /^\/$/, /^\/catalogue(?:\/.*)?$/, /^\/workspace(?:\/.*)?$/, /^\/opportunities(?:\/.*)?$/, /^\/trades(?:\/.*)?$/, /^\/account(?:\/.*)?$/, /^\/messages(?:\/.*)?$/ ],
  operations: [ /^\/$/, ...BACKOFFICE_ROUTES, /^\/account(?:\/.*)?$/, /^\/messages(?:\/.*)?$/ ],
};

const FALLBACK: Record<string, string> = { express: "/store", business: "/workspace", operations: "/admin" };

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || /\.[^/]+$/.test(pathname)) return NextResponse.next();
  if ((ALLOWED[CHANNEL] ?? ALLOWED.express).some((pattern) => pattern.test(pathname))) return NextResponse.next();

  if (OPERATIONS_ORIGIN && BACKOFFICE_ROUTES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, OPERATIONS_ORIGIN));
  }

  const destination = request.nextUrl.clone();
  destination.pathname = FALLBACK[CHANNEL] ?? FALLBACK.express;
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = { matcher: [ "/((?!_next/static|_next/image|favicon.ico).*)" ] };
