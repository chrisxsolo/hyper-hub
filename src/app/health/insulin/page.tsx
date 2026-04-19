import TopicPageLayout from "@/components/TopicPageLayout";
import { insulinData } from "@/data/health/insulin";

export const metadata = { title: "Insulin & Insulin Resistance — Hyper Hub" };

export default function InsulinPage() {
  return <TopicPageLayout data={insulinData} />;
}
