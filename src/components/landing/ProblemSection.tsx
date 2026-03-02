import { AppIcon } from "@/components/ui/app-icon";

const stats = [
  { number: "10+", label: "Anos de experiência" },
  { number: "500+", label: "Projetos entregues" },
  { number: "100%", label: "Projetos sob medida" },
];

const values = [
  { icon: "Target", title: "Precisão", desc: "Engenharia detalhada com tolerâncias rigorosas para a indústria automotiva." },
  { icon: "Lightbulb", title: "Inovação", desc: "Soluções criativas para desafios complexos de movimentação e logística interna." },
  { icon: "Handshake", title: "Parceria", desc: "Trabalhamos lado a lado com nossos clientes do projeto à instalação." },
  { icon: "Award", title: "Qualidade", desc: "Materiais de primeira linha e processos controlados em cada etapa." },
];

export function ProblemSection() {
  return (
    <section id="sobre" className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">Sobre nós</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] font-display tracking-tight mb-6">
            Engenharia sob medida para a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">indústria que transforma</span>
          </h2>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            A <strong className="text-white/70">Prodem Minas Sistemas</strong> é especializada no desenvolvimento e fabricação de sistemas de transporte, embalagens metálicas e dispositivos de movimentação para a indústria automotiva e manufatura em geral. Desde 2015, entregamos soluções de engenharia que otimizam processos produtivos.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-20">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600 font-display">{s.number}</div>
              <div className="text-xs sm:text-sm text-white/40 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Values Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v) => (
            <div key={v.title} className="group relative rounded-2xl p-[1px] overflow-hidden transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 group-hover:from-orange-500/30 group-hover:to-transparent transition-colors duration-500" />
              <div className="relative h-full bg-[#0d1525] rounded-[15px] p-6 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300">
                  <AppIcon name={v.icon} size={22} className="text-white/60 group-hover:text-orange-400 transition-colors" />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{v.title}</h4>
                <p className="text-white/40 text-[13px] leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
