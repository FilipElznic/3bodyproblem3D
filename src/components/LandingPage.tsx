import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const scrollToHowItWorks = () => {
    const el = document.getElementById("howitworks");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formulaForceRef = useRef<HTMLDivElement | null>(null);
  const formulaAccelRef = useRef<HTMLDivElement | null>(null);
  const formulaVelRef = useRef<HTMLDivElement | null>(null);
  const formulaPosRef = useRef<HTMLDivElement | null>(null);
  const formulaChaosRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (formulaForceRef.current) {
      katex.render(
        String.raw`\vec F_i = \sum_{j \ne i} G \frac{m_i m_j}{\lVert \vec r_j - \vec r_i \rVert^3} (\vec r_j - \vec r_i)`,
        formulaForceRef.current,
        { throwOnError: false, displayMode: true }
      );
    }
    if (formulaAccelRef.current) {
      katex.render(
        String.raw`\vec a_i = \frac{\vec F_i}{m_i}`,
        formulaAccelRef.current,
        { throwOnError: false, displayMode: true }
      );
    }
    if (formulaVelRef.current) {
      katex.render(
        String.raw`\vec v_i(t + \Delta t) \approx \vec v_i(t) + \vec a_i(t)\, \Delta t`,
        formulaVelRef.current,
        { throwOnError: false, displayMode: true }
      );
    }
    if (formulaPosRef.current) {
      katex.render(
        String.raw`\vec r_i(t + \Delta t) \approx \vec r_i(t) + \vec v_i\Bigl(t + \tfrac{\Delta t}{2}\Bigr)\, \Delta t`,
        formulaPosRef.current,
        { throwOnError: false, displayMode: true }
      );
    }
    if (formulaChaosRef.current) {
      katex.render(
        String.raw`\lVert \Delta \vec r(t) \rVert \approx \lVert \Delta \vec r(0) \rVert \, e^{\lambda t}`,
        formulaChaosRef.current,
        { throwOnError: false, displayMode: true }
      );
    }
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#020204] text-white selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden font-sans relative">
      {/* Shared background with simulation: deep space gradient + soft glows */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#020204] via-black to-[#020218]" />
      <div className="fixed inset-0 -z-10 opacity-60 pointer-events-none">
        <div className="absolute -top-32 -left-10 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />
      </div>

      {/* Sparse stars to echo the Canvas <Stars /> */}
      <div className="fixed inset-0 -z-10 opacity-60 pointer-events-none">
        <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white]" />
        <div className="absolute top-40 right-40 w-1 h-1 bg-blue-200 rounded-full shadow-[0_0_6px_#93c5fd]" />
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white/80 rounded-full" />
        <div className="absolute top-1/3 right-10 w-1 h-1 bg-white/80 rounded-full" />
        <div className="absolute top-1/2 left-10 w-0.5 h-0.5 bg-white/60 rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-0.5 h-0.5 bg-white/60 rounded-full" />
      </div>

      {/* HERO */}
      <header className="container mx-auto px-6 py-10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_18px_#38bdf8]" />
          <span className="text-xs tracking-[0.25em] uppercase text-gray-400">
            Three-Body Explorer
          </span>
        </div>

        <button
          onClick={onStart}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] tracking-[0.18em] uppercase text-gray-100 transition-all duration-200 backdrop-blur-md"
        >
          Launch Simulation
        </button>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-10 pb-24 md:pb-32 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-[0.2em] uppercase text-gray-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Live WebGL Simulation
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.12em] md:tracking-[0.2em] leading-tight mb-6">
              THREE–BODY
              <span className="block text-xl sm:text-2xl md:text-3xl font-thin text-blue-200/80 mt-3 tracking-[0.35em]">
                GRAVITATIONAL CHAOS
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed font-light">
              Watch three stars dance under gravity alone. No rails, no fixed
              orbits – just the raw equations of motion and the butterfly
              effect, rendered in real time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button
                onClick={onStart}
                className="w-full sm:w-auto px-10 py-3 rounded-full bg-blue-500/80 hover:bg-blue-500 text-sm tracking-[0.2em] uppercase font-medium shadow-[0_0_25px_rgba(59,130,246,0.45)] transition-all duration-200"
              >
                Start Simulation
              </button>

              <button
                onClick={scrollToHowItWorks}
                className="w-full sm:w-auto px-8 py-3 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] tracking-[0.2em] uppercase text-gray-200 flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-md"
              >
                <span>How it works</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 justify-center md:justify-start text-[11px] text-gray-500 tracking-[0.2em] uppercase">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Figure‑8 Orbit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span>Chaotic Regime</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Galaxy Cluster</span>
              </div>
            </div>
          </div>

          {/* Orbit illustration matching simulation vibe */}
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
              <div className="absolute inset-0 rounded-full border border-white/5" />
              <div className="absolute inset-6 rounded-full border border-blue-500/20" />
              <div className="absolute inset-12 rounded-full border border-purple-500/25" />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_25px_#fbbf24]" />
              <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_18px_#22d3ee]" />
              <div className="absolute right-4 top-1/3 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_18px_#fb7185]" />
              <div className="absolute left-6 bottom-6 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_18px_#a855f7]" />

              <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_22s_linear_infinite]" />
              <div className="absolute inset-10 rounded-full border border-blue-500/15 animate-[spin_16s_linear_infinite_reverse]" />
              <div className="absolute inset-20 rounded-full border border-white/10 animate-[spin_28s_linear_infinite]" />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS – physics explanation with KaTeX-like layout */}
        <section
          id="howitworks"
          className="border-t border-white/10 bg-gradient-to-b from-white/5/0 to-white/5/10"
        >
          <div className="container mx-auto px-6 py-20 md:py-24 grid md:grid-cols-[1.1fr_minmax(0,1fr)] gap-16 items-start">
            <div className="space-y-8">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.18em] uppercase text-white">
                How the simulation works
              </h2>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-xl">
                We solve Newton's equations of motion for three massive bodies
                in 3D space. There is no pre‑baked animation – every frame is
                computed from the forces between the bodies using a
                high‑accuracy numerical integrator.
              </p>

              <div className="space-y-6 text-sm text-gray-300">
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
                    1. Gravitational force
                  </h3>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-[11px] leading-relaxed">
                    <div className="mb-3 text-gray-200">
                      Total gravitational force on body{" "}
                      <span className="text-cyan-300">i</span> from all other
                      bodies:
                    </div>
                    <div
                      ref={formulaForceRef}
                      className="katex-block text-[13px] text-blue-100 overflow-x-auto"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
                    2. From force to motion
                  </h3>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-[11px] leading-relaxed space-y-3">
                    <div className="text-gray-200 mb-1">
                      First we compute acceleration from Newton&apos;s second
                      law:
                    </div>
                    <div
                      ref={formulaAccelRef}
                      className="katex-block text-[13px] text-blue-100 overflow-x-auto"
                    />
                    <div className="text-gray-200 mt-2">
                      Then we update velocities and positions with a time step
                      Δt:
                    </div>
                    <div
                      ref={formulaVelRef}
                      className="katex-block text-[13px] text-blue-100 overflow-x-auto"
                    />
                    <div
                      ref={formulaPosRef}
                      className="katex-block text-[13px] text-blue-100 overflow-x-auto"
                    />

                    <div className="text-[10px] text-gray-400 pt-2 border-t border-white/5">
                      In code, this is implemented as a symplectic
                      (energy‑preserving) integrator with several sub‑steps per
                      frame for stability.
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
                    3. Chaos & butterfly effect
                  </h3>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-[11px] leading-relaxed">
                    <p className="text-gray-300 mb-2">
                      A tiny difference in starting positions Δr(0) grows
                      roughly as:
                    </p>
                    <div
                      ref={formulaChaosRef}
                      className="katex-block text-[13px] text-blue-100 overflow-x-auto mb-2"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      where λ &gt; 0 is the Lyapunov exponent. This exponential
                      separation of trajectories is exactly what you observe
                      when using the{" "}
                      <span className="text-cyan-300">Butterfly Effect</span>{" "}
                      button in the simulation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact "formula card" column */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/15 rounded-xl p-5 md:p-6 shadow-[0_0_35px_rgba(15,23,42,0.8)]">
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-300 mb-3">
                  Core equations
                </h3>
                <div className="font-mono text-[11px] leading-relaxed text-blue-50 space-y-2">
                  <p>Newton&apos;s law of gravitation:</p>
                  <p>F = G m₁ m₂ / r²</p>
                  <p className="pt-1 border-t border-white/10 mt-2 text-gray-300">
                    In this demo we treat G as a tunable parameter (the
                    <span className="text-cyan-300"> Gravity</span> slider) to
                    keep orbits visually interesting.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/15 rounded-xl p-5 md:p-6">
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-300 mb-3">
                  What to try
                </h3>
                <ul className="text-[11px] text-gray-300 space-y-2 list-disc list-inside">
                  <li>
                    Switch between Figure‑8, 2‑Body, Chaotic and Galaxy modes.
                  </li>
                  <li>
                    Use <span className="text-cyan-300">Butterfly Effect</span>{" "}
                    to restart with microscopic perturbations.
                  </li>
                  <li>
                    Watch how orbits diverge even though formulas never change.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-10 text-gray-700 text-[10px] tracking-[0.3em] uppercase relative z-10 space-y-1">
        <p className="text-gray-600">
          Built by <span className="text-gray-400">FilipElznic</span> for
          Hack&nbsp;Club project
          <span className="text-gray-400"> Accelerate</span>
        </p>
      </footer>
    </div>
  );
};
