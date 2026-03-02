import { AppIcon } from "@/components/ui/app-icon";
import logoImg from "@/assets/prodem-logo.png";

const WHATSAPP_URL = "https://wa.me/5519997315465?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento.";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-[2.5rem] overflow-hidden p-10 sm:p-14 md:p-20 text-center border border-white/10"
          style={{
            background: 'linear-gradient(145deg, #0a1020 0%, #101830 50%, #0a1020 100%)',
            boxShadow: '0 20px 80px -20px rgba(232,132,44,0.15), inset 0 1px 1px rgba(255,255,255,0.05)'
          }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.15] mix-blend-screen pointer-events-none" style={{ background: 'hsl(25 85% 54%)' }} />
          <div className="absolute bottom-[20%] right-[20%] w-[250px] h-[250px] rounded-full blur-[80px] opacity-[0.1] mix-blend-screen pointer-events-none" style={{ background: 'hsl(220 70% 50%)' }} />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ boxShadow: '0 0 60px hsl(25 85% 54% / 0.2)' }}>
              <img src={logoImg} alt="Prodem" className="w-11 h-11 object-contain" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight font-display">
              Pronto para otimizar<br className="hidden sm:block" /> sua operação industrial?
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Entre em contato e receba um orçamento personalizado para o seu projeto. Atendimento rápido e sem compromisso.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#contato"
                className="group inline-flex items-center justify-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base bg-white text-[hsl(222,30%,15%)] shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              >
                Solicitar Orçamento
                <AppIcon name="ArrowRight" size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-base border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                <AppIcon name="MessageCircle" size={18} />
                WhatsApp
              </a>
            </div>

            <div className="mt-7 flex items-center justify-center gap-4 sm:gap-5 text-xs text-white/35 flex-wrap">
              <span className="flex items-center gap-1.5">
                <AppIcon name="Phone" size={12} />
                (19) 3624-1190
              </span>
              <span className="text-white/15">·</span>
              <span>contato@prodem-ind.com</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
