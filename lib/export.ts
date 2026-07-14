import Papa from "papaparse";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatCurrency, formatDate } from "@/lib/utils";
import { transactionLabels } from "@/lib/transaction-meta";
import type { Transaction } from "@/types";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCsv(transactions: Transaction[]) {
  const rows = transactions.map((tx) => ({
    Date: formatDate(tx.createdAt),
    Description: tx.description,
    Type: transactionLabels[tx.type],
    Direction: tx.direction,
    Amount: tx.amount,
    Currency: tx.currency,
    Status: tx.status,
    Reference: tx.reference,
  }));

  const csv = Papa.unparse(rows);
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "transactions.csv");
}

export function exportTransactionsToPdf(transactions: Transaction[]) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Novaofficial — Transaction Statement", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${formatDate(new Date())}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Date", "Description", "Type", "Amount", "Status", "Reference"]],
    body: transactions.map((tx) => [
      formatDate(tx.createdAt),
      tx.description,
      transactionLabels[tx.type],
      `${tx.direction === "credit" ? "+" : "-"}${formatCurrency(tx.amount, tx.currency)}`,
      tx.status,
      tx.reference,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [67, 56, 202] },
  });

  doc.save("transactions.pdf");
}
