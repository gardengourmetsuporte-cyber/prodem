import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function SeedPage() {
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        if (!confirm('ATENÇÃO: Isso vai APAGAR todas as peças, produtos e setores atuais do banco de dados e inserir os dados novos da metalúrgica. Tem certeza absoluta?')) return;

        setLoading(true);
        try {
            // 1. Apagar tudo (Cascade deletion won't work perfectly on Supabase without explicit setup, so we do it reverse-order)
            toast.loading('Apagando dados antigos...', { id: 'seed' });

            // We purposefully ignore errors on delete if tables are empty
            await supabase.from('checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('checklist_subcategories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('checklist_sectors').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // 2. Criar os 4 setores da Metalúrgica
            toast.loading('Criando setores da fábrica...', { id: 'seed' });
            const { data: sectors, error: errSectors } = await supabase.from('checklist_sectors').insert([
                { name: 'SERRA', color: '#3b82f6', icon: 'Scissors', sort_order: 1 },
                { name: 'METALEIRA', color: '#f59e0b', icon: 'Hammer', sort_order: 2 },
                { name: 'METALEIRA/DOBRA', color: '#ef4444', icon: 'FoldVertical', sort_order: 3 },
                { name: 'EXPEDIÇÃO', color: '#22c55e', icon: 'Truck', sort_order: 4 }
            ]).select();

            if (errSectors) throw errSectors;

            const sectorMap = {
                SERRA: sectors.find(s => s.name === 'SERRA')!.id,
                METALEIRA: sectors.find(s => s.name === 'METALEIRA')!.id,
                METALEIRA_DOBRA: sectors.find(s => s.name === 'METALEIRA/DOBRA')!.id,
                EXPEDICAO: sectors.find(s => s.name === 'EXPEDIÇÃO')!.id,
            };

            // 3. Criar uma Subcategoria Padrão para cada (ex: Peças)
            toast.loading('Criando grupos de peças...', { id: 'seed' });
            const subcategoriesData = [
                { name: 'Cortes Retos', sector_id: sectorMap.SERRA, sort_order: 1 },
                { name: 'Furos e Cortes', sector_id: sectorMap.METALEIRA, sort_order: 1 },
                { name: 'Dobras e Conformação', sector_id: sectorMap.METALEIRA_DOBRA, sort_order: 1 },
                { name: 'Peças Prontas', sector_id: sectorMap.EXPEDICAO, sort_order: 1 },
            ];

            const { data: subcategories, error: errSub } = await supabase.from('checklist_subcategories').insert(subcategoriesData).select();
            if (errSub) throw errSub;

            const subcatMap = {
                SERRA: subcategories.find(s => s.sector_id === sectorMap.SERRA)!.id,
                METALEIRA: subcategories.find(s => s.sector_id === sectorMap.METALEIRA)!.id,
                METALEIRA_DOBRA: subcategories.find(s => s.sector_id === sectorMap.METALEIRA_DOBRA)!.id,
                EXPEDICAO: subcategories.find(s => s.sector_id === sectorMap.EXPEDICAO)!.id,
            };

            // 4. Inserir as Peças (Checklist Items) baseadas nas planilhas do usuário
            toast.loading('Injetando catálogo de produtos da metalúrgica...', { id: 'seed' });
            const itemsToInsert: any[] = [
                // SERRA
                { subcategory_id: subcatMap.SERRA, name: 'BARRA REDONDA 6000 MM - 1/2 POL', material_code: 'MPO13.0004', piece_dimensions: '58mm', points: 1, is_active: true, sort_order: 1, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'BARRA REDONDA 6000 MM - 5/16 POL', material_code: 'MPO13.0011', piece_dimensions: '235mm', points: 1, is_active: true, sort_order: 2, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'BARRA REDONDA 6000 MM - 3/8 POL', material_code: 'MPO13.0010', piece_dimensions: '80mm', points: 1, is_active: true, sort_order: 3, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'BARRA REDONDA 6000 MM - 1/2 POL', material_code: 'MPO13.0004', piece_dimensions: '435mm', points: 1, is_active: true, sort_order: 4, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'TUBO IND. QUADRADO 6000 MM - 50 x 50 X 2,65 MM', material_code: 'MPO01.0021', piece_dimensions: '1100mm', points: 1, is_active: true, sort_order: 5, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'TUBO IND. QUADRADO 6000 MM - 40 x 40 x 2,65 MM', material_code: 'MPO01.0017', piece_dimensions: '1075mm', points: 1, is_active: true, sort_order: 6, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'TUBO IND. QUADRADO 6000 MM - 30 x 30 X 2,00 MM', material_code: 'MPO01.0012', piece_dimensions: '88mm', points: 1, is_active: true, sort_order: 7, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.SERRA, name: 'TUBO IND. REDONDO 6000 MM - DIAM. 5/8 POL. X 1,50 MM', material_code: 'MPO02.0028', piece_dimensions: '40mm', points: 1, is_active: true, sort_order: 8, checklist_type: 'abertura', frequency: 'daily' },

                // METALEIRA
                { subcategory_id: subcatMap.METALEIRA, name: 'BARRA REDONDA 6000 MM - 1/2 POL', material_code: 'MPO13.0004', piece_dimensions: '80mm', points: 1, is_active: true, sort_order: 1, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA, name: 'FERRO CHATO 6000 MM - 1.1/2 X 1/2 POL', material_code: 'MPO10.0006', piece_dimensions: '1110mm', points: 1, is_active: true, sort_order: 2, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA, name: 'FERRO CHATO 6000 MM - 1.1/2 X 1/2 POL', material_code: 'MPO10.0006', piece_dimensions: '788mm', points: 1, is_active: true, sort_order: 3, checklist_type: 'abertura', frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA, name: 'FERRO CHATO 6000 MM - 1 X 3/16 POL', material_code: 'MPO10.0003', piece_dimensions: '235mm', points: 1, is_active: true, sort_order: 4, checklist_type: 'abertura', frequency: 'daily' },

                // METALEIRA / DOBRA
                { subcategory_id: subcatMap.METALEIRA_DOBRA, name: 'BARRA REDONDA 6000 MM - 3/8 POL', material_code: 'MPO13.0010', piece_dimensions: '150mm', points: 1, is_active: true, sort_order: 1, checklist_type: 'abertura' as const, frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA_DOBRA, name: 'FERRO CHATO 6000 MM - 1.1/2 X 1/2 POL', material_code: 'MPO10.0006', piece_dimensions: '658mm', points: 1, is_active: true, sort_order: 2, checklist_type: 'abertura' as const, frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA_DOBRA, name: 'FERRO CHATO 6000 MM - 1.1/2 X 1/2 POL', material_code: 'MPO10.0006', piece_dimensions: '328mm', points: 1, is_active: true, sort_order: 3, checklist_type: 'abertura' as const, frequency: 'daily' },
                { subcategory_id: subcatMap.METALEIRA_DOBRA, name: 'FERRO CHATO 6000 MM - 1.1/2 X 1/2 POL', material_code: 'MPO10.0006', piece_dimensions: '700mm', points: 1, is_active: true, sort_order: 4, checklist_type: 'abertura' as const, frequency: 'daily' },
            ];

            const { error: errItems } = await supabase.from('checklist_items').insert(itemsToInsert);
            if (errItems) throw errItems;

            toast.success('Banco de dados atualizado com as peças da Metalúrgica!', { id: 'seed' });

        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao atualizar banco: ' + err.message, { id: 'seed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
                <div className="max-w-md w-full space-y-6 text-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto border-4 border-destructive/20">
                        <AppIcon name="AlertTriangle" size={40} className="text-destructive" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Área de Perigo</h1>
                        <p className="text-muted-foreground mt-2">
                            Esta página é um utilitário temporário. Ela apaga <b>TODAS</b> as peças, setores e tarefas antigas salvas e as substitui pelas peças reais da metalúrgica (Barras Redondas, Tubos e Ferros Chatos que vimos nas planilhas).
                        </p>
                    </div>

                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl text-left space-y-2">
                        <h3 className="font-bold text-warning text-sm uppercase tracking-wider">O que será criado:</h3>
                        <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                            <li>Setor: SERRA</li>
                            <li>Setor: METALEIRA</li>
                            <li>Setor: METALEIRA/DOBRA</li>
                            <li>Setor: EXPEDIÇÃO</li>
                            <li>~16 Peças reais em seus respectivos setores (ex: MPO13.0004)</li>
                        </ul>
                    </div>

                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full text-lg h-14 font-bold"
                        onClick={handleSeed}
                        disabled={loading}
                    >
                        {loading ? 'Substituindo dados...' : 'APAGAR E ATUALIZAR BANCO'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
