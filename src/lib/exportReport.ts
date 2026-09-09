import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction, TransactionType } from "../types/transaction";

// ── Period resolution ──────────────────────────────────────────
export type ExportPeriodKey =
  | "this_month"
  | "last_month"
  | "this_year"
  | "all"
  | "custom";

export interface ExportPeriod {
  label: string;
  match: (date: string) => boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function resolvePeriod(
  key: ExportPeriodKey,
  customMonth?: string
): ExportPeriod {
  const now = new Date();
  switch (key) {
    case "this_month": {
      const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
      return { label: monthLabel(now), match: (d) => d.startsWith(prefix) };
    }
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prefix = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      return { label: monthLabel(d), match: (d) => d.startsWith(prefix) };
    }
    case "this_year": {
      const prefix = `${now.getFullYear()}-`;
      return { label: `Year ${now.getFullYear()}`, match: (d) => d.startsWith(prefix) };
    }
    case "all":
      return { label: "All Time", match: () => true };
    case "custom": {
      if (!customMonth || !/^\d{4}-\d{2}$/.test(customMonth)) {
        return { label: "Custom", match: () => false };
      }
      const [y, m] = customMonth.split("-").map(Number);
      return {
        label: monthLabel(new Date(y, m - 1, 1)),
        match: (d) => d.startsWith(customMonth),
      };
    }
  }
}

// ── Aggregations ────────────────────────────────────────────────
export interface ReportData {
  transactions: Transaction[];
  totalCredit: number;
  totalSpend: number;
  net: number;
  spendByCategory: { key: string; label: string; amount: number }[];
  creditBySource: { key: string; label: string; amount: number }[];
}

export function buildReportData(
  transactions: Transaction[],
  period: ExportPeriod
): ReportData {
  const matched = transactions.filter((tx) => period.match(tx.date));
  const spends: Record<string, number> = {};
  const credits: Record<string, number> = {};
  let totalSpend = 0;
  let totalCredit = 0;

  matched.forEach((tx) => {
    if (tx.type === "expense") {
      const key = tx.category || "other";
      spends[key] = (spends[key] ?? 0) + tx.amount;
      totalSpend += tx.amount;
    } else if (tx.type === "income_salary" || tx.type === "income_topup") {
      const key = tx.type === "income_salary" ? "salary" : "topup";
      credits[key] = (credits[key] ?? 0) + tx.amount;
      totalCredit += tx.amount;
    }
  });

  const sortDesc = ([, a]: [string, number], [, b]: [string, number]) => b - a;
  const titleCase = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

  return {
    transactions: matched.sort((a, b) => a.date.localeCompare(b.date) || (a.dayLabel - b.dayLabel)),
    totalCredit,
    totalSpend,
    net: totalCredit - totalSpend,
    spendByCategory: Object.entries(spends)
      .sort(sortDesc)
      .map(([key, amount]) => ({ key, label: titleCase(key), amount })),
    creditBySource: Object.entries(credits)
      .sort(sortDesc)
      .map(([key, amount]) => ({
        key,
        label: key === "salary" ? "Salary" : "Top-up",
        amount,
      })),
  };
}

// ── PDF builder ─────────────────────────────────────────────────
export interface BuildPdfParams {
  data: ReportData;
  periodLabel: string;
  currencySymbol: string;
  currencyName: string;
  locale: string;
  userName: string;
  generatedAt: string;
  logo?: HTMLImageElement | null;
}

type RGB = [number, number, number];

const GREEN: RGB = [92, 176, 16];
const GREEN_DARK: RGB = [46, 104, 10];
const INK: RGB = [13, 19, 15];
const BODY: RGB = [80, 90, 84];
const MUTED: RGB = [130, 140, 134];
const LIGHT: RGB = [244, 248, 242];
const SOFT: RGB = [247, 249, 247];
const HAIRLINE: RGB = [233, 238, 234];
const RED: RGB = [228, 80, 70];

function fmtNum(n: number, locale: string) {
  return Math.abs(n).toLocaleString(locale);
}

function lastTableY(doc: jsPDF): number | undefined {
  type WithLastTable = { lastAutoTable?: { finalY?: number } };
  return (doc as unknown as WithLastTable).lastAutoTable?.finalY;
}

function fmtDateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildReportPdf(params: BuildPdfParams): jsPDF {
  const {
    data,
    periodLabel,
    currencySymbol,
    currencyName,
    locale,
    userName,
    generatedAt,
    logo,
  } = params;

  const num = (n: number) => fmtNum(n, locale);
  const signedNum = (n: number) => `${n >= 0 ? "+" : "-"}${fmtNum(n, locale)}`;

  const doc = new jsPDF();
  const pageW = 210;
  const marginX = 16;
  const contentW = pageW - marginX * 2;
  const rightX = pageW - marginX;

  const setText = (color: RGB, size: number, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };

  // ── Modern header (light, airy) ───────────────────────────
  // Logo + wordmark
  if (logo) {
    doc.addImage(logo, "PNG", marginX, 15, 12, 12);
  }
  setText(GREEN_DARK, 13, "bold");
  doc.text("MY POCKET", marginX + 16, 23);
  setText(MUTED, 7);
  doc.text("EXPENSE REPORT", marginX + 16, 28.5);

  // Period pill (soft green)
  setText(GREEN_DARK, 8.5, "bold");
  const pillText = periodLabel;
  const pillW = doc.getTextWidth(pillText) + 14;
  const pillH = 9;
  const pillX = rightX - pillW;
  const pillY = 16.5;
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setDrawColor(HAIRLINE[0], HAIRLINE[1], HAIRLINE[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(pillX, pillY, pillW, pillH, pillH / 2, pillH / 2, "FD");
  doc.text(pillText, pillX + pillW / 2, pillY + 6, { align: "center" });

  // Headline block
  setText(INK, 20, "bold");
  doc.text("Expense Report", marginX, 48);

  setText(BODY, 9);
  doc.text(`Prepared for ${userName}`, marginX, 55.5);
  setText(MUTED, 8);
  doc.text(`All amounts in ${currencySymbol} (${currencyName})`, rightX, 55.5, {
    align: "right",
  });

  // Green accent underline
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.roundedRect(marginX, 61, 22, 2.4, 1.2, 1.2, "F");

  // ── Summary cards ─────────────────────────────────────────
  const cardsY = 72;
  const cardH = 32;
  const gap = 8;
  const cardW = (contentW - gap * 2) / 3;
  const valueFont = (len: number) => (len <= 6 ? 11 : len <= 7 ? 9.5 : 8);

  const creditValue = num(data.totalCredit);
  const spendValue = num(data.totalSpend);
  const netValue = signedNum(data.net);

  const cards: {
    label: string;
    value: string;
    color: RGB;
    filled?: boolean;
  }[] = [
    { label: "Total credit", value: creditValue, color: GREEN },
    { label: "Total spend", value: spendValue, color: RED },
    {
      label: "Net balance",
      value: netValue,
      color: data.net >= 0 ? GREEN : RED,
      filled: true,
    },
  ];

  cards.forEach((c, i) => {
    const x = marginX + i * (cardW + gap);
    if (c.filled) {
      doc.setFillColor(c.color[0], c.color[1], c.color[2]);
      doc.roundedRect(x, cardsY, cardW, cardH, 4, 4, "F");
    } else {
      doc.setFillColor(SOFT[0], SOFT[1], SOFT[2]);
      doc.setDrawColor(HAIRLINE[0], HAIRLINE[1], HAIRLINE[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, cardsY, cardW, cardH, 4, 4, "FD");
    }

    const labelColor: RGB = c.filled ? [235, 246, 226] : MUTED;
    setText(labelColor, 6.5, "bold");
    doc.text(c.label.toUpperCase(), x + 9, cardsY + 10);

    setText(c.filled ? [255, 255, 255] : c.color, valueFont(c.value.length), "bold");
    doc.text(c.value, x + 9, cardsY + 22.5);
  });

  // ── Sections ──────────────────────────────────────────────
  let cursorY = cardsY + cardH + 14;

  const sectionTitle = (title: string, meta?: string) => {
    doc.setDrawColor(HAIRLINE[0], HAIRLINE[1], HAIRLINE[2]);
    doc.setLineWidth(0.25);
    doc.line(marginX, cursorY - 7, rightX, cursorY - 7);
    setText(INK, 11, "bold");
    doc.text(title, marginX, cursorY);
    if (meta) {
      setText(MUTED, 8);
      doc.text(meta, rightX, cursorY, { align: "right" });
    }
  };

  const gridBase = {
    font: "helvetica" as const,
    cellPadding: { top: 3.5, right: 2.5, bottom: 3.5, left: 2.5 },
    textColor: INK,
    lineColor: HAIRLINE,
    lineWidth: 0.2,
  };

  const headBase = {
    fillColor: SOFT,
    textColor: GREEN_DARK,
    fontStyle: "bold" as const,
    fontSize: 8,
    lineColor: HAIRLINE,
    lineWidth: 0.4,
    cellPadding: { top: 4, right: 2.5, bottom: 4, left: 2.5 },
  };

  const footBase = {
    fillColor: SOFT,
    textColor: INK,
    fontStyle: "bold" as const,
    fontSize: 9.5,
    lineColor: HAIRLINE,
    lineWidth: 0.3,
  };

  const shareOf = (amt: number, total: number) =>
    total > 0 ? `${((amt / total) * 100).toFixed(1)}%` : "0.0%";

  // ── Spent by category ─────────────────────────────────────
  sectionTitle(
    "Spent by category",
    data.spendByCategory.length > 0 ? `${data.spendByCategory.length} categories` : undefined
  );
  autoTable(doc, {
    startY: cursorY + 8,
    margin: { left: marginX, right: marginX, bottom: 22 },
    head: [["Category", "Amount", "Share"]],
    body:
      data.spendByCategory.length > 0
        ? data.spendByCategory.map((r) => [
            r.label,
            num(r.amount),
            shareOf(r.amount, data.totalSpend),
          ])
        : [["No spends recorded in this period", "—", "—"]],
    foot: data.totalSpend > 0
      ? [["Total spent", num(data.totalSpend), "100.0%"]]
      : undefined,
    styles: { ...gridBase, fontSize: 9.5 },
    headStyles: headBase,
    footStyles: footBase,
    columnStyles: {
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 26, halign: "right" },
    },
  });

  cursorY = (lastTableY(doc) ?? cursorY) + 14;

  // ── Credits by source ─────────────────────────────────────
  sectionTitle(
    "Credits by source",
    data.creditBySource.length > 0 ? `${data.creditBySource.length} sources` : undefined
  );
  autoTable(doc, {
    startY: cursorY + 8,
    margin: { left: marginX, right: marginX, bottom: 22 },
    head: [["Source", "Amount", "Share"]],
    body:
      data.creditBySource.length > 0
        ? data.creditBySource.map((r) => [
            r.label,
            num(r.amount),
            shareOf(r.amount, data.totalCredit),
          ])
        : [["No credits recorded in this period", "—", "—"]],
    foot: data.totalCredit > 0
      ? [["Total credit", num(data.totalCredit), "100.0%"]]
      : undefined,
    styles: { ...gridBase, fontSize: 9.5 },
    headStyles: headBase,
    footStyles: footBase,
    columnStyles: {
      1: { cellWidth: 40, halign: "right" },
      2: { cellWidth: 26, halign: "right" },
    },
  });

  cursorY = (lastTableY(doc) ?? cursorY) + 14;

  // ── Transactions ──────────────────────────────────────────
  const txCount = data.transactions.length;
  sectionTitle("Transactions", `${txCount} entries`);
  autoTable(doc, {
    startY: cursorY + 8,
    margin: { left: marginX, right: marginX, bottom: 22 },
    head: [["Date", "Type", "Category", "Bucket", "Note", "Amount"]],
    body:
      txCount > 0
        ? data.transactions.map((tx) => [
            fmtDateLabel(tx.date),
            TYPE_LABEL[tx.type],
            tx.category ? titleCaseFn(tx.category) : "—",
            BUCKET_LABEL[tx.bucket],
            tx.note || "—",
            signedNum(tx.type === "expense" || tx.type === "transfer" ? -tx.amount : tx.amount),
          ])
        : [["No transactions recorded in this period", "—", "—", "—", "—", "—"]],
    styles: { ...gridBase, fontSize: 9 },
    headStyles: {
      ...headBase,
      fontSize: 8,
    },
    footStyles: { ...footBase, fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25, halign: "left" },
      1: { cellWidth: 18, halign: "left" },
      2: { cellWidth: 26, halign: "left" },
      3: { cellWidth: 20, halign: "left" },
      4: { cellWidth: "auto" },
      5: { cellWidth: 39, halign: "right" },
    },
    didParseCell: (hd) => {
      if (hd.section === "body" && hd.column.index === 1) {
        const raw = hd.cell.raw;
        if (raw === "Spend") hd.cell.styles.textColor = RED;
        else if (raw === "Transfer") hd.cell.styles.textColor = MUTED;
        else hd.cell.styles.textColor = GREEN;
      } else if (hd.section === "body" && hd.column.index === 5) {
        const raw = hd.cell.raw;
        hd.cell.styles.textColor =
          typeof raw === "string" && raw.startsWith("-") ? RED : GREEN;
      }
    },
  });

  // ── Footers ───────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(HAIRLINE[0], HAIRLINE[1], HAIRLINE[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, 283, rightX, 283);
    setText(MUTED, 7.5);
    doc.text("My Pocket · Expense Report", marginX, 287.5);
    doc.text(generatedAt, pageW / 2, 287.5, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, rightX, 287.5, { align: "right" });
  }

  return doc;
}

// ── Shared labels ───────────────────────────────────────────────
const TYPE_LABEL: Record<TransactionType, string> = {
  expense: "Spend",
  income_salary: "Salary",
  income_topup: "Top-up",
  transfer: "Transfer",
};

const BUCKET_LABEL: Record<string, string> = {
  liquid: "In Hand",
  account: "Account",
};

function titleCaseFn(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}