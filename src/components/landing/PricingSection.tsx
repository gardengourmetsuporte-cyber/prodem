import { useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Switch } from "@/components/ui/switch";
import { PlanCheckoutDialog } from "@/components/landing/PlanCheckoutDialog";

const plans = [
  {
    id: "pro",
    name: "Pro",
    description: "Para operações em crescimento",
    monthly: 97,
    yearly: 77,
    highlight: true,
    icon: 'Star',
    features: [
      "Financeiro completo",
      "Estoque inteligente",
      "Gestão de equipe",
      "Checklists ilimitados",
      "Fichas técnicas",
      "Gamificação e ranking",
      "Fechamento de caixa",
      "Até 15 usuários",
    ],
    cta: "Começar 14 dias grátis",
  },
  {
    id: "business",
    name: "Business",
    description: "Para operações avançadas",
    monthly: 197,
    yearly: 157,
    highlight: false,
    icon: 'Zap',
    features: [
      "Tudo do Pro",
      "IA Copiloto",
      "WhatsApp Bot",
      "Marketing",
      "Pedidos online (tablet)",
      "Catálogo digital",
      "Finanças pessoais",
      "Usuários ilimitados",
      "Suporte prioritário",
    ],
    cta: "Começar 14 dias grátis",
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  return (
    <section id="planos" className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
              Planos
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight font-display tracking-tight">
            Planos para cada <br className="hidden sm:block" />fase da sua operação
          </h2>
          <p className="text-base sm:text-lg text-white/50 font-medium">
            14 dias grátis em qualquer plano. Sem cartão de crédito. <br className="hidden sm:block" /> Cancele quando quiser.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-sm font-semibold transition-colors ${!yearly ? "text-white" : "text-white/40"}`}>
            Mensal
          </span>
          <Switch
            checked={yearly}
            onCheckedChange={setYearly}
            className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-white/20"
          />
          <span className={`text-sm font-semibold transition-colors flex items-center ${yearly ? "text-white" : "text-white/40"}`}>
            Anual{" "}
            <span className="inline-flex ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
              -20%
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative rounded-3xl transition-all duration-300 ${plan.highlight
                ? "md:scale-105 z-10 p-[1px] hover:-translate-y-1"
                : "p-[1px] hover:-translate-y-1 opacity-90 hover:opacity-100"
                }`}
            >
              {plan.highlight ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-900 rounded-3xl opacity-50 blur-md group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-400/50 to-transparent rounded-3xl" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl" />
              )}

              <div className={`relative h-full flex flex-col rounded-[23px] p-8 sm:p-10 ${plan.highlight
                ? "bg-[#0d1525] backdrop-blur-3xl overflow-hidden"
                : "bg-[#0d1525] backdrop-blur-2xl"
                }`}>

                {plan.highlight && (
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                )}

                <div className="h-8 mb-4">
                  {plan.highlight && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <AppIcon name="Star" size={14} className="fill-current" />
                      Mais popular
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${plan.highlight
                    ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                    : "bg-white/5 border-white/10 text-white/70"
                    }`}>
                    <AppIcon name={plan.icon} size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-white/50 min-h-[40px] font-medium">
                  {plan.description}
                </p>

                <div className="mt-8 mb-10">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-medium text-white/50">R$</span>
                    <span className="text-6xl font-extrabold tabular-nums tracking-tighter text-white">
                      {yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-sm font-medium text-white/50">/mês</span>
                  </div>
                  {yearly && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-orange-400 bg-orange-500/10 inline-block px-2 py-1 rounded-md">
                        Economize R$ {(plan.monthly - plan.yearly) * 12} no ano
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`group/btn mt-auto flex items-center justify-center gap-2 w-full h-14 rounded-xl font-bold text-base transition-all duration-300 active:scale-[0.98] ${plan.highlight
                    ? "bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_30px_rgba(232,132,44,0.3)] hover:shadow-[0_0_40px_rgba(232,132,44,0.5)]"
                    : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
                    }`}
                >
                  {plan.cta}
                  <AppIcon name="ArrowRight" size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-5 text-white/40">
                    O que está incluído:
                  </p>
                  <ul className="space-y-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm font-medium text-white/70">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-white/60"
                          }`}>
                          <AppIcon name="Check" size={12} />
                        </div>
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <PlanCheckoutDialog
          plan={selectedPlan}
          yearly={yearly}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </section>
  );
}
