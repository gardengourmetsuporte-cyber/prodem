import { AppIcon } from '@/components/ui/app-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { MarketingPost } from '@/types/marketing';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Agendado', className: 'bg-primary/20 text-primary' },
  published: { label: 'Publicado', className: 'bg-success/20 text-success' },
  failed: { label: 'Erro', className: 'bg-destructive/20 text-destructive' },
};

interface PostCardProps {
  post: MarketingPost;
  onEdit: (post: MarketingPost) => void;
  onDelete: (id: string) => void;
  onPublish: (post: MarketingPost) => void;
}

async function handleShare(post: MarketingPost) {
  if (navigator.share && post.media_urls.length > 0) {
    try {
      const response = await fetch(post.media_urls[0]);
      const blob = await response.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `post.${ext}`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: post.title,
          text: post.caption || '',
          files: [file],
        });
        return;
      }
    } catch {
      /* fallback */
    }
  }
  if (post.media_urls.length > 0) {
    try {
      const response = await fetch(post.media_urls[0]);
      const blob = await response.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }
  if (post.caption) {
    try {
      await navigator.clipboard.writeText(post.caption);
      toast.success('Imagem baixada e legenda copiada! Abra o Instagram e poste.');
    } catch {
      toast.success('Imagem baixada! Copie a legenda manualmente.');
    }
  } else {
    toast.success('Imagem baixada! Abra o Instagram e poste.');
  }
}

export function PostCard({ post, onEdit, onDelete, onPublish }: PostCardProps) {
  const status = statusConfig[post.status] || statusConfig.draft;

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {post.media_urls.length > 0 && (
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img
            src={post.media_urls[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {post.media_urls.length > 1 && (
            <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
              +{post.media_urls.length - 1}
            </span>
          )}
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{post.title}</h3>
            {post.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.caption}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg hover:bg-secondary shrink-0">
                <AppIcon name="MoreVertical" size={16} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <AppIcon name="Pencil" size={16} className="mr-2" /> Editar
              </DropdownMenuItem>
              {post.status !== 'published' && (
                <DropdownMenuItem onClick={() => onPublish(post)}>
                  <AppIcon name="Send" size={16} className="mr-2" /> Publicar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                <AppIcon name="Trash2" size={16} className="mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={status.className + ' text-[10px] border-0'}>
            {status.label}
          </Badge>
          {post.channels.includes('instagram') && (
            <AppIcon name="photo_camera" size={14} className="text-pink-400" />
          )}
          {post.channels.includes('whatsapp_status') && (
            <AppIcon name="MessageCircle" size={14} className="text-success" />
          )}
          {post.scheduled_at && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
              <AppIcon name="Calendar" size={12} />
              {format(new Date(post.scheduled_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {post.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Share button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs border-pink-500/30 hover:bg-pink-500/10 text-pink-400"
          onClick={() => handleShare(post)}
        >
          <AppIcon name="share" size={14} />
          Compartilhar
          <AppIcon name="photo_camera" size={12} className="ml-auto" />
        </Button>
      </div>
    </div>
  );
}
