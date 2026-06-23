"use client";
import { useState } from "react";
import { UserProfile } from "@/lib/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Props {
  initial: UserProfile | null;
  onSubmit: (profile: UserProfile) => void;
}

export default function ProfileForm({ initial, onSubmit }: Props) {
  const [form, setForm] = useState<UserProfile>(
    initial ?? { age: 25, weightLbs: 155, heightIn: 68, sex: "male" }
  );

  const set = (key: keyof UserProfile, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">
        Tell us about yourself
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Used to personalize your hydration targets.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Age</span>
            <input
              type="number"
              value={form.age}
              min={10}
              max={100}
              onChange={(e) => set("age", Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Weight (lbs)</span>
            <input
              type="number"
              value={form.weightLbs}
              min={50}
              max={500}
              onChange={(e) => set("weightLbs", Number(e.target.value))}
              className="input"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Height (inches)</span>
          <input
            type="number"
            value={form.heightIn}
            min={48}
            max={96}
            onChange={(e) => set("heightIn", Number(e.target.value))}
            className="input"
          />
          <span className="text-xs text-gray-400">
            {Math.floor(form.heightIn / 12)}ft {form.heightIn % 12}in
          </span>
        </label>

        <div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 block mb-2">
            Biological Sex
          </span>
          <div className="flex gap-3">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("sex", s)}
                className={`flex-1 py-2.5 rounded-xl border-2 font-medium capitalize transition-all
                  ${form.sex === s ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-600"}`}
              >
                {s === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={() => onSubmit(form)} className="w-full mt-6">
        Next →
      </Button>
    </Card>
  );
}
