import { useState } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppIcon } from '@/components/ui/app-icon';
import { useFabAction } from '@/contexts/FabActionContext';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useMarketing } from '@/hooks/useMarketing';
import { MarketingCalendarGrid } from '@/components/marketing/MarketingCalendarGrid';
import { MarketingSmartSuggestions } from '@/components/marketing/MarketingSmartSuggestions';
import { MarketingFeed } from '@/components/marketing/MarketingFeed';
import { MarketingIdeasAI } from '@/components/marketing/MarketingIdeasAI';
import { PostSheet } from '@/components/marketing/PostSheet';
import { PublishActions } from '@/components/marketing/PublishActions';
import type { MarketingPost } from '@/types/marketing';

export default function Marketing() {
  const { posts, isLoading, createPost, updatePost, deletePost, markPublished, uploadMedia } = useMarketing();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [publishPost, setPublishPost] = useState<MarketingPost | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  useScrollToTopOnChange(activeTab);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);
  const [prefillTitle, setPrefillTitle] = useState('');

  useFabAction({ icon: 'Plus', label: 'Novo Post', onClick: () => { setEditingPost(null); setPrefillDate(null); setPrefillTitle(''); setSheetOpen(true); } }, []);

  const handleEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setPrefillDate(null);
    setPrefillTitle('');
    setSheetOpen(true);
  };

  const handleNewPost = (date?: Date) => {
    setEditingPost(null);
    setPrefillDate(date || null);
    setPrefillTitle('');
    setSheetOpen(true);
  };

  const handleSuggestionClick = (title: string, date: Date) => {
    setEditingPost(null);
    setPrefillDate(date);
    setPrefillTitle(title);
    setSheetOpen(true);
  };

  const handleSave = (data: Partial<MarketingPost>) => {
    if (data.id) {
      updatePost.mutate({ id: data.id, ...data });
    } else {
      createPost.mutate(data);
    }
  };

  const handleAISchedule = (data: Partial<MarketingPost>) => {
    createPost.mutate(data);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          <AnimatedTabs
            tabs={[
              { key: 'calendar', label: 'Calendário', icon: <AppIcon name="CalendarDays" size={16} /> },
              { key: 'feed', label: 'Feed', icon: <AppIcon name="LayoutList" size={16} /> },
              { key: 'ideas', label: 'Ideias IA', icon: <AppIcon name="Sparkles" size={16} /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <MarketingSmartSuggestions
                  onSuggestionClick={handleSuggestionClick}
                />
                <MarketingCalendarGrid
                  posts={posts}
                  onEdit={handleEdit}
                  onDelete={id => deletePost.mutate(id)}
                  onPublish={p => setPublishPost(p)}
                  onNewPost={handleNewPost}
                />
              </div>
            )}
            {activeTab === 'feed' && (
              <MarketingFeed
                posts={posts}
                onEdit={handleEdit}
                onDelete={id => deletePost.mutate(id)}
                onPublish={p => setPublishPost(p)}
              />
            )}
            {activeTab === 'ideas' && (
              <MarketingIdeasAI onSchedule={handleAISchedule} />
            )}
          </div>
        </div>
      </div>

      <PostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={editingPost}
        onSave={handleSave}
        onPublish={p => setPublishPost(p)}
        uploadMedia={uploadMedia}
        isSaving={createPost.isPending || updatePost.isPending}
        prefillDate={prefillDate}
        prefillTitle={prefillTitle}
      />

      <PublishActions
        post={publishPost}
        open={!!publishPost}
        onOpenChange={open => !open && setPublishPost(null)}
        onConfirmPublished={id => markPublished.mutate(id)}
      />
    </AppLayout>
  );
}
