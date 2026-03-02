import { useState, useEffect, useMemo } from 'react';
import { useTabletAdmin } from '@/hooks/useTabletAdmin';
import { useGamificationAdmin } from '@/hooks/useGamificationAdmin';
import { useUnit } from '@/contexts/UnitContext';
import { GamificationSettingsPanel } from '@/components/gamification/GamificationSettings';
import { GamificationMetrics } from '@/components/gamification/GamificationMetrics';
import { PrizeSheet } from '@/components/gamification/PrizeSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import type { GamificationPrize } from '@/hooks/useGamification';

type SettingsTab = 'pdv' | 'mesas' | 'roleta' | 'config';

interface CardapioSettingsProps {
  initialTab?: SettingsTab | null;
}

export function CardapioSettings({ initialTab = null }: CardapioSettingsProps) {
  const { activeUnit } = useUnit();
  const tabletAdmin = useTabletAdmin();
  const { tables, pdvConfig, addTable, removeTable, savePDVConfig, retryPDV } = tabletAdmin;
  const gamAdmin = useGamificationAdmin();

  const [activeTab, setActiveTab] = useState<SettingsTab | null>(initialTab);
  const [newTableNum, setNewTableNum] = useState('');

  // PDV form
  const [hubUrl, setHubUrl] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [paymentCode, setPaymentCode] = useState('1');
  const [pdvActive, setPdvActive] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);

  // Prize sheet
  const [prizeSheetOpen, setPrizeSheetOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<GamificationPrize | null>(null);

  useEffect(() => {
    if (pdvConfig) {
      setHubUrl(pdvConfig.hub_url);
      setAuthKey(pdvConfig.auth_key);
      setPdvActive(pdvConfig.is_active);
      setPaymentCode((pdvConfig as any).payment_code || '1');
    }
  }, [pdvConfig]);

  const testConnection = async () => {
    if (!hubUrl) return;
    setTestingConnection(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colibri-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ hub_url: hubUrl, auth_key: authKey }),
      });
      const data = await res.json();
      if (data.success) toast.success('Conexão OK');
      else toast.error(data.error || 'Falha na conexão');
    } catch { toast.error('Não foi possível testar'); }
    finally { setTestingConnection(false); }
  };

  // Gamification
  const handleToggleEnabled = (enabled: boolean) => {
    gamAdmin.upsertSettings.mutate({ is_enabled: enabled }, {
      onSuccess: () => toast.success(enabled ? 'Jogo ativado!' : 'Jogo desativado'),
    });
  };
  const handleSettingsUpdate = (data: any) => { gamAdmin.upsertSettings.mutate(data); };
  const handleSavePrize = (data: Partial<GamificationPrize>) => {
    gamAdmin.savePrize.mutate(data, {
      onSuccess: () => { toast.success(data.id ? 'Prêmio atualizado!' : 'Prêmio criado!'); setPrizeSheetOpen(false); setEditingPrize(null); },
    });
  };
  const handleDeletePrize = (id: string) => {
    if (!confirm('Remover este prêmio?')) return;
    gamAdmin.deletePrize.mutate(id, { onSuccess: () => toast.success('Prêmio removido') });
  };

  const TABS: { id: SettingsTab; label: string; icon: string; description: string }[] = [
    { id: 'pdv', label: 'Integração ERP', icon: 'Zap', description: 'Conexão com ERP Prodem e envio automático' },
    { id: 'config', label: 'Geral', icon: 'Cog', description: 'Configurações gerais do catálogo' },
  ];

  // Hub menu view — matches Settings page pattern
  if (!activeTab) {
    return (
      <div className="card-surface rounded-2xl overflow-hidden divide-y divide-border/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/30 active:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground">{tab.label}</span>
            </span>
            <AppIcon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    );
  }

  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => setActiveTab(null)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -mt-1"
      >
        <AppIcon name="ChevronLeft" size={16} />
        <span>{activeTabData?.label}</span>
      </button>

      {/* ==================== PDV ==================== */}
      {activeTab === 'pdv' && (
        <div className="card-base p-4 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <AppIcon name="Zap" size={16} className="text-primary" /> Integração ERP Prodem
            {pdvConfig?.is_active && (
              <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1 inline-block" /> Conectado
              </Badge>
            )}
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">URL do Hub ERP</Label>
              <Input placeholder="http://192.168.1.100:8080/api/orders" value={hubUrl} onChange={e => setHubUrl(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Chave de Autenticação</Label>
              <Input type="password" placeholder="Bearer token..." value={authKey} onChange={e => setAuthKey(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Código de Pagamento</Label>
              <Input placeholder="1" value={paymentCode} onChange={e => setPaymentCode(e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Código da forma de pagamento no ERP</p>
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">Integração ativa</Label>
              <Switch checked={pdvActive} onCheckedChange={setPdvActive} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testConnection} disabled={!hubUrl || testingConnection} className="flex-1">
                {testingConnection ? <AppIcon name="Loader2" size={16} className="animate-spin mr-2" /> : <AppIcon name="Zap" size={16} className="mr-2" />}
                {testingConnection ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button onClick={() => savePDVConfig({ hub_url: hubUrl, auth_key: authKey, is_active: pdvActive, ...(paymentCode ? { payment_code: paymentCode } : {}) } as any)} className="flex-1" disabled={!hubUrl || !authKey}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MESAS & QR ==================== */}
      {activeTab === 'mesas' && (
        <div className="space-y-4">
          {activeUnit && (
            <div className="card-base p-4 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <AppIcon name="QrCode" size={16} className="text-primary" /> QR Codes
              </h3>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                <QRCodeSVG value={`${window.location.origin}/m/${activeUnit.id}`} size={80} bgColor="transparent" fgColor="currentColor" className="text-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">QR Genérico</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Balcão / Delivery</p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}`); toast.success('Link copiado!'); }}>
                      <AppIcon name="Copy" size={12} className="mr-1" /> Copiar
                    </Button>
                    <a href={`/m/${activeUnit.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <AppIcon name="ExternalLink" size={12} /> Abrir
                    </a>
                  </div>
                </div>
              </div>
              {tables.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">QR por mesa:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {tables.map(t => (
                      <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/20 border border-border/20">
                        <QRCodeSVG value={`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`} size={48} bgColor="transparent" fgColor="currentColor" className="text-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">Mesa {t.number}</p>
                          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`); toast.success(`Link mesa ${t.number} copiado!`); }} className="text-[10px] text-primary font-medium mt-0.5">Copiar link</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card-base p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AppIcon name="LayoutGrid" size={16} className="text-primary" /> Gerenciar mesas
            </h3>
            <div className="flex gap-2">
              <Input type="number" placeholder="Nº da mesa" value={newTableNum} onChange={e => setNewTableNum(e.target.value)} className="flex-1" />
              <Button onClick={() => { addTable(parseInt(newTableNum)); setNewTableNum(''); }} disabled={!newTableNum}>
                <AppIcon name="Plus" size={16} className="mr-1" /> Adicionar
              </Button>
            </div>
            {tables.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {tables.map(t => (
                  <div key={t.id} className="relative bg-secondary/50 rounded-xl p-3 text-center group">
                    <span className="text-xl font-bold text-foreground">{t.number}</span>
                    <button onClick={() => removeTable(t.id)} className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity">
                      <AppIcon name="X" size={12} className="text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mesa cadastrada</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== ROLETA ==================== */}
      {activeTab === 'roleta' && (
        <div className="space-y-4">
          <GamificationSettingsPanel
            settings={gamAdmin.settings}
            onToggle={handleToggleEnabled}
            onUpdate={handleSettingsUpdate}
          />

          {activeUnit && (
            <Card className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Link do cardápio digital (com roleta)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                  {`${window.location.origin}/m/${activeUnit.id}`}
                </code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}`); toast.success('Link copiado!'); }}>
                  <AppIcon name="Copy" size={14} />
                </Button>
              </div>
            </Card>
          )}

          <GamificationMetrics
            playsToday={gamAdmin.metrics.playsToday}
            prizesToday={gamAdmin.metrics.prizesToday}
            costToday={gamAdmin.metrics.costToday}
            maxDailyCost={gamAdmin.settings?.max_daily_cost ?? 100}
          />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground text-sm">Prêmios</h2>
              <Button size="sm" onClick={() => { setEditingPrize(null); setPrizeSheetOpen(true); }}>
                <AppIcon name="Plus" size={16} className="mr-1" /> Novo
              </Button>
            </div>

            {gamAdmin.prizesLoading ? (
              <div className="flex justify-center py-8">
                <AppIcon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : gamAdmin.prizes.length === 0 ? (
              <Card className="p-6 text-center">
                <AppIcon name="Gift" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum prêmio configurado</p>
                <Button variant="outline" className="mt-3" onClick={() => { setEditingPrize(null); setPrizeSheetOpen(true); }}>
                  Criar primeiro prêmio
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const totalWeight = gamAdmin.prizes.reduce((sum, p) => sum + p.probability, 0);
                  return gamAdmin.prizes.map(prize => {
                    const pct = totalWeight > 0 ? ((prize.probability / totalWeight) * 100) : 0;
                    return (
                      <Card key={prize.id} className="p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${prize.color}20`, border: `2px solid ${prize.color}` }}>
                            {prize.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{prize.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-primary">{pct.toFixed(1)}%</span> · R$ {prize.estimated_cost.toFixed(2)}
                            </p>
                          </div>
                          <Switch checked={prize.is_active} onCheckedChange={val => gamAdmin.togglePrize.mutate({ id: prize.id, is_active: val })} />
                          <button onClick={() => { setEditingPrize(prize); setPrizeSheetOpen(true); }} className="p-1.5 hover:bg-muted rounded">
                            <AppIcon name="Pencil" size={14} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDeletePrize(prize.id)} className="p-1.5 hover:bg-destructive/10 rounded">
                            <AppIcon name="Trash2" size={14} className="text-destructive" />
                          </button>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: prize.color }} />
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CONFIGURAÇÕES GERAIS ==================== */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <div className="card-base p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AppIcon name="Truck" size={16} className="text-primary" /> Delivery & Retirada
            </h3>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Aceitar delivery</p>
                <p className="text-[10px] text-muted-foreground">Clientes podem pedir para entrega</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">Aceitar retirada</p>
                <p className="text-[10px] text-muted-foreground">Clientes retiram no balcão</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="card-base p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AppIcon name="Clock" size={16} className="text-primary" /> Horários de Funcionamento
            </h3>
            <div className="space-y-2">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                <div key={day} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-sm text-foreground font-medium w-20">{day}</span>
                  <div className="flex items-center gap-1">
                    <Input className="w-16 h-7 text-xs text-center" placeholder="08:00" defaultValue="08:00" />
                    <span className="text-muted-foreground text-xs">—</span>
                    <Input className="w-16 h-7 text-xs text-center" placeholder="22:00" defaultValue="22:00" />
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
            <Button className="w-full" size="sm">
              <AppIcon name="Save" size={14} className="mr-1" /> Salvar horários
            </Button>
          </div>

          <div className="card-base p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AppIcon name="CreditCard" size={16} className="text-primary" /> Pagamento no Cardápio
            </h3>
            {['Dinheiro', 'Pix', 'Crédito', 'Débito', 'Vale Refeição'].map(m => (
              <div key={m} className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">{m}</span>
                <Switch defaultChecked />
              </div>
            ))}
          </div>

          <div className="card-base p-4 space-y-3">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AppIcon name="Palette" size={16} className="text-primary" /> Personalização
            </h3>
            <div>
              <Label className="text-xs">Nome exibido</Label>
              <Input placeholder="Nome da unidade" defaultValue={activeUnit?.name || ''} />
            </div>
            <div>
              <Label className="text-xs">Descrição curta</Label>
              <Input placeholder="Ex: Hambúrguers artesanais desde 2015" />
            </div>
            <div>
              <Label className="text-xs">Tempo estimado de preparo (min)</Label>
              <Input type="number" placeholder="30" defaultValue="30" />
            </div>
            <Button className="w-full" size="sm">
              <AppIcon name="Save" size={14} className="mr-1" /> Salvar personalização
            </Button>
          </div>
        </div>
      )}

      <PrizeSheet
        open={prizeSheetOpen}
        onOpenChange={setPrizeSheetOpen}
        prize={editingPrize}
        onSave={handleSavePrize}
        saving={gamAdmin.savePrize.isPending}
        otherPrizesTotalWeight={gamAdmin.prizes.filter(p => p.id !== editingPrize?.id).reduce((sum, p) => sum + p.probability, 0)}
      />
    </div>
  );
}
