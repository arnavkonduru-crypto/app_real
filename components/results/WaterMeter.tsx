"use client";

interface Props {
  drunkOz: number;
  totalOz: number;
}

export default function WaterMeter({ drunkOz, totalOz }: Props) {
  const pct = Math.min(drunkOz / totalOz, 1);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={r} strokeWidth="14" className="stroke-blue-100 dark:stroke-blue-900 fill-none" />
        <circle
          cx="90"
          cy="90"
          r={r}
          strokeWidth="14"
          className="stroke-blue-500 fill-none transition-all duration-700"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-[160px] mb-[130px]">
        <div className="text-3xl font-bold text-blue-600">{drunkOz}<span className="text-base font-normal text-gray-400"> oz</span></div>
        <div className="text-sm text-gray-400">of {totalOz} oz goal</div>
      </div>
    </div>
  );
}
