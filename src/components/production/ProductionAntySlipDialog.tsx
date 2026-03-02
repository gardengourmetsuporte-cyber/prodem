import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';
import { ProductionReportItem } from '@/hooks/useProductionOrders';
import { ChecklistSector } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductionAntySlipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportItem: ProductionReportItem | null;
    itemName: string;
    dimensions?: string;
    materialCode?: string;
    projectNumber: string;
    projectName: string;
    onFinish: (quantity: number, machineRef?: string) => Promise<void>;
}

export function ProductionAntySlipDialog({
    open, onOpenChange,
    reportItem, itemName, dimensions, materialCode,
    projectNumber, projectName,
    onFinish
}: ProductionAntySlipDialogProps) {
    const [quantity, setQuantity] = useState<number | ''>('');
    const [machineRef, setMachineRef] = useState('');
    const [loading, setLoading] = useState(false);

    if (!open || !reportItem) return null;

    const pendingQty = reportItem.quantity_ordered - reportItem.quantity_done;

    const handleSetMax = () => setQuantity(pendingQty > 0 ? pendingQty : 1);

    const handleSubmit = async () => {
        const qty = Number(quantity);
        if (!qty || qty <= 0) return;
        try {
            setLoading(true);
            await onFinish(qty, machineRef);
            onOpenChange(false);
            setQuantity('');
            setMachineRef('');
        } catch (err) {
            // Error handled by parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white text-black w-full max-w-2xl shadow-2xl overflow-hidden industrial-slip flex flex-col max-h-[90vh]">
                {/* Paper Header */}
                <div className="flex bg-gray-100 border-b-2 border-black/80 p-4 shrink-0">
                    <div className="flex-1 flex flex-col justify-center gap-1">
                        <AppIcon name="Factory" size={24} className="text-black mb-1" />
                        <span className="text-2xl font-black tracking-widest uppercase border-l-4 border-black pl-3 leading-none">
                            Ordem de Produção
                        </span>
                    </div>
                    <div className="flex flex-col items-end pt-1">
                        <span className="text-sm font-bold block mb-1">PROJETO / OS</span>
                        <div className="text-right border-2 border-black px-2 py-0.5 mt-auto">
                            <span className="text-lg font-black">{projectNumber}</span>
                            <br />
                            <span className="text-xs font-bold uppercase">{projectName}</span>
                        </div>
                    </div>
                </div>

                {/* Paper Body */}
                <div className="p-4 space-y-4 overflow-y-auto">
                    {/* Item Info Box */}
                    <div className="border border-black p-2 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm uppercase font-bold text-gray-800">
                        <div className="col-span-2">
                            <span className="text-[10px] text-gray-500 block">Descrição (Cód: {materialCode || '-'})</span>
                            {itemName}
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">Medida / Comp.</span>
                            {dimensions || '-'}
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block">Qtd Solicitada</span>
                            <div className="text-lg font-black">{reportItem.quantity_ordered}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2 pt-2">
                        <span className="h-0.5 bg-black w-8"></span>
                        <h3 className="font-black uppercase tracking-widest text-sm shrink-0">Apontamento de Produção</h3>
                        <span className="h-0.5 bg-black w-full"></span>
                    </div>

                    {/* Form */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white border-2 border-black p-3 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
                        <div className="col-span-2">
                            <label className="text-xs font-bold uppercase block mb-1">Data de Execução</label>
                            <div className="border border-gray-300 p-2 font-mono text-sm bg-gray-50">
                                {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs font-bold uppercase block mb-1">Ref Máquina <span className="text-gray-400 font-normal">(Opcional)</span></label>
                            <input
                                type="text"
                                placeholder="Ex: Serra 1"
                                className="w-full border border-black p-2 font-mono text-sm uppercase focus:ring-0 focus:border-blue-600 outline-none placeholder:text-gray-300"
                                value={machineRef}
                                onChange={e => setMachineRef(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs font-bold uppercase block mb-1">QTD. PROD.</label>
                            <div className="flex relative">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="w-full border border-black p-2 font-black font-mono text-lg text-center focus:ring-0 focus:border-blue-600 outline-none"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                                <button
                                    onClick={handleSetMax}
                                    className="absolute right-0 top-0 bottom-0 px-2 text-[10px] font-bold text-blue-600 border-l border-gray-300 bg-gray-50 hover:bg-blue-50"
                                    title="Qtd Pendente"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* History / Previous entries (mock or total) */}
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-px bg-gray-300 w-8"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Resumo</span>
                            <span className="h-px bg-gray-300 w-full"></span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-bold text-gray-600">Total Já Produzido: {reportItem.quantity_done}</span>
                            <span className="text-sm font-bold text-red-600">Pendente: {pendingQty}</span>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 bg-gray-100 border-t border-gray-300 flex justify-end gap-3 mt-auto shrink-0">
                    <button
                        onClick={() => { setQuantity(''); setMachineRef(''); onOpenChange(false); }}
                        className="px-6 py-2 border-2 border-black font-bold uppercase text-sm hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !quantity || Number(quantity) <= 0}
                        className="px-8 py-2 bg-black text-white font-bold uppercase text-sm border-2 border-black hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        {loading ? 'Salvando...' : 'Salvar Apontamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
