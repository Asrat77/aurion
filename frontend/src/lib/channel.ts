export type Channel = "express" | "business" | "operations";

export const CHANNEL = (process.env.NEXT_PUBLIC_CHANNEL ?? "express") as Channel;

const ORIGINS: Record<Channel, string> = {
  express: process.env.NEXT_PUBLIC_EXPRESS_ORIGIN ?? "",
  business: process.env.NEXT_PUBLIC_BUSINESS_ORIGIN ?? "",
  operations: process.env.NEXT_PUBLIC_OPERATIONS_ORIGIN ?? "",
};

export function channelOrigin(channel: Channel): string {
  return ORIGINS[channel];
}

export function channelUrl(channel: Channel, path = "/"): string {
  const origin = channelOrigin(channel);
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function channelLabel(channel: Channel): string {
  return channel === "express" ? "AURION EXPRESS" : channel === "business" ? "AURION BUSINESS" : "AURION OPERATIONS";
}
