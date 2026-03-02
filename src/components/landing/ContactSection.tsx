import { AppIcon } from "@/components/ui/app-icon";

const WHATSAPP_URL = "https://wa.me/5519997315465?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento.";

const contacts = [
  { icon: "MapPin", title: "Endereço", lines: ["Rua Fernando de Souza, 1065", "Distrito Industrial", "São João da Boa Vista/SP"] },
  { icon: "Phone", title: "Telefone", lines: ["(19) 3624-1190", "(19) 99731-5465 (WhatsApp)"] },
  { icon: "Mail", title: "E-mail", lines: ["contato@prodem-ind.com"] },
  { icon: "Clock", title: "Horário", lines: ["Seg a Sex: 07h às 17h", "Sáb: 07h às 11h"] },
];

export function ContactSection() {
  return (
    <section id="contato" className="py-24 md:py-32 relative bg-[#0a1020] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">Contato</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.15] tracking-tight font-display mb-4">
            Fale conosco
          </h2>
          <p className="text-white/50 text-base sm:text-lg leading-relaxed">
            Estamos prontos para entender seu projeto e oferecer a melhor solução.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <div key={c.title} className="rounded-2xl bg-[#0d1525] border border-white/5 p-6 hover:border-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                  <AppIcon name={c.icon} size={18} className="text-orange-400" />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{c.title}</h4>
                {c.lines.map((line) => (
                  <p key={line} className="text-white/40 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d1525] min-h-[300px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3697.9!2d-46.79!3d-21.97!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDU4JzEyLjAiUyA0NsKwNDcnMjQuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '300px', filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(0.9)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Prodem"
            />
          </div>
        </div>

        {/* WhatsApp floating */}
        <div className="mt-12 text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_8px_30px_-8px_rgba(22,163,74,0.5)]"
          >
            <AppIcon name="MessageCircle" size={22} />
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
