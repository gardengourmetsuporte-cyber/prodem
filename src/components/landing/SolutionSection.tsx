import { AppIcon } from "@/components/ui/app-icon";

const solutions = [
  {
    icon: "ArrowRightLeft",
    title: "Transportadores Industriais",
    desc: "Sistemas de esteiras, roletes e correntes para linhas de produção e montagem. Projetos customizados para cada layout de fábrica.",
    features: ["Esteiras transportadoras", "Sistemas de roletes", "Transportadores de corrente", "Elevadores de carga"],
    gradient: "from-orange-500/20 via-orange-500/5 to-transparent",
  },
  {
    icon: "Box",
    title: "Embalagens Metálicas",
    desc: "Racks, containers e embalagens especiais para armazenamento e transporte de peças automotivas e componentes industriais.",
    features: ["Racks retornáveis", "Containers metálicos", "Embalagens especiais", "Proteção anti-corrosão"],
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  {
    icon: "Truck",
    title: "Carrinhos de Movimentação",
    desc: "Dispositivos ergonômicos para logística interna de fábricas. Carrinhos, dollies e sistemas de abastecimento de linha.",
    features: ["Carrinhos ergonômicos", "Dollies industriais", "Kit-carts", "Sistemas AGV-ready"],
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
];

const differentials = [
  { icon: "Pencil", title: "Projetos sob medida", desc: "Cada solução é desenhada para a necessidade específica do cliente." },
  { icon: "Wrench", title: "Engenharia própria", desc: "Equipe interna de engenheiros especializados em movimentação industrial." },
  { icon: "Zap", title: "Atendimento ágil", desc: "Do orçamento à entrega com comunicação direta e sem burocracia." },
  { icon: "ShieldCheck", title: "Qualidade certificada", desc: "Processos controlados e materiais rastreados em cada projeto." },
];

export function SolutionSection() {
  return (
    <section id="solucoes" className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">Nossas soluções</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] tracking-tight font-display mb-4">
            Soluções completas para sua operação
          </h2>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed font-medium">
            Da concepção à instalação, oferecemos projetos de engenharia que otimizam sua produção.
          </p>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          {solutions.map((s) => (
            <div key={s.title} className="group relative rounded-3xl p-[1px] overflow-hidden transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-100 group-hover:opacity-0 transition-opacity duration-500" />
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative h-full rounded-[23px] bg-[#0d1525] border border-white/5 flex flex-col p-8 z-10">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300">
                    <AppIcon name={s.icon} size={26} className="text-white/60 group-hover:text-orange-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm mb-6 flex-1">{s.desc}</p>
                <ul className="space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/40">
                      <AppIcon name="Check" size={14} className="text-orange-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Differentials */}
        <div className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="text-center mb-12 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight font-display">
              Por que escolher a Prodem?
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {differentials.map((d) => (
              <div key={d.title} className="group relative rounded-2xl p-[1px] overflow-hidden transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 group-hover:from-orange-500/40 group-hover:to-transparent transition-colors duration-500" />
                <div className="relative h-full bg-[#0d1525] rounded-[15px] p-5 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300">
                    <AppIcon name={d.icon} size={22} className="text-white/60 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-2">{d.title}</h4>
                  <p className="text-white/40 text-[12px] leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
