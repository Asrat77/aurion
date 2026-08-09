import { NextResponse, type NextRequest } from "next/server";
import { DEPLOYMENT, businessHref, expressHref, operationsHref } from "@/lib/channel";

/**
 * Edge routing for the three AURION products.
 *
 * On a dedicated Business site every path is rewritten into the /business tree,
 * so business.<domain>/rfqs renders app/business/rfqs without exposing the
 * prefix. On the unified single-origin deployment nothing is rewritten:
 * /business/* already is the Business product.
 *
 * Routes that predate the split keep working by redirecting to their canonical
 * home, so bookmarks and the contractor's shared links do not 404.
 */
const BACKOFFICE = /^\/(admin|vendor)(\/|$)/;

const BUSINESS_ROUTES = [
  /^\/$/,
  /^\/suppliers(?:\/.*)?$/,
  /^\/catalogue(?:\/.*)?$/,
  /^\/rfqs(?:\/.*)?$/,
  /^\/opportunities(?:\/.*)?$/,
  /^\/trades(?:\/.*)?$/,
  /^\/assurance(?:\/.*)?$/,
  /^\/account(?:\/.*)?$/,
  /^\/messages(?:\/.*)?$/,
];

const OPERATIONS_ROUTES = [/^\/$/, BACKOFFICE, /^\/account(?:\/.*)?$/, /^\/messages(?:\/.*)?$/];

const EXPRESS_ROUTES = [
  /^\/$/,
  /^\/store(?:\/.*)?$/,
  /^\/product(?:\/.*)?$/,
  /^\/checkout(?:\/.*)?$/,
  /^\/orders(?:\/.*)?$/,
  /^\/wishlist(?:\/.*)?$/,
  /^\/account(?:\/.*)?$/,
  /^\/messages(?:\/.*)?$/,
  /^\/buyer-protection(?:\/.*)?$/,
  /^\/contact(?:\/.*)?$/,
  /^\/sell(?:\/.*)?$/,
  /^\/source(?:\/.*)?$/,
];

/** Pre-split paths, mapped to where the route now lives. */
const LEGACY: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^\/workspace\/?$/, () => businessHref("/rfqs")],
  [/^\/catalogue\/?$/, () => businessHref("/catalogue")],
  [/^\/opportunities\/?$/, () => businessHref("/opportunities")],
  [/^\/trades\/([^/]+)\/?$/, (match) => businessHref(`/trades/${match[1]}`)],
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // The dedicated Business site owns its own root, so /catalogue there is
  // already canonical and must not be redirected onto itself.
  if (DEPLOYMENT !== "business") {
    for (const [pattern, destination] of LEGACY) {
      const match = pathname.match(pattern);
      if (match) return redirect(destination(match), request, search);
    }
  }

  if (DEPLOYMENT === "business") return businessSite(request);
  if (DEPLOYMENT === "operations") return operationsSite(request);
  if (DEPLOYMENT === "express") return expressSite(request);
  return NextResponse.next();
}

/** business.<domain>/x renders app/business/x. */
function businessSite(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/business")) {
    return redirect(pathname.replace(/^\/business/, "") || "/", request, request.nextUrl.search);
  }
  if (BACKOFFICE.test(pathname)) return redirect(operationsHref(pathname), request, request.nextUrl.search);
  if (!BUSINESS_ROUTES.some((pattern) => pattern.test(pathname))) {
    return redirect(expressHref(pathname), request, request.nextUrl.search);
  }

  const target = request.nextUrl.clone();
  target.pathname = `/business${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(target);
}

function operationsSite(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/business")) {
    return redirect(businessHref(pathname.replace(/^\/business/, "") || "/"), request, request.nextUrl.search);
  }
  if (OPERATIONS_ROUTES.some((pattern) => pattern.test(pathname))) return NextResponse.next();
  return redirect(expressHref(pathname), request, request.nextUrl.search);
}

function expressSite(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/business")) {
    return redirect(businessHref(pathname.replace(/^\/business/, "") || "/"), request, request.nextUrl.search);
  }
  if (BACKOFFICE.test(pathname)) return redirect(operationsHref(pathname), request, request.nextUrl.search);
  if (EXPRESS_ROUTES.some((pattern) => pattern.test(pathname))) return NextResponse.next();

  const fallback = request.nextUrl.clone();
  fallback.pathname = "/store";
  fallback.search = "";
  return NextResponse.redirect(fallback);
}

/**
 * `href` is same-origin when the deployment is unified and absolute once the
 * channel origins are bound, so both shapes have to be handled.
 */
function redirect(href: string, request: NextRequest, search: string) {
  const absolute = /^https?:\/\//.test(href);
  const target = absolute ? new URL(href) : new URL(href, request.nextUrl.origin);
  if (search && !target.search) target.search = search;
  if (target.toString() === request.nextUrl.toString()) return NextResponse.next();
  return NextResponse.redirect(target);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
