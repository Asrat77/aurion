import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Source Ethiopian Products at Scale",
  description:
    "Submit a structured commercial sourcing request for Ethiopian products and receive a trackable RFQ reference.",
};

export default function SourceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
