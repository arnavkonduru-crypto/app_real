"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PreferredNameForm({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <Card className="max-w-sm mx-auto text-center">
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">What should we call you?</h2>
      <p className="text-sm text-gray-500 mb-6">We&apos;ll use this to personalize your plan.</p>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your preferred name"
        className="input text-center mb-4"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
      />

      <Button onClick={() => onSubmit(name.trim())} disabled={!name.trim()} className="w-full">
        Continue →
      </Button>
    </Card>
  );
}
