import type { Metadata } from "next";
import { MyCommitments } from "@/components/my-commitments";
export const metadata: Metadata = { title: "My Commitments" };
export default function CommitmentsPage() {
  return <MyCommitments />;
}
