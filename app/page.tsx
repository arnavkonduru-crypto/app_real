import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="text-6xl mb-6">💧</div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-none tracking-tight whitespace-nowrap">
          8 cups of water is a scam.
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-xl leading-relaxed">
          Your hydration needs depend on your body, your activities, and the weather outside — not a number someone made up in 1945.
        </p>
        <Link
          href="/app"
          className="mt-10 inline-block bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-100"
        >
          Calculate my actual need →
        </Link>
        <p className="mt-4 text-sm text-gray-500">Free · No sign-up · Powered by AI</p>
      </section>

      {/* How it works */}
      <section className="bg-gray-800/50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            How HydroAI works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { emoji: "🧍", step: "1", title: "Your body", desc: "Age, weight, height, and sex all affect how much you sweat and retain water." },
              { emoji: "🏋️", step: "2", title: "Your activities", desc: "Running hard vs. sitting at a desk are not the same. Pick what you're doing today." },
              { emoji: "🌡️", step: "3", title: "Today's weather", desc: "Heat and humidity spike your sweat rate. We pull real weather from your location." },
              { emoji: "🤖", step: "4", title: "AI plan", desc: "Claude calculates your exact water, sodium, potassium, and magnesium targets." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <div className="text-4xl">{item.emoji}</div>
                <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 font-bold text-sm flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="text-3xl font-bold text-white text-center">
            Why generic hydration advice fails you
          </h2>
          {[
            { q: "The 8-cup myth", a: "The \"8×8\" rule has no scientific backing. It originated from a misread 1945 dietary guideline. Your needs can be 2× or 0.5× that depending on your day." },
            { q: "Weather matters more than you think", a: "On a 95°F day with 70% humidity, you can lose over 2 liters per hour during moderate exercise. On a cool day at a desk, you barely need half the average." },
            { q: "Electrolytes aren't optional", a: "Drinking water without replacing sodium, potassium, and magnesium can cause hyponatremia — a dangerous condition from being over-hydrated with the wrong stuff." },
          ].map((item) => (
            <div key={item.q} className="border-l-4 border-blue-400 pl-6">
              <h3 className="font-bold text-white text-lg mb-1">{item.q}</h3>
              <p className="text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-500 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to actually hydrate right?</h2>
        <p className="text-blue-100 mb-8">Takes 60 seconds. No account needed.</p>
        <Link
          href="/app"
          className="inline-block bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-2xl shadow hover:shadow-lg transition-all hover:scale-105 active:scale-100"
        >
          Get my hydration plan →
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-600">
        HydroAI · Built with Claude · Not medical advice
      </footer>
    </main>
  );
}
