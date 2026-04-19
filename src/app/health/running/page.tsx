import TopicPageLayout from "@/components/TopicPageLayout";
import { runningData } from "@/data/health/running";

export const metadata = { title: "Running & Aerobic Training — Hyper Hub" };

export default function RunningPage() {
  return <TopicPageLayout data={runningData} />;
}
