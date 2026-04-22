import TopicPageLayout from "@/components/TopicPageLayout";
import { meditationsData } from "@/data/stoicism/meditations";

export default function MeditationsPage() {
  return (
    <TopicPageLayout
      data={meditationsData}
      backHref="/stoicism"
      backLabel="Stoicism"
    />
  );
}
