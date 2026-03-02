import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { normalizePhone } from '@/lib/normalizePhone';
import type { Customer } from '@/types/customer';

const ORIGINS = [
  { value: 'manual', label: 'Manual' },
  { value: 'pdv', label: 'ERP' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'site', label: 'Site' },
  { value: 'csv', label: 'CSV' },
] as const;

const SUGGESTED_TAGS = ['VIP', 'Corporativo', 'Fiel', 'Indústria', 'Governo', 'Revenda', 'Manutenção', 'Projeto'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  isSaving?: boolean;
}

export function CustomerSheet({ open, onOpenChange, customer, onSave, isSaving }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [origin, setOrigin] = useState<string>('manual');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setOrigin(customer.origin);
      setBirthday(customer.birthday || '');
      setNotes(customer.notes || '');
      setTags(customer.tags || []);
    } else {
      setName(''); setPhone(''); setEmail(''); setOrigin('manual'); setBirthday(''); setNotes(''); setTags([]);
    }
    setTagInput('');
  }, [customer, open]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      ...(customer ? { id: customer.id } : {}),
      name: name.trim(),
      phone: normalizePhone(phone) || null,
      email: email.trim() || null,
      origin: origin as Customer['origin'],
      birthday: birthday || null,
      notes: notes.trim() || null,
      tags,
    });
  };

  const unusedSuggestions = SUGGESTED_TAGS.filter(t => !tags.includes(t));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>{customer ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pb-8">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" type="tel" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGINS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Aniversário</Label>
            <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                    <AppIcon name="X" size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Digite uma tag e pressione Enter"
              className="mb-2"
            />
            {unusedSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {unusedSuggestions.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas sobre o cliente..." rows={3} />
          </div>
          <div className="pt-2 pb-4">
            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!name.trim() || isSaving}>
              {isSaving ? 'Salvando...' : customer ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
