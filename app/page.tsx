import Link from "next/link";
import Image from "next/image";

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#f0ede8] flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-8 text-sm font-semibold uppercase tracking-widest text-gray-700">
          <Link href="#how" className="hover:text-blue-600 transition-colors">How It Works</Link>
          <Link href="#science" className="hover:text-blue-600 transition-colors">The Science</Link>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-2xl font-black tracking-tight text-blue-600" style={{ fontFamily: "var(--font-heading)" }}>
            💧 HydroAI
          </span>
        </div>
        <div className="w-40" /> {/* spacer to balance nav */}
      </nav>

      {/* Hero — full screen split */}
      <section className="h-screen flex">

        {/* Left: content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-10 lg:px-20 pt-24 bg-[#f0ede8]">
          <p className="text-blue-600 font-black uppercase tracking-widest text-sm mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Introducing
          </p>
          <h1
            className="text-7xl lg:text-8xl font-black uppercase leading-none text-gray-900 mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            8 cups of<br />water is<br />a scam.
          </h1>
          <p className="text-lg text-gray-700 max-w-sm mb-8 leading-relaxed">
            Get your real hydration target — built around your body, your activities, and today&apos;s weather.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm px-8 py-4 rounded-full w-fit transition-all hover:scale-105 active:scale-100 shadow-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Calculate my need →
          </Link>
        </div>

        {/* Right: image with diagonal slant */}
        <div className="hidden lg:block w-1/2 h-full relative overflow-hidden">
          {/* Slant overlay on the left edge */}
          <div className="absolute inset-y-0 left-0 w-24 z-10 bg-[#f0ede8]" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
          <Image
            src="/hero.svg"
            alt="Hydration"
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </section>

      {/* Scrolling ticker */}
      <div className="bg-blue-600 py-3 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="inline-block mx-8 text-white font-black uppercase tracking-widest text-sm" style={{ fontFamily: "var(--font-heading)" }}>
              CALCULATE.&nbsp;&nbsp;SWEAT.&nbsp;&nbsp;REPEAT.
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="py-24 px-10 lg:px-20 bg-[#f0ede8]">
        <p className="text-blue-600 font-black uppercase tracking-widest text-sm mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          How it works
        </p>
        <h2 className="text-5xl font-black uppercase text-gray-900 mb-16" style={{ fontFamily: "var(--font-heading)" }}>
          Built around you.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
          {[
            { emoji: "🧍", step: "01", title: "Your body", desc: "Age, weight, height, and sex all change how much you sweat and retain water." },
            { emoji: "🏋️", step: "02", title: "Your activities", desc: "Running hard vs. sitting at a desk are not the same. Tell us your day." },
            { emoji: "🌡️", step: "03", title: "Today's weather", desc: "Heat and humidity spike your sweat rate. We pull live weather from your location." },
            { emoji: "🤖", step: "04", title: "AI plan", desc: "Claude gives you your exact water, sodium, potassium, and magnesium targets." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col gap-3">
              <div className="text-4xl">{item.emoji}</div>
              <div className="text-blue-600 font-black text-sm uppercase tracking-widest" style={{ fontFamily: "var(--font-heading)" }}>{item.step}</div>
              <h3 className="font-black uppercase text-xl text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Science section */}
      <section id="science" className="py-24 px-10 lg:px-20 bg-white">
        <p className="text-blue-600 font-black uppercase tracking-widest text-sm mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          The science
        </p>
        <h2 className="text-5xl font-black uppercase text-gray-900 mb-16" style={{ fontFamily: "var(--font-heading)" }}>
          Why generic advice fails you.
        </h2>
        <div className="space-y-10 max-w-3xl">
          {[
            { q: "The 8-cup myth", a: "The \"8×8\" rule has no scientific backing. It originated from a misread 1945 dietary guideline. Your needs can be 2× or 0.5× that depending on your day." },
            { q: "Weather matters more than you think", a: "On a 95°F day with 70% humidity, you can lose over 2 liters per hour during moderate exercise. On a cool day at a desk, you barely need half the average." },
            { q: "Electrolytes aren't optional", a: "Drinking water without replacing sodium, potassium, and magnesium can cause hyponatremia — a dangerous condition from being over-hydrated with the wrong stuff." },
          ].map((item) => (
            <div key={item.q} className="border-l-4 border-blue-600 pl-6">
              <h3 className="font-black uppercase text-xl text-gray-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>{item.q}</h3>
              <p className="text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20 px-10 lg:px-20 flex flex-col lg:flex-row items-center justify-between gap-8">
        <h2 className="text-5xl font-black uppercase text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>
          Ready to actually<br />hydrate right?
        </h2>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-black uppercase tracking-widest text-sm px-10 py-4 rounded-full transition-all hover:scale-105 active:scale-100 shadow-lg whitespace-nowrap"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Get my hydration plan →
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400 bg-[#f0ede8]">
        HydroAI · Built with Claude · Not medical advice
      </footer>
    </main>
  );
}
