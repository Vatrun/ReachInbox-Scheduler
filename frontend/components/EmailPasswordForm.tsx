"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/api";

export function EmailPasswordForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await registerUser({ name, email, password });
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-md bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded px-3 py-1.5 font-medium transition ${
            mode === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded px-3 py-1.5 font-medium transition ${
            mode === "signup"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500"
          }`}
        >
          Sign up
        </button>
      </div>

      {mode === "signup" && (
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500/30"
        />
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email ID"
        className="w-full rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500/30"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-500/30"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[#00A844] py-3 text-sm font-medium text-white transition hover:bg-[#00963c] disabled:opacity-50"
      >
        {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
      </button>
    </form>
  );
}
