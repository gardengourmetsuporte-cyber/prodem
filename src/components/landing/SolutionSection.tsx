import { AppIcon } from "@/components/ui/app-icon";
import { AnimatedPhoneMockup } from "./AnimatedPhoneMockup";

const steps: { number: string; title: string; desc: string; type: "finance" | "checklist" | "inventory"; alt: string }[] = [
  {
    number: "01",
    title: "Cadastre suas contas e categorias",
    desc: "Em minutos, configure suas contas bancárias, categorias de despesas e receitas. O sistema já vem com sugestões prontas para indústrias.",
    type: "finance",
    alt: "Configuração financeira do Prodem",
  },
  {
    number: "02",
    title: "Configure os checklists da sua equipe",
    desc: "Crie tarefas para abertura, fechamento e rotina. Cada funcionário sabe exatamente o que fazer — e você acompanha de qualquer lugar.",
    type: "checklist",
    alt: "Checklist de abertura e fechamento",
  },
  {
    number: "03",
    title: "Acompanhe tudo em tempo real",
    desc: "Dashboard com lucro, estoque, equipe e alertas. Sem surpresas no final do mês.",
    type: "inventory",
    alt: "Dashboard com visão geral",
  },
];

const modules = [
  { icon: "DollarSign", title: "Financeiro", desc: "Receitas, despesas, contas e fechamento de caixa integrado." },
  { icon: "ClipboardCheck", title: "Checklists", desc: "Abertura, fechamento e rotina com progresso em tempo real." },
  { icon: "Package", title: "Estoque", desc: "Controle de materiais com alertas e sugestão de pedidos." },
  { icon: "BarChart3", title: "Relatórios", desc: "DRE, custos por categoria e resumo semanal automático." },
  { icon: "Users", title: "Gestão de Equipe", desc: "Escala, ponto, folha de pagamento e ranking de desempenho." },
  { icon: "UtensilsCrossed", title: "Fichas Técnicas", desc: "Monte fichas com custo automático baseado no estoque." },
  { icon: "Calendar", title: "Agenda & Marketing", desc: "Calendário de tarefas, campanhas e datas comemorativas." },
  { icon: "Bot", title: "IA Copiloto", desc: "Assistente inteligente que analisa dados e sugere ações." },
  { icon: "ShoppingCart", title: "Pedidos Online", desc: "Catálogo digital com pedidos via tablet e WhatsApp." },
  { icon: "Gamepad2", title: "Gamificação", desc: "Ranking e prêmios para engajar a equipe." },
];

export function SolutionSection() {
  return (
    <section id="como-funciona" className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
              Como funciona
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] tracking-tight font-display mb-4">
            Comece em 3 passos práticos
          </h2>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed font-medium">
            Do zero ao controle total em menos de 10 minutos. Esqueça sistemas complexos.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}
            >
              <div className="lg:[direction:ltr] space-y-6">
                <div className="inline-flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 blur-xl opacity-30" />
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white bg-gradient-to-br from-orange-500 to-orange-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-orange-400/30">
                      {step.number}
                    </div>
                  </div>
                  <div className="h-px flex-1 min-w-[60px] max-w-[100px] bg-gradient-to-r from-orange-500/50 to-transparent" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed text-base sm:text-lg font-medium">{step.desc}</p>
                </div>
              </div>

              <div className="lg:[direction:ltr] perspective-1200 group">
                <div
                  className="relative transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  style={{
                    transform: i % 2 === 0 ? "rotateY(-4deg) rotateX(2deg)" : "rotateY(4deg) rotateX(2deg)",
                    transformStyle: "preserve-3d"
                  }}
                >
                  <div className="absolute -inset-8 bg-gradient-to-tr from-orange-500/10 via-transparent to-blue-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" />
                  <div className="relative overflow-hidden pt-4 pb-2 px-6 sm:px-10 flex justify-center bg-[#0d1525]">
                    <AnimatedPhoneMockup type={step.type} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-32 md:mt-40 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="text-center mb-16 relative z-10">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight font-display">
              Tudo que você precisa, em um só lugar
            </h3>
            <p className="text-white/50 max-w-2xl mx-auto text-base sm:text-lg font-medium">
              10 módulos integrados que conversam entre si para você ter a visão completa do negócio.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {modules.map((m) => (
              <div
                key={m.title}
                className="group relative rounded-2xl p-[1px] overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 group-hover:from-orange-500/40 group-hover:to-transparent transition-colors duration-500" />
                <div className="relative h-full bg-[#0d1525] rounded-[15px] p-5 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300 shadow-inner">
                    <AppIcon name={m.icon} size={22} className="text-white/60 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-white text-sm mb-2">{m.title}</h4>
                  <p className="text-white/40 text-[11px] leading-relaxed hidden sm:block">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
