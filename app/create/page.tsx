import type { Metadata } from "next";
import { CreateDeal } from "@/components/create-deal";
export const metadata: Metadata = { title: "Create a Demo Booking" };
export default function CreatePage() {
  return <CreateDeal />;
}
