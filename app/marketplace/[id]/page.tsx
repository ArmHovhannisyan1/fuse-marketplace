import { DealDetails } from "@/components/deal-details";
export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealDetails id={id} />;
}
