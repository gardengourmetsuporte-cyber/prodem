import logoImg from "@/assets/prodem-logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
                <img src={logoImg} alt="Prodem" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-sm font-bold text-foreground font-display">Prodem Minas Sistemas</span>
            </div>
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              Soluções em sistemas de transporte e movimentação industrial. Desde 2015.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Navegação</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="#sobre" className="block hover:text-foreground transition-colors">Sobre nós</a>
              <a href="#solucoes" className="block hover:text-foreground transition-colors">Soluções</a>
              <a href="#contato" className="block hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Contato</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>(19) 3624-1190</p>
              <p>(19) 99731-5465</p>
              <p>contato@prodem-ind.com</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border/20 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Prodem Minas Sistemas Ltda · CNPJ: XX.XXX.XXX/0001-XX · Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
