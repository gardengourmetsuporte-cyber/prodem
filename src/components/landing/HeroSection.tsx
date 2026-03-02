import { Link } from "react-router-dom";
import { AppIcon } from "@/components/ui/app-icon";
import { AnimatedMockup } from "./AnimatedMockup";

const features = [
  { icon: "BarChart3", label: "Financeiro" },
  { icon: "Package", label: "Estoque" },
  { icon: "Users", label: "Equipe" },
  { icon: "ListChecks", label: "Checklists" },
  { icon: "Bot", label: "IA Copiloto" },
  { icon: "ShoppingCart", label: "Pedidos" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a1020]">
      {/* Core Background Mesh/Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 50%, hsl(25 85% 54% / 0.15), transparent 25%),
              radial-gradient(circle at 85% 30%, hsl(220 70% 50% / 0.12), transparent 25%)
            `
          }}
        />

        <div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse"
          style={{ background: 'hsl(25 85% 54%)', animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] mix-blend-screen opacity-20"
          style={{ background: 'hsl(220 70% 50%)', animation: 'float-orb-2 15s ease-in-out infinite' }}
        />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 md:pt-48 pb-24 md:pb-32">
        <div className="flex flex-col items-center text-center space-y-8 animate-[fade-up_0.8s_ease-out_both] max-w-4xl mx-auto">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-colors cursor-default">
            <AppIcon name="Sparkles" size={14} className="text-orange-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">
              A nova era da gestão industrial
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.1]">
            O sistema perfeito para <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
              sua indústria crescer.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl leading-relaxed font-medium">
            Tudo em um só lugar. Esqueça planilhas confusas e sistemas lentos. Experimente o SaaS mais inteligente, rápido e bonito do mercado, construído para operações industriais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Link
              to="/auth?plan=free"
              className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-bold text-base bg-white text-black overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: '0 0 40px hsl(0 0% 100% / 0.15)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Começar grátis agora
              <AppIcon name="ArrowRight" size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center h-14 px-8 rounded-full text-base font-semibold text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              Já tenho uma conta
            </Link>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 md:gap-4 text-xs text-white/40 pt-2 font-medium">
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-orange-500" /> Sem cartão de crédito</span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-orange-500" /> Setup em 5 minutos</span>
            <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block" />
            <span className="flex items-center gap-1.5"><AppIcon name="Check" size={14} className="text-orange-500" /> Cancele quando quiser</span>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-3 animate-[fade-up_0.8s_ease-out_0.2s_both] max-w-4xl mx-auto">
          {features.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-[1.05] hover:bg-white/10 cursor-default"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <AppIcon name={icon} size={16} className="text-white/60" />
              {label}
            </div>
          ))}
        </div>

        {/* 3D Dashboard Mockup */}
        <div className="relative mt-20 sm:mt-24 w-full max-w-5xl mx-auto animate-[fade-up_1s_ease-out_0.4s_both] group">
          <div
            className="relative transition-transform duration-700 ease-out hover:scale-[1.02]"
            style={{ transform: "perspective(1200px) rotateX(4deg)", transformStyle: "preserve-3d" }}
          >
            <div className="absolute -inset-10 rounded-[3rem] blur-[80px] bg-gradient-to-b from-primary/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-700" />

            <div className="relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-white/10 bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 px-4 py-3 sm:py-4 border-b border-white/10 bg-[#0a1020]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56] border border-white/10" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E] border border-white/10" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F] border border-white/10" />
                </div>
                <div className="flex-1 mx-4 sm:mx-8">
                  <div className="h-6 sm:h-8 rounded-md max-w-[280px] mx-auto flex items-center justify-center bg-white/5 border border-white/5">
                    <AppIcon name="Lock" size={12} className="text-white/40 mr-1.5" />
                    <span className="text-[10px] sm:text-xs text-white/40 font-medium tracking-wide">app.prodem-ind.com</span>
                  </div>
                </div>
              </div>

              <AnimatedMockup />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
