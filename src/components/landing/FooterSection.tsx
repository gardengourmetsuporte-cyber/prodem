import { Link } from "react-router-dom";
import logoImg from "@/assets/prodem-logo.png";

export function FooterSection() {
  return (
    <footer className="py-12 border-t border-border/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
              <img src={logoImg} alt="Prodem" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-sm font-bold text-foreground font-display">Prodem Gestão</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
            <a href="mailto:contato@prodem-ind.com" className="hover:text-foreground transition-colors">Contato</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Prodem Gestão · Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
