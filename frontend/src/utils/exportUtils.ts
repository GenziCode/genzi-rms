import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  columns: Array<{ header: string; key: string }>;
  data: Array<Record<string, any>>;
  title?: string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV({ columns, data, title }: ExportData) {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      // Handle null/undefined
      if (value == null) return '';
      // Handle dates
      if (value instanceof Date) return value.toISOString();
      // Convert to string and escape commas
      return String(value).includes(',') ? `"${String(value)}"` : String(value);
    })
  );

  const csvContent = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel format
 */
export function exportToExcel({ columns, data, title }: ExportData) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        obj[col.header] = row[col.key];
      });
      return obj;
    })
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Set column widths
  const colWidths = columns.map(() => ({ wch: 15 }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(
    workbook,
    `${title || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

/**
 * Export data to PDF format
 */
export function exportToPDF({ columns, data, title }: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Add title
  if (title) {
    doc.setFontSize(18);
    doc.text(title, margin, 20);
    doc.setFontSize(12);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      margin,
      30
    );
  }

  // Prepare table data
  const tableColumns = columns.map((col) => col.header);
  const tableRows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value == null) return '';
      if (value instanceof Date) return value.toLocaleDateString();
      return String(value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: title ? 35 : 20,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
  });

  doc.save(`${title || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export chart as image (PNG)
 */
export function exportChartAsImage(
  chartElement: HTMLElement | null,
  filename: string
) {
  if (!chartElement) return;

  import('html2canvas').then((html2canvas) => {
    html2canvas.default(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });
}

