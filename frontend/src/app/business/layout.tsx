import type { Metadata } from "next";

/**
 * The Business tree is its own product: separate titles, description and
 * indexing story from the Express storefront that owns the root.
 */
export const metadata: Metadata = {
  // `absolute` stops the root Express template from appending itself on the
  // unified deployment, where Express owns the root layout.
  title: {
    absolute: "AURION Business | Source at Scale",
    template: "%s | AURION Business",
  },
  description:
    "Commercial sourcing for Ethiopian-origin goods: structured RFQs, matched suppliers, competing quotations, contracts, inspection, and Protected Trade settlement.",
  openGraph: {
    title: "AURION Business | Source at Scale",
    description: "Structured sourcing from requirement to accountable, protected trade.",
    images: ["/brand/aurion-emblem.png"],
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
