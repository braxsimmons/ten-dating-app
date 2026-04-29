import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { TAGLINE, PRODUCT_LIST, formatPrice } from "@ten/shared";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50 text-ink">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo className="text-2xl" />
          <nav className="flex items-center gap-1">
            <Link href="/login" className="btn-ghost">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <WhyTen />
        <Features />
        <PricingPreview />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-ink-50 to-ink-100" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-20 md:grid-cols-2 md:items-center md:pb-24 md:pt-28">
        <div className="animate-slide-up">
          <span className="pill bg-ember-100 text-ember-700">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            New: Daily decks now in beta
          </span>
          <h1 className="mt-6 font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {TAGLINE}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-600 leading-relaxed">
            Ten is a dating app built around intention, scarcity, and better
            decisions. No endless swiping. Just a daily deck of people worth
            considering.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn-ember text-base px-7 py-3">
              Start your daily 10
            </Link>
            <Link href="/login" className="btn-outline text-base px-7 py-3">
              I have an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            Free to join. 18+. No infinite scroll.
          </p>
        </div>

        <HeroDeck />
      </div>
    </section>
  );
}

function pollinationsHeroUrl(person: { name: string; prompt: string }, w = 600, h = 800): string {
  const seed = stableSeed(`${person.name}-0`);
  const params = new URLSearchParams({
    model: "flux",
    width: String(w),
    height: String(h),
    seed: String(seed),
    nologo: "true",
    enhance: "true",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(person.prompt)}?${params.toString()}`;
}

function stableSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function HeroDeck() {
  const HERO_FACES = [
    {
      name: "Aisha, 26",
      city: "Brooklyn, NY",
      offset: "translate-x-6 translate-y-6 rotate-3",
      prompt: "26 year old woman, centered portrait, sunny park in spring, yellow sundress, natural curls, open laughing smile, natural lighting, shot on 35mm film, shallow depth of field, photorealistic dating app profile photo, high quality",
    },
    {
      name: "Jordan, 29",
      city: "Brooklyn, NY",
      offset: "translate-x-3 translate-y-3 -rotate-2",
      prompt: "29 year old man, centered portrait, industrial kitchen window light, navy henley, short dark hair light stubble, amused half-smile, natural lighting, shot on 35mm film, shallow depth of field, photorealistic dating app profile photo, high quality",
    },
    {
      name: "Maya, 27",
      city: "Brooklyn, NY",
      offset: "",
      prompt: "27 year old woman, centered portrait, rooftop in Brooklyn at golden hour, linen shirt and jeans, long dark wavy hair, warm genuine smile, natural lighting, shot on 35mm film, shallow depth of field, photorealistic dating app profile photo, high quality",
    },
  ];

  return (
    <div className="relative mx-auto h-[380px] sm:h-[440px] md:h-[500px] w-full max-w-xs md:max-w-sm">
      {HERO_FACES.map((c, i) => (
        <div
          key={c.name}
          className={`absolute inset-0 ${c.offset} rounded-card shadow-card border border-ink-100 overflow-hidden bg-ink-200`}
          style={{ zIndex: i }}
        >
          <Image
            src={pollinationsHeroUrl(c)}
            alt={c.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
            priority={i === HERO_FACES.length - 1}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          <div className="absolute bottom-0 p-6 text-white">
            <p className="text-xs font-medium opacity-80">5 of 10 left today</p>
            <p className="font-display text-2xl font-semibold">{c.name}</p>
            <p className="text-sm opacity-90">{c.city} · 2 mi</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-ink-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-500">
          A different kind of dating app
        </p>
        <div className="mt-4 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            ["10", "swipes a day"],
            ["0", "infinite scroll"],
            ["1", "shot at first impressions"],
            ["100%", "intent-driven"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-3xl font-semibold">{n}</div>
              <div className="text-sm text-ink-500">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Build a real profile", body: "5 photos, 3 prompts, and one hidden trait revealed only after a match." },
    { n: "02", title: "Get your daily 10", body: "We hand you a curated deck every day. No infinite feeds. No background noise." },
    { n: "03", title: "Choose like it counts", body: "Like, pass, or rewind. Each decision actually matters — and the other side feels it too." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="font-display text-3xl font-semibold md:text-4xl">How it works</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card p-6">
            <div className="font-display text-ember text-sm font-semibold">{s.n}</div>
            <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyTen() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Why ten?
            </h2>
            <p className="mt-5 text-ink-300 leading-relaxed">
              Most dating apps reward endless swiping. We don't. Ten gives you
              scarcity, anticipation, and higher-stakes decisions — the same
              forces that make first impressions matter in real life.
            </p>
            <ul className="mt-6 space-y-3 text-ink-200">
              {[
                "Better profile quality, because every swipe is scarce.",
                "Smaller daily volume, higher daily value.",
                "Premium signals like Double Down — opt-in, not pay-to-play.",
              ].map((l) => (
                <li key={l} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ember" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-ink-900 p-8 border border-ink-800">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">Today's deck</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="font-display text-7xl font-semibold">7</div>
              <div className="text-ink-400">of 10 left</div>
            </div>
            <div className="mt-6 h-2 rounded-full bg-ink-800 overflow-hidden">
              <div className="h-full w-[30%] bg-ember" />
            </div>
            <p className="mt-6 text-sm text-ink-300">
              You'll see the full profile before you decide. Choose wisely.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { t: "Full profiles, not snippets", b: "Up to 5 photos, 3 prompt answers, and a hidden trait revealed only after a match." },
    { t: "Rewind", b: "Take back your last swipe. Free users get one rewind per streak — extras are a few cents." },
    { t: "Double Down", b: "Send a stronger signal when someone really stands out. They'll know you meant it." },
    { t: "Daily Reveal (optional)", b: "Save your matches for 8 PM. Or pay a tiny fee to peek now." },
    { t: "Streaks", b: "Show up every day, earn rewinds, swipes, and Double Downs." },
    { t: "Real safety", b: "Reports, blocks, photo moderation, and a real human admin behind the scenes." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="font-display text-3xl font-semibold md:text-4xl">What's inside</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="card p-6">
            <h3 className="font-display text-lg font-semibold">{i.t}</h3>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">{i.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingPreview() {
  const featured = ["extra_swipes_5", "extra_swipes_15", "double_downs_5", "rewinds_5"];
  return (
    <section className="bg-white border-y border-ink-100">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Microtransactions, not subscriptions</h2>
          <p className="text-sm text-ink-500">Buy what you actually need. Nothing else.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_LIST.filter((p) => featured.includes(p.id)).map((p) => (
            <div key={p.id} className="card p-6 flex flex-col">
              <div className="font-display text-2xl font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-ink-500">{p.description}</div>
              <div className="mt-6 font-display text-3xl font-semibold text-ember">
                {formatPrice(p.priceCents)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qa = [
    { q: "Why only 10 swipes a day?", a: "Because scarcity changes how you decide. When every choice counts, profile quality rises and matches actually mean something." },
    { q: "What if I want more swipes?", a: "Buy a small pack — five for $0.99, fifteen for $2.99. No subscriptions. No paywalls hiding the people you want to see." },
    { q: "What is Double Down?", a: "An optional premium like that signals stronger interest. The recipient sees you meant it, and you get prioritized in their feed." },
    { q: "Is it safe?", a: "Reports, blocks, banning, and human moderation are core, not afterthoughts. We're 18+ only." },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="font-display text-3xl font-semibold md:text-4xl">FAQ</h2>
      <div className="mt-10 divide-y divide-ink-100 border-t border-b border-ink-100">
        {qa.map((x) => (
          <details key={x.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
              {x.q}
              <span className="text-ink-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-ink-600 leading-relaxed">{x.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="rounded-card bg-ink p-10 md:p-16 text-white text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold md:text-5xl">
          Ten profiles. One day. Choose wisely.
        </h2>
        <Link href="/signup" className="btn-ember mt-8 text-base px-7 py-3 inline-flex">
          Start your daily 10
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-ink-500 md:flex-row">
        <Logo className="text-lg text-ink" />
        <span>© {new Date().getFullYear()} Ten. Be kind out there.</span>
      </div>
    </footer>
  );
}
