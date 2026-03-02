import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/ui/app-icon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuoteRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteRequestDialog({ open, onOpenChange }: QuoteRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    description: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Preencha nome e descrição do projeto.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("quote_requests" as any).insert({
        name: form.name.trim(),
        company: form.company.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        description: form.description.trim(),
      } as any);

      if (error) throw error;

      toast.success("Orçamento enviado com sucesso! Entraremos em contato em breve.");
      setForm({ name: "", company: "", phone: "", email: "", description: "" });
      onOpenChange(false);
    } catch {
      toast.error("Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0f1729] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
            <AppIcon name="FileText" size={22} className="text-orange-400" />
            Solicitar Orçamento
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Preencha os dados abaixo e retornaremos o mais rápido possível.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Seu nome"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Empresa</Label>
              <Input
                value={form.company}
                onChange={e => handleChange("company", e.target.value)}
                placeholder="Nome da empresa"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">Telefone / WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="(19) 99999-9999"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-sm">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="seu@email.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Descrição do projeto *</Label>
            <Textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              placeholder="Descreva o que você precisa: tipo de equipamento, dimensões, quantidade, materiais..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50 min-h-[100px] resize-none"
              maxLength={1000}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white text-black font-bold text-base hover:bg-white/90 rounded-xl"
          >
            {loading ? (
              <AppIcon name="Loader2" size={20} className="animate-spin" />
            ) : (
              <>
                Enviar Solicitação
                <AppIcon name="ArrowRight" size={18} className="ml-2" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
