import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppIcon } from '@/components/ui/app-icon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MarketingPost, MarketingChannel } from '@/types/marketing';

interface PostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: MarketingPost | null;
  onSave: (data: Partial<MarketingPost>) => void;
  onPublish: (post: MarketingPost) => void;
  uploadMedia: (file: File) => Promise<string>;
  isSaving: boolean;
  prefillDate?: Date | null;
  prefillTitle?: string;
}

export function PostSheet({ open, onOpenChange, post, onSave, onPublish, uploadMedia, isSaving, prefillDate, prefillTitle }: PostSheetProps) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [channels, setChannels] = useState<MarketingChannel[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setCaption(post.caption || '');
      setChannels(post.channels || []);
      if (post.scheduled_at) {
        const d = new Date(post.scheduled_at);
        setScheduledAt(d);
        setScheduledTime(format(d, 'HH:mm'));
      } else {
        setScheduledAt(undefined);
        setScheduledTime('12:00');
      }
      setTags((post.tags || []).join(', '));
      setNotes(post.notes || '');
      setMediaUrls(post.media_urls || []);
    } else {
      setTitle(prefillTitle || '');
      setCaption('');
      setChannels([]);
      if (prefillDate) {
        setScheduledAt(prefillDate);
        setScheduledTime('12:00');
      } else {
        setScheduledAt(undefined);
        setScheduledTime('12:00');
      }
      setTags('');
      setNotes('');
      setMediaUrls([]);
    }
  }, [post, open, prefillDate, prefillTitle]);

  const toggleChannel = (ch: MarketingChannel) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadMedia(file);
        urls.push(url);
      }
      setMediaUrls(prev => [...prev, ...urls]);
    } catch {
      // toast handled in hook
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeMedia = (idx: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const buildScheduledAt = (): string | null => {
    if (!scheduledAt) return null;
    const [h, m] = scheduledTime.split(':').map(Number);
    const d = new Date(scheduledAt);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const buildData = (): Partial<MarketingPost> => ({
    ...(post ? { id: post.id } : {}),
    title: title.trim() || 'Sem título',
    caption,
    channels,
    scheduled_at: buildScheduledAt(),
    status: scheduledAt ? 'scheduled' : 'draft',
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    notes: notes || null,
    media_urls: mediaUrls,
  });

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{post ? 'Editar Post' : 'Novo Post'}</SheetTitle>
          <SheetDescription>Planeje seu conteúdo de marketing</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do post" />
          </div>

          <div>
            <Label>Legenda <span className="text-muted-foreground text-xs">({caption.length}/2200)</span></Label>
            <Textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Escreva a legenda..."
              rows={4}
              maxLength={2200}
            />
          </div>

          {/* Media */}
          <div>
            <Label>Mídia</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/40">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <AppIcon name="X" size={10} style={{ color: 'white' }} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <AppIcon name="add_photo_alternate" size={20} className="text-muted-foreground" />
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Channels */}
          <div>
            <Label>Canais</Label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={channels.includes('instagram')} onCheckedChange={() => toggleChannel('instagram')} />
                <AppIcon name="photo_camera" size={16} className="text-pink-400" />
                <span className="text-sm">Instagram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={channels.includes('whatsapp_status')} onCheckedChange={() => toggleChannel('whatsapp_status')} />
                <AppIcon name="MessageCircle" size={16} className="text-success" />
                <span className="text-sm">WhatsApp</span>
              </label>
            </div>
          </div>

          {/* Schedule with time */}
          <div className="space-y-2">
            <Label>Agendar para</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <AppIcon name="CalendarDays" size={16} className="mr-2" />
                    {scheduledAt ? format(scheduledAt, "dd/MM/yyyy", { locale: ptBR }) : 'Sem agendamento'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledAt} onSelect={setScheduledAt} locale={ptBR} />
                </PopoverContent>
              </Popover>
              {scheduledAt && (
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="w-[100px]">
                    <AppIcon name="Clock" size={14} className="mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags <span className="text-muted-foreground text-xs">(separadas por vírgula)</span></Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="promoção, cardápio, novidade" />
          </div>

          {/* Notes */}
          <div>
            <Label>Notas internas</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações..." rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            <LoadingButton
              variant="outline"
              className="flex-1"
              onClick={() => { onSave(buildData()); onOpenChange(false); }}
              disabled={!title.trim()}
              loading={isSaving}
              loadingText="Salvando..."
            >
              <AppIcon name="Save" size={16} className="mr-2" /> Salvar
            </LoadingButton>
            {post && post.media_urls.length > 0 && channels.length > 0 && (
              <Button
                className="flex-1"
                onClick={() => { onSave(buildData()); onPublish({ ...post, ...buildData() } as MarketingPost); }}
                disabled={isSaving}
              >
                <AppIcon name="Send" size={16} className="mr-2" /> Publicar
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
