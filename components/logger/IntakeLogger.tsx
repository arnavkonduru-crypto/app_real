"use client";
import { useState } from "react";
import { saveIntakeLog, loadIntakeLog } from "@/lib/storage";
import Button from "@/components/ui/Button";

const QUICK = [8, 12, 16, 20];

export default function IntakeLogger({ totalOz, onUpdate }: { totalOz: number; onUpdate: (oz: number) => void }) {
  const [logged, setLogged] = useState(loadIntakeLog());

  const log = (oz: number) => {
    saveIntakeLog(oz);
    const next = loadIntakeLog();
    setLogged(next);
    onUpdate(next);
  };

  const remaining = Math.max(totalOz - logged, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
        💧 Log What You Drank
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {logged} oz logged today · {remaining} oz remaining
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((oz) => (
          <Button key={oz} variant="secondary" onClick={() => log(oz)} className="text-sm">
            +{oz} oz
          </Button>
        ))}
      </div>
    </div>
  );
}
