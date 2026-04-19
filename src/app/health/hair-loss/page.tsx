import TopicPageLayout from "@/components/TopicPageLayout";
import { hairLossData } from "@/data/health/hairloss";

export const metadata = { title: "Hair Loss & DHT — Hyper Hub" };

export default function HairLossPage() {
  return <TopicPageLayout data={hairLossData} />;
}
