import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <DashboardShell user={session.user!} />;
}
