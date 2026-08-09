import type { MetadataRoute } from "next";
import { CHANNEL, channelUrl } from "@/lib/channel";

const ROUTES = {
  express: ["/", "/store", "/source", "/buyer-protection", "/contact"],
  business: ["/", "/catalogue", "/workspace"],
  operations: ["/"],
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES[CHANNEL].map((path) => ({ url: channelUrl(CHANNEL, path), lastModified: new Date() }));
}
