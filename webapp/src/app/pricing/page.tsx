import Link from 'next/link'
import { Check, BrainCircuit } from 'lucide-react'
import { Toaster } from 'sonner'
import CheckoutButton from '@/components/ui/CheckoutButton'

const plans = [
  {
    name: 'Gratis',
    price: '0',
    period: '/månad',
    description: 'Perfekt för att komma igång',
    features: [
      '1 CV uppladdning',
      '10 AI-analyser per månad',
      '50 jobbträffar per sökning',
      'Ansökningsspårare',
      'Grundläggande jobbmatchning',
    ],
    cta: 'Kom igång gratis',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '149',
    period: '/månad',
    description: 'För seriösa jobbsökare',
    features: [
      'Obegränsat antal CV:n',
      '200 AI-analyser per månad',
      'Obegränsade jobbträffar',
      'Anpassat CV per ansökan',
      'Personligt brev AI',
      'Företagsupptäckt',
      'LIA-matching',
      'Prioriterad support',
    ],
    cta: 'Starta Pro',
    href: '/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Kontakta oss',
    period: '',
    description: 'För utbildningsanordnare och rekryteringsbyråer',
    features: [
      'Allt i Pro',
      'Obegränsade användare',
      'Anpassad integration',
      'Dedikerad account manager',
      'SLA-garanti',
      'Anpassad branding',
    ],
    cta: 'Kontakta oss',
    href: 'mailto:info@careerops.ai',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Toaster richColors />
      <header className="border-b px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">CareerBridge AI</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Logga in</Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Registrera</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Enkla, transparenta priser</h1>
          <p className="text-lg text-slate-500">Välj det plan som passar din jobbsökning</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${plan.highlighted ? 'border-blue-600 bg-blue-50 shadow-lg' : ''}`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  Populärast
                </div>
              )}
              <h3 className="mb-1 text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mb-4 text-sm text-slate-500">{plan.description}</p>
              <div className="mb-8 flex items-baseline gap-1">
                {plan.price === 'Kontakta oss' ? (
                  <span className="text-2xl font-bold text-slate-900">Kontakta oss</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-slate-900">{plan.price} kr</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </>
                )}
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <Check className="h-4 w-4 shrink-0 text-blue-600" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.highlighted ? (
                <CheckoutButton
                  label={plan.cta}
                  className="block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                />
              ) : (
                <Link
                  href={plan.href}
                  className="block w-full rounded-lg border border-slate-200 py-3 text-center font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
