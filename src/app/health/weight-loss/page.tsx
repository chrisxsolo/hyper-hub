import TopicPageLayout from "@/components/TopicPageLayout";
import { weightLossData } from "@/data/health/weightloss";

export const metadata = { title: "Weight Loss — Hyper Hub" };

export default function WeightLossPage() {
  return <TopicPageLayout data={weightLossData} />;
}
