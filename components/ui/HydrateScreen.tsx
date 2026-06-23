"use client";

interface Props {
  onHydrate: () => void;
  preferredName?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const FACTS = [
  "Even mild dehydration impairs cognitive function by up to 20%.",
  "Your kidneys filter about 200 liters of fluid every day.",
  "Thirst is already a sign you're mildly dehydrated.",
  "Muscles are 75% water — hydration directly affects strength.",
  "Proper hydration can reduce headache frequency by 40%.",
];

export default function HydrateScreen({ onHydrate, preferredName }: Props) {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();
  const fact = FACTS[date % FACTS.length];

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-md mx-auto py-4">

      {/* Top: date */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 mb-3">{day}</p>
        <h2 className="text-7xl font-black text-gray-900 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
          {month}<br />{date}
        </h2>
        <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">{year}</p>
      </div>

      {/* Spacer */}
      <div />

      {/* Bottom: greeting + fact + button */}
      <div className="flex flex-col items-center gap-4">
        {preferredName && (
          <div className="w-full">
            <p className="text-2xl font-semibold text-gray-800">
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="text-blue-600">{preferredName}.</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">Let&apos;s build your hydration plan for today.</p>
          </div>
        )}
        <div className="border-l-4 border-blue-200 pl-4 w-full">
          <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-1">Did you know</p>
          <p className="text-sm text-gray-600 leading-relaxed italic">{fact}</p>
        </div>
        <button
          onClick={onHydrate}
          className="px-10 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-100 shadow-md"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Hydrate
        </button>
        <p className="text-xs text-gray-400">Calculate today&apos;s personalized plan</p>
      </div>
    </div>
  );
}
