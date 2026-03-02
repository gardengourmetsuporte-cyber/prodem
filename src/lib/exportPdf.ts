/**
 * PDF Export using browser print API
 * Generates a printable HTML document and triggers the browser print dialog (Save as PDF).
 */

interface DREData {
  lines: Array<{ label: string; value: number; isTotal?: boolean }>;
  grossMargin: number;
  netMargin: number;
}

interface CashClosingData {
  date: string;
  unit_name: string;
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  delivery_amount: number;
  meal_voucher_amount: number;
  total_amount: number | null;
  cash_difference: number | null;
  notes?: string | null;
}

import { formatCurrency } from '@/lib/format';

function openPrintWindow(title: string, bodyHtml: string) {
  const win = window.open('', '_blank');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 32px; font-size: 13px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 24px; font-weight: 400; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
        th { font-weight: 600; background: #f9f9f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
        td { font-size: 13px; }
        .text-right { text-align: right; }
        .bold { font-weight: 700; }
        .total-row { background: #f0f0f0; font-weight: 700; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        .footer { margin-top: 32px; font-size: 10px; color: #aaa; text-align: center; }
        .metrics { display: flex; gap: 24px; margin-bottom: 24px; }
        .metric { flex: 1; padding: 12px; border: 1px solid #e5e5e5; border-radius: 8px; text-align: center; }
        .metric-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        @media print { body { padding: 16px; } }
      </style>
    </head>
    <body>
      ${bodyHtml}
      <div class="footer">Gerado por Prodem Gestão em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
    </body>
    </html>
  `);
  win.document.close();
  // Small delay to ensure content renders before print dialog
  setTimeout(() => win.print(), 400);
}

export function exportDREPdf(dre: DREData, monthLabel: string) {
  const rows = dre.lines
    .map(line => {
      const cls = line.isTotal ? 'total-row' : '';
      const valCls = line.value >= 0 ? 'positive' : 'negative';
      return `
        <tr class="${cls}">
          <td>${line.label}</td>
          <td class="text-right ${line.isTotal ? valCls : ''}">${formatCurrency(Math.abs(line.value))}</td>
        </tr>
      `;
    })
    .join('');

  const body = `
    <h1>DRE Simplificado</h1>
    <h2>Demonstrativo de Resultados — ${monthLabel}</h2>
    <table>
      <thead><tr><th>Descrição</th><th class="text-right">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Margem Bruta</div>
        <div class="metric-value ${dre.grossMargin >= 0 ? 'positive' : 'negative'}">${dre.grossMargin.toFixed(1)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Margem Líquida</div>
        <div class="metric-value ${dre.netMargin >= 0 ? 'positive' : 'negative'}">${dre.netMargin.toFixed(1)}%</div>
      </div>
    </div>
  `;

  openPrintWindow(`DRE - ${monthLabel}`, body);
}

export function exportCashClosingPdf(closing: CashClosingData) {
  const total = closing.total_amount ?? (
    closing.cash_amount + closing.debit_amount + closing.credit_amount +
    closing.pix_amount + closing.delivery_amount + closing.meal_voucher_amount
  );

  const rows = [
    ['Dinheiro', closing.cash_amount],
    ['Débito', closing.debit_amount],
    ['Crédito', closing.credit_amount],
    ['Pix', closing.pix_amount],
    ['Delivery', closing.delivery_amount],
    ['Vale Alimentação', closing.meal_voucher_amount],
  ]
    .map(([label, value]) => `
      <tr>
        <td>${label}</td>
        <td class="text-right">${formatCurrency(value as number)}</td>
      </tr>
    `)
    .join('');

  const body = `
    <h1>Fechamento de Caixa</h1>
    <h2>${closing.unit_name} — ${new Date(closing.date + 'T12:00:00').toLocaleDateString('pt-BR')}</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Total Vendas</div>
        <div class="metric-value">${formatCurrency(total)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Diferença</div>
        <div class="metric-value ${(closing.cash_difference ?? 0) >= 0 ? 'positive' : 'negative'}">${formatCurrency(closing.cash_difference ?? 0)}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Meio de Pagamento</th><th class="text-right">Valor</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td class="bold">Total</td>
          <td class="text-right bold">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
    ${closing.notes ? `<p style="margin-top:16px;color:#666;"><strong>Observações:</strong> ${closing.notes}</p>` : ''}
  `;

  openPrintWindow(`Fechamento - ${closing.date}`, body);
}

interface CsvTransaction {
  date: string;
  description: string;
  category?: string;
  amount: number;
  type: string;
  is_paid: boolean;
  account?: string;
}

export function exportTransactionsCsv(transactions: CsvTransaction[], monthLabel: string) {
  const BOM = '\uFEFF';
  const header = 'Data;Descrição;Categoria;Tipo;Valor;Status;Conta';
  const rows = transactions.map(t => {
    const typeLabel = t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : t.type === 'transfer' ? 'Transferência' : t.type;
    const status = t.is_paid ? 'Pago' : 'Pendente';
    const value = t.amount.toFixed(2).replace('.', ',');
    return `${t.date};${t.description};${t.category || ''};${typeLabel};${value};${status};${t.account || ''}`;
  });

  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `extrato-${monthLabel.replace(/\s/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
