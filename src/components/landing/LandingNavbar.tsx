import { useState, useEffect } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import logoImg from "@/assets/prodem-logo.png";

const WHATSAPP_URL = "https://wa.me/5519997315465?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento.";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Sobre", href: "#sobre" },
    { label: "Soluções", href: "#solucoes" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${scrolled
        ? "bg-[#0f1729]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-white/10 shadow-sm">
            <img src={logoImg} alt="Prodem" className="w-[85%] h-[85%] object-contain" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Prodem</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            WhatsApp
          </a>
          <a
            href="/auth"
            className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            Entrar
          </a>
          <a
            href="#contato"
            className="group relative inline-flex items-center justify-center h-10 px-6 rounded-full text-sm font-bold bg-white text-black overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">Solicitar Orçamento</span>
          </a>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <a
            href="#contato"
            className="inline-flex items-center justify-center h-8 px-4 rounded-full text-xs font-bold bg-white text-black transition-all active:scale-[0.98]"
          >
            Orçamento
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10 bg-white/5 border border-white/10"
          >
            {open ? <AppIcon name="X" size={20} /> : <AppIcon name="Menu" size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[400px] border-b border-white/10 shadow-2xl" : "max-h-0"}`}>
        <div className="bg-[#0f1729]/98 backdrop-blur-3xl px-4 pt-4 pb-6 space-y-2">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3.5 px-4 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-3">
            <a
              href="/auth"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3.5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              Entrar
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3.5 rounded-xl text-base font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
            >
              WhatsApp
            </a>
            <a
              href="#contato"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-3.5 rounded-xl text-base font-bold bg-white text-black active:scale-[0.98] transition-transform"
            >
              Solicitar Orçamento
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
