import { toast } from 'sonner';
import type { MarketingPost } from '@/types/marketing';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success('Legenda copiada!'); } catch { toast.error('Erro ao copiar legenda'); }
}

function shareViaWebShare(post: MarketingPost, channel: 'instagram' | 'whatsapp_status') {
  if (post.caption) copyToClipboard(post.caption);
  if (navigator.share && post.media_urls.length > 0) {
    fetch(post.media_urls[0]).then(r => r.blob()).then(blob => {
      const file = new File([blob], 'post.jpg', { type: blob.type });
      navigator.share({ title: post.title, text: post.caption, files: [file] }).catch(() => openDeepLink(post, channel));
    }).catch(() => openDeepLink(post, channel));
  } else { openDeepLink(post, channel); }
}

function openDeepLink(post: MarketingPost, channel: 'instagram' | 'whatsapp_status') {
  if (channel === 'instagram') window.open('instagram://camera', '_blank');
  else { const text = encodeURIComponent(post.caption || ''); window.open(`whatsapp://send?text=${text}`, '_blank'); }
}

interface PublishActionsProps { post: MarketingPost | null; open: boolean; onOpenChange: (open: boolean) => void; onConfirmPublished: (id: string) => void; }

export function PublishActions({ post, open, onOpenChange, onConfirmPublished }: PublishActionsProps) {
  if (!post) return null;
  const handlePublish = (channel: 'instagram' | 'whatsapp_status') => { shareViaWebShare(post, channel); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="space-y-4">
        <SheetHeader><SheetTitle>Publicar Post</SheetTitle><SheetDescription>Escolha o canal e publique com 1 toque</SheetDescription></SheetHeader>
        <div className="space-y-3">
          {post.channels.includes('instagram') && (
            <Button variant="outline" className="w-full justify-start gap-3 h-14 border-pink-500/30 hover:bg-pink-500/10" onClick={() => handlePublish('instagram')}>
              <AppIcon name="photo_camera" size={20} className="text-pink-400" />
              <div className="text-left"><p className="text-sm font-medium">Instagram</p><p className="text-[10px] text-muted-foreground">Abre o app + copia legenda</p></div>
            </Button>
          )}
          {post.channels.includes('whatsapp_status') && (
            <Button variant="outline" className="w-full justify-start gap-3 h-14 border-success/30 hover:bg-success/10" onClick={() => handlePublish('whatsapp_status')}>
              <AppIcon name="MessageCircle" size={20} className="text-success" />
              <div className="text-left"><p className="text-sm font-medium">WhatsApp Status</p><p className="text-[10px] text-muted-foreground">Compartilha via WhatsApp</p></div>
            </Button>
          )}
        </div>
        <Button className="w-full" onClick={() => { onConfirmPublished(post.id); onOpenChange(false); }}>
          <AppIcon name="Check" size={16} className="mr-2" />Confirmar Publicação
        </Button>
      </SheetContent>
    </Sheet>
  );
}
