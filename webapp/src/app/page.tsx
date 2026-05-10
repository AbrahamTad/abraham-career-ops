import Link from 'next/link'
import { ArrowRight, BrainCircuit, FileText, Search, Target, TrendingUp, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">CareerBridge AI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="#features" className="hover:text-slate-900">Funktioner</Link>
            <Link href="#how-it-works" className="hover:text-slate-900">Hur det fungerar</Link>
            <Link href="/pricing" className="hover:text-slate-900">Priser</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Logga in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Kom igång gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full border bg-blue-50 px-3 py-1 text-sm text-blue-700">
          <span className="mr-2">🇸🇪</span> Optimerad för den svenska arbetsmarknaden
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
          Hitta rätt jobb med{' '}
          <span className="text-blue-600">AI-precision</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Ladda upp ditt CV och låt AI analysera, matcha och anpassa dina ansökningar.
          Perfekt för frontendutvecklare, QA-ingenjörer, och LIA-sökande.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Skapa konto gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-lg border px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Se hur det fungerar
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">Inget kreditkort krävs · Gratis att testa</p>
      </section>

      {/* Stats */}
      <section className="border-y bg-slate-50 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
          {[
            { value: '740+', label: 'Utvärderade annonser' },
            { value: '100+', label: 'Anpassade CV:n' },
            { value: '5.0', label: 'AI-matchningspoäng' },
            { value: '< 3 min', label: 'Per jobbanalys' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">Allt du behöver för jobbsökning</h2>
        <p className="mb-16 text-center text-slate-500">Från CV-analys till anpassade ansökningar – allt på ett ställe</p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <f.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-16 text-center text-3xl font-bold text-slate-900">Kom igång på 3 steg</h2>
          <div className="space-y-12">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-slate-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">Redo att hitta din nästa roll?</h2>
          <p className="mb-8 text-slate-500">
            Gå med tusentals jobbsökare som använder AI för att hitta rätt matchning.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700"
          >
            Skapa gratis konto <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            <span>CareerBridge AI</span>
          </div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-slate-600">Priser</Link>
            <Link href="/privacy" className="hover:text-slate-600">Integritet</Link>
            <Link href="/terms" className="hover:text-slate-600">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: FileText,
    title: 'AI CV-analys',
    description: 'Ladda upp ditt CV (PDF, DOCX eller text) och få en djup analys av dina styrkor, kompetenser och förbättringsområden.',
  },
  {
    icon: Target,
    title: 'Intelligent jobbmatchning',
    description: 'AI jämför ditt CV mot jobbannonser och ger ett matchningspoäng med tydliga motiveringar — inte bara nyckelordsmatchning.',
  },
  {
    icon: Search,
    title: 'Jobbscanning',
    description: 'Automatisk sökning på Greenhouse, Ashby, Lever och svenska jobboarder. Hitta relevanta tjänster utan att leta manuellt.',
  },
  {
    icon: BrainCircuit,
    title: 'Anpassat CV per ansökan',
    description: 'AI omskriver och anpassar ditt CV för varje specifik tjänst — ärligt och baserat på din verkliga erfarenhet.',
  },
  {
    icon: Users,
    title: 'Företagsupptäckt',
    description: 'Hitta relevanta företag baserat på ditt CV, inklusive sådana som inte annonserat öppet men kan ta emot LIA.',
  },
  {
    icon: TrendingUp,
    title: 'Ansökningsuppföljning',
    description: 'Håll koll på alla dina ansökningar: sparad, ansökt, intervju, erbjudande — allt på ett ställe.',
  },
]

const steps = [
  {
    title: 'Ladda upp ditt CV',
    description: 'Ladda upp som PDF/DOCX eller klistra in text. AI extraherar automatiskt dina kompetenser, erfarenheter och mål.',
  },
  {
    title: 'Hitta matchande jobb',
    description: 'Systemet söker och matchar jobb mot ditt CV och ger poäng med tydliga förklaringar. Du bestämmer vad som är intressant.',
  },
  {
    title: 'Ansök med anpassat material',
    description: 'Generera ett skräddarsytt CV och personligt brev för varje tjänst. Exportera som PDF och ansök med självförtroende.',
  },
]
