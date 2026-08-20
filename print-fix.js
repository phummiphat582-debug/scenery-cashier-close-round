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

  function normalizePrintNumber(value) {
    const text = String(value ?? '').trim();
    const match = text.match(/^([^0-9-]*)(-?[0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
    if (!match) return text;
    const number = Number(match[2].replace(/,/g, ''));
    if (!Number.isFinite(number)) return text;
    const formatted = number.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `${match[1]}${formatted}${match[3]}`;
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
    const models = (records || []).map((record) => (
      typeof closeRoundRecordModel === 'function'
        ? closeRoundRecordModel(record)
        : record || {}
    ));
    const total = (key) => models.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    const format = (value) => normalizePrintNumber(typeof money === 'function'
      ? money(value)
      : Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }));
    const channels = [
      ['เงินสด', 'cash'],
      ['บัตรเครดิต', 'card'],
      ['QR Code', 'qr'],
      ['โอนเงิน SC', 'transfer'],
      ['รัฐ 50%', 'government'],
      ['ททท.', 'tat'],
      ['ไม่เรียกเก็บ', 'noCharge'],
      ['ค้างชำระ', 'pending'],
    ];
    const channelTotal = (key) => models.reduce(
      (sum, row) => sum + Number(row.payments?.[key] || 0),
      0,
    );
    const sales = total('total');
    const deposit = total('deposit');
    const frontIncome = Math.max(0, sales - deposit);
    const line = (label, value) => `<p><span>${label}</span> ${format(value)}</p>`;
    return '<section class="close-round-print-summary">'
      + '<p class="close-round-print-summary-heading"><strong>สรุปรวม</strong></p>'
      + line('รวม', sales)
      + line('หักค่าบ้านพักชำระล่วงหน้า', deposit)
      + line('รวมรายได้หน้า Front วันนี้', frontIncome)
      + channels.map(([label, key]) => line(label, channelTotal(key))).join('')
      + '</section>';
  }

  function printCloseRoundDetailA4() {
    const source = document.querySelector(
      '#view-close-round .close-round-detail-wrap .close-round-detail-table',
    ) || document.querySelector('#view-close-round .close-round-detail-table');
    if (!source) return;

    const date = document.querySelector('#close-round-date')?.value || '';
    const table = makeTemplateTable(source);
    const records = typeof closeRoundRecords === 'function'
      ? closeRoundRecords(date)
      : [];
    const heading = '<div class="close-round-print-heading"><strong>รายงานปิดรอบประจำวันของเดอะ ซีนเนอรี่ รีสอร์ท</strong><span>Business Date: ' + date + '</span></div>';
    const summary = summaryMarkup(records);
    const css = `
      @page{size:A4 landscape;margin:0}
      *{box-sizing:border-box}
      html,body{width:297mm;min-height:210mm;margin:0;padding:0;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}
      body{overflow:visible}
      .sheet{width:297mm;min-height:210mm;padding:7mm 6.35mm 10mm;background:#fff}
      .close-round-print-heading{display:flex;justify-content:space-between;align-items:flex-end;width:284.3mm;margin:0 0 3mm;padding:0 0 1.8mm;border-bottom:1.5px solid #6e442d;font-size:12px;line-height:1.2}
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
      .close-round-print-summary{width:284.3mm;margin-top:3mm;padding-top:2mm;border-top:1.5px solid #6e442d;font-size:8px;line-height:1.35;break-inside:avoid;page-break-inside:avoid}
      .close-round-print-summary p{margin:0 0 1mm;font-size:8px;line-height:1.35}
      .close-round-print-summary p:last-child{margin-bottom:0}
      .close-round-print-summary .close-round-print-summary-heading{margin-bottom:1.5mm;color:#6e442d;font-weight:700}
      .close-round-print-summary span{color:#66584e}
      .close-round-print-summary strong{font-size:9px}
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
