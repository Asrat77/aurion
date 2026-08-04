import type { Metadata } from "next";
import BuyerProtectionContent from "@/components/buyer/BuyerProtectionContent";

export const metadata: Metadata = {
  title: "Buyer Protection | AURION Markets",
  description:
    "Every AURION order is covered: if your goods never arrive, arrive damaged, or are not what was described, you can claim a refund.",
};

export default function BuyerProtectionPage() {
  return <BuyerProtectionContent />;
}
