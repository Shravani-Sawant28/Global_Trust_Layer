import { X, Check } from 'lucide-react';

const COMPARISON = [
  { feature: 'Platform fee', traditional: '20–30%', gtl: '2%',     gtlWins: true  },
  { feature: 'Reputation ownership', traditional: 'Platform-owned', gtl: 'Your wallet', gtlWins: true  },
  { feature: 'Escrow security',  traditional: 'Centralized', gtl: 'Smart contract', gtlWins: true  },
  { feature: 'Dispute resolution', traditional: 'Platform decides', gtl: 'On-chain record', gtlWins: true  },
  { feature: 'Fraud risk check',  traditional: 'None', gtl: 'AI Trust Report', gtlWins: true  },
  { feature: 'Portable trust',    traditional: 'Siloed', gtl: 'Across any platform', gtlWins: true  },
];

export default function WhyGTLSection() {
  return (
    <section id="why-gtl" className="py-24" style={{ backgroundColor: '#FFF2DB' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F62440] mb-3">Why GTL</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1C1410] dark:text-[#F5EDE0] tracking-tight">
            Stop paying 20% to platforms that don't even protect you
          </h2>
          <p className="mt-4 text-[#9A7F65] dark:text-[#6B5A4A] max-w-xl mx-auto leading-relaxed">
            GTL isn't a platform — it's the infrastructure layer underneath platforms. No company controls it. No one can delete your reputation.
          </p>
        </div>

        {/* Comparison card */}
        <div className="rounded-xl overflow-hidden shadow-card-md border" style={{ backgroundColor: '#FFFFFF', borderColor: '#F0D9B5' }}>
          {/* Column headers */}
          <div className="grid grid-cols-3 border-b" style={{ backgroundColor: '#FFFAF3', borderColor: '#F0D9B5' }}>
            <div className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A]">Feature</div>
            <div className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#C8A87A] dark:text-[#6B5A4A] border-l" style={{ borderColor: '#F0D9B5' }}>
              Upwork / Traditional
            </div>
            <div className="px-6 py-4 border-l-2" style={{ borderColor: '#F62440', backgroundColor: '#FFF2DB' }}>
              <span className="text-sm font-bold text-[#F62440]">GlobalTrust</span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b last:border-0 ${i % 2 !== 0 ? '' : ''}`}
              style={{ borderColor: '#FAF0E4' }}
            >
              <div className="px-6 py-4 text-sm font-medium text-[#3D2E16] dark:text-[#D4C4B0]">
                {row.feature}
              </div>
              <div className="px-6 py-4 border-l flex items-center gap-2" style={{ borderColor: '#FAF0E4' }}>
                <X className="h-4 w-4 shrink-0 text-red-400" />
                <span className="text-sm text-[#9A7F65] dark:text-[#6B5A4A]">{row.traditional}</span>
              </div>
              <div className="px-6 py-4 border-l-2 flex items-center gap-2"
                style={{ borderColor: '#F62440', backgroundColor: '#FFFAF3' }}>
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm font-semibold text-[#1C1410] dark:text-[#F5EDE0]">{row.gtl}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fee highlight */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' }}>
            <p className="text-4xl font-bold text-red-500 mb-1">20–30%</p>
            <p className="text-sm text-[#9A7F65] dark:text-[#6B5A4A]">Average Upwork platform fee</p>
          </div>
          <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: '#FFF2DB', borderColor: '#F0D9B5' }}>
            <p className="text-4xl font-bold text-[#F62440] mb-1">2%</p>
            <p className="text-sm text-[#9A7F65] dark:text-[#6B5A4A]">GTL protocol fee — that's it</p>
          </div>
        </div>
      </div>
    </section>
  );
}
