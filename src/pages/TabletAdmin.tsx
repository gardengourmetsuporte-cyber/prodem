import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTabletAdmin, TabletProductAdmin } from '@/hooks/useTabletAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { QRCodeSVG } from 'qrcode.react';
import { EmptyState } from '@/components/ui/empty-state';
import { useUnit } from '@/contexts/UnitContext';
import { useToast } from '@/hooks/use-toast';
import { AppIcon } from '@/components/ui/app-icon';

export default function TabletAdmin() {
  const {
    products, tables, orders, pdvConfig, loading,
    saveProduct, deleteProduct,
    addTable, removeTable,
    savePDVConfig, retryPDV,
  } = useTabletAdmin();
  const { activeUnit } = useUnit();
  const { toast } = useToast();

  const [productSheet, setProductSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<TabletProductAdmin> | null>(null);
  const [newTableNum, setNewTableNum] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // PDV Config form
  const [hubUrl, setHubUrl] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [paymentCode, setPaymentCode] = useState('1');
  const [pdvActive, setPdvActive] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync pdvConfig state
  useEffect(() => {
    if (pdvConfig) {
      setHubUrl(pdvConfig.hub_url);
      setAuthKey(pdvConfig.auth_key);
      setPdvActive(pdvConfig.is_active);
      setPaymentCode((pdvConfig as any).payment_code || '1');
    }
  }, [pdvConfig]);

  // Integration stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter(o => o.created_at.slice(0, 10) === today);
    return {
      total: todayOrders.length,
      sent: todayOrders.filter(o => o.status === 'sent_to_pdv').length,
      errors: todayOrders.filter(o => o.status === 'error').length,
      pending: todayOrders.filter(o => o.status === 'confirmed' || o.status === 'awaiting_confirmation').length,
    };
  }, [orders]);

  const productsWithoutPDV = products.filter(p => !p.codigo_pdv);

  const openNewProduct = () => {
    setEditingProduct({ name: '', price: 0, category: 'Geral', codigo_pdv: '', is_active: true });
    setProductSheet(true);
  };

  const openEditProduct = (p: TabletProductAdmin) => {
    setEditingProduct(p);
    setProductSheet(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct?.name) return;
    saveProduct(editingProduct as any);
    setProductSheet(false);
  };

  const testConnection = async () => {
    if (!hubUrl) return;
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/colibri-health`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ hub_url: hubUrl, auth_key: authKey }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setConnectionStatus('success');
        toast({ title: '✅ Conexão OK', description: data.message });
      } else {
        setConnectionStatus('error');
        toast({ title: '❌ Falha na conexão', description: data.error, variant: 'destructive' });
      }
    } catch {
      setConnectionStatus('error');
      toast({ title: 'Erro', description: 'Não foi possível testar a conexão', variant: 'destructive' });
    } finally {
      setTestingConnection(false);
    }
  };

  const statusColor: Record<string, string> = {
    draft: 'bg-secondary text-muted-foreground',
    awaiting_confirmation: 'bg-warning/15 text-warning',
    confirmed: 'bg-primary/15 text-primary',
    sent_to_pdv: 'bg-success/15 text-success',
    error: 'bg-destructive/15 text-destructive',
  };

  const statusLabel: Record<string, string> = {
    draft: 'Rascunho',
    awaiting_confirmation: 'Aguardando',
    confirmed: 'Confirmado',
    sent_to_pdv: 'Enviado PDV',
    error: 'Erro',
  };

  const formatPrice = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <div className="px-4 py-4 lg:px-6 space-y-4">
        {activeUnit && (
          <div className="flex items-center justify-end">
            <a
              href={`/tablet/${activeUnit.id}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg"
            >
              <AppIcon name="ExternalLink" className="w-3.5 h-3.5" />
              Ver Cardápio
            </a>
          </div>
        )}

        {/* Integration Status Banner */}
        {pdvConfig?.is_active && (
          <div className="grid grid-cols-3 gap-2">
            <div className="card-base p-3 text-center">
              <AppIcon name="Send" className="w-4 h-4 mx-auto text-success mb-1" />
              <p className="text-lg font-bold text-foreground">{todayStats.sent}</p>
              <p className="text-[10px] text-muted-foreground">Enviados</p>
            </div>
            <div className="card-base p-3 text-center">
              <AppIcon name="AlertCircle" className="w-4 h-4 mx-auto text-destructive mb-1" />
              <p className="text-lg font-bold text-foreground">{todayStats.errors}</p>
              <p className="text-[10px] text-muted-foreground">Erros</p>
            </div>
            <div className="card-base p-3 text-center">
              <AppIcon name="Clock" className="w-4 h-4 mx-auto text-warning mb-1" />
              <p className="text-lg font-bold text-foreground">{todayStats.pending}</p>
              <p className="text-[10px] text-muted-foreground">Pendentes</p>
            </div>
          </div>
        )}

        {/* Products without PDV code warning */}
        {productsWithoutPDV.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <AppIcon name="AlertCircle" className="w-4 h-4 text-warning shrink-0" />
            <p className="text-xs text-warning">
              {productsWithoutPDV.length} produto(s) sem código ERP — não serão enviados ao sistema
            </p>
          </div>
        )}

        <Tabs defaultValue="orders">
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="flex-1">Pedidos</TabsTrigger>
            <TabsTrigger value="products" className="flex-1">Produtos</TabsTrigger>
            <TabsTrigger value="tables" className="flex-1">Mesas</TabsTrigger>
            <TabsTrigger value="config" className="flex-1">PDV</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-3 mt-4">
            {orders.length === 0 ? (
              <EmptyState
                icon="QrCode"
                title="Nenhum pedido ainda"
                subtitle="Os pedidos feitos no tablet aparecerão aqui em tempo real"
              />
            ) : (
              orders.map(order => (
                <div key={order.id} className="list-command">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Mesa {order.table_number}</span>
                      <Badge className={statusColor[order.status] || 'bg-secondary'}>
                        {statusLabel[order.status] || order.status}
                      </Badge>
                      {(order as any).retry_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          (tentativa {(order as any).retry_count})
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                  </div>
                  {order.tablet_order_items && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {order.tablet_order_items.map((item: any) => (
                        <p key={item.id} className="flex items-center gap-1">
                          {item.quantity}x {item.tablet_products?.name || '?'}
                          {item.tablet_products?.codigo_pdv ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {item.tablet_products.codigo_pdv}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0">
                              sem PDV
                            </Badge>
                          )}
                          {item.notes ? ` (${item.notes})` : ''}
                        </p>
                      ))}
                    </div>
                  )}
                  {order.error_message && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-destructive">
                      <AppIcon name="AlertCircle" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{order.error_message}</span>
                    </div>
                  )}
                  {order.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryPDV(order.id)}
                      className="mt-2"
                    >
                      <AppIcon name="RefreshCw" className="w-3.5 h-3.5 mr-1" />
                      Reenviar ao PDV
                    </Button>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-3 mt-4">
            <Button onClick={openNewProduct} className="w-full h-12 rounded-xl">
              <AppIcon name="Plus" className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
            {products.map(p => (
              <div key={p.id} className="list-command" onClick={() => openEditProduct(p)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      {p.name}
                      {p.codigo_pdv ? (
                        <AppIcon name="CheckCircle2" className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <AppIcon name="AlertCircle" className="w-3.5 h-3.5 text-warning" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.category} • {p.codigo_pdv ? (
                        <span className="text-success">{p.codigo_pdv}</span>
                      ) : (
                        <span className="text-warning">Sem código PDV</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">{formatPrice(p.price)}</p>
                    {!p.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="tables" className="space-y-4 mt-4">
            {/* QR Code Section */}
            {activeUnit && (
              <div className="card-base p-4 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <AppIcon name="QrCode" className="w-4 h-4" />
                  Cardápio Digital (QR Code)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Gere QR Codes para que seus clientes acessem o cardápio digital pelo celular.
                </p>

                {/* Generic QR */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <QRCodeSVG
                    value={`${window.location.origin}/m/${activeUnit.id}`}
                    size={80}
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="text-foreground shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">QR Genérico</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Balcão / Delivery (sem mesa)</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}`);
                          toast({ title: 'Link copiado!' });
                        }}
                      >
                        <AppIcon name="Copy" className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                      <a
                        href={`/m/${activeUnit.id}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                      >
                        <AppIcon name="ExternalLink" className="w-3 h-3" /> Abrir
                      </a>
                    </div>
                  </div>
                </div>

                {/* Per-table QR codes */}
                {tables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">QR por mesa:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {tables.map(t => (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded-xl bg-secondary/20 border border-border/20">
                          <QRCodeSVG
                            value={`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`}
                            size={48}
                            bgColor="transparent"
                            fgColor="currentColor"
                            className="text-foreground shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">Mesa {t.number}</p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/m/${activeUnit.id}?mesa=${t.number}`);
                                toast({ title: `Link mesa ${t.number} copiado!` });
                              }}
                              className="text-[10px] text-primary font-medium mt-0.5"
                            >
                              Copiar link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add table */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Nº da mesa"
                value={newTableNum}
                onChange={e => setNewTableNum(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => { addTable(parseInt(newTableNum)); setNewTableNum(''); }} disabled={!newTableNum}>
                <AppIcon name="Plus" className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(t => (
                <div key={t.id} className="relative bg-secondary/50 rounded-xl p-4 text-center">
                  <span className="text-2xl font-bold text-foreground">{t.number}</span>
                  <button
                    onClick={() => removeTable(t.id)}
                    className="absolute top-1 right-1 p-1 rounded hover:bg-destructive/10"
                  >
                    <AppIcon name="Trash2" className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* CONFIG TAB */}
          <TabsContent value="config" className="space-y-4 mt-4">
            {/* Setup Guide Toggle */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary"
            >
              <AppIcon name="Info" className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left font-medium">
                {showGuide ? 'Ocultar guia' : 'Como configurar a Integração ERP Prodem'}
              </span>
              <AppIcon name="ArrowRight" className={`w-4 h-4 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
            </button>

            {showGuide && (
              <div className="card-base p-4 space-y-3">
                <h4 className="font-bold text-sm text-foreground">Passo a passo</h4>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">1</span>
                    <span>No servidor ERP, abra o <strong>Gestor de Pedidos</strong> (ou instale o <strong>DeliveryTunnel</strong>)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">2</span>
                    <span>Copie a <strong>URL do Hub</strong> exibida na tela principal (ex: <code className="bg-secondary px-1 rounded">http://192.168.1.100:8080/api/orders</code>)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">3</span>
                    <span>Copie a <strong>Chave de Autenticação</strong> (Bearer Token) nas configurações do Gestor</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">4</span>
                    <span>Cole os valores nos campos abaixo e clique em <strong>Testar Conexão</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">5</span>
                    <span>Cadastre os produtos com o <strong>Código ERP</strong> correspondente ao código do sistema Prodem. Para combos, use o prefixo <strong>CMB-</strong> (ex: <code className="bg-secondary px-1 rounded">CMB-001</code>)</span>
                  </li>
                </ol>
                <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-[11px] text-warning">
                    <strong>⚡ Dica:</strong> Para acesso fora da rede local, configure um DDNS ou use um túnel seguro para conexão remota.
                  </p>
                </div>
              </div>
            )}

            {/* Config Form */}
            <div className="card-base p-4 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AppIcon name="Settings2" className="w-4 h-4" />
                Configuração ERP Prodem
                {pdvConfig?.is_active && (
                  <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                    <AppIcon name="Wifi" className="w-3 h-3 mr-1" /> Ativo
                  </Badge>
                )}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>URL do Hub ERP</Label>
                  <Input
                    placeholder="http://192.168.1.100:8080/api/orders"
                    value={hubUrl}
                    onChange={e => setHubUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Chave de Autenticação</Label>
                  <Input
                    type="password"
                    placeholder="Bearer token..."
                    value={authKey}
                    onChange={e => setAuthKey(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Código de Pagamento (ERP)</Label>
                  <Input
                    placeholder="1"
                    value={paymentCode}
                    onChange={e => setPaymentCode(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Código da forma de pagamento no ERP (ex: 1 = Dinheiro, 2 = Cartão)
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Integração ativa</Label>
                  <Switch checked={pdvActive} onCheckedChange={setPdvActive} />
                </div>

                {/* Test Connection */}
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={!hubUrl || testingConnection}
                  className="w-full"
                >
                  {testingConnection ? (
                    <AppIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <AppIcon name="CheckCircle2" className="w-4 h-4 mr-2 text-success" />
                  ) : connectionStatus === 'error' ? (
                    <AppIcon name="WifiOff" className="w-4 h-4 mr-2 text-destructive" />
                  ) : (
                    <AppIcon name="Zap" className="w-4 h-4 mr-2" />
                  )}
                  {testingConnection ? 'Testando...' : 'Testar Conexão'}
                </Button>

                <Button
                  onClick={() => savePDVConfig({
                    hub_url: hubUrl,
                    auth_key: authKey,
                    is_active: pdvActive,
                    ...(paymentCode ? { payment_code: paymentCode } : {}),
                  } as any)}
                  className="w-full"
                  disabled={!hubUrl || !authKey}
                >
                  Salvar Configuração
                </Button>
              </div>
            </div>

            {/* Retry info */}
            <div className="card-base p-4">
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <AppIcon name="RefreshCw" className="w-4 h-4" />
                Retry Automático
              </h4>
              <p className="text-xs text-muted-foreground">
                Quando um pedido falha ao ser enviado ao Colibri, o sistema tenta automaticamente até <strong>5 vezes</strong> com intervalo crescente. 
                Se todas as tentativas falharem, o pedido fica com status "Erro" e pode ser reenviado manualmente na aba Pedidos.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Sheet */}
      <Sheet open={productSheet} onOpenChange={setProductSheet}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
          </SheetHeader>
          {editingProduct && (
            <div className="mt-4 space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Código PDV (Colibri)</Label>
                <Input
                  value={editingProduct.codigo_pdv || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, codigo_pdv: e.target.value })}
                  placeholder="Ex: 001 ou CMB-001 (combo)"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use o prefixo <strong>CMB-</strong> para combos do Colibri
                </p>
              </div>
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingProduct.price || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={editingProduct.category || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={editingProduct.is_active ?? true}
                  onCheckedChange={v => setEditingProduct({ ...editingProduct, is_active: v })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProduct} className="flex-1" disabled={!editingProduct.name}>
                  Salvar
                </Button>
                {editingProduct.id && (
                  <Button
                    variant="destructive"
                    onClick={() => { deleteProduct(editingProduct.id!); setProductSheet(false); }}
                  >
                    <AppIcon name="Trash2" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
