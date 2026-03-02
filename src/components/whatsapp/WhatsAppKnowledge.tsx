import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWhatsAppKnowledge } from '@/hooks/useWhatsApp';
import { useUnit } from '@/contexts/UnitContext';
import type { WhatsAppKnowledgeArticle } from '@/types/whatsapp';
import { AppIcon } from '@/components/ui/app-icon';

const CATEGORY_OPTIONS = ['geral', 'entrega', 'pagamento', 'funcionamento', 'politicas', 'contato'];

const SUGGESTIONS = [
  { title: 'Horário de Funcionamento', category: 'funcionamento', content: 'Ex: Segunda a Sexta: 11h às 23h\nSábados: 11h às 00h\nDomingos: 12h às 22h' },
  { title: 'Endereço e Localização', category: 'geral', content: 'Ex: Rua Exemplo, 123 - Bairro - Cidade/UF' },
  { title: 'Formas de Pagamento', category: 'pagamento', content: 'Ex: Aceitamos Pix, cartão de crédito/débito e dinheiro.' },
  { title: 'Tempo de Entrega', category: 'entrega', content: 'Ex: Entregas em até 45 minutos para a região.' },
  { title: 'Taxa de Entrega', category: 'entrega', content: 'Ex: Taxa fixa de R$ 5,00 para até 5km.' },
  { title: 'Política de Cancelamento', category: 'politicas', content: 'Ex: Cancelamentos aceitos em até 5 minutos após a confirmação do pedido.' },
  { title: 'Informações sobre Alérgenos', category: 'geral', content: 'Ex: Nossos produtos podem conter glúten, lactose e oleaginosas. Consulte antes de pedir.' },
  { title: 'Contato / Redes Sociais', category: 'contato', content: 'Ex: Instagram: @prodem\nTelefone: (19) 99999-9999' },
];

export function WhatsAppKnowledge() {
  const { activeUnitId } = useUnit();
  const { articles, isLoading, upsertArticle, deleteArticle, toggleActive } = useWhatsAppKnowledge();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<WhatsAppKnowledgeArticle> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const openNew = () => {
    setEditing({ title: '', content: '', category: 'geral', is_active: true });
    setSheetOpen(true);
  };

  const openEdit = (article: WhatsAppKnowledgeArticle) => {
    setEditing({ ...article });
    setSheetOpen(true);
  };

  const useSuggestion = (s: typeof SUGGESTIONS[0]) => {
    setEditing({ title: s.title, content: s.content, category: s.category, is_active: true });
    setShowSuggestions(false);
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!editing?.title || !activeUnitId) return;
    upsertArticle.mutate({ ...editing, unit_id: activeUnitId } as any, {
      onSuccess: () => { setSheetOpen(false); setEditing(null); },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon name="BookOpen" className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Base de Conhecimento</h2>
          <span className="text-xs text-muted-foreground">({articles.length} artigos)</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowSuggestions(!showSuggestions)}>
            <AppIcon name="Lightbulb" className="w-3.5 h-3.5 mr-1" />
            Sugestões
          </Button>
          <Button size="sm" onClick={openNew}>
            <AppIcon name="Plus" className="w-3.5 h-3.5 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-border/30 bg-muted/30">
          <p className="col-span-full text-xs text-muted-foreground mb-1">Clique para usar como base:</p>
          {SUGGESTIONS.filter(s => !articles.some(a => a.title === s.title)).map(s => (
            <button
              key={s.title}
              onClick={() => useSuggestion(s)}
              className="text-left text-xs p-2 rounded-md border border-border/20 hover:bg-accent/50 transition-colors"
            >
              <span className="font-medium">{s.title}</span>
              <span className="block text-muted-foreground mt-0.5">{s.category}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AppIcon name="BookOpen" className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum artigo cadastrado</p>
          <p className="text-xs mt-1">Use as sugestões ou crie um novo artigo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map(article => (
            <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-card/50">
              <Switch
                checked={article.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: article.id, is_active: v })}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{article.title}</p>
                <p className="text-xs text-muted-foreground">{article.category}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(article)}>
                  <AppIcon name="Pencil" className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteArticle.mutate(article.id)}>
                  <AppIcon name="Trash2" className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Editar Artigo' : 'Novo Artigo'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Título</Label>
              <Input
                value={editing?.title || ''}
                onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
                placeholder="Ex: Horário de Funcionamento"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={editing?.category || 'geral'}
                onValueChange={v => setEditing(prev => prev ? { ...prev, category: v } : prev)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={editing?.content || ''}
                onChange={e => setEditing(prev => prev ? { ...prev, content: e.target.value } : prev)}
                placeholder="Escreva aqui as informações que a IA deve saber..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-1">A IA vai ler este conteúdo para responder perguntas dos clientes.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editing?.is_active ?? true}
                onCheckedChange={v => setEditing(prev => prev ? { ...prev, is_active: v } : prev)}
              />
              <Label>Artigo ativo</Label>
            </div>
            <Button onClick={handleSave} disabled={upsertArticle.isPending} className="w-full">
              {upsertArticle.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
