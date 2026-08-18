import { auth } from "@/lib/auth";
import { LoginCard } from "@/components/LoginCard";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <LoginCard />
    </main>
  );
}
