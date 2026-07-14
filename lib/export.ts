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

export function exportReceiptToPdf(
  transaction: Transaction,
  extra: { senderName?: string; recipientName?: string }
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Novaofficial — Transaction Receipt", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${formatDate(new Date())}`, 14, 24);

  doc.setFontSize(20);
  doc.setTextColor(20);
  doc.text(
    `${transaction.direction === "credit" ? "+" : "-"}${formatCurrency(transaction.amount, transaction.currency)}`,
    14,
    38
  );
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`${transactionLabels[transaction.type]} · ${transaction.status.toUpperCase()}`, 14, 45);

  const rows: [string, string][] = [
    ["Reference number", transaction.reference],
    ["Transaction ID", transaction.id],
    ["Date & time", formatDate(transaction.createdAt, { dateStyle: "medium", timeStyle: "short" })],
  ];
  if (extra.senderName) rows.push(["Sender", extra.senderName]);
  if (extra.recipientName) rows.push(["Recipient", extra.recipientName]);
  if (transaction.counterpartyAccount) rows.push(["Recipient account", transaction.counterpartyAccount]);
  rows.push(["Description", transaction.description]);
  if (transaction.fee) rows.push(["Fee", formatCurrency(transaction.fee, transaction.currency)]);
  rows.push(["Currency", transaction.currency]);

  autoTable(doc, {
    startY: 55,
    body: rows,
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  doc.save(`receipt-${transaction.reference}.pdf`);
}
