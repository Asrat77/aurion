import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ethiopian Product Marketplace",
  description:
    "Explore coffee, grains, spices, honey, textiles, jewelry, and more from vendors across Ethiopia.",
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
