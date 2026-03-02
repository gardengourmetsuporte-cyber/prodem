import { AppIcon } from "@/components/ui/app-icon";
import heroImg from "@/assets/hero-industrial.jpg";

const WHATSAPP_URL = "https://wa.me/5519997315465?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento.";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a1020] min-h-[90vh] flex items-center">
      {/* Background */}
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
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-20" style={{ background: 'hsl(25 85% 54%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] mix-blend-screen opacity-15" style={{ background: 'hsl(220 70% 50%)' }} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-20 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-8 animate-[fade-up_0.8s_ease-out_both]">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 bg-white/5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-white/70">Engenharia industrial desde 2015</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display leading-[1.1]">
              Soluções em{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                transporte e movimentação
              </span>{" "}
              industrial
            </h1>

            <p className="text-lg text-white/55 max-w-xl leading-relaxed">
              Projetos sob medida de transportadores, embalagens metálicas e carrinhos de movimentação para a indústria automotiva e manufatura.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contato"
                className="group relative inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full font-bold text-base bg-white text-black overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ boxShadow: '0 0 40px hsl(0 0% 100% / 0.15)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10">Solicitar Orçamento</span>
                <AppIcon name="ArrowRight" size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full text-base font-semibold text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300"
              >
                <AppIcon name="MessageCircle" size={20} />
                Fale pelo WhatsApp
              </a>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/40 pt-2">
              <span className="flex items-center gap-2"><AppIcon name="Shield" size={16} className="text-orange-500" /> Qualidade garantida</span>
              <span className="flex items-center gap-2"><AppIcon name="Clock" size={16} className="text-orange-500" /> Entrega no prazo</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-[fade-up_1s_ease-out_0.3s_both]">
            <div className="absolute -inset-8 bg-gradient-to-tr from-orange-500/15 via-transparent to-blue-500/10 rounded-[3rem] blur-2xl opacity-60" />
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
              <img
                src={heroImg}
                alt="Sistemas de transporte industrial Prodem"
                className="w-full h-auto object-cover aspect-[16/10]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1020]/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
