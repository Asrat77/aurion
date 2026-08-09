export type Channel = "express" | "business" | "operations";

/**
 * AURION ships one codebase as three products. How they are reached depends on
 * how the deployment is wired:
 *
 *   unified   — a single origin. Express owns the root, Business lives under
 *               /business, Operations under /admin and /vendor. This is what a
 *               single Appwrite Site serves before subdomains are bound.
 *   express   — a dedicated consumer site. Business and Operations links leave
 *               for their own origins.
 *   business  — a dedicated sourcing site. `proxy.ts` rewrites every path into
 *               the /business tree, so links here carry no prefix.
 *   operations — a dedicated back office.
 *
 * Every surface reads its channel through this module, so binding
 * business.<domain> later is an environment change, not a code change.
 */
const ORIGINS: Record<Channel, string> = {
  express: (process.env.NEXT_PUBLIC_EXPRESS_ORIGIN ?? "").replace(/\/$/, ""),
  business: (process.env.NEXT_PUBLIC_BUSINESS_ORIGIN ?? "").replace(/\/$/, ""),
  operations: (process.env.NEXT_PUBLIC_OPERATIONS_ORIGIN ?? "").replace(/\/$/, ""),
};

const REQUESTED = process.env.NEXT_PUBLIC_CHANNEL ?? "";

export type Deployment = "unified" | Channel;

/**
 * `express` only means a dedicated consumer site once a separate Business
 * origin exists to send buyers to. Until then the deployment is unified, which
 * keeps the live single-site build serving all three products.
 */
export const DEPLOYMENT: Deployment =
  REQUESTED === "business" || REQUESTED === "operations"
    ? REQUESTED
    : REQUESTED === "express" && ORIGINS.business
      ? "express"
      : "unified";

/** Path prefix the Business tree answers on for the current deployment. */
export const BUSINESS_BASE = DEPLOYMENT === "business" ? "" : "/business";

/** The channel a dedicated deployment is pinned to, if any. */
export const PINNED_CHANNEL: Channel | null = DEPLOYMENT === "unified" ? null : DEPLOYMENT;

export function channelOrigin(channel: Channel): string {
  return ORIGINS[channel];
}

function join(base: string, path: string): string {
  const suffix = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}` || "/";
}

/** Link into the Business product from anywhere. */
export function businessHref(path = "/"): string {
  if (DEPLOYMENT === "business") return path;
  if (ORIGINS.business) return join(ORIGINS.business, path);
  return join(BUSINESS_BASE, path);
}

/** Link into the Express product from anywhere. */
export function expressHref(path = "/"): string {
  if (DEPLOYMENT === "unified" || DEPLOYMENT === "express") return path;
  if (ORIGINS.express) return join(ORIGINS.express, path);
  return path;
}

/** Link into the Operations back office from anywhere. */
export function operationsHref(path = "/admin"): string {
  if (DEPLOYMENT === "operations") return path;
  if (ORIGINS.operations) return join(ORIGINS.operations, path);
  return path;
}

/**
 * Which product is rendering this path. On a dedicated deployment the answer is
 * fixed; on the unified deployment it comes from the URL.
 */
export function surfaceForPath(pathname: string): Channel {
  if (PINNED_CHANNEL) return PINNED_CHANNEL;
  if (pathname === "/business" || pathname.startsWith("/business/")) return "business";
  if (/^\/(admin|vendor)(\/|$)/.test(pathname)) return "operations";
  return "express";
}

export function channelLabel(channel: Channel): string {
  return channel === "express"
    ? "AURION EXPRESS"
    : channel === "business"
      ? "AURION BUSINESS"
      : "AURION OPERATIONS";
}
