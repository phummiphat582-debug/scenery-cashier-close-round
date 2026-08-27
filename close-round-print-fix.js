/* Final print override for Close Round.
 * Keep this file after the legacy app bundle so the accounting document is
 * always rendered as one table, even if an older bundle still contains the
 * card-based print implementation.
 */
(function(){
  'use strict';
  const PATCH_KEY='scenery-close-round-print-table-fix-v1';
  if(window[PATCH_KEY])return;
  window[PATCH_KEY]=true;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cellValue=cell=>{
    const control=cell?.querySelector('input,select,textarea');
    return String(control?control.value:(cell?.textContent||'')).trim();
  };

  function buildTable(source){
    const headerRows=[...(source.tHead?.rows||[])];
    const first=[...(headerRows[0]?.cells||[])];
    if(first.length<21)return null;
    const headers=[...first.slice(0,19).map(cell=>cell.textContent.trim()),'ช่องทางชำระเงิน',first[20]?.textContent.trim()||'หมายเหตุ'];
    const head=`<thead><tr>${headers.map(label=>`<th>${esc(label)}</th>`).join('')}</tr></thead>`;
    const rows=[...(source.tBodies[0]?.rows||[])].filter(row=>row.cells.length>=28&&!row.classList.contains('close-round-villa-add-row'));
    const body=rows.map(row=>{
      const values=[...Array.from(row.cells).slice(0,19).map(cellValue)];
      const payment=[...Array.from(row.cells).slice(19,27).map(cellValue)].filter(Boolean).join(', ');
      values.push(payment,cellValue(row.cells[27]));
      return `<tr>${values.map((value,index)=>`<td class="${index>=5&&index<=18?'number':''}">${esc(value)}</td>`).join('')}</tr>`;
    }).join('');
    return `<table class="close-round-print-table">${head}<tbody>${body||'<tr><td colspan="21">ยังไม่มีรายการที่ Finalized ในวันที่เลือก</td></tr>'}</tbody></table>`;
  }

  function printCloseRoundDetailAsTable(){
    const source=document.querySelector('#view-close-round .close-round-detail-table');
    const table=source&&buildTable(source);
    if(!table){window.showToast?.('ไม่พบตารางรายละเอียดสำหรับพิมพ์','error');return;}
    const date=document.querySelector('#close-round-date')?.value||new Date().toISOString().slice(0,10);
    document.querySelector('#close-round-print-frame')?.remove();
    const frame=document.createElement('iframe');
    frame.id='close-round-print-frame';
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
    const css=`@page{size:A4 landscape;margin:0}*{box-sizing:border-box}html,body{width:297mm;min-height:210mm;margin:0;padding:0;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}.sheet{width:297mm;min-height:210mm;padding:5mm;background:#fff}.heading{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5px solid #6e442d;padding:0 0 1.5mm;margin:0 0 2mm;font-size:10px;line-height:1.2}.heading span{font-size:8px;color:#66584e}.close-round-print-table{width:287mm;border-collapse:collapse;table-layout:fixed;font-size:6px;line-height:1.05}.close-round-print-table th,.close-round-print-table td{border:1px solid #29231e;padding:1px .7px;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word}.close-round-print-table th{background:#eee3d8;font-weight:700;text-align:center}.close-round-print-table td.number{text-align:right}.close-round-print-table th:nth-child(1),.close-round-print-table td:nth-child(1){width:8%}.close-round-print-table th:nth-child(2),.close-round-print-table td:nth-child(2){width:7%}.close-round-print-table th:nth-child(3),.close-round-print-table td:nth-child(3){width:13%}.close-round-print-table th:nth-child(4),.close-round-print-table td:nth-child(4),.close-round-print-table th:nth-child(5),.close-round-print-table td:nth-child(5){width:4%}.close-round-print-table th:nth-child(n+6):nth-child(-n+16),.close-round-print-table td:nth-child(n+6):nth-child(-n+16){width:3%}.close-round-print-table th:nth-child(n+17):nth-child(-n+19),.close-round-print-table td:nth-child(n+17):nth-child(-n+19){width:5%}.close-round-print-table th:nth-child(20),.close-round-print-table td:nth-child(20){width:9%}.close-round-print-table th:nth-child(21),.close-round-print-table td:nth-child(21){width:7%}.close-round-print-table thead{display:table-header-group}.close-round-print-table tbody tr{break-inside:avoid;page-break-inside:avoid}`;
    frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดปิดรอบ ${esc(date)}</title><style>${css}</style></head><body><div class="sheet"><div class="heading"><strong>รายละเอียดรายการปิดรอบส่งบัญชี</strong><span>Business Date: ${esc(date)}</span></div>${table}</div></body></html>`;
    document.body.append(frame);
    const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};
    window.addEventListener('afterprint',cleanup,{once:true});
    frame.addEventListener('load',()=>{const printWindow=frame.contentWindow;if(!printWindow)return;printWindow.focus();setTimeout(()=>printWindow.print(),150);setTimeout(cleanup,15000)},{once:true});
  }

  window.printCloseRoundDetailOnePage=printCloseRoundDetailAsTable;
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-close-round-detail-print]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    printCloseRoundDetailAsTable();
  },true);
})();
