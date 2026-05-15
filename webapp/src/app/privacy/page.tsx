import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

export const metadata = { title: 'Integritetspolicy – CareerBridge AI' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900">CareerBridge AI</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Logga in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Integritetspolicy</h1>
        <p className="mb-10 text-sm text-slate-400">Senast uppdaterad: 2026-05-10</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Vilka uppgifter vi samlar in</h2>
            <p>
              Vi samlar in de uppgifter du tillhandahåller direkt: e-postadress vid registrering,
              CV-text du laddar upp, profilinformation (stad, lönemål, önskade roller) samt
              information om dina jobbansökningar som du lägger in i systemet.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Hur vi använder dina uppgifter</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Tillhandahålla och förbättra tjänsten</li>
              <li>Analysera ditt CV med AI för att generera jobbmatchningar och anpassat material</li>
              <li>Skicka transaktionell kommunikation (t.ex. bekräftelser)</li>
              <li>Hantera din prenumeration och fakturering</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Delning med tredje part</h2>
            <p>
              Vi delar inte dina personuppgifter med tredje part i marknadsföringssyfte.
              Din CV-text skickas till Anthropic eller OpenAI för AI-analys. Autentisering hanteras
              av Supabase. Betalningar hanteras av Stripe. Alla underleverantörer är bundna av
              lämpliga databehandlingsavtal.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. Lagring och radering</h2>
            <p>
              Dina uppgifter lagras så länge ditt konto är aktivt. Du kan när som helst radera
              ditt konto och all tillhörande data via Inställningar → Danger zone.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Cookies</h2>
            <p>
              Vi använder nödvändiga sessionskakor för autentisering. Vi använder inga
              spårnings- eller reklamkakor.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Dina rättigheter (GDPR)</h2>
            <p>
              Som användare inom EU har du rätt att begära tillgång till, rättelse av eller radering
              av dina personuppgifter. Kontakta oss på{' '}
              <a href="mailto:info@careerops.ai" className="text-blue-600 hover:underline">
                info@careerops.ai
              </a>{' '}
              för att utöva dessa rättigheter.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Kontakt</h2>
            <p>
              Frågor om denna policy skickas till{' '}
              <a href="mailto:info@careerops.ai" className="text-blue-600 hover:underline">
                info@careerops.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
