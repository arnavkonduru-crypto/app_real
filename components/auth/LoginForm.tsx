"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <Card className="max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2"></div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your Aqua account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="input"
            autoComplete="username"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input"
            autoComplete="current-password"
          />
        </label>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <button type="button" className="hover:text-blue-500 transition-colors">
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={!username || !password || loading}
          className="w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Don&apos;t have an account?{" "}
        <button type="button" className="text-blue-500 hover:underline">Sign up</button>
      </p>
    </Card>
  );
}
