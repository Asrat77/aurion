import type { MetadataRoute } from "next";
import { DEPLOYMENT, businessHref, expressHref } from "@/lib/channel";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * On a dedicated site only that channel's routes are listed. The unified
 * deployment serves Express and Business from one origin, so both trees belong
 * in the same sitemap.
 */
function routes(): string[] {
  if (DEPLOYMENT === "operations") return [];
  const business = ["/", "/suppliers", "/catalogue", "/rfqs", "/assurance"].map((path) => businessHref(path));
  if (DEPLOYMENT === "business") return business;
  const express = ["/", "/store", "/source", "/buyer-protection", "/contact"].map((path) => expressHref(path));
  return DEPLOYMENT === "express" ? express : [...express, ...business];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routes()
    .filter((path) => !/^https?:\/\//.test(path))
    .map((path) => ({ url: `${SITE}${path === "/" ? "" : path}` || SITE, lastModified: new Date() }));
}
