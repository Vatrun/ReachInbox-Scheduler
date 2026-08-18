import { LoginButton } from "@/components/LoginButton";
import { EmailPasswordForm } from "@/components/EmailPasswordForm";

export function LoginCard() {
  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-8 py-10 shadow-sm">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
        Login
      </h1>

      {/* Google login */}
      <LoginButton />

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Email / password login & signup */}
      <EmailPasswordForm />
    </div>
  );
}
