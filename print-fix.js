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
    const format = (value) => {
      const num = Number(value || 0);
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const channels = [
      ['เงินสด', 'cash'],
      ['บัตรเครดิต', 'card'],
      ['QR Code', 'qr'],
      ['โอนเงิน SC', 'transfer'],
      ['รัฐ 50%', 'government'],
      ['ลูกค้า ททท.', 'tat'],
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
    const pendingVal = channelTotal('pending');

    return `
      <section class="close-round-print-summary-container">
        <div class="print-signoff-block">
          <div class="signoff-box">
            <div class="signoff-title">ผู้จัดทำรายงาน (Receptionist)</div>
            <div class="signoff-dotted-line"></div>
            <div class="signoff-meta">วันที่ ......./......./............ เวลา ................ น.</div>
          </div>
          <div class="signoff-box">
            <div class="signoff-title">ผู้ตรวจสอบ (หัวหน้าแผนก / ฝ่ายบัญชี)</div>
            <div class="signoff-dotted-line"></div>
            <div class="signoff-meta">วันที่ ......./......./............</div>
          </div>
        </div>

        <div class="print-summary-cards-block">
          <div class="print-summary-card payment-card">
            <div class="card-header">ช่องทางรับชำระหน้า Front</div>
            <div class="card-body-grid">
              ${channels.map(([label, key]) => {
                const isPending = key === 'pending';
                const isNoCharge = key === 'noCharge';
                const val = channelTotal(key);
                const extraClass = isPending ? ' badge-pending' : (isNoCharge ? ' badge-nocharge' : '');
                const style = (isPending && val > 0) ? 'color:#a83232;font-weight:700;' : '';
                return `<div class="card-row${extraClass}"><span>${label}</span><strong style="${style}">${format(val)}</strong></div>`;
              }).join('')}
            </div>
          </div>

          <div class="print-summary-card income-card">
            <div class="card-header">สรุปยอดรายได้และรับชำระ</div>
            <div class="card-table-rows">
              <div class="income-row">
                <span>รวมยอดรายได้ (Q)</span>
                <strong>${format(sales)}</strong>
              </div>
              <div class="income-row text-deposit">
                <span>หัก Deposit (R)</span>
                <strong>${format(deposit)}</strong>
              </div>
              <div class="income-row front-income-row">
                <span>รวมรับชำระหน้า Front (S = Q - R)</span>
                <strong class="val-front">${format(frontIncome)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
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
      .close-round-print-summary-container{width:284.3mm;margin-top:2.5mm;padding-top:2mm;border-top:1.5px solid #6e442d;display:flex;justify-content:space-between;align-items:stretch;gap:3.5mm;break-inside:avoid;page-break-inside:avoid;font-family:Arial,"Noto Sans",Tahoma,sans-serif}
      .print-signoff-block{flex:1 1 85mm;max-width:92mm;display:flex;flex-direction:column;justify-content:space-between;background:#fdfcfb;border:1px solid #dfcfbe;border-radius:4px;padding:2mm 2.5mm}
      .signoff-box{margin-bottom:1.5mm}
      .signoff-box:last-child{margin-bottom:0}
      .signoff-title{font-size:6.8px;font-weight:700;color:#553e2d;margin-bottom:3.2mm}
      .signoff-dotted-line{border-bottom:1px dashed #b5a394;height:1px;margin-bottom:1mm}
      .signoff-meta{font-size:5.8px;color:#7a6b5e}
      .print-summary-cards-block{flex:1.8 1 185mm;display:flex;gap:3mm}
      .print-summary-card{border:1px solid #dfcfbe;border-radius:4px;background:#ffffff;overflow:hidden;display:flex;flex-direction:column}
      .print-summary-card.payment-card{flex:1.2}
      .print-summary-card.income-card{flex:1}
      .print-summary-card .card-header{background:#f5ece2;color:#5a3617;font-size:6.8px;font-weight:700;padding:1mm 2mm;border-bottom:1px solid #dfcfbe;text-align:center;letter-spacing:-0.1px}
      .card-body-grid{display:grid;grid-template-columns:1fr 1fr;padding:1.2mm 1.8mm;gap:.8mm 2mm;font-size:6.2px;line-height:1.2}
      .card-row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px dotted #ede4db;padding-bottom:.4mm}
      .card-row span{color:#5e5044}
      .card-row strong{color:#2c2017;font-size:6.5px;font-weight:600}
      .card-row.badge-nocharge{background:#fdfaf7;border-radius:2px;padding:.3mm .8mm}
      .card-row.badge-pending{background:#fdf5f4;border-radius:2px;padding:.3mm .8mm}
      .card-table-rows{display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:1.2mm 1.8mm;font-size:6.5px}
      .income-row{display:flex;justify-content:space-between;align-items:center;padding:.8mm .6mm;border-bottom:1px solid #eee5dd}
      .income-row span{color:#4e4034}
      .income-row strong{font-size:7px;font-weight:700;color:#2c2017}
      .income-row.text-deposit span,.income-row.text-deposit strong{color:#a04e0e}
      .income-row.front-income-row{background:#f7ede3;border:1px solid #dfcfbe;border-radius:3px;margin-top:.8mm;padding:1.2mm 1.6mm}
      .income-row.front-income-row span{font-weight:700;color:#5a3617;font-size:6.8px}
      .income-row.front-income-row strong{font-size:8px;font-weight:800;color:#5a3617}
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
