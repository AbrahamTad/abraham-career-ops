import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

export const metadata = { title: 'Användarvillkor – CareerBridge AI' }

export default function TermsPage() {
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
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Användarvillkor</h1>
        <p className="mb-10 text-sm text-slate-400">Senast uppdaterad: 2026-05-10</p>

        <div className="space-y-8 text-slate-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">1. Acceptans av villkor</h2>
            <p>
              Genom att skapa ett konto eller använda CareerBridge AI accepterar du dessa
              användarvillkor. Om du inte accepterar villkoren ska du inte använda tjänsten.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">2. Tjänstens syfte</h2>
            <p>
              CareerBridge AI är ett verktyg för jobbsökning som hjälper användare att analysera
              CV:n, hitta jobb och generera ansökningsmaterial med hjälp av AI. Tjänsten är avsedd
              för personligt, icke-kommersiellt bruk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">3. Användarkonto</h2>
            <p>
              Du ansvarar för att hålla dina inloggningsuppgifter konfidentiella och för all
              aktivitet som sker via ditt konto. Meddela oss omedelbart om du misstänker obehörig
              åtkomst.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">4. AI-genererat innehåll</h2>
            <p>
              AI-genererat material (CV-anpassningar, personliga brev, jobbmatchningar) är
              verktyg för att stödja din jobbsökning. Du ansvarar för att granska och verifiera
              allt material innan du skickar det till arbetsgivare. Vi garanterar inte riktigheten
              i AI-genererade texter.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">5. Prenumeration och betalning</h2>
            <p>
              Gratis-planen är tillgänglig utan betalning. Pro-planen faktureras månadsvis via
              Stripe. Du kan avsluta din prenumeration när som helst; avslutning träder i kraft
              vid slutet av betalningsperioden.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">6. Ansvarsbegränsning</h2>
            <p>
              Tjänsten tillhandahålls &quot;som den är&quot;. Vi ansvarar inte för uteblivna
              jobberbjudanden, inkorrekta jobbmatchningar eller skador som uppstår till följd av
              användning av tjänsten.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">7. Kontakt</h2>
            <p>
              Frågor om dessa villkor skickas till{' '}
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
