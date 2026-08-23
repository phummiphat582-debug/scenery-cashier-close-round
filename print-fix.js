/* A4 Close Round print output.
 * The printed sheet follows the column proportions from
 * Desktop/ปิดรอบ 0/หน้าปิดรอบ.xlsx and keeps the full accounting table intact.
 * It may continue onto a second A4 page vertically so the text stays legible.
 */
(function () {
  const templateColumnWidths = [
    4.4, 3.1059, 11.8102, 1.6513, 1.6513,
    2.6219, 2.6219, 2.6219, 2.7824,
    2.6219, 2.6219, 2.6219, 2.6219, 2.6219, 2.6219, 2.6219,
    3.3647, 3.3647, 3.3647,
    2.6219, 2.6219, 2.6219, 2.6219, 2.6219, 2.6219, 2.6219, 2.6219,
    17.3103,
  ];

  function valueFromControl(control) {
    if (control.tagName === 'SELECT') {
      return control.selectedOptions?.[0]?.textContent || control.value || '';
    }
    return control.value || control.textContent || '';
  }

  function formatDayOnly(dateStr) {
    if (!dateStr || dateStr === '-') return '';
    const str = String(dateStr).trim();
    if (!str || str === '-') return '';
    const isoMatch = str.match(/^\d{4}-\d{2}-(\d{1,2})/);
    if (isoMatch) return String(parseInt(isoMatch[1], 10));
    const slashMatch = str.match(/^(\d{1,2})[\/\-]/);
    if (slashMatch) return String(parseInt(slashMatch[1], 10));
    const thaiMatch = str.match(/^(\d{1,2})\s+/);
    if (thaiMatch) return String(parseInt(thaiMatch[1], 10));
    if (/^\d{1,2}$/.test(str)) return str;
    const d = new Date(str);
    if (!isNaN(d.getDate())) return String(d.getDate());
    return str;
  }

  function normalizePrintNumber(value) {
    const text = String(value ?? '').trim();
    if (!text || text === '-' || text === '฿0.00' || text === '฿0' || text === '0.00' || text === '0') return '';
    const match = text.match(/^(-?[0-9][0-9,]*(?:\.[0-9]+)?)$/) || text.match(/^[^0-9-]*(-?[0-9][0-9,]*(?:\.[0-9]+)?).*$/);
    if (!match) return '';
    const number = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(number) || Math.abs(number) < 0.005) return '';
    const hasDecimals = Math.abs(number % 1) >= 0.005;
    return number.toLocaleString('en-US', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  function addTemplateColumns(table) {
    table.querySelector('colgroup')?.remove();
    const colgroup = document.createElement('colgroup');
    templateColumnWidths.forEach((width) => {
      const col = document.createElement('col');
      col.style.width = `${width}%`;
      colgroup.append(col);
    });
    table.insertBefore(colgroup, table.firstChild);
  }

  function makeTemplateTable(source) {
    if (!source) return null;
    const table = source.cloneNode(true);
    table.className = 'close-round-detail-table close-round-print-template-table';

    // Clean up category headers such as 'อื่นๆ'
    table.querySelectorAll('th').forEach((th) => {
      if (/อื่น\s*ๆ/i.test(th.textContent)) {
        th.textContent = 'อื่นๆ';
      }
    });

    // The add-a-villa helper is useful on screen, but it is not an accounting row.
    // Remove it before printing so the exported document contains only real records.
    table.querySelectorAll('tbody tr').forEach((row) => {
      const normalized = row.textContent.replace(/\s+/g, '').toLowerCase();
      const isAddVillaRow = row.classList.contains('close-round-villa-add-row')
        || row.hasAttribute('data-close-round-add-villa')
        || /เพิ่ม(?:villa|วิลล่า|วิลลา)/i.test(normalized);
      if (isAddVillaRow) row.remove();
    });
    addTemplateColumns(table);

    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = row.cells;
      if (cells && cells.length >= 5) {
        // Cell 3 = In (Check-in), Cell 4 = Out (Check-out)
        if (cells[3]) {
          const inVal = valueFromControl(cells[3].querySelector('input,select,textarea') || cells[3]);
          cells[3].textContent = formatDayOnly(inVal);
        }
        if (cells[4]) {
          const outVal = valueFromControl(cells[4].querySelector('input,select,textarea') || cells[4]);
          cells[4].textContent = formatDayOnly(outVal);
        }
      }
    });

    table.querySelectorAll('.material-symbols-outlined, [class*="material-symbols"]').forEach((icon) => {
      icon.remove();
    });

    table.querySelectorAll('input, textarea, select').forEach((control) => {
      const span = document.createElement('span');
      span.className = 'close-round-print-value';
      span.textContent = String(valueFromControl(control)).trim();
      control.replaceWith(span);
    });

    table.querySelectorAll('button').forEach((button) => {
      const span = document.createElement('span');
      span.className = 'close-round-print-value';
      span.textContent = button.textContent.trim();
      button.replaceWith(span);
    });

    table.querySelectorAll('td.align-right, td.strong-number').forEach((cell) => {
      cell.textContent = normalizePrintNumber(cell.textContent);
    });
    return table;
  }

  function summaryMarkup(records) {
    const entries = typeof closeRoundTemplateEntries === 'function' ? closeRoundTemplateEntries(records) : [];
    return typeof closeRoundBottomSummaryHtml === 'function' ? closeRoundBottomSummaryHtml(entries) : '';
  }

  function formatHeadingDate(dateStr) {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    const d = new Date(str.includes('T') ? str : `${str}T00:00:00`);
    if (isNaN(d.getTime())) return str;
    const thMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const day = d.getDate();
    const month = thMonths[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `ประจำวันที่ ${day} ${month} ${year}`;
  }

  function printCloseRoundDetailA4() {
    const source = document.querySelector(
      '#view-close-round .close-round-detail-wrap .close-round-detail-table',
    ) || document.querySelector('#view-close-round .close-round-detail-table');
    if (!source) return;

    const date = document.querySelector('#close-round-date')?.value || '';
    const table = makeTemplateTable(source);
    const records = typeof closeRoundRecords === 'function' ? closeRoundRecords(date) : [];
    const dateFormatted = formatHeadingDate(date);
    const heading = `<div class="close-round-print-heading">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:13px;font-weight:800;color:#3d2110;letter-spacing:0.2px;">รายงานปิดรอบประจำวัน เดอะ ซีนเนอรี่ รีสอร์ท</span>
        <span style="font-size:10.5px;font-weight:700;color:#6e4022;background:#f5ede4;padding:1.5px 7px;border-radius:4px;border:0.8px solid #d4c3b3;">${dateFormatted}</span>
      </div>
      <div style="text-align:right;font-size:9.5px;color:#66584e;">
        <span>Business Date: <strong>${date}</strong></span>
      </div>
    </div>`;
    const summary = summaryMarkup(records);
    const css = `
      @page{size:A4 landscape;margin:0}
      *{box-sizing:border-box}
      html,body{width:297mm;min-height:210mm;margin:0;padding:0;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}
      body{overflow:visible}
      .sheet{width:297mm;min-height:210mm;padding:7mm 6.35mm 10mm;background:#fff}
      .close-round-print-heading{display:flex;justify-content:space-between;align-items:center;width:284.3mm;margin:0 0 3mm;padding:0 0 1.8mm;border-bottom:1.5px solid #6e442d;font-size:12px;line-height:1.2}
      .close-round-print-heading span{font-size:10px;color:#66584e}
      .close-round-detail-table{width:284.3mm;border-collapse:collapse;table-layout:fixed;font-size:7.2px;line-height:1.18}
      .close-round-detail-table th,.close-round-detail-table td{border:1px solid #29231e;padding:1.2mm .65mm;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
      .close-round-detail-table th{background:#eee3d8;font-weight:700;text-align:center}
      .close-round-detail-table td{text-align:left}
      .close-round-detail-table .align-right{text-align:right}
      .close-round-detail-table thead{display:table-header-group}
      .close-round-detail-table tbody tr{break-inside:avoid;page-break-inside:avoid}
      .close-round-detail-table .close-round-print-value{display:inline;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
      .close-round-detail-table .total-row td{font-weight:700;background:#faf1ec}
      .close-round-bottom-summary-wrap{width:284.3mm;display:flex;justify-content:flex-end;margin-top:2mm;break-inside:avoid;page-break-inside:avoid}
      .close-round-bottom-summary-table{width:65mm;border-collapse:collapse;font-size:5.8px;line-height:1.15;border:0.8px solid #29231e;background:#fff}
      .close-round-bottom-summary-table td{border:0.8px solid #29231e;padding:0.5mm 1.2mm;font-size:5.8px}
    `;

    const frame = document.createElement('iframe');
    frame.id = 'close-round-print-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
    frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><title>หน้าปิดรอบ ' + date + '</title><style>' + css + '</style></head><body><div class="sheet">' + heading + table.outerHTML + summary + '</div></body></html>';
    document.body.append(frame);
    const cleanup = () => frame.remove();
    frame.addEventListener('load', () => {
      frame.contentWindow?.focus();
      setTimeout(() => frame.contentWindow?.print(), 150);
      setTimeout(cleanup, 15000);
    }, { once: true });
  }

  window.printCloseRoundDetailOnePage = printCloseRoundDetailA4;
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-close-round-detail-print]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    printCloseRoundDetailA4();
  }, true);
}());
