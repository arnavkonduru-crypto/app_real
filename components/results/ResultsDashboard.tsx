"use client";
import { useState } from "react";
import { HydrationResult } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import WaterMeter from "./WaterMeter";
import ElectrolyteCards from "./ElectrolyteCards";
import HourlySchedule from "./HourlySchedule";
import DrinkSuggestions from "./DrinkSuggestions";
import IntakeLogger from "@/components/logger/IntakeLogger";
import StreakTracker from "@/components/streak/StreakTracker";

interface Props {
  result: HydrationResult;
  onReset: () => void;
  preferredName?: string;
}

export default function ResultsDashboard({ result, onReset, preferredName }: Props) {
  const [drunkOz, setDrunkOz] = useState(0);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {preferredName ? `${preferredName}'s Hydration Plan` : "Your Hydration Plan"}
        </h2>
        <StreakTracker />
      </div>

      <Card className="text-center">
        <WaterMeter drunkOz={drunkOz} totalOz={result.waterOz} />
        <p className="text-sm text-gray-400 -mt-2">
          {result.waterOz} oz · {result.waterMl} ml total goal
        </p>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          ⚡ Electrolytes
        </h3>
        <ElectrolyteCards result={result} />
      </Card>

      <Card>
        <IntakeLogger totalOz={result.waterOz} onUpdate={setDrunkOz} />
      </Card>

      <Card>
        <HourlySchedule result={result} />
      </Card>

      <Card>
        <DrinkSuggestions result={result} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
          🤖 AI Reasoning
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {result.reasoning}
        </p>
      </Card>

      <Button variant="secondary" onClick={onReset} className="w-full">
        ↺ Start Over
      </Button>
    </div>
  );
}
