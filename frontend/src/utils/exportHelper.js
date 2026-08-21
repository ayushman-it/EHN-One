/* ─────────────────────────────────────────────────────────────
   EHN One ERP Multi-Format Document Export Utility
   Supports CSV (.csv), Excel (.xls/.xlsx), and Printable PDF (.pdf)
───────────────────────────────────────────────────────────── */

/**
 * Export data to UTF-8 CSV
 */
export function exportToCSV(filename, headers, rows) {
  const csvRows = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ];
  
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Native Microsoft Excel Spreadsheet (.xls/.xlsx)
 */
export function exportToExcel(filename, sheetName, headers, rows) {
  const headerXml = headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('');
  const rowsXml = rows.map(row => {
    const cells = row.map(cell => {
      const isNum = typeof cell === 'number';
      return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${cell ?? ''}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#7367F0" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName || 'Register'}">
  <Table>
   <Row ss:StyleID="Header">${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export / Print Professional A4 PDF Document
 */
export function exportToPDF(docTitle, companyInfo, headers, rows, totalSummary = null) {
  const printWin = window.open('', '_blank', 'width=950,height=1100');
  if (!printWin) {
    alert('Pop-up blocked! Please allow pop-ups to print or export PDF.');
    return;
  }

  const companyName = companyInfo?.name || 'Kedvass Hygiene Products';
  const companyAddr = companyInfo?.address || 'Agrasen Chowk Korba';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map((row, idx) => {
    const cells = row.map((cell, cIdx) => {
      const isAmount = String(cell).startsWith('₹') || typeof cell === 'number';
      return `<td class="${isAmount ? 'text-end' : ''}">${cell ?? ''}</td>`;
    }).join('');
    return `<tr><td>${idx + 1}</td>${cells}</tr>`;
  }).join('');

  const totalHtml = totalSummary ? `
    <tr class="total-row">
      <td colspan="${headers.length}">${totalSummary.label || 'Total Summary'}</td>
      <td class="text-end fw-bold">${totalSummary.value || ''}</td>
    </tr>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${docTitle.replace(/\s+/g, '_')}_${dateStr}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 0; padding: 15px; }
        .pdf-header { border-bottom: 2.5px solid #7367f0; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .brand-title { font-size: 18px; font-weight: bold; color: #7367f0; text-transform: uppercase; }
        .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
        .doc-meta { text-align: right; }
        .doc-title { font-size: 14px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
        .doc-date { font-size: 11px; color: #64748b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #cbd5e1; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 10.5px; text-transform: uppercase; border: 1px solid #cbd5e1; font-weight: 700; }
        td { padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 11.5px; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-end { text-align: right; }
        .fw-bold { font-weight: bold; }
        .total-row { background: #e2e8f0 !important; font-weight: bold; font-size: 12px; }
        .pdf-footer { margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
        .signature-box { text-align: right; }
        .sig-space { height: 40px; }
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <div>
          <div class="brand-title">${companyName}</div>
          <div class="brand-sub">${companyAddr} • EHN One ERP Register</div>
        </div>
        <div class="doc-meta">
          <div class="doc-title">${docTitle}</div>
          <div class="doc-date">Date: ${dateStr} | F.Y. 2026-2027</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">#</th>
            ${headersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          ${totalHtml}
        </tbody>
      </table>

      <div class="pdf-footer">
        <div>Generated by EHN One ERP • Confidential Corporate Document</div>
        <div class="signature-box">
          <div>For ${companyName}</div>
          <div class="sig-space"></div>
          <div><strong>Authorized Signatory</strong></div>
        </div>
      </div>

      <script>
        window.onload = function() { window.focus(); window.print(); };
      </script>
    </body>
    </html>
  `;

  printWin.document.open();
  printWin.document.write(htmlContent);
  printWin.document.close();
}
