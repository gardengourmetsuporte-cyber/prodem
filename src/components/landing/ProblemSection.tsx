import { AppIcon } from "@/components/ui/app-icon";

const problems = [
  {
    icon: "TrendingDown",
    title: '"Quanto sobrou esse mês?"',
    desc: "Você fecha o mês sem saber se teve lucro ou prejuízo. As contas estão espalhadas em planilhas e grupos de WhatsApp.",
    glow: "from-red-500/20 via-red-500/5 to-transparent",
    iconColor: "text-red-400",
  },
  {
    icon: "AlertTriangle",
    title: '"Faltou material de novo"',
    desc: "Estoque zerado no meio da produção. Sem controle, você descobre na hora errada e para a linha.",
    glow: "from-amber-500/20 via-amber-500/5 to-transparent",
    iconColor: "text-amber-400",
  },
  {
    icon: "Users",
    title: '"A equipe não se engaja"',
    desc: "Funcionário sem feedback, sem meta, sem motivação. Alta rotatividade e baixa produtividade.",
    glow: "from-orange-500/20 via-orange-500/5 to-transparent",
    iconColor: "text-orange-400",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
              A realidade atual
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] font-display tracking-tight">
            Você reconhece alguma dessas situações?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-3xl p-[1px] overflow-hidden transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
              <div className={`absolute inset-0 bg-gradient-to-br ${p.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative h-full rounded-[23px] bg-[#0d1525] border border-white/5 flex flex-col p-8 z-10">
                <div className="mb-6 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${p.glow} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <AppIcon name={p.icon} size={26} className={p.iconColor} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{p.title}</h3>
                <p className="text-base text-white/50 leading-relaxed flex-1">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
