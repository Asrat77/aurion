import type { MetadataRoute } from "next";
import { CHANNEL, channelUrl } from "@/lib/channel";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: CHANNEL === "operations" ? [] : ["/"] }, sitemap: `${channelUrl(CHANNEL, "/sitemap.xml")}` };
}
