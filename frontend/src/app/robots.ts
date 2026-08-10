import type { MetadataRoute } from "next";
import { DEPLOYMENT } from "@/lib/channel";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      DEPLOYMENT === "operations"
        ? { userAgent: "*", disallow: ["/"] }
        : { userAgent: "*", allow: ["/"], disallow: ["/admin", "/vendor"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
