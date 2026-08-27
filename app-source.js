const DATA=window.DATA_MASTER||{villas:[],accommodationItems:[],addonItems:[]};
const villaOptions=DATA.villas;
const CLOSE_ROUND_SOURCE_VILLAS=[
  '02 Pangola','03 Hamata','04 Barbados','05 Merino','06 Corriedale','07 Katahdin',
  '08 Mulato','010 Napier','011 Setaria','012 Alfalfa','013 Rapunzel'
];
const villaBathTypes={'02 Pangola':'Jacuzzi','03 Hamata':'Jacuzzi','04 Barbados':'Jacuzzi_Deluxe','05 Merino':'BathTub','06 Corriedale':'BathTub','06 Corredale':'BathTub','07 Katahdin':'BathTub_Deluxe','08 Mulato':'Jacuzzi','010 Napier':'Jacuzzi','011 Setaria':'Jacuzzi','012 Alfalfa':'Jacuzzi','013 Rapunzel':'Villa'};
function cleanEnglishText(value){return String(value??'').replace(/\bBath\b/g,'Baht').replace(/\bFlaver\b/g,'Flavor').replace(/\bGrand ma\b/g,'Grandma').replace(/Food_Beverage/g,'Food & Beverage').replace(/Afternoon_Tea/g,'Afternoon Tea').replace(/Extra_Bed/g,'Extra Bed').replace(/BathTub_Deluxe/g,'Bathtub Deluxe').replace(/BathTub/g,'Bathtub').replace(/Jacuzzi_Deluxe/g,'Jacuzzi Deluxe').replace(/\s*(?:เด้งราคา|เพิ่มราคา)\b/g,'').replace(/\s*\?\s*/g,' - ')}
const accommodationItems=[...DATA.accommodationItems.map(item=>{const villaName=Object.keys(villaBathTypes).find(name=>item.name.startsWith(`${name} `)||String(item.villa||'').startsWith(`${name} `));const normalized={...item,name:cleanEnglishText(item.name),category:cleanEnglishText(item.category)};return villaName?{...normalized,label:`${villaName} ${cleanEnglishText(villaBathTypes[villaName])}`,name:`${villaName} ${cleanEnglishText(villaBathTypes[villaName])}`,category:cleanEnglishText(villaBathTypes[villaName]),villa:villaName}:normalized}),{name:'E-Voucher Dinner 800 Baht (22)',category:'Package',rate:800},{name:'E-Voucher Dinner 1200 Baht (22)',category:'Package',rate:1200}].filter((item,index,items)=>items.findIndex(other=>other.name===item.name)===index);
const addonItems=[...DATA.addonItems.map(item=>({...item,name:cleanEnglishText(item.name),category:cleanEnglishText(item.category)})),{name:'E-Voucher Dinner 800 Baht (22)',category:'Food & Beverage',rate:800},{name:'E-Voucher Dinner 1200 Baht (22)',category:'Food & Beverage',rate:1200}].filter((item,index,items)=>items.findIndex(other=>other.name===item.name)===index);
const paymentMethods=['เงินสด','โอน','บัตรเครดิต','คิวอาโค้ต','2C2P'];
const state={invoiceLines:[],payments:[],currentView:'dashboard',invoicePage:'form',invoiceNumber:85,invoices:[],drafts:[{id:'DF-260717-A',label:'บัตรกิจกรรมแกะ + หญ้า 4 ชุด',total:1200,time:'5 นาทีที่แล้ว'},{id:'DF-260717-B',label:'ของที่ระลึก: กระเป๋าสาน 2 ใบ',total:640,time:'12 นาทีที่แล้ว'},{id:'DF-260716-Z',label:'เหมาจ่าย: คณะทัศนศึกษา 45 ท่าน',total:12500,time:'เมื่อวาน'}],closedBookings:loadClosedBookings()};
window.sceneryAppState=state;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],money=v=>{const n=Number(v||0),magnitude=Math.abs(n),hasDecimals=Math.abs(n%1)>=0.005,formatted=magnitude.toLocaleString('th-TH',{minimumFractionDigits:hasDecimals?2:0,maximumFractionDigits:2});return n<0?`-฿${formatted}`:`฿${formatted}`},esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.money=money;
function loadClosedBookings(){try{return JSON.parse(localStorage.getItem('scenery-closed-bookings')||'[]')}catch{return[]}}
function saveClosedBookings(){try{localStorage.setItem('scenery-closed-bookings',JSON.stringify(state.closedBookings))}catch{}}
function showToast(message,type='success'){const region=$('#toast-region');if(!region)return;const toast=document.createElement('div');toast.className=`toast ${type}`;toast.innerHTML=`<span class="material-symbols-outlined">${type==='error'?'error':'check_circle'}</span><span>${esc(message)}</span>`;region.appendChild(toast);setTimeout(()=>toast.classList.add('show'),10);setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),250)},3200)}
function setView(view){state.currentView=view;$$('.view').forEach(s=>s.classList.toggle('active',s.id===`view-${view}`));$$('.nav-item').forEach(i=>i.classList.toggle('active',i.dataset.view===view));$('#sidebar')?.classList.remove('open');if(view==='dashboard'&&typeof renderDashboard==='function')renderDashboard();if(view==='master')renderBookingRecords();if(view==='close-round'&&typeof renderCloseRound==='function')renderCloseRound();if(view==='drawer'&&typeof cashDrawerV2Render==='function')cashDrawerV2Render();if(view==='history'){if(typeof renderInvoiceHistoryAllRecords==='function')renderInvoiceHistoryAllRecords();else if(typeof renderHistory==='function')renderHistory();}}
function setInvoicePage(page){state.invoicePage=page;$$('.invoice-page').forEach(s=>s.classList.toggle('active',s.dataset.invoicePage===page));$$('.invoice-page-tab').forEach(b=>b.classList.toggle('active',b.dataset.invoicePage===page));if(page==='preview')renderInvoicePreview()}
function renderDashboard(){
  const records=typeof loadInvoiceHistory==='function'?loadInvoiceHistory():(state.invoices||[]);
  const today=typeof historyDateKey==='function'?historyDateKey():new Date().toISOString().slice(0,10);
  const totalSales=records.reduce((sum,r)=>sum+Number(r.total||0),0);
  const totalPending=records.reduce((sum,r)=>sum+(typeof historyPendingTotal==='function'?historyPendingTotal(r):Number(r.pendingTotal||0)),0);
  const drafts=state.drafts||[];

  const metricCards=document.querySelectorAll('#view-dashboard .metric-card');
  if(metricCards[0]){const strong=metricCards[0].querySelector('strong');if(strong)strong.textContent=money(totalSales)}
  if(metricCards[1]){const strong=metricCards[1].querySelector('strong');if(strong)strong.textContent=`${drafts.length} รายการ`}
  if(metricCards[2]){const strong=metricCards[2].querySelector('strong');if(strong)strong.textContent=`${records.length} บิล`}
  if(metricCards[3]){const strong=metricCards[3].querySelector('strong');if(strong){strong.textContent=money(totalPending);strong.className=totalPending>0?'critical-text':'positive-text'}}

  const lastUpdated=$('#last-updated');
  if(lastUpdated){
    const now=new Date();
    const timeStr=now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    lastUpdated.textContent=`ข้อมูลล่าสุดเมื่อ: วันนี้ | ${timeStr} น. · ข้อมูลจริง ${records.length} รายการ`;
  }

  const d=$('#dashboard-invoices');
  if(d){
    if(!records.length){
      d.innerHTML='<tr><td colspan="6"><div class="empty-state"><span class="material-symbols-outlined">receipt_long</span><p>ยังไม่มีใบแจ้งหนี้</p><small>สร้างใบแจ้งหนี้ใหม่เพื่อบันทึกรายการ</small></div></td></tr>';
    }else{
      d.innerHTML=records.slice(0,8).map(i=>{
        const status=typeof historyStatus==='function'?historyStatus(i):{label:i.status||'ชำระแล้ว',className:i.statusClass||'status-paid'};
        const displayDate=typeof historyDisplayDate==='function'?historyDisplayDate(i.businessDate||today):(i.businessDate||today);
        return `<tr>
          <td><button class="button button-text mono strong-link" type="button" data-history-view="${esc(i.id)}" style="padding:0;font-weight:700;color:var(--primary);text-decoration:underline;cursor:pointer;background:none;border:none;">${esc(i.id)}</button></td>
          <td><strong>${esc(i.customer||'-')}</strong><small class="table-subtext">${esc(i.villa||'-')} · ${esc(i.time||'-')} น.</small></td>
          <td class="muted">${esc(displayDate)}</td>
          <td class="align-right strong-number"><strong>${money(i.total)}</strong></td>
          <td><span class="status-chip ${status.className}">${esc(status.label)}</span></td>
          <td class="align-right">
            <div class="history-actions" style="display:inline-flex;gap:4px;">
              <button class="button button-outline action-small" data-history-view="${esc(i.id)}" title="ดู Information Bill"><span class="material-symbols-outlined">receipt_long</span>เปิดดู</button>
              <button class="button button-danger action-small" data-history-delete="${esc(i.id)}" title="ลบใบแจ้งหนี้"><span class="material-symbols-outlined">delete</span>ลบ</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }
  }

  const draftList=$('#draft-list');
  if(draftList){
    draftList.innerHTML=drafts.length?drafts.map(d=>`<div class="draft-item"><div class="draft-top"><strong>${esc(d.id)}</strong><small>${esc(d.time)}</small></div><p>${esc(d.label)}</p><div class="draft-bottom"><span class="amount">${money(d.total)}</span><button class="text-button" data-view="invoice">แก้ไข</button></div></div>`).join(''):'<div class="empty-state"><p class="muted">ไม่มีใบแจ้งหนี้แบบร่าง</p></div>';
  }
}
function renderHistory(){const b=$('#history-body');if(!b)return;const q=($('#history-search')?.value||'').trim().toLowerCase(),rows=state.invoices.filter(i=>`${i.id} ${i.customer}`.toLowerCase().includes(q));b.innerHTML=rows.map(i=>`<tr><td>${esc(i.id)}</td><td><strong>${esc(i.customer)}</strong><small class="table-subtext">${esc(i.time)} น.</small></td><td>17 ก.ค. 2026</td><td class="align-right strong-number">${money(i.total)}</td><td>${i.status==='ชำระแล้ว'?'<span class="positive-text">ครบถ้วน</span>':'<span class="warning-text">ค้างชำระ</span>'}</td><td><span class="status-chip ${i.statusClass}">${esc(i.status)}</span></td><td><button class="button button-outline action-small" data-action="detail" data-id="${esc(i.id)}">เปิดบิล</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="empty-state"><span class="material-symbols-outlined">search_off</span><p>ไม่พบรายการ</p></div></td></tr>'}
function renderBookingRecords(){const view=$('#view-master');if(!view)return;let panel=$('#booking-records-panel');if(!panel){panel=document.createElement('article');panel.id='booking-records-panel';panel.className='panel booking-records-panel';view.appendChild(panel)}panel.innerHTML=`<div class="panel-heading"><div><span class="title-icon"><span class="material-symbols-outlined">folder_shared</span></span><h3>หลักฐานการจองที่ปิดยอดแล้ว</h3></div><span class="count-chip">${state.closedBookings.length} รายการ</span></div>${state.closedBookings.length?`<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Guest / Villa</th><th>วันที่ปิดยอด</th><th class="align-right">ยอดรวม</th><th>สถานะ</th></tr></thead><tbody>${state.closedBookings.map(r=>`<tr><td class="mono">${esc(r.reference)}</td><td><strong>${esc(r.customer)}</strong><small class="table-subtext">${esc(r.villa||'-')}</small></td><td>${esc(r.closedAt)}</td><td class="align-right strong-number">${money(r.total)}</td><td><span class="status-chip success">ชำระครบแล้ว</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><span class="material-symbols-outlined">folder_open</span><p>ยังไม่มีการปิดยอด</p><small>เมื่อกดปิดยอด ใบแจ้งหนี้จะถูกเก็บหลักฐานไว้ที่นี่</small></div>'}`}
function formValue(id,fallback=''){const element=$(`#${id}`);return element?.dataset.dateValue??element?.value??fallback}
function formatDate(value){
  if(!value||value==='-')return'-';
  const str=String(value).trim();
  if(!str||str==='-')return'-';
  const isoMatch=str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(isoMatch)return `${isoMatch[3].padStart(2,'0')}/${isoMatch[2].padStart(2,'0')}/${isoMatch[1]}`;
  const d=new Date(str.includes('T')?str:`${str}T00:00:00`);
  if(!Number.isNaN(d.getTime())){
    const day=String(d.getDate()).padStart(2,'0');
    const month=String(d.getMonth()+1).padStart(2,'0');
    const year=d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return str;
}
function lineAmount(line){return Math.max(0,Number(line.qty||0)*Number(line.rate||0))}
function discountRateOptions(selected=0){return[0,5,10,15,20,25,30,50].map(n=>`<option value="${n}" ${Number(selected)===n?'selected':''}>ลด ${n}%</option>`).join('')}
function paymentMethodOptions(selected='เงินสด'){return paymentMethods.map(method=>`<option value="${esc(method)}" ${method===selected?'selected':''}>${esc(method)}</option>`).join('')}
function invoiceSnapshot(){
  const todayStr=new Date().toISOString().slice(0,10);
  const subtotal=state.invoiceLines.reduce((s,l)=>s+lineAmount(l),0);
  const scope=formValue('discount-scope','line');
  const allRate=Math.max(0,Number(formValue('discount-all-rate',0))||0);
  const lineDiscount=scope==='line'?state.invoiceLines.reduce((s,l)=>s+lineAmount(l)*(Number(l.discountRate||0)/100),0):0;
  const discount=scope==='all'?subtotal*allRate/100:lineDiscount;
  const lineDeposits=state.invoiceLines.reduce((s,l)=>s+Math.max(0,Number(l.deposit||0)),0);
  const paymentDeposits=state.payments.reduce((s,p)=>s+Math.max(0,Number(p.amount||0)),0);
  const pendingTotal=state.invoiceLines.reduce((s,l)=>s+Math.max(0,Number(l.pendingCollection||0)),0);
  const deposit=lineDeposits+paymentDeposits;
  const netTotal=Math.max(0,subtotal-discount);
  const autoRef=`INV-${todayStr.slice(2).replaceAll('-','')}-${Math.floor(100+Math.random()*900)}`;
  const docDate=formValue('doc-date')||todayStr;
  return{
    reference:formValue('folio')||autoRef,
    customer:formValue('customer','ลูกค้าทั่วไป'),
    checkIn:formValue('check-in')||docDate,
    checkOut:formValue('check-out')||docDate,
    nights:formValue('no-of-night','1'),
    remark:formValue('remark','-'),
    docDate,
    villa:formValue('villa',''),
    villaCode:formValue('villa-code',''),
    subtotal,
    discount,
    lineDeposits,
    paymentDeposits,
    pendingTotal,
    deposit,
    netTotal,
    outstanding:netTotal-deposit-pendingTotal,
    discountScope:scope,
    allRate
  };
}
function allocateLineAmounts(snapshot){let paid=snapshot.paymentDeposits;const rows=state.invoiceLines.map(line=>{const amount=lineAmount(line),discount=snapshot.discountScope==='line'?amount*Number(line.discountRate||0)/100:amount*(snapshot.allRate/100),afterDiscount=Math.max(0,amount-discount),lineDeposit=Math.max(0,Number(line.deposit||0)),payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid),pending=Math.max(0,Number(line.pendingCollection||0));paid-=payment;return{line,amount,discount,lineDeposit,payment,pending,deposit:lineDeposit+payment,outstanding:afterDiscount-lineDeposit-payment-pending}});if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.outstanding-=paid}return rows}
function lineRow(line,index){
  const gross=lineAmount(line),snapshot=invoiceSnapshot(),discount=snapshot.discountScope==='line'?gross*Number(line.discountRate||0)/100:snapshot.discountScope==='all'?gross*snapshot.allRate/100:0,net=Math.max(0,gross-discount);
  const defaultIn = formValue('check-in') || new Date().toISOString().slice(0,10);
  const defaultOut = formValue('check-out') || defaultIn;
  const inVal = line.checkIn || defaultIn;
  const outVal = line.checkOut || defaultOut;
  line.checkIn = inVal;
  line.checkOut = outVal;
  const splitStayBadge = line.isSplitStay ? `
    <small class="table-subtext" style="color:#7a5028;display:block;margin-top:2px;font-size:11px;">
      <span style="background:#f2e6da;color:#6b4423;font-size:9.5px;padding:1px 5px;border-radius:3px;font-weight:700;border:1px solid #d8c3b0;margin-right:4px;">พักต่อเนื่อง คืนที่ 2</span>
      ${formatDate(inVal)} → ${formatDate(outVal)}
    </small>
  ` : '';
  return `<tr><td>${esc(line.category)}</td><td><strong>${esc(line.name)}</strong>${splitStayBadge}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><select class="line-discount" data-line-index="${index}" aria-label="ส่วนลด ${esc(line.name)}">${discountRateOptions(line.discountRate)}</select></td><td class="align-right strong-number"><span>${money(net)}</span>${discount?`<small class="line-gross">เต็ม ${money(gross)}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">delete</span></button></td></tr>`;
}
function renderFormLines(){
  const a=$('#form-accommodation-lines'),b=$('#form-addon-lines');
  if(!a||!b)return;
  const indexed=state.invoiceLines.map((line,index)=>({line,index}));
  a.innerHTML=indexed.filter(x=>x.line.type==='accommodation').map(x=>lineRow(x.line,x.index)).join('');
  b.innerHTML=indexed.filter(x=>x.line.type==='addon').map(x=>lineRow(x.line,x.index)).join('');
  if($('#accommodation-empty'))$('#accommodation-empty').style.display=state.invoiceLines.some(l=>l.type==='accommodation')?'none':'block';
  if($('#addon-empty'))$('#addon-empty').style.display=state.invoiceLines.some(l=>l.type==='addon')?'none':'block';
  calculateInvoice();
  if(typeof refreshInvoiceSummaryPanel==='function')refreshInvoiceSummaryPanel();
  renderInvoicePreview();
}
function renderPayments(){const list=$('#payment-list');if(!list)return;list.innerHTML=state.payments.map((p,i)=>`<div class="payment-pill"><span class="material-symbols-outlined">${p.method==='เงินสด'?'payments':p.method==='บัตรเครดิต'?'credit_card':'qr_code_2'}</span><span>${esc(p.method)}</span><strong>${money(p.amount)}</strong><button type="button" data-payment-index="${i}" aria-label="ลบการชำระ"><span class="material-symbols-outlined">close</span></button></div>`).join('');calculateInvoice()}
function calculateInvoice(){
  const s=invoiceSnapshot();
  const displayOutstanding=s.outstandingDisplay??s.outstanding;
  [['summary-total',s.subtotal],['summary-deposit',s.deposit],['summary-discount',s.discount],['summary-outstanding',state.invoiceClosed&&displayOutstanding===0?'':displayOutstanding],['preview-total',s.subtotal],['preview-deposit',s.deposit],['preview-discount',s.discount],['preview-outstanding',state.invoiceClosed&&displayOutstanding===0?'':displayOutstanding]].forEach(([id,v])=>{
    if($(`#${id}`)) $(`#${id}`).textContent=money(v);
  });
  if(typeof refreshInvoiceSummaryPanel==='function')refreshInvoiceSummaryPanel();
  renderInvoicePreview();
}
function previewItemRows(snapshot){const groups=[{label:'Accommodation & Inclusive Package',type:'accommodation'},{label:'Food and Beverages (add-on) and Other Expenses',type:'addon'}],breakdowns=allocateLineAmounts(snapshot);return groups.map(g=>{const matches=breakdowns.filter(x=>x.line.type===g.type),lines=matches.map(x=>{const rate=snapshot.discountScope==='line'?Number(x.line.discountRate||0):snapshot.discountScope==='all'?Number(snapshot.allRate||0):0,discountLabel=rate?`<span class="invoice-discount-rate">${rate}%</span><small class="invoice-discount-amount">${money(x.discount)}</small>`:'-',totalLabel=x.pending?`<span class="invoice-pending">รอเก็บ ${money(x.pending)}</span>`:x.outstanding<0?`<span class="invoice-overpaid">${money(x.outstanding)}</span>`:state.invoiceClosed&&x.outstanding===0?'':money(x.outstanding);return`<tr><td>${esc(x.line.category)}</td><td class="align-center">${x.line.qty}</td><td>${esc(x.line.name)}</td><td class="align-right">${money(x.amount)}</td><td class="align-right">${x.deposit?money(x.deposit):'-'}</td><td class="align-right invoice-discount-cell">${discountLabel}</td><td class="align-right">${totalLabel}</td></tr>`}).join(''),count=Math.max(matches.length,g.type==='accommodation'?7:14),blanks=Array.from({length:count-matches.length},()=>'<tr class="blank-line"><td></td><td></td><td></td><td></td><td>-</td><td>-</td><td>-</td></tr>').join('');return`<tr class="bill-section-row"><td colspan="7">${g.label}</td></tr>${lines}${blanks}`}).join('')}
function renderInvoicePreview(){if(!$('#invoice-preview-sheet'))return;const s=invoiceSnapshot(),set=(id,v)=>{if($(`#${id}`))$(`#${id}`).textContent=v},methods=[...new Set([...state.invoiceLines.filter(l=>Number(l.deposit||0)>0).map(l=>l.depositMethod||'เงินสด'),...state.payments.filter(p=>Number(p.amount||0)>0).map(p=>p.method)])].join(', ')||'-';set('preview-reference',s.reference);set('preview-reference-meta',s.reference);set('preview-customer',s.customer);set('preview-check-in',formatDate(s.checkIn));set('preview-check-out',formatDate(s.checkOut));set('preview-nights',s.nights);set('preview-remark',s.remark||'-');set('preview-invoice-date',formatDate(s.docDate));set('preview-payment-method',methods);set('preview-total',money(s.subtotal));set('preview-deposit',money(s.deposit));set('preview-discount',money(s.discount));set('preview-outstanding',state.invoiceClosed&&s.outstanding===0?'':money(s.outstanding));if($('#preview-invoice-lines'))$('#preview-invoice-lines').innerHTML=previewItemRows(s)}
function fillRate(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),input=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),items=type==='accommodation'?accommodationItems:addonItems,item=items[Number(select?.value)];if(input)input.value=item?.rate||0}
function addLine(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),rateEl=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),qtyEl=type==='accommodation'?$('#accommodation-qty'):$('#addon-qty'),items=type==='accommodation'?accommodationItems:addonItems,item=items[Number(select?.value)];if(!item){showToast('กรุณาเลือกรายการก่อนเพิ่ม','error');return}state.invoiceLines.push({type,name:type==='accommodation'&&item.villa?item.villa:item.name,category:item.category,sourceIndex:Number(select.value),rate:Math.max(0,Number(rateEl?.value||0)),deposit:0,depositMethod:'เงินสด',qty:Math.max(1,Number(qtyEl?.value||1)),discountRate:0});select.value='';rateEl.value='';qtyEl.value='1';const search=$(`#${type==='accommodation'?'accommodation':'addon'}-search`);if(search)search.value='';renderFormLines();showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`)}
function closeInvoice(){
  const customer=($('#customer')?.value||'').trim();
  if(!customer){
    setInvoicePage('form');
    showToast('กรุณากรอกชื่อลูกค้าก่อนปิดยอด','error');
    $('#customer')?.focus();
    return;
  }
  openSettlementModal();
}
function exportPdf(){setInvoicePage('preview');setTimeout(()=>window.print(),80)}
function resetInvoice(){state.invoiceLines=[];state.payments=[];state.invoiceClosed=false;state.itemSearch={};const defaults={folio:'',customer:'','check-in':'','check-out':'','no-of-night':'',remark:'','doc-date':'','villa':'','villa-code':'','discount-scope':'line','discount-all-rate':'0','cashier':''};Object.entries(defaults).forEach(([id,v])=>{if($(`#${id}`))$(`#${id}`).value=v});['accommodation-rate','accommodation-qty','addon-rate','addon-qty','payment-amount'].forEach(id=>{if($(`#${id}`))$(`#${id}`).value=''});$$('.invoice-search-input').forEach(input=>input.value='');$$('.invoice-search-clear').forEach(button=>button.hidden=true);renderFormLines();renderPayments();setInvoicePage('form');showToast('เริ่มใบแจ้งหนี้ใหม่แล้ว')}
function openModal(title,body,actions='<button class="button button-primary" data-close-modal>ปิดหน้าต่าง</button>'){const root=$('#modal-root');if(!root)return;root.innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><h3>${esc(title)}</h3><button class="icon-button" data-close-modal aria-label="ปิด"><span class="material-symbols-outlined">close</span></button></div><div class="modal-body">${body}</div><div class="modal-footer">${actions}</div></div></div>`}
function wireEvents(){
  document.addEventListener('click',event=>{
    const viewTrigger=event.target.closest('[data-view]');
    if(viewTrigger){event.preventDefault();setView(viewTrigger.dataset.view);return}
    const pageTrigger=event.target.closest('[data-invoice-page]');
    if(pageTrigger){event.preventDefault();setInvoicePage(pageTrigger.dataset.invoicePage);return}
    if(event.target.closest('[data-close-modal]')){$('#modal-root').innerHTML='';return}
    const qty=event.target.closest('[data-line-index][data-qty]');
    if(qty){
      const i=Number(qty.dataset.lineIndex);
      state.invoiceLines[i].qty=Math.max(1,state.invoiceLines[i].qty+Number(qty.dataset.qty));
      renderFormLines();
      return;
    }
    const remove=event.target.closest('.remove-form-line');
    if(remove){
      state.invoiceLines.splice(Number(remove.dataset.lineIndex),1);
      renderFormLines();
      showToast('ลบรายการออกจากใบแจ้งหนี้แล้ว');
      return;
    }
    const history=event.target.closest('[data-action="detail"]');
    if(history)openModal(`รายละเอียด ${history.dataset.id}`,'<p>ใบแจ้งหนี้นี้สามารถใช้เป็นต้นทางสำหรับ Void, Adjustment หรือ Refund ได้ โดยระบบจะเก็บประวัติเดิมไว้เสมอ</p>');
  });
  document.addEventListener('click',event=>{
    const splitBtn = event.target.closest('#btn-add-split-stay-invoice');
    if(splitBtn){ event.preventDefault(); openSplitStayInvoiceModal(); return; }
    const closeSplitBtn = event.target.closest('#btn-add-close-round-split-stay');
    if(closeSplitBtn){ event.preventDefault(); openCloseRoundManualSplitModal(); return; }
    const notesBtn = event.target.closest('#btn-close-round-notes-modal');
    if(notesBtn){ event.preventDefault(); openCloseRoundNotesModal(); return; }
    const button=event.target.closest('[data-payment-index]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    state.payments.splice(Number(button.dataset.paymentIndex),1);
    renderPayments();
    showToast('ลบรายการชำระแล้ว');
  },true);

  document.addEventListener('change',event=>{
    if(event.target.classList.contains('line-in-input')){
      const idx=Number(event.target.dataset.lineIndex);
      if(state.invoiceLines[idx]){
        state.invoiceLines[idx].checkIn=event.target.value;
        calculateInvoice();
      }
    }
    if(event.target.classList.contains('line-out-input')){
      const idx=Number(event.target.dataset.lineIndex);
      if(state.invoiceLines[idx]){
        state.invoiceLines[idx].checkOut=event.target.value;
        calculateInvoice();
      }
    }
  });

  $('#open-sidebar')?.addEventListener('click',()=>$('#sidebar')?.classList.add('open'));
  $('#close-sidebar')?.addEventListener('click',()=>$('#sidebar')?.classList.remove('open'));
  $('#login-form')?.addEventListener('submit',e=>{
    e.preventDefault();
    try{
      const email=String($('#username')?.value||'').trim();
      if(email)localStorage.setItem('scenery-last-login-email',email);
    }catch{}
    $('#password').value='';
    $('#login-screen')?.classList.add('is-hidden');
    $('#app-screen')?.classList.remove('is-hidden');
    showToast('เข้าสู่ระบบสำเร็จ');
  });
  $('#toggle-password')?.addEventListener('click',()=>{
    const input=$('#password');
    if(input)input.type=input.type==='password'?'text':'password';
  });
  $('#forgot-password')?.addEventListener('click',()=>openModal('ลืมรหัสผ่าน?','<p>กรุณาติดต่อผู้ดูแลระบบหรือฝ่ายไอทีเพื่อรีเซ็ตรหัสผ่านของคุณ</p>'));
  $('#help-button')?.addEventListener('click',()=>openModal('ศูนย์ช่วยเหลือ','<p>เลือก “หน้ากรอกข้อมูล” เพื่อเริ่มสร้างใบแจ้งหนี้ และตรวจผลได้ที่ “หน้าใบแจ้งหนี้”</p>'));
  $('#add-accommodation')?.addEventListener('click',()=>addLine('accommodation'));
  $('#add-addon')?.addEventListener('click',()=>addLine('addon'));
  $('#accommodation-select')?.addEventListener('change',()=>fillRate('accommodation'));
  $('#addon-select')?.addEventListener('change',()=>fillRate('addon'));
  $('#add-payment')?.addEventListener('click',()=>{
    const amount=Number($('#payment-amount')?.value||0);
    if(amount<=0){showToast('กรุณาระบุจำนวนเงินที่รับชำระ','error');return}
    state.payments.push({method:$('#payment-method').value,amount});
    $('#payment-amount').value='';
    renderPayments();
    showToast('บันทึกรายการรับชำระแล้ว');
  });
  ['folio','customer','check-in','check-out','no-of-night','remark','doc-date','discount-scope','discount-all-rate','villa','villa-code','cashier'].forEach(id=>{
    $(`#${id}`)?.addEventListener('input',calculateInvoice);
    $(`#${id}`)?.addEventListener('change',calculateInvoice);
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('.line-rate')){
      const l=state.invoiceLines[Number(event.target.dataset.lineIndex)];
      if(l){l.rate=Math.max(0,Number(event.target.value||0));calculateInvoice()}
    }
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('.line-discount')){
      const l=state.invoiceLines[Number(event.target.dataset.lineIndex)];
      if(l){l.discountRate=Number(event.target.value||0);calculateInvoice()}
    }
  });
  $('#reset-invoice')?.addEventListener('click',resetInvoice);
  $('#export-pdf')?.addEventListener('click',exportPdf);
  $('#close-invoice')?.addEventListener('click',closeInvoice);
  $('#history-search')?.addEventListener('input',renderHistory);
  $('#global-search')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target.value.trim()){
      setView('history');
      $('#history-search').value=e.target.value.trim();
      renderHistory();
    }
  });
}

function openSplitStayInvoiceModal() {
  const currentIn = formValue('check-in') || new Date().toISOString().slice(0, 10);
  const currentOut = formValue('check-out') || addDaysToDateStr(currentIn, 1);
  const accommLines = state.invoiceLines.filter(l => l.type === 'accommodation');
  let nextIn = currentOut;
  if (accommLines.length > 0) {
    const last = accommLines[accommLines.length - 1];
    if (last.checkOut) nextIn = last.checkOut;
  }
  const nextOut = addDaysToDateStr(nextIn, 1);

  const villaOpts = CLOSE_ROUND_SOURCE_VILLAS.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

  openModal(
    'เพิ่มการพักคืนถัดไป (คนละบ้าน / Split Stay)',
    `
    <div style="font-size:13.5px;color:#554;margin-bottom:12px;">
      เพิ่มการพักหลังที่ 2 ในใบแจ้งหนี้เดียวกันสำหรับลูกค้าคนเดียวกัน
    </div>
    <form id="split-stay-form" style="display:flex;flex-direction:column;gap:12px;" onsubmit="return false;">
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">เลือก Villa หลังที่ 2</label>
        <select id="split-stay-villa" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required>
          ${villaOpts}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;">Check-in (คืนที่ 2)</label>
          <input id="split-stay-in" type="date" value="${nextIn}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;">Check-out (คืนที่ 2)</label>
          <input id="split-stay-out" type="date" value="${nextOut}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
        </div>
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">ราคาค่าห้อง (บาท)</label>
        <input id="split-stay-rate" type="number" min="0" placeholder="4500" value="4500" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
      </div>
    </form>
    `,
    `
    <button type="button" class="button button-primary" id="btn-save-split-stay-line">เพิ่มลงบิล</button>
    <button type="button" class="button button-outline" data-close-modal>ยกเลิก</button>
    `
  );

  $('#btn-save-split-stay-line')?.addEventListener('click', () => {
    const villaName = $('#split-stay-villa')?.value;
    const inDate = $('#split-stay-in')?.value;
    const outDate = $('#split-stay-out')?.value;
    const rate = Number($('#split-stay-rate')?.value || 0);

    if (!villaName || !inDate || !outDate) {
      showToast('กรุณากรอกข้อมูลบ้านพักและวันที่ให้ครบถ้วน', 'error');
      return;
    }

    state.invoiceLines.push({
      type: 'accommodation',
      name: villaName,
      villa: villaName,
      category: 'Accommodation',
      sourceIndex: null,
      rate: rate,
      deposit: 0,
      depositMethod: 'เงินสด',
      qty: 1,
      discountRate: 0,
      discountAmount: 0,
      checkIn: inDate,
      checkOut: outDate,
      isSplitStay: true,
      pendingCollection: 0,
      pendingNote: ''
    });

    const checkOutEl = $('#check-out');
    if (checkOutEl && (!checkOutEl.value || checkOutEl.value < outDate)) {
      checkOutEl.value = outDate;
    }

    renderFormLines();
    calculateInvoice();
    $('#modal-root').innerHTML = '';
    showToast(`เพิ่มการพักบ้าน "${villaName}" เรียบร้อยแล้ว`);
  });
}

function openCloseRoundManualSplitModal() {
  const date = typeof closeRoundSelectedDate === 'function' ? closeRoundSelectedDate() : new Date().toISOString().slice(0, 10);
  const invoices = typeof loadInvoiceHistory === 'function' ? loadInvoiceHistory() : [];
  const invoiceOptions = invoices.map(i => `<option value="${esc(i.id)}">${esc(i.id)} — ${esc(i.customer)} (${esc(i.villa || '-')})</option>`).join('');
  const villaOpts = CLOSE_ROUND_SOURCE_VILLAS.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

  openModal(
    'เพิ่มแถบรายการบ้านพักต่อเนื่อง (Split Stay Row ในปิดรอบ)',
    `
    <form id="close-round-split-stay-form" style="display:flex;flex-direction:column;gap:12px;" onsubmit="return false;">
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">เลือก Invoice อ้างอิง</label>
        <select id="manual-split-invoice" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;">
          <option value="">-- ไม่ระบุ หรือ ป้อนข้อมูลเอง --</option>
          ${invoiceOptions}
        </select>
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">ชื่อลูกค้า</label>
        <input id="manual-split-customer" placeholder="เช่น คุณวิมลทิพย์ ก." style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">ชื่อ Villa หลังที่ 2 (ที่พักต่อเนื่อง)</label>
        <select id="manual-split-villa" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required>
          ${villaOpts}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;">วัน Check-in (In)</label>
          <input id="manual-split-in" type="date" value="${date}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
        </div>
        <div>
          <label style="display:block;font-weight:600;margin-bottom:4px;">วัน Check-out (Out)</label>
          <input id="manual-split-out" type="date" value="${addDaysToDateStr(date, 1)}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
        </div>
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">ยอดค่าที่พัก / ยอดรวม (บาท)</label>
        <input id="manual-split-rate" type="number" min="0" placeholder="4500" value="4500" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" required />
      </div>
      <div>
        <label style="display:block;font-weight:600;margin-bottom:4px;">หมายเหตุ</label>
        <input id="manual-split-remark" placeholder="เช่น พักต่อเนื่องจากบ้าน 02 Pangola" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;" />
      </div>
    </form>
    `,
    `
    <button type="button" class="button button-primary" id="btn-save-close-round-split">บันทึกแถบรายการ</button>
    <button type="button" class="button button-outline" data-close-modal>ยกเลิก</button>
    `
  );

  $('#manual-split-invoice')?.addEventListener('change', (e) => {
    const chosenId = e.target.value;
    const found = invoices.find(i => i.id === chosenId);
    if (found) {
      if ($('#manual-split-customer')) $('#manual-split-customer').value = found.customer || '';
      if ($('#manual-split-remark')) $('#manual-split-remark').value = `พักต่อเนื่องจาก ${found.villa || 'บ้านหลัก'} (${found.id})`;
    }
  });

  $('#btn-save-close-round-split')?.addEventListener('click', () => {
    const invId = $('#manual-split-invoice')?.value;
    const customer = ($('#manual-split-customer')?.value || '').trim();
    const villa = $('#manual-split-villa')?.value;
    const inDate = $('#manual-split-in')?.value;
    const outDate = $('#manual-split-out')?.value;
    const rate = Number($('#manual-split-rate')?.value || 0);
    const remark = ($('#manual-split-remark')?.value || '').trim();

    if (!customer || !villa || !inDate || !outDate) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    saveManualSplitStay({
      id: invId || `SPLIT-${Date.now()}`,
      businessDate: date,
      customer,
      villa,
      checkIn: inDate,
      checkOut: outDate,
      rate,
      deposit: 0,
      remark,
      isSplitStay: true,
      stayIndex: 2
    });

    $('#modal-root').innerHTML = '';
    showToast(`เพิ่มแถบรายการ "${villa}" (พักต่อเนื่อง) ในรอบ ${date} แล้ว`);
    if (typeof renderCloseRound === 'function') renderCloseRound();
  });
}
let settlementRows=[],pendingCollectionRows=[];
function installDepositHeaders(){document.querySelectorAll('#view-invoice .invoice-line-group thead tr').forEach(row=>{if(row.querySelector('.deposit-column'))return;const header=document.createElement('th');header.className='deposit-column align-right';header.textContent='Deposit';row.insertBefore(header,row.children[4]||null)})}
function installSearchableItemFields(){[{id:'accommodation-select',prefix:'accommodation',type:'accommodation'},{id:'addon-select',prefix:'addon',type:'addon'}].forEach(({id,prefix,type})=>{const select=$(`#${id}`);if(!select||$(`#${prefix}-search`))return;const input=document.createElement('input');input.type='text';input.id=`${prefix}-search`;input.className='invoice-search-input';input.setAttribute('list',`${prefix}-options`);input.setAttribute('inputmode','search');input.dataset.source=id;input.autocomplete='off';input.placeholder='';const list=document.createElement('datalist');list.id=`${prefix}-options`;[...select.options].slice(1).forEach(option=>{const item=document.createElement('option');item.value=option.textContent;list.appendChild(item)});select.options[0].textContent='';select.hidden=true;select.insertAdjacentElement('beforebegin',input);select.insertAdjacentElement('afterend',list);const choose=()=>{const value=input.value.trim().toLowerCase(),option=[...select.options].slice(1).find(o=>o.textContent.trim().toLowerCase()===value);select.value=option?option.value:'';if(option){fillRate(type);select.dispatchEvent(new Event('change',{bubbles:true}))}else{const rate=$(`#${prefix}-rate`);if(rate)rate.value=''}};input.addEventListener('input',choose);input.addEventListener('change',choose)});}
function installPreviewPaymentMeta(){const meta=$('#invoice-preview-sheet .preview-meta');if(!meta||$('#preview-payment-method'))return;const guestLabel=meta.querySelector('.guest-meta span');if(guestLabel)guestLabel.textContent='Guest Name / No. of Guest';const reference=meta.children[0];if(!reference)return;const row=document.createElement('div');row.className='preview-payment-method-row';row.innerHTML='<span>Payment Method</span><strong id="preview-payment-method">-</strong>';const wrapper=document.createElement('div');wrapper.className='preview-reference-payment-row';reference.parentNode.insertBefore(wrapper,reference);wrapper.append(reference,row)}
function renderSettlementRows(){const box=$('#settlement-rows');if(!box)return;box.innerHTML=settlementRows.map((row,index)=>`<div class="settlement-row"><select data-settlement-index="${index}" data-settlement-field="method">${paymentMethodOptions(row.method)}</select><input data-settlement-index="${index}" data-settlement-field="amount" type="number" min="0" step="0.01" value="${Number(row.amount||0)}" placeholder="จำนวนเงิน"><button type="button" class="icon-button" data-settlement-remove="${index}" aria-label="ลบช่องทางชำระ"><span class="material-symbols-outlined">delete</span></button></div>`).join('')}
function renderPendingCollectionRows(){const box=$('#pending-collection-rows');if(!box)return;box.innerHTML=state.invoiceLines.map((line,index)=>{const row=pendingCollectionRows[index]||{amount:0,note:''};return`<div class="pending-collection-row"><div class="pending-collection-name"><strong>${esc(line.name)}</strong><small>${esc(line.category||'รายการ')}</small></div><input data-pending-line-index="${index}" data-pending-field="amount" type="number" min="0" step="0.01" value="${Number(row.amount||0)}" placeholder="ยอดรอเก็บ"><input data-pending-line-index="${index}" data-pending-field="note" value="${esc(row.note||'')}" placeholder="แผนก / จุดที่รอเก็บ"></div>`}).join('')||'<p class="muted">ยังไม่มีรายการสำหรับกำหนดยอดรอเก็บ</p>';box.querySelectorAll('[data-pending-line-index]').forEach(input=>input.addEventListener('input',event=>{const index=Number(event.target.dataset.pendingLineIndex),row=pendingCollectionRows[index]||(pendingCollectionRows[index]={amount:0,note:''});if(event.target.dataset.pendingField==='amount')row.amount=Math.max(0,Number(event.target.value||0));else row.note=event.target.value;updateSettlementTotal()}))}
function staffDisplayName(raw){
  if(!raw)return'Now Narit';
  const str=String(raw).trim();
  if(!str)return'Now Narit';
  if(!str.includes('@')){
    if(['cashier','receptionist','user','staff','admin'].includes(str.toLowerCase()))return'Now Narit';
    return str;
  }
  const emailLower=str.toLowerCase();
  const emailMap={
    'h.adv.scenery@gmail.com':'Now Narit',
    'now@thescenery.co':'Now Narit',
    'narit@thescenery.co':'Now Narit',
    'mhew@thescenery.co':'Mhew Kusu',
    'kusu@thescenery.co':'Mhew Kusu',
    'nattaya@thescenery.co':'Nattaya Phung',
    'phung@thescenery.co':'Nattaya Phung',
    'nummim@thescenery.co':'Nummim',
    'ple@thescenery.co':'Ple Theresa',
    'theresa@thescenery.co':'Ple Theresa',
    'somchai@thescenery.co':'Somchai R.',
    'somchai@thesceneryresort.com':'Somchai R.',
    'rungarun@thescenery.co':'Rungarun S.',
    'kittipong@thescenery.co':'Kittipong T.',
    'admin@thescenery.co':'Now Narit'
  };
  if(emailMap[emailLower])return emailMap[emailLower];
  const usernamePart=str.split('@')[0];
  const cleaned=usernamePart.replace(/[._-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  return cleaned||'Now Narit';
}
window.staffDisplayName=staffDisplayName;

function openSettlementModal(){
  const s=invoiceSnapshot();
  settlementRows=state.payments.length?state.payments.map(p=>({...p})): [{method:'เงินสด',amount:s.netTotal||0}];
  pendingCollectionRows=state.invoiceLines.map(line=>({amount:Number(line.pendingCollection||0),note:line.pendingNote||''}));
  const root=$('#modal-root');if(!root)return;
  root.innerHTML=`<div class="modal-backdrop"><div class="modal settlement-modal" role="dialog" aria-modal="true"><div class="modal-header"><h3>ยืนยันการชำระเงินและปิดยอด (${esc(s.customer)})</h3><button class="icon-button" data-close-modal aria-label="ปิด"><span class="material-symbols-outlined">close</span></button></div><div class="modal-body"><p class="muted">แยกช่องทางและจำนวนเงินที่ลูกค้าชำระได้หลายรายการ</p><div id="settlement-rows"></div><button type="button" class="button button-soft full-width" data-settlement-add><span class="material-symbols-outlined">add</span>เพิ่มช่องทางชำระ</button><section class="pending-collection-section"><div class="pending-collection-heading"><strong>ยอดรอเก็บจากแผนก / จุดอื่น</strong><small>ระบุรายการที่ปิดงานได้โดยยังรอเก็บจากจุดอื่น</small></div><div id="pending-collection-rows"></div></section><label class="settlement-slip">หลักฐานการชำระเงิน<input id="settlement-slip" type="file" accept="image/*,.pdf"></label><label class="settlement-preparer">ผู้จัดทำ / ผู้ปิดงาน <b class="required-note" style="color:var(--danger,#d32f2f)">*</b><input id="settlement-preparer" value="" list="preparer-options" placeholder="เลือกหรือพิมพ์ชื่อผู้จัดทำ" autocomplete="off" required><datalist id="preparer-options"><option value="Now Narit"><option value="Mhew Kusu"><option value="Nattaya Phung"><option value="Nummim"><option value="Ple Theresa"></datalist></label><p id="settlement-total" class="settlement-total"></p></div><div class="modal-footer"><button class="button button-outline" type="button" data-close-modal>ยกเลิก</button><button class="button button-primary" type="button" data-settlement-confirm>ปิดยอดและบันทึกรอบ</button></div></div></div>`;
  renderSettlementRows();renderPendingCollectionRows();updateSettlementTotal();
}
function updateSettlementTotal(){const el=$('#settlement-total');if(el){const paid=settlementRows.reduce((s,row)=>s+Math.max(0,Number(row.amount||0)),0),pending=pendingCollectionRows.reduce((s,row)=>s+Math.max(0,Number(row.amount||0)),0);el.innerHTML=`รวมชำระ ${money(paid)} <span>• ยอดรอเก็บ ${money(pending)}</span>`}}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
async function finalizeInvoice(){
  const enteredPreparer=($('#settlement-preparer')?.value||'').trim();
  if(!enteredPreparer){
    showToast('กรุณาระบุชื่อผู้จัดทำ / ผู้ปิดงาน','error');
    $('#settlement-preparer')?.focus();
    return;
  }
  const preparer=staffDisplayName(enteredPreparer);
  const file=$('#settlement-slip')?.files?.[0];let proof=null;
  if(file){
    if(file.size>4*1024*1024){showToast('ไฟล์สลิปต้องมีขนาดไม่เกิน 4 MB','error');return}
    try{proof={name:file.name,size:file.size,type:file.type,data:await fileToDataUrl(file)}}catch{showToast('อ่านไฟล์สลิปไม่สำเร็จ','error');return}
  }
  const previousPending=state.invoiceLines.map(line=>({pendingCollection:line.pendingCollection,pendingNote:line.pendingNote}));
  state.payments=settlementRows.filter(row=>Number(row.amount||0)>0).map(row=>({method:row.method,amount:Number(row.amount||0)}));
  const pendingCollections=pendingCollectionRows.map((row,index)=>({lineIndex:index,amount:Math.max(0,Number(row.amount||0)),note:String(row.note||'').trim()}));
  state.invoiceLines.forEach((line,index)=>{line.pendingCollection=pendingCollections[index]?.amount||0;line.pendingNote=pendingCollections[index]?.note||''});
  const s=invoiceSnapshot();
  state.invoiceClosed=true;
  const record={
    reference:s.reference,
    id:s.reference,
    customer:s.customer,
    villa:s.villa,
    docDate:s.docDate,
    businessDate:s.docDate,
    checkIn:s.checkIn,
    checkOut:s.checkOut,
    nights:s.nights,
    remark:s.remark,
    total:s.subtotal,
    discount:s.discount,
    deposit:s.deposit,
    pendingTotal:s.pendingTotal,
    pendingCollections:pendingCollections.filter(row=>row.amount>0),
    preparer,
    cashier:preparer,
    closedAt:new Date().toLocaleString('th-TH'),
    proof,
    lines:state.invoiceLines.map(l=>({...l})),
    payments:state.payments.map(p=>({...p}))
  };
  state.closedBookings.unshift(record);
  saveClosedBookings();
  state.invoices.unshift({id:s.reference,customer:s.customer,time:'เมื่อสักครู่',total:s.subtotal,status:'ชำระแล้ว',statusClass:'status-paid'});
  renderDashboard();renderBookingRecords();$('#modal-root').innerHTML='';calculateInvoice();setInvoicePage('preview');
  showToast(`บันทึกใบแจ้งหนี้ ${s.reference} (${s.customer}) และลงตารางปิดรอบแล้ว`);
  if(typeof renderCloseRound==='function')renderCloseRound();
}
function loadInvoiceDrafts(){try{return JSON.parse(localStorage.getItem('scenery-invoice-drafts')||'[]')}catch{return[]}}
function saveInvoiceDraft(){const drafts=loadInvoiceDrafts(),fields={};['folio','customer','check-in','check-out','no-of-night','remark','doc-date','discount-scope','discount-all-rate','villa','cashier'].forEach(id=>{if($(`#${id}`))fields[id]=$(`#${id}`).value});drafts.unshift({id:`DF-${Date.now()}`,reference:fields.folio||'-',customer:fields.customer||'-',savedAt:new Date().toLocaleString('th-TH'),fields,lines:state.invoiceLines.map(l=>({...l})),payments:state.payments.map(p=>({...p}))});try{localStorage.setItem('scenery-invoice-drafts',JSON.stringify(drafts.slice(0,50)));showToast('บันทึกใบแจ้งหนี้แบบร่างแล้ว')}catch{showToast('บันทึกแบบร่างไม่สำเร็จ','error')}}
function loadInvoiceDraft(index){const draft=loadInvoiceDrafts()[Number(index)];if(!draft)return;Object.entries(draft.fields||{}).forEach(([id,value])=>{if($(`#${id}`))$(`#${id}`).value=value});state.invoiceLines=(draft.lines||[]).map(l=>({...l,depositMethod:l.depositMethod||'เงินสด'}));state.payments=(draft.payments||[]).map(p=>({...p}));state.invoiceClosed=false;state.closedInvoiceSnapshot=null;state.pendingCollectionTotal=0;state.pendingCollectionNote='';$$('.invoice-search-input').forEach(input=>{const select=$(`#${input.dataset.source}`),option=[...select.options].find(o=>o.value===String(state.invoiceLines.find(l=>l.type===(input.dataset.source==='accommodation-select'?'accommodation':'addon'))?.sourceIndex||''));if(option)input.value=option.textContent});$('#modal-root').innerHTML='';renderFormLines();renderPayments();setInvoicePage('form');showToast('เปิดแบบร่างแล้ว')}
function openDraftPicker(){const drafts=loadInvoiceDrafts(),body=drafts.length?`<div class="draft-picker-list">${drafts.map((draft,index)=>`<div class="draft-picker-row"><div><strong>${esc(draft.reference)}</strong><small>${esc(draft.customer)} · ${esc(draft.savedAt)}</small></div><button class="button button-outline action-small" type="button" data-draft-load="${index}">เปิด</button><button class="icon-button" type="button" data-draft-delete="${index}" aria-label="ลบแบบร่าง"><span class="material-symbols-outlined">delete</span></button></div>`).join('')}</div>`:'<div class="empty-state"><p>ยังไม่มีแบบร่าง</p><small>บันทึกข้อมูลไว้เพื่อกลับมาเพิ่มรายการภายหลัง</small></div>';openModal('แบบร่างใบแจ้งหนี้',body,'<button class="button button-outline" data-close-modal>ปิด</button>')}
function installInvoiceTools(){const actions=$('#view-invoice .heading-actions');if(!actions||$('#save-invoice-draft'))return;const save=document.createElement('button');save.id='save-invoice-draft';save.type='button';save.className='button button-soft';save.innerHTML='<span class="material-symbols-outlined">save</span>บันทึกแบบร่าง';const open=document.createElement('button');open.id='open-invoice-drafts';open.type='button';open.className='button button-outline';open.innerHTML='<span class="material-symbols-outlined">folder_open</span>แบบร่าง';actions.insertBefore(save,actions.firstChild);actions.insertBefore(open,actions.children[1]||null);save.addEventListener('click',saveInvoiceDraft);open.addEventListener('click',openDraftPicker)}
buildInvoiceWorkspace();installDepositHeaders();installSearchableItemFields();installPreviewPaymentMeta();installInvoiceTools();state.invoiceClosed=false;document.addEventListener('input',event=>{if(event.target.matches('.line-deposit')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line){line.deposit=Math.max(0,Number(event.target.value||0));calculateInvoice()}}if(event.target.matches('[data-settlement-index][data-settlement-field="amount"]')){settlementRows[Number(event.target.dataset.settlementIndex)].amount=Number(event.target.value||0);updateSettlementTotal()}});document.addEventListener('change',event=>{if(event.target.matches('.line-deposit-method')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line)line.depositMethod=event.target.value;renderInvoicePreview()}if(event.target.matches('[data-settlement-index][data-settlement-field="method"]')){settlementRows[Number(event.target.dataset.settlementIndex)].method=event.target.value;updateSettlementTotal()}});document.addEventListener('click',event=>{const remove=event.target.closest('.remove-form-line');if(!remove)return;event.preventDefault();event.stopPropagation();const index=Number(remove.dataset.lineIndex);if(!Number.isInteger(index)||!state.invoiceLines[index])return;state.invoiceLines.splice(index,1);renderFormLines();showToast('ลบรายการออกจากใบแจ้งหนี้แล้ว')},true);document.addEventListener('click',event=>{const addSettlement=event.target.closest('[data-settlement-add]');if(addSettlement){event.preventDefault();settlementRows.push({method:'เงินสด',amount:0});renderSettlementRows();updateSettlementTotal();return}const removeSettlement=event.target.closest('[data-settlement-remove]');if(removeSettlement){event.preventDefault();settlementRows.splice(Number(removeSettlement.dataset.settlementRemove),1);if(!settlementRows.length)settlementRows.push({method:'เงินสด',amount:0});renderSettlementRows();updateSettlementTotal();return}if(event.target.closest('[data-settlement-confirm]')){event.preventDefault();finalizeInvoice();return}const loadDraft=event.target.closest('[data-draft-load]');if(loadDraft){event.preventDefault();loadInvoiceDraft(loadDraft.dataset.draftLoad);return}const deleteDraft=event.target.closest('[data-draft-delete]');if(deleteDraft){event.preventDefault();const drafts=loadInvoiceDrafts();drafts.splice(Number(deleteDraft.dataset.draftDelete),1);localStorage.setItem('scenery-invoice-drafts',JSON.stringify(drafts));openDraftPicker()}});document.addEventListener('DOMContentLoaded',()=>{renderDashboard();renderHistory();renderBookingRecords();renderFormLines();renderPayments();wireEvents()});

function roundMetricValue(index){const value=$$('#view-close-round .round-metrics article')[index]?.querySelector('strong')?.textContent||'0';return Number(value.replace(/[^0-9.-]/g,''))||0}
function loadClosedRounds(){try{return JSON.parse(localStorage.getItem('scenery-closed-rounds')||'[]')}catch{return[]}}
function submitCloseRound(){const date=$('#view-close-round input[type="date"]')?.value||new Date().toISOString().slice(0,10),rounds=loadClosedRounds();if(closeRoundIsLocked(date)){showToast('รอบวันนี้ถูก Submit และ Lock แล้ว','error');return}const record={id:`CR-${date.replaceAll('-','')}-${Date.now()}`,businessDate:date,status:'Submitted',submittedAt:new Date().toISOString(),totals:{sales:roundMetricValue(0),deposit:roundMetricValue(1),outstanding:roundMetricValue(2),difference:roundMetricValue(3)}};try{localStorage.setItem('scenery-closed-rounds',JSON.stringify([record,...rounds].slice(0,90)))}catch{showToast('บันทึกสถานะปิดรอบไม่สำเร็จ','error');return}recordAudit('Submit และ Lock','Close Round',record.id,null,record,{reason:`ปิดรอบ Business Date ${date}`});$('#modal-root').innerHTML='';const button=$('#submit-round');if(button){button.disabled=true;button.innerHTML='<span class="material-symbols-outlined">lock</span>รอบถูกล็อกแล้ว'}renderCloseRound();showToast(`Submit และ Lock รอบ ${date} สำเร็จ`)}
document.addEventListener('DOMContentLoaded',()=>{const button=$('#submit-round');if(!button)return;const date=$('#view-close-round input[type="date"]')?.value||new Date().toISOString().slice(0,10);if(loadClosedRounds().some(round=>round.businessDate===date&&round.status==='Submitted')){button.disabled=true;button.innerHTML='<span class="material-symbols-outlined">lock</span>รอบถูกล็อกแล้ว'}button.addEventListener('click',()=>openModal('ยืนยัน Submit และ Lock รอบ','<p>เมื่อยืนยันแล้ว รอบนี้จะถูกล็อกและไม่ควรแก้ไขรายการย้อนหลังโดยตรง</p><p class="muted">กรุณาตรวจสอบยอดค้างชำระและรายการผิดปกติก่อนส่งฝ่ายบัญชี</p>','<button class="button button-outline" data-close-modal>ยกเลิก</button><button class="button button-primary" data-submit-round>ยืนยัน Submit และ Lock</button>'));document.addEventListener('click',event=>{if(event.target.closest('[data-submit-round]')){event.preventDefault();submitCloseRound()}})});

function enhanceInvoiceWorkspace(){
  const discountRate=$('#discount-all-rate');
  if(discountRate){const input=document.createElement('input');input.id='discount-all-rate';input.type='number';input.min='0';input.step='0.01';input.value=discountRate.value||'0';input.placeholder='ส่วนลดเป็นยอดเงิน';input.setAttribute('aria-label','ส่วนลดทั้งบิลเป็นยอดเงิน');discountRate.replaceWith(input);const label=input.closest('label');if(label)label.firstChild.textContent='ส่วนลดทั้งบิล (Baht) ';input.addEventListener('input',calculateInvoice)}
  $$('#view-invoice .invoice-line-group th').forEach(th=>{if(th.textContent.trim()==='ส่วนลด')th.textContent='ส่วนลด (Baht)'})
  $$('#villa option').forEach(option=>{option.textContent=cleanEnglishText(option.textContent)})
  const nightsInput=$('#no-of-night');if(nightsInput?.parentElement)nightsInput.parentElement.firstChild.textContent='No. of Nights ';
  const guestMeta=$('#invoice-preview-sheet .guest-meta span');if(guestMeta)guestMeta.textContent='Guest Name / No. of Guests';
  $$('.invoice-search-input').forEach(input=>{input.placeholder='ค้นหาหรือพิมพ์รายการใหม่';input.setAttribute('aria-label','ค้นหาหรือเพิ่มรายการใหม่')})
  const adjustments=$('#view-invoice .invoice-adjustments');
  if(adjustments&&!$('#pending-form-section'))adjustments.insertAdjacentHTML('beforeend','<section id="pending-form-section" class="pending-form-section"><div class="line-group-heading"><strong>หมายเหตุในการรอเรียกเก็บ</strong><small>ระบุยอดและจุดที่ต้องติดตาม ยอดนี้จะแสดงในรายการใบแจ้งหนี้และท้ายใบแจ้งหนี้</small></div><div id="pending-form-rows"></div></section>');
  const footer=$('#invoice-preview-sheet .preview-footer');
  if(footer&&!$('#preview-pending-notes'))footer.insertAdjacentHTML('afterbegin','<section id="preview-pending-notes" class="preview-pending-notes" aria-label="หมายเหตุในการรอเรียกเก็บ"></section>');
  $$('#invoice-preview-sheet .preview-meta span').forEach(span=>{if(span.textContent.trim()==='No. Of Night')span.textContent='No. of Nights'});

  invoiceSnapshot=function(){const subtotal=state.invoiceLines.reduce((sum,line)=>sum+lineAmount(line),0),scope=formValue('discount-scope','line'),lineDiscount=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.discountAmount||0)),0),allDiscount=Math.max(0,Number(formValue('discount-all-rate',0))||0),discount=scope==='none'?0:scope==='all'?Math.min(subtotal,allDiscount):Math.min(subtotal,lineDiscount),lineDeposits=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.deposit||0)),0),paymentDeposits=state.payments.reduce((sum,payment)=>sum+Math.max(0,Number(payment.amount||0)),0),pendingTotal=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.pendingCollection||0)),0),deposit=lineDeposits+paymentDeposits,netTotal=Math.max(0,subtotal-discount);return{reference:formValue('folio','INV-260717-085'),customer:formValue('customer','-'),checkIn:formValue('check-in'),checkOut:formValue('check-out'),nights:formValue('no-of-night','1'),remark:formValue('remark','-'),docDate:formValue('doc-date'),villa:formValue('villa',''),subtotal,discount,lineDeposits,paymentDeposits,pendingTotal,deposit,netTotal,outstanding:netTotal-deposit-pendingTotal,discountScope:scope,allAmount:allDiscount}}
  allocateLineAmounts=function(snapshot){let paid=snapshot.paymentDeposits;const rows=state.invoiceLines.map(line=>{const amount=lineAmount(line),discount=snapshot.discountScope==='line'?Math.min(amount,Math.max(0,Number(line.discountAmount||0))):snapshot.discountScope==='all'&&snapshot.subtotal?amount*(snapshot.discount/snapshot.subtotal):0,afterDiscount=Math.max(0,amount-discount),lineDeposit=Math.max(0,Number(line.deposit||0)),payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid),pending=Math.max(0,Number(line.pendingCollection||0)),unpaid=Math.max(0,afterDiscount-lineDeposit-payment);paid-=payment;return{line,amount,discount,lineDeposit,payment,pending,deposit:lineDeposit+payment,unpaid,outstanding:unpaid-pending}});if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.unpaid-=paid;last.outstanding-=paid}return rows}
  lineRow=function(line,index){const gross=lineAmount(line),discount=Math.min(gross,Math.max(0,Number(line.discountAmount||0))),net=Math.max(0,gross-discount);return`<tr><td>${esc(line.category)}</td><td>${esc(line.name)}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><input class="line-discount" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.discountAmount||0)}" placeholder="ยอดเงิน" aria-label="ส่วนลดเป็นยอดเงิน ${esc(line.name)}"></td><td class="align-right strong-number"><span>${money(net)}</span>${discount?`<small class="line-gross">ก่อนหัก ${money(gross)}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">close</span></button></td></tr>`}
  const originalRenderFormLines=renderFormLines;renderFormLines=function(){originalRenderFormLines();renderPendingFormRows()}
  renderPendingFormRows=function(){const box=$('#pending-form-rows');if(!box)return;box.innerHTML=state.invoiceLines.map((line,index)=>`<div class="pending-form-row"><strong>${esc(line.name)}</strong><input class="form-pending-amount" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.pendingCollection||0)}" placeholder="ยอดรอเรียกเก็บ"><input class="form-pending-note" data-line-index="${index}" value="${esc(line.pendingNote||'')}" placeholder="หมายเหตุ / แผนก / จุดที่รอเก็บ"></div>`).join('')||'<p class="muted">เพิ่มรายการก่อนระบุยอดรอเรียกเก็บ</p>'}
  addLine=function(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),search=$(`#${type==='accommodation'?'accommodation':'addon'}-search`),rateEl=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),qtyEl=type==='accommodation'?$('#accommodation-qty'):$('#addon-qty'),items=type==='accommodation'?accommodationItems:addonItems,selected=items[Number(select?.value)],typed=cleanEnglishText(search?.value?.trim()||''),item=selected||(!typed?null:{name:typed,category:type==='accommodation'?'Accommodation':'Miscellaneous',rate:Math.max(0,Number(rateEl?.value||0)),custom:true});if(!item){showToast('กรุณาเลือกรายการหรือพิมพ์รายการใหม่ก่อนเพิ่ม','error');return}state.invoiceLines.push({type,name:item.name,category:item.category,sourceIndex:selected?Number(select.value):null,rate:Math.max(0,Number(rateEl?.value||item.rate||0)),deposit:0,depositMethod:'เงินสด',qty:Math.max(1,Number(qtyEl?.value||1)),discountAmount:0,pendingCollection:0,pendingNote:''});if(select)select.value='';if(rateEl)rateEl.value='';if(qtyEl)qtyEl.value='1';if(search)search.value='';renderFormLines();showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`)}
  fillRate=function(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),input=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),items=type==='accommodation'?accommodationItems:addonItems,item=items[Number(select?.value)];if(input&&item)input.value=item.rate||0}
  previewItemRows=function(snapshot){const groups=[{label:'Accommodation & Inclusive Package',type:'accommodation'},{label:'Food and Beverages (add-on) and Other Expenses',type:'addon'}],breakdowns=allocateLineAmounts(snapshot);return groups.map(group=>{const matches=breakdowns.filter(row=>row.line.type===group.type),lines=matches.map(row=>{const discountLabel=row.discount?money(row.discount):'-',totalLabel=row.unpaid<0?`<span class="invoice-overpaid">${money(row.unpaid)}</span>`:money(row.unpaid);return`<tr><td>${esc(row.line.category)}</td><td class="align-center">${row.line.qty}</td><td>${esc(row.line.name)}</td><td class="align-right">${money(row.amount)}</td><td class="align-right">${row.deposit?money(row.deposit):'-'}</td><td class="align-right invoice-discount-cell">${discountLabel}</td><td class="align-right">${totalLabel}</td></tr>`}).join(''),count=Math.max(matches.length,group.type==='accommodation'?7:14),blanks=Array.from({length:count-matches.length},()=>'<tr class="blank-line"><td></td><td></td><td></td><td></td><td>-</td><td>-</td><td>-</td></tr>').join('');return`<tr class="bill-section-row"><td colspan="7">${group.label}</td></tr>${lines}${blanks}`}).join('')}
  renderInvoicePreview=function(){if(!$('#invoice-preview-sheet'))return;const s=invoiceSnapshot(),set=(id,value)=>{if($(`#${id}`))$(`#${id}`).textContent=value},methods=[...new Set([...state.invoiceLines.filter(line=>Number(line.deposit||0)>0).map(line=>line.depositMethod||'เงินสด'),...state.payments.filter(payment=>Number(payment.amount||0)>0).map(payment=>payment.method)])].join(', ')||'-';set('preview-reference',s.reference);set('preview-reference-meta',s.reference);set('preview-customer',s.customer);set('preview-check-in',formatDate(s.checkIn));set('preview-check-out',formatDate(s.checkOut));set('preview-nights',s.nights);set('preview-remark',s.remark||'-');set('preview-invoice-date',formatDate(s.docDate));set('preview-payment-method',methods);set('preview-total',money(s.subtotal));set('preview-deposit',money(s.deposit));set('preview-discount',money(s.discount));set('preview-outstanding',state.invoiceClosed&&s.outstanding===0?'':money(s.outstanding));const noteBox=$('#preview-pending-notes');if(noteBox){const noteLines=state.invoiceLines.filter(line=>String(line.pendingNote||'').trim()),notes=noteLines.map(line=>`<div><strong>${esc(line.name)}</strong><span>${esc(line.pendingNote)}</span></div>`).join('');noteBox.innerHTML=notes;noteBox.classList.toggle('long-note',noteLines.some(line=>String(line.pendingNote||'').length>90));const previewFooter=noteBox.closest('.preview-footer');if(previewFooter)previewFooter.classList.toggle('has-pending-notes',Boolean(notes))}if($('#preview-invoice-lines'))$('#preview-invoice-lines').innerHTML=previewItemRows(s)}
  renderPendingFormRows();renderFormLines();renderInvoicePreview()
}
document.addEventListener('DOMContentLoaded',()=>{enhanceInvoiceWorkspace();document.addEventListener('input',event=>{if(event.target.matches('.line-discount')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line){line.discountAmount=Math.max(0,Number(event.target.value||0));calculateInvoice()}}if(event.target.matches('.form-pending-amount,.form-pending-note')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line){if(event.target.matches('.form-pending-amount'))line.pendingCollection=Math.max(0,Number(event.target.value||0));else line.pendingNote=event.target.value;calculateInvoice()}}})});

function switchLineDiscountToPercent(){
  $$('#view-invoice .invoice-line-group th').forEach(th=>{if(th.textContent.trim()==='ส่วนลด (Baht)'||th.textContent.trim()==='ส่วนลด')th.textContent='ส่วนลด (%)'})
  invoiceSnapshot=function(){const subtotal=state.invoiceLines.reduce((sum,line)=>sum+lineAmount(line),0),scope=formValue('discount-scope','line'),lineDiscount=state.invoiceLines.reduce((sum,line)=>sum+lineAmount(line)*(Math.min(100,Math.max(0,Number(line.discountRate||0)))/100),0),allDiscount=Math.max(0,Number(formValue('discount-all-rate',0))||0),discount=scope==='none'?0:scope==='all'?Math.min(subtotal,allDiscount):Math.min(subtotal,lineDiscount),lineDeposits=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.deposit||0)),0),paymentDeposits=state.payments.reduce((sum,payment)=>sum+Math.max(0,Number(payment.amount||0)),0),pendingTotal=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.pendingCollection||0)),0),deposit=lineDeposits+paymentDeposits,netTotal=Math.max(0,subtotal-discount);return{reference:formValue('folio','INV-260717-085'),customer:formValue('customer','-'),checkIn:formValue('check-in'),checkOut:formValue('check-out'),nights:formValue('no-of-night','1'),remark:formValue('remark','-'),docDate:formValue('doc-date'),villa:formValue('villa',''),subtotal,discount,lineDeposits,paymentDeposits,pendingTotal,deposit,netTotal,outstanding:netTotal-deposit-pendingTotal,discountScope:scope,allAmount:allDiscount}}
  allocateLineAmounts=function(snapshot){let paid=snapshot.paymentDeposits;const rows=state.invoiceLines.map(line=>{const amount=lineAmount(line),rate=Math.min(100,Math.max(0,Number(line.discountRate||0))),discount=snapshot.discountScope==='line'?amount*rate/100:snapshot.discountScope==='all'&&snapshot.subtotal?amount*(snapshot.discount/snapshot.subtotal):0,afterDiscount=Math.max(0,amount-discount),lineDeposit=Math.max(0,Number(line.deposit||0)),payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid),pending=Math.max(0,Number(line.pendingCollection||0)),unpaid=Math.max(0,afterDiscount-lineDeposit-payment);paid-=payment;return{line,amount,discount,lineDeposit,payment,pending,deposit:lineDeposit+payment,unpaid,outstanding:unpaid-pending}});if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.unpaid-=paid;last.outstanding-=paid}return rows}
  lineRow=function(line,index){const gross=lineAmount(line),rate=Math.min(100,Math.max(0,Number(line.discountRate||0))),snapshot=invoiceSnapshot(),discount=snapshot.discountScope==='line'?gross*rate/100:snapshot.discountScope==='all'&&snapshot.subtotal?gross*(snapshot.discount/snapshot.subtotal):0,net=Math.max(0,gross-discount);return`<tr><td>${esc(line.category)}</td><td>${esc(line.name)}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><div class="discount-input-wrap"><input class="line-discount" data-line-index="${index}" type="number" min="0" max="100" step="0.01" value="${rate}" placeholder="%" aria-label="ส่วนลดเปอร์เซ็นต์ ${esc(line.name)}"><span>%</span></div></td><td class="align-right strong-number"><span>${money(net)}</span>${discount?`<small class="line-gross">ก่อนหัก ${money(gross)}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">close</span></button></td></tr>`}
  addLine=function(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),search=$(`#${type==='accommodation'?'accommodation':'addon'}-search`),rateEl=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),qtyEl=type==='accommodation'?$('#accommodation-qty'):$('#addon-qty'),items=type==='accommodation'?accommodationItems:addonItems,selected=items[Number(select?.value)],typed=cleanEnglishText(search?.value?.trim()||''),item=selected||(!typed?null:{name:typed,category:type==='accommodation'?'Accommodation':'Miscellaneous',rate:Math.max(0,Number(rateEl?.value||0)),custom:true});if(!item){showToast('กรุณาเลือกรายการหรือพิมพ์รายการใหม่ก่อนเพิ่ม','error');return}state.invoiceLines.push({type,name:item.name,category:item.category,sourceIndex:selected?Number(select.value):null,rate:Math.max(0,Number(rateEl?.value||item.rate||0)),deposit:0,depositMethod:'เงินสด',qty:Math.max(1,Number(qtyEl?.value||1)),discountRate:0,pendingCollection:0,pendingNote:''});if(select)select.value='';if(rateEl)rateEl.value='';if(qtyEl)qtyEl.value='1';if(search)search.value='';renderFormLines();showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`)}
  document.addEventListener('input',event=>{if(event.target.matches('.line-discount')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line){line.discountRate=Math.min(100,Math.max(0,Number(event.target.value||0)));calculateInvoice()}}})
  renderInvoicePreview();renderFormLines()
}
document.addEventListener('DOMContentLoaded',()=>switchLineDiscountToPercent());

function enableDualLineDiscount(){
  const clampRate=value=>Math.min(100,Math.max(0,Number(value||0))),fixedDiscount=line=>Math.max(0,Number(line.discountAmount||0)),lineDiscount=(line,amount,snapshot)=>snapshot.discountScope==='line'?Math.min(amount,amount*clampRate(line.discountRate)/100+fixedDiscount(line)):snapshot.discountScope==='all'&&snapshot.subtotal?amount*(snapshot.discount/snapshot.subtotal):0;
  $$('#view-invoice .invoice-line-group th').forEach(th=>{if(th.textContent.includes('ส่วนลด'))th.textContent='ส่วนลด (% / Baht)'})
  invoiceSnapshot=function(){const subtotal=state.invoiceLines.reduce((sum,line)=>sum+lineAmount(line),0),scope=formValue('discount-scope','line'),lineDiscountTotal=state.invoiceLines.reduce((sum,line)=>sum+lineDiscount(line,lineAmount(line),{discountScope:'line'}),0),allDiscount=Math.max(0,Number(formValue('discount-all-rate',0))||0),discount=scope==='none'?0:scope==='all'?Math.min(subtotal,allDiscount):Math.min(subtotal,lineDiscountTotal),lineDeposits=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.deposit||0)),0),paymentDeposits=state.payments.reduce((sum,payment)=>sum+Math.max(0,Number(payment.amount||0)),0),pendingTotal=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.pendingCollection||0)),0),deposit=lineDeposits+paymentDeposits,netTotal=Math.max(0,subtotal-discount);return{reference:formValue('folio','INV-260717-085'),customer:formValue('customer','-'),checkIn:formValue('check-in'),checkOut:formValue('check-out'),nights:formValue('no-of-night','1'),remark:formValue('remark','-'),docDate:formValue('doc-date'),villa:formValue('villa',''),subtotal,discount,lineDeposits,paymentDeposits,pendingTotal,deposit,netTotal,outstanding:netTotal-deposit-pendingTotal,discountScope:scope,allAmount:allDiscount}}
  const dualDiscountSnapshot=invoiceSnapshot;
  invoiceSnapshot=function(){const snapshot=dualDiscountSnapshot();if(snapshot.discountScope!=='all')return snapshot;const rate=Math.min(100,Math.max(0,Number(snapshot.allAmount||0))),discount=Math.min(snapshot.subtotal,snapshot.subtotal*rate/100),netTotal=Math.max(0,snapshot.subtotal-discount);return {...snapshot,discount,netTotal,outstanding:netTotal-snapshot.deposit-snapshot.pendingTotal}}
  allocateLineAmounts=function(snapshot){let paid=snapshot.paymentDeposits;const rows=state.invoiceLines.map(line=>{const amount=lineAmount(line),discount=lineDiscount(line,amount,snapshot),afterDiscount=Math.max(0,amount-discount),lineDeposit=Math.max(0,Number(line.deposit||0)),payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid),pending=Math.max(0,Number(line.pendingCollection||0)),unpaid=Math.max(0,afterDiscount-lineDeposit-payment);paid-=payment;return{line,amount,discount,lineDeposit,payment,pending,deposit:lineDeposit+payment,unpaid,outstanding:unpaid-pending}});if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.unpaid-=paid;last.outstanding-=paid}return rows}
  lineRow=function(line,index){const gross=lineAmount(line),rate=clampRate(line.discountRate),fixed=fixedDiscount(line),snapshot=invoiceSnapshot(),discount=lineDiscount(line,gross,snapshot),net=Math.max(0,gross-discount);return`<tr><td>${esc(line.category)}</td><td>${esc(line.name)}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><div class="line-discount-fields"><label class="line-discount-field"><input class="line-discount-rate" data-line-index="${index}" type="number" min="0" max="100" step="0.01" value="${rate}" placeholder="0" aria-label="ส่วนลดเปอร์เซ็นต์ ${esc(line.name)}"><span>%</span></label><label class="line-discount-field"><input class="line-discount-amount" data-line-index="${index}" type="number" min="0" step="0.01" value="${fixed}" placeholder="0" aria-label="ส่วนลดเป็นเงิน ${esc(line.name)}"><span>Baht</span></label></div></td><td class="align-right strong-number"><span>${money(net)}</span>${discount?`<small class="line-gross">ก่อนหัก ${money(gross)}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">close</span></button></td></tr>`}
  previewItemRows=function(snapshot){const groups=[{label:'Accommodation & Inclusive Package',type:'accommodation'},{label:'Food and Beverages (add-on) and Other Expenses',type:'addon'}],breakdowns=allocateLineAmounts(snapshot);return groups.map(group=>{const matches=breakdowns.filter(row=>row.line.type===group.type),lines=matches.map(row=>{const rate=clampRate(row.line.discountRate),fixed=fixedDiscount(row.line),discountParts=[];if(rate)discountParts.push(`${rate}%`);if(fixed)discountParts.push(money(fixed));const discountLabel=discountParts.length?`${discountParts.join(' + ')}<small class="invoice-discount-amount">${money(row.discount)}</small>`:'-',totalLabel=row.pending?`<span class="invoice-pending">รอเรียกเก็บ ${money(row.unpaid)}</span>`:row.unpaid<0?`<span class="invoice-overpaid">${money(row.unpaid)}</span>`:money(row.unpaid);return`<tr><td>${esc(row.line.category)}</td><td class="align-center">${row.line.qty}</td><td>${esc(row.line.name)}</td><td class="align-right">${money(row.amount)}</td><td class="align-right">${row.deposit?money(row.deposit):'-'}</td><td class="align-right invoice-discount-cell">${discountLabel}</td><td class="align-right">${totalLabel}</td></tr>`}).join(''),count=Math.max(matches.length,group.type==='accommodation'?7:14),blanks=Array.from({length:count-matches.length},()=>'<tr class="blank-line"><td></td><td></td><td></td><td></td><td>-</td><td>-</td><td>-</td></tr>').join('');return`<tr class="bill-section-row"><td colspan="7">${group.label}</td></tr>${lines}${blanks}`}).join('')}
  document.addEventListener('input',event=>{if(event.target.matches('.line-discount-rate,.line-discount-amount')){const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];if(line){if(event.target.matches('.line-discount-rate'))line.discountRate=clampRate(event.target.value);else line.discountAmount=Math.max(0,Number(event.target.value||0));calculateInvoice()}}})
  renderFormLines();renderInvoicePreview()
}
document.addEventListener('DOMContentLoaded',()=>enableDualLineDiscount());

function enablePendingOutstandingDisplay(){
  const baseSnapshot=invoiceSnapshot;
  invoiceSnapshot=function(){const snapshot=baseSnapshot();return{...snapshot,outstandingDisplay:snapshot.netTotal-snapshot.deposit}}
  const baseRender=renderInvoicePreview;
  renderInvoicePreview=function(){baseRender();const snapshot=invoiceSnapshot(),value=snapshot.outstandingDisplay;if($('#preview-outstanding'))$('#preview-outstanding').textContent=state.invoiceClosed&&value===0?'':money(value)}
  const baseCalculate=calculateInvoice;
  calculateInvoice=function(){baseCalculate();const snapshot=invoiceSnapshot(),value=snapshot.outstandingDisplay;if($('#summary-outstanding'))$('#summary-outstanding').textContent=state.invoiceClosed&&value===0?'':money(value)}
  renderInvoicePreview();calculateInvoice()
}
document.addEventListener('DOMContentLoaded',()=>enablePendingOutstandingDisplay());

function enableNegativeLineTotals(){
  const discountFor=(line,amount,snapshot)=>{const rate=Math.min(100,Math.max(0,Number(line.discountRate||0))),fixed=Math.max(0,Number(line.discountAmount||0));return snapshot.discountScope==='line'?Math.min(amount,amount*rate/100+fixed):snapshot.discountScope==='all'&&snapshot.subtotal?amount*(snapshot.discount/snapshot.subtotal):0}
  allocateLineAmounts=function(snapshot){let paid=snapshot.paymentDeposits;const rows=state.invoiceLines.map(line=>{const amount=lineAmount(line),discount=discountFor(line,amount,snapshot),afterDiscount=amount-discount,lineDeposit=Math.max(0,Number(line.deposit||0)),payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid),pending=Math.max(0,Number(line.pendingCollection||0)),unpaid=afterDiscount-lineDeposit-payment;paid-=payment;return{line,amount,discount,lineDeposit,payment,pending,deposit:lineDeposit+payment,unpaid,outstanding:unpaid-pending}});if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.unpaid-=paid;last.outstanding-=paid}return rows}
  lineRow=function(line,index){const gross=lineAmount(line),snapshot=invoiceSnapshot(),discount=discountFor(line,gross,snapshot),net=gross-discount-Number(line.deposit||0);return`<tr><td>${esc(line.category)}</td><td>${esc(line.name)}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><div class="line-discount-fields"><label class="line-discount-field"><input class="line-discount-rate" data-line-index="${index}" type="number" min="0" max="100" step="0.01" value="${Math.min(100,Math.max(0,Number(line.discountRate||0)))}" placeholder="0" aria-label="ส่วนลดเปอร์เซ็นต์ ${esc(line.name)}"><span>%</span></label><label class="line-discount-field"><input class="line-discount-amount" data-line-index="${index}" type="number" min="0" step="0.01" value="${Math.max(0,Number(line.discountAmount||0))}" placeholder="0" aria-label="ส่วนลดเป็นเงิน ${esc(line.name)}"><span>Baht</span></label></div></td><td class="align-right strong-number"><span>${money(net)}</span>${discount?`<small class="line-gross">ก่อนหัก ${money(gross)}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">close</span></button></td></tr>`}
  renderFormLines();renderInvoicePreview();calculateInvoice()
}
document.addEventListener('DOMContentLoaded',()=>enableNegativeLineTotals());

function refreshInvoiceSummaryPanel(){const snapshot=invoiceSnapshot(),displayOutstanding=snapshot.outstandingDisplay??snapshot.outstanding;[['summary-total',snapshot.subtotal],['summary-deposit',snapshot.deposit],['summary-discount',snapshot.discount],['summary-outstanding',displayOutstanding],['preview-total',snapshot.subtotal],['preview-deposit',snapshot.deposit],['preview-discount',snapshot.discount],['preview-outstanding',displayOutstanding]].forEach(([id,value])=>{const element=$(`#${id}`);if(element)element.textContent=money(value)})}
document.addEventListener('DOMContentLoaded',()=>{const refresh=event=>{if(!event||event.target.closest?.('#view-invoice'))refreshInvoiceSummaryPanel()};document.addEventListener('input',refresh);document.addEventListener('change',refresh);document.addEventListener('click',event=>{if(event.target.closest?.('#add-accommodation,#add-addon,[data-line-index][data-qty],.remove-form-line'))setTimeout(refreshInvoiceSummaryPanel,0)});refreshInvoiceSummaryPanel()});

function installEditableLineCategories(){[{type:'accommodation',id:'accommodation-category',values:['Accommodation','Inclusive Package','Package','Extra Bed','Complimentary']},{type:'addon',id:'addon-category',values:['Food & Beverage','BBQ','Minibar','Souvenir','Activities','Miscellaneous','Other Expenses']}].forEach(({type,id,values})=>{const select=$(`#${type}-select`),fields=select?.parentElement;if(!fields||$(`#${id}`))return;const input=document.createElement('input');input.id=id;input.type='text';input.className='invoice-category-input';input.placeholder='หมวด / พิมพ์หรือเลือก';input.setAttribute('list',`${id}-options`);input.setAttribute('aria-label',`หมวด ${type}`);const list=document.createElement('datalist');list.id=`${id}-options`;values.forEach(value=>{const option=document.createElement('option');option.value=value;list.appendChild(option)});fields.insertBefore(input,fields.querySelector('.button'));fields.appendChild(list)})}
function enableEditableLineCategories(){
  installEditableLineCategories()
  addLine=function(type){const select=type==='accommodation'?$('#accommodation-select'):$('#addon-select'),search=$(`#${type==='accommodation'?'accommodation':'addon'}-search`),categoryEl=type==='accommodation'?$('#accommodation-category'):$('#addon-category'),rateEl=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),qtyEl=type==='accommodation'?$('#accommodation-qty'):$('#addon-qty'),items=type==='accommodation'?accommodationItems:addonItems,selected=items[Number(select?.value)],typed=cleanEnglishText(search?.value?.trim()||''),item=selected||(!typed?null:{name:typed,category:type==='accommodation'?'Accommodation':'Miscellaneous',rate:Math.max(0,Number(rateEl?.value||0)),custom:true});if(!item){showToast('กรุณาเลือกรายการหรือพิมพ์รายการใหม่ก่อนเพิ่ม','error');return}const category=cleanEnglishText(categoryEl?.value?.trim()||item.category||(type==='accommodation'?'Accommodation':'Miscellaneous'));state.invoiceLines.push({type,name:item.name,category,sourceIndex:selected?Number(select.value):null,rate:Math.max(0,Number(rateEl?.value||item.rate||0)),deposit:0,depositMethod:'เงินสด',qty:Math.max(1,Number(qtyEl?.value||1)),discountRate:0,discountAmount:0,pendingCollection:0,pendingNote:''});if(select)select.value='';if(rateEl)rateEl.value='';if(qtyEl)qtyEl.value='1';if(search)search.value='';if(categoryEl)categoryEl.value='';renderFormLines();calculateInvoice();showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`)}
  installEditableLineCategories()
}
document.addEventListener('DOMContentLoaded',()=>enableEditableLineCategories());

function removeSearchClearButtons(){
  document.querySelectorAll('.invoice-search-clear').forEach(button=>button.remove());
  document.querySelectorAll('.invoice-search-wrap').forEach(wrapper=>{
    const input=wrapper.querySelector('.invoice-search-input');
    if(input)wrapper.replaceWith(input);
  });
}
document.addEventListener('DOMContentLoaded',()=>removeSearchClearButtons());

// Final invoice rules: discount is a single entered Baht amount and
// collection from other points is recorded once for the whole bill.
function installFinalInvoiceRules(){
  if(typeof state.pendingCollectionTotal!=='number')state.pendingCollectionTotal=0;
  if(typeof state.pendingCollectionNote!=='string')state.pendingCollectionNote='';
  if(!state.closedInvoiceSnapshot)state.closedInvoiceSnapshot=null;

  const clampDiscount=(line,amount)=>Math.min(Math.max(0,Number(amount||0)),Math.max(0,Number(line.discountAmount||0)));
  const pendingTotal=()=>Math.max(0,Number(state.pendingCollectionTotal||0));

  const calculateLiveInvoiceSnapshot=()=>{
    const subtotal=state.invoiceLines.reduce((sum,line)=>sum+lineAmount(line),0);
    const scope=formValue('discount-scope','line');
    const enteredLineDiscount=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.discountAmount||0)),0);
    const allDiscount=Math.max(0,Number(formValue('discount-all-rate',0))||0);
    const discount=scope==='none'?0:scope==='all'?Math.min(subtotal,subtotal*allDiscount/100):Math.min(subtotal,enteredLineDiscount);
    const lineDeposits=state.invoiceLines.reduce((sum,line)=>sum+Math.max(0,Number(line.deposit||0)),0);
    const paymentDeposits=state.payments.reduce((sum,payment)=>sum+Math.max(0,Number(payment.amount||0)),0);
    const deposit=lineDeposits+paymentDeposits;
    const pending=Math.min(Math.max(0,subtotal-discount-deposit),pendingTotal());
    const netTotal=Math.max(0,subtotal-discount);
    const todayStr=new Date().toISOString().slice(0,10);
    const autoRef=`INV-${todayStr.slice(2).replaceAll('-','')}-${Math.floor(100+Math.random()*900)}`;
    const reference=String(formValue('folio','')||'').trim()||autoRef;
    const docDate=formValue('doc-date')||todayStr;
    return {reference,customer:formValue('customer',''),checkIn:formValue('check-in')||docDate,checkOut:formValue('check-out')||docDate,nights:formValue('no-of-night','1'),remark:formValue('remark',''),docDate,villa:formValue('villa',''),villaCode:formValue('villa-code',''),subtotal,discount,lineDeposits,paymentDeposits,pendingTotal:pending,deposit,netTotal,outstanding:netTotal-deposit-pending,outstandingDisplay:netTotal-deposit,discountScope:scope,allAmount:allDiscount};
  };
  const settlementTotals=()=>{
    const snapshot=calculateLiveInvoiceSnapshot();
    const paid=settlementRows.reduce((sum,row)=>sum+Math.max(0,Number(row.amount||0)),0);
    const pending=pendingCollectionRows.reduce((sum,row)=>sum+Math.max(0,Number(row.amount||0)),0);
    const maximum=Math.max(0,snapshot.netTotal-snapshot.lineDeposits);
    const excess=Math.max(0,paid+pending-maximum);
    return {snapshot,paid,pending,maximum,excess};
  };
  invoiceSnapshot=function(){
    if(state.invoiceClosed&&state.closedInvoiceSnapshot)return {...state.closedInvoiceSnapshot};
    return calculateLiveInvoiceSnapshot();
  };

  allocateLineAmounts=function(snapshot){
    let paid=snapshot.paymentDeposits;
    const rows=state.invoiceLines.map(line=>{
      const amount=lineAmount(line);
      const discount=snapshot.discountScope==='line'?clampDiscount(line,amount):snapshot.discountScope==='all'&&snapshot.subtotal?amount*(snapshot.discount/snapshot.subtotal):0;
      const afterDiscount=amount-discount;
      const lineDeposit=Math.max(0,Number(line.deposit||0));
      const payment=Math.min(Math.max(0,afterDiscount-lineDeposit),paid);
      const unpaid=afterDiscount-lineDeposit-payment;
      paid-=payment;
      return {line,amount,discount,lineDeposit,payment,pending:0,deposit:lineDeposit+payment,unpaid,outstanding:unpaid};
    });
    if(paid>0&&rows.length){const last=rows[rows.length-1];last.payment+=paid;last.deposit+=paid;last.unpaid-=paid;last.outstanding-=paid}
    return rows;
  };

  lineRow=function(line,index){
    const gross=lineAmount(line),discount=clampDiscount(line,gross),deposit=Math.max(0,Number(line.deposit||0)),net=Math.max(0,gross-discount-deposit);
    return `<tr><td>${esc(line.category)}</td><td>${esc(line.name)}</td><td class="align-center"><div class="qty-control"><button type="button" data-line-index="${index}" data-qty="-1">−</button><strong>${line.qty}</strong><button type="button" data-line-index="${index}" data-qty="1">+</button></div></td><td class="align-right"><input class="line-rate" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.rate||0)}" aria-label="Rate ${esc(line.name)}"></td><td class="align-right"><div class="line-deposit-fields"><input class="line-deposit" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.deposit||0)}" aria-label="Deposit ${esc(line.name)}"><select class="line-deposit-method" data-line-index="${index}" aria-label="ช่องทาง Deposit ${esc(line.name)}">${paymentMethodOptions(line.depositMethod)}</select></div></td><td><input class="line-discount" data-line-index="${index}" type="number" min="0" step="0.01" value="${Number(line.discountAmount||0)}" placeholder="ยอดเงิน" aria-label="ส่วนลดเป็นยอดเงิน ${esc(line.name)}"></td><td class="align-right strong-number"><span>${money(net)}</span>${(discount||deposit)?`<small class="line-gross">เต็ม ${money(gross)}${discount?` · ลด -${money(discount)}`:''}${deposit?` · มัดจำ -${money(deposit)}`:''}</small>`:''}</td><td class="align-right"><button class="icon-button remove-form-line" type="button" data-line-index="${index}" aria-label="ลบรายการ"><span class="material-symbols-outlined">close</span></button></td></tr>`;
  };

  previewItemRows=function(snapshot){
    const groups=[{label:'Accommodation & Inclusive Package',type:'accommodation'},{label:'Food and Beverages (add-on) and Other Expenses',type:'addon'}],breakdowns=allocateLineAmounts(snapshot);
    return groups.map(group=>{
      const matches=breakdowns.filter(row=>row.line.type===group.type);
      const lines=matches.map(row=>`<tr><td>${esc(row.line.category)}</td><td class="align-center">${row.line.qty}</td><td>${esc(row.line.name)}</td><td class="align-right">${money(row.amount)}</td><td class="align-right">${row.deposit?money(row.deposit):'-'}</td><td class="align-right invoice-discount-cell">${row.discount?money(row.discount):'-'}</td><td class="align-right">${row.outstanding<0?`<span class="invoice-overpaid">${money(row.outstanding)}</span>`:money(row.outstanding)}</td></tr>`).join('');
      const count=Math.max(matches.length,group.type==='accommodation'?7:14),blanks=Array.from({length:count-matches.length},()=>'<tr class="blank-line"><td></td><td></td><td></td><td></td><td>-</td><td>-</td><td>-</td></tr>').join('');
      return `<tr class="bill-section-row"><td colspan="7">${group.label}</td></tr>${lines}${blanks}`;
    }).join('');
  };

  $$('#view-invoice .invoice-line-group th').forEach(th=>{if(th.textContent.includes('ส่วนลด'))th.textContent='ส่วนลด (Baht)'});

  const baseRenderPreview=renderInvoicePreview;
  renderInvoicePreview=function(){
    baseRenderPreview();
    const previewSnapshot=invoiceSnapshot();
    [['preview-reference',previewSnapshot.reference],['preview-reference-meta',previewSnapshot.reference],['preview-customer',previewSnapshot.customer],['preview-check-in',previewSnapshot.checkIn?formatDate(previewSnapshot.checkIn):''],['preview-check-out',previewSnapshot.checkOut?formatDate(previewSnapshot.checkOut):''],['preview-nights',previewSnapshot.nights],['preview-remark',previewSnapshot.remark],['preview-invoice-date',previewSnapshot.docDate?formatDate(previewSnapshot.docDate):'']].forEach(([id,value])=>{if($(`#${id}`))$(`#${id}`).textContent=value||''});
    const noteBox=$('#preview-pending-notes');
    if(!noteBox)return;
    const methods=[...new Set([...state.invoiceLines.filter(line=>Number(line.deposit||0)>0).map(line=>line.depositMethod||'เงินสด'),...state.payments.filter(payment=>Number(payment.amount||0)>0).map(payment=>payment.method)])];
    if($('#preview-payment-method')&&!methods.length)$('#preview-payment-method').textContent='';
    const notes=[];
    if(methods.length)notes.push(`<div><strong>ชำระแล้วจากช่องทาง</strong><span>${esc(methods.join(', '))}</span></div>`);
    if(pendingTotal())notes.push(`<div><strong>รอเรียกเก็บทั้งบิล ${money(pendingTotal())}</strong><span>${esc(state.pendingCollectionNote||'รอเรียกเก็บจากจุดที่เกี่ยวข้อง')}</span></div>`);
    noteBox.innerHTML=notes.join('');
    noteBox.classList.toggle('long-note',String(state.pendingCollectionNote||'').length>90);
    const footer=noteBox.closest('.preview-footer');
    if(footer)footer.classList.toggle('has-pending-notes',notes.length>0);
  };

  const baseRenderPendingFormRows=renderPendingFormRows;
  renderPendingFormRows=function(){
    const box=$('#pending-form-rows');
    if(!box)return;
    box.innerHTML=`<div class="pending-form-row"><strong>รอเรียกเก็บทั้งบิล</strong><input class="whole-bill-pending-amount" type="number" min="0" step="0.01" value="${pendingTotal()}" placeholder="ยอดรอเรียกเก็บ"><input class="whole-bill-pending-note" value="${esc(state.pendingCollectionNote||'')}" placeholder="หมายเหตุ / จุดที่รอเก็บ"></div>`;
  };

  renderPendingCollectionRows=function(){
    const box=$('#pending-collection-rows');
    if(!box)return;
    box.innerHTML=`<div class="pending-collection-row"><div class="pending-collection-name"><strong>รอเรียกเก็บทั้งบิล</strong><small>รวมยอดจากทุกแผนก / จุดที่เกี่ยวข้อง</small></div><input data-pending-bill-field="amount" type="number" min="0" step="0.01" value="${pendingTotal()}" placeholder="ยอดรอเก็บ"><input data-pending-bill-field="note" value="${esc(state.pendingCollectionNote||'')}" placeholder="แผนก / จุดที่รอเก็บ"></div>`;
    box.querySelectorAll('[data-pending-bill-field]').forEach(input=>input.addEventListener('input',event=>{const field=event.target.dataset.pendingBillField;if(field==='amount')pendingCollectionRows[0].amount=Math.max(0,Number(event.target.value||0));else pendingCollectionRows[0].note=event.target.value;updateSettlementTotal()}));
  };

  const baseOpenSettlementModal=openSettlementModal;
  openSettlementModal=function(){
    const snapshot=typeof calculateLiveInvoiceSnapshot==='function'?calculateLiveInvoiceSnapshot():invoiceSnapshot();
    const defaultAmount=Math.max(0,snapshot.netTotal-snapshot.deposit);
    settlementRows=state.payments.length?state.payments.map(payment=>({...payment})):[{method:'เงินสด',amount:defaultAmount}];
    pendingCollectionRows=[{amount:pendingTotal(),note:state.pendingCollectionNote||''}];
    const root=$('#modal-root');
    if(!root)return;
    root.innerHTML=`<div class="modal-backdrop"><div class="modal settlement-modal" role="dialog" aria-modal="true"><div class="modal-header"><h3>ยืนยันการชำระเงินและปิดยอด (${esc(snapshot.customer)})</h3><button class="icon-button" data-close-modal aria-label="ปิด"><span class="material-symbols-outlined">close</span></button></div><div class="modal-body"><p class="muted">บันทึกช่องทางชำระ และรวมยอดที่รอเรียกเก็บจากทุกจุดเป็นยอดเดียวของบิล</p><div id="settlement-rows"></div><button type="button" class="button button-soft full-width" data-settlement-add><span class="material-symbols-outlined">add</span>เพิ่มช่องทางชำระ</button><section class="pending-collection-section"><div class="pending-collection-heading"><strong>ยอดรอเรียกเก็บทั้งบิล</strong><small>ไม่แยกตามรายการ ให้ระบุยอดรวมและหมายเหตุครั้งเดียว</small></div><div id="pending-collection-rows"></div></section><label class="settlement-slip">หลักฐานการชำระเงิน<input id="settlement-slip" type="file" accept="image/*,.pdf"></label><label class="settlement-preparer">ผู้จัดทำ / ผู้ปิดงาน <b class="required-note" style="color:var(--danger,#d32f2f)">*</b><input id="settlement-preparer" value="" list="preparer-options" placeholder="เลือกหรือพิมพ์ชื่อผู้จัดทำ" autocomplete="off" required><datalist id="preparer-options"><option value="Now Narit"><option value="Mhew Kusu"><option value="Nattaya Phung"><option value="Nummim"><option value="Ple Theresa"></datalist></label><p id="settlement-total" class="settlement-total"></p></div><div class="modal-footer"><button class="button button-outline" type="button" data-close-modal>ยกเลิก</button><button class="button button-primary" type="button" data-settlement-confirm>ปิดยอดและบันทึกรอบ</button></div></div></div>`;
    renderSettlementRows();renderPendingCollectionRows();updateSettlementTotal();
  };

  updateSettlementTotal=function(){
    const el=$('#settlement-total');
    if(el){
      const totals=settlementTotals(),overLimit=totals.excess>0.005;
      el.classList.toggle('over-limit',overLimit);
      el.innerHTML=`รวมชำระ ${money(totals.paid)} <span>• ยอดรอเก็บทั้งบิล ${money(totals.pending)}</span>${overLimit?`<small class="settlement-limit-warning">ยอดรวมเกินใบแจ้งหนี้ ${money(totals.excess)} กรุณาปรับยอดก่อนปิดบิล</small>`:''}`;
      const confirm=$('[data-settlement-confirm]');
      if(confirm){confirm.disabled=overLimit;confirm.setAttribute('aria-disabled',String(overLimit));}
    }
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest('#add-payment');
    if(!button)return;
    const amount=Math.max(0,Number($('#payment-amount')?.value||0));
    const snapshot=calculateLiveInvoiceSnapshot();
    const available=Math.max(0,snapshot.netTotal-snapshot.lineDeposits-snapshot.paymentDeposits);
    if(amount>available+0.005){
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast(`ยอดชำระเกินยอดคงเหลือของใบแจ้งหนี้ ${money(amount-available)}`,'error');
    }
  },true);

  finalizeInvoice=async function(){
    const enteredPreparer=($('#settlement-preparer')?.value||'').trim();
    if(!enteredPreparer){
      showToast('กรุณาระบุชื่อผู้จัดทำ / ผู้ปิดงาน','error');
      $('#settlement-preparer')?.focus();
      return;
    }
    const preparer=staffDisplayName(enteredPreparer);
    const enteredTotals=settlementTotals();
    if(enteredTotals.excess>0.005){
      updateSettlementTotal();
      showToast(`ยอดชำระรวมเกินยอดใบแจ้งหนี้ ${money(enteredTotals.excess)}`,'error');
      return;
    }
    const file=$('#settlement-slip')?.files?.[0];
    let proof=null;
    if(file){
      if(file.size>4*1024*1024){showToast('ไฟล์สลิปต้องมีขนาดไม่เกิน 4 MB','error');return}
      try{proof={name:file.name,size:file.size,type:file.type,data:await fileToDataUrl(file)}}catch{showToast('อ่านไฟล์สลิปไม่สำเร็จ','error');return}
    }
    const originalSnapshot=invoiceSnapshot();
    const displaySnapshot={...originalSnapshot,pendingTotal:0,outstanding:originalSnapshot.netTotal-originalSnapshot.deposit,outstandingDisplay:originalSnapshot.netTotal-originalSnapshot.deposit};
    const previousPayments=state.payments.map(payment=>({...payment})),previousTotal=state.pendingCollectionTotal,previousNote=state.pendingCollectionNote;
    state.payments=settlementRows.filter(row=>Number(row.amount||0)>0).map(row=>({method:row.method,amount:Number(row.amount||0)}));
    const pending=pendingCollectionRows[0]||{amount:0,note:''};
    state.pendingCollectionTotal=Math.max(0,Number(pending.amount||0));
    state.pendingCollectionNote=String(pending.note||'').trim();
    let settlementSnapshot=calculateLiveInvoiceSnapshot();
    state.pendingCollectionTotal=Math.min(state.pendingCollectionTotal,Math.max(0,settlementSnapshot.netTotal-settlementSnapshot.deposit));
    settlementSnapshot=calculateLiveInvoiceSnapshot();
    if(settlementSnapshot.outstanding>0&&!state.payments.length&&!state.pendingCollectionTotal){
      state.payments=[{method:'เงินสด',amount:settlementSnapshot.netTotal}];
      settlementSnapshot=calculateLiveInvoiceSnapshot();
    }
    if(settlementSnapshot.deposit+settlementSnapshot.pendingTotal>settlementSnapshot.netTotal+0.005){
      state.payments=previousPayments;state.pendingCollectionTotal=previousTotal;state.pendingCollectionNote=previousNote;renderPayments();calculateInvoice();
      showToast(`ยอดชำระรวมเกินยอดใบแจ้งหนี้ ${money(settlementSnapshot.deposit+settlementSnapshot.pendingTotal-settlementSnapshot.netTotal)}`,'error');return;
    }
    if(settlementSnapshot.outstanding>0){
      state.payments=previousPayments;state.pendingCollectionTotal=previousTotal;state.pendingCollectionNote=previousNote;renderPayments();calculateInvoice();
      showToast(`ยังมียอดที่ยังไม่ชำระหรือยังไม่ระบุยอดรอเก็บ ${money(settlementSnapshot.outstanding)}`,'error');return;
    }
    state.closedInvoiceSnapshot=displaySnapshot;
    state.invoiceClosed=true;
    const record={reference:settlementSnapshot.reference,customer:settlementSnapshot.customer,villa:settlementSnapshot.villa,checkIn:settlementSnapshot.checkIn,checkOut:settlementSnapshot.checkOut,nights:settlementSnapshot.nights,remark:settlementSnapshot.remark,docDate:settlementSnapshot.docDate,total:settlementSnapshot.subtotal,discount:settlementSnapshot.discount,deposit:settlementSnapshot.deposit,pendingTotal:settlementSnapshot.pendingTotal,pendingCollectionTotal:settlementSnapshot.pendingTotal,pendingCollectionNote:state.pendingCollectionNote,preparer,cashier:preparer,closedBy:preparer,closedAt:new Date().toLocaleString('th-TH'),proof,lines:state.invoiceLines.map(line=>({...line})),payments:state.payments.map(payment=>({...payment}))};
    state.closedBookings.unshift(record);saveClosedBookings();
    state.invoices.unshift({id:settlementSnapshot.reference,customer:settlementSnapshot.customer,time:'เมื่อสักครู่',total:settlementSnapshot.subtotal,status:'ชำระแล้ว',statusClass:'status-paid'});
    const now=new Date();
    const historyItem=normalizeHistoryRecord({
      ...record,
      id:record.reference,
      reference:record.reference,
      customer:settlementSnapshot.customer,
      villa:settlementSnapshot.villa,
      cashier:preparer,
      preparer:preparer,
      closedBy:preparer,
      businessDate:record.docDate||historyDateKey(now),
      time:now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),
      total:settlementSnapshot.subtotal,
      netTotal:settlementSnapshot.netTotal,
      discount:settlementSnapshot.discount,
      deposit:settlementSnapshot.deposit,
      pendingTotal:settlementSnapshot.pendingTotal
    });
    const historyList=loadInvoiceHistory().filter(item=>item.id!==historyItem.id);
    saveInvoiceHistory([historyItem,...historyList]);
    syncInvoiceHistoryState();
    if(typeof renderInvoiceHistoryAllRecords==='function')renderInvoiceHistoryAllRecords();
    renderDashboard();renderBookingRecords();$('#modal-root').innerHTML='';calculateInvoice();setInvoicePage('preview');
    showToast(`บันทึกใบแจ้งหนี้ ${settlementSnapshot.reference} (${settlementSnapshot.customer}) เรียบร้อยแล้ว`);
    if(typeof renderCloseRound==='function')renderCloseRound();
  };

  const baseResetInvoice=resetInvoice;
  resetInvoice=function(){
    const currentInvoicePage=state.invoicePage;
    state.invoiceClosed=false;
    state.closedInvoiceSnapshot=null;
    state.pendingCollectionTotal=0;
    state.pendingCollectionNote='';
    settlementRows=[];
    pendingCollectionRows=[];
    if($('#modal-root'))$('#modal-root').innerHTML='';
    if($('#preview-pending-notes'))$('#preview-pending-notes').innerHTML='';
    baseResetInvoice();
    renderPendingFormRows();
    renderPendingCollectionRows();
    renderInvoicePreview();
    calculateInvoice();
    setInvoicePage(currentInvoicePage);
  };

  // wireEvents registers the original reset handler before this final rule runs.
  // Replace the button so the new reset behavior is the only click handler.
  const resetButton=$('#reset-invoice');
  if(resetButton){
    const freshResetButton=resetButton.cloneNode(true);
    resetButton.replaceWith(freshResetButton);
    freshResetButton.addEventListener('click',()=>resetInvoice());
  }

  function updateLineRowVisual(index){
    const line=state.invoiceLines[index];
    if(!line)return;
    const gross=lineAmount(line);
    const discount=clampDiscount(line,gross);
    const deposit=Math.max(0,Number(line.deposit||0));
    const net=Math.max(0,gross-discount-deposit);
    const inputEl=document.querySelector(`[data-line-index="${index}"]`);
    const row=inputEl?.closest('tr');
    if(row){
      const cell=row.querySelector('.strong-number');
      if(cell){
        cell.innerHTML=`<span>${money(net)}</span>${(discount||deposit)?`<small class="line-gross">เต็ม ${money(gross)}${discount?` · ลด -${money(discount)}`:''}${deposit?` · มัดจำ -${money(deposit)}`:''}</small>`:''}`;
      }
    }
  }

  document.addEventListener('input',event=>{
    if(event.target.matches('.line-rate')){
      const idx=Number(event.target.dataset.lineIndex);
      const line=state.invoiceLines[idx];
      if(line){
        line.rate=Math.max(0,Number(event.target.value||0));
        updateLineRowVisual(idx);
        calculateInvoice();
      }
    }
    if(event.target.matches('.line-deposit')){
      const idx=Number(event.target.dataset.lineIndex);
      const line=state.invoiceLines[idx];
      if(line){
        line.deposit=Math.max(0,Number(event.target.value||0));
        updateLineRowVisual(idx);
        calculateInvoice();
      }
    }
    if(event.target.matches('.line-discount')){
      const idx=Number(event.target.dataset.lineIndex);
      const line=state.invoiceLines[idx];
      if(line){
        line.discountAmount=Math.max(0,Number(event.target.value||0));
        line.discountRate=0;
        updateLineRowVisual(idx);
        calculateInvoice();
      }
    }
    if(event.target.matches('.whole-bill-pending-amount,.whole-bill-pending-note')){
      if(event.target.matches('.whole-bill-pending-amount'))state.pendingCollectionTotal=Math.max(0,Number(event.target.value||0));
      else state.pendingCollectionNote=event.target.value;
      calculateInvoice();
    }
  });

  document.addEventListener('change',event=>{
    if(event.target.matches('.line-deposit-method')){
      const line=state.invoiceLines[Number(event.target.dataset.lineIndex)];
      if(line){
        line.depositMethod=event.target.value;
        calculateInvoice();
      }
    }
  });

  renderPendingFormRows();renderPendingCollectionRows();renderFormLines();renderInvoicePreview();calculateInvoice();
}
document.addEventListener('DOMContentLoaded',()=>installFinalInvoiceRules());

function installInvoiceDraftActions(){
  const summary=$('#view-invoice .live-summary'),previewButton=summary?.querySelector('[data-invoice-page="preview"]');
  if(!summary||!previewButton||$('#save-draft'))return;
  const button=document.createElement('button');button.id='save-draft';button.type='button';button.className='button button-outline full-width';button.innerHTML='<span class="material-symbols-outlined">save</span>บันทึกแบบร่าง';previewButton.insertAdjacentElement('beforebegin',button);button.addEventListener('click',saveInvoiceDraft);
}
document.addEventListener('DOMContentLoaded',installInvoiceDraftActions);

function normalizeInvoiceVillaOptions(){
  const villaSelect=$('#villa');
  if(villaSelect){
    const numberedVillas=[
      '02 Pangola','03 Hamata','04 Barbados','05 Merino','06 Corriedale',
      '07 Katahdin','08 Mulato','010 Napier','011 Setaria','012 Alfalfa','013 Rapunzel'
    ];
    villaSelect.innerHTML='<option value="">เลือก Villa / Room (ไม่ระบุก็ได้)</option>'+
      numberedVillas.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  }
  let codeInput=$('#villa-code');
  if(!codeInput&&villaSelect){
    const label=document.createElement('label');
    label.innerHTML='รหัส <input id="villa-code" list="invoice-villa-code-options" placeholder="เช่น A — Rainy S" autocomplete="off"><datalist id="invoice-villa-code-options">'+
      CLOSE_ROUND_VILLA_CODES.map(c=>`<option value="${esc(c.value)}">${esc(c.label)}</option>`).join('')+'</datalist>';
    villaSelect.closest('label')?.insertAdjacentElement('afterend',label);
  }else if(codeInput){
    let datalist=$('#invoice-villa-code-options');
    if(!datalist){
      datalist=document.createElement('datalist');
      datalist.id='invoice-villa-code-options';
      codeInput.insertAdjacentElement('afterend',datalist);
    }
    datalist.innerHTML=CLOSE_ROUND_VILLA_CODES.map(c=>`<option value="${esc(c.value)}">${esc(c.label)}</option>`).join('');
    codeInput.setAttribute('list','invoice-villa-code-options');
  }
}
document.addEventListener('DOMContentLoaded',normalizeInvoiceVillaOptions);

function normalizeReceptionLabels(){
  document.querySelectorAll('.topbar-context strong').forEach(element=>{element.textContent='RECEPTION'});
  document.querySelectorAll('#view-close-round option').forEach(option=>{option.textContent=option.textContent.replace(/\s*·\s*Zone A/g,'')});
  document.querySelectorAll('#view-users th').forEach(cell=>{if(cell.textContent.trim()==='จุดขาย')cell.textContent='หน่วยงาน'});
  document.querySelectorAll('#view-users td').forEach(cell=>{if(cell.textContent.trim()==='Zone A')cell.textContent='RECEPTION';if(cell.textContent.trim()==='ทุกจุดขาย')cell.textContent='ทุกหน่วยงาน'});
  document.querySelectorAll('#view-audit p,#view-audit small').forEach(element=>{element.textContent=element.textContent.replace(/จุดขาย/g,'หน่วยงาน').replace(/Zone A/g,'RECEPTION')});
  updateTopbarUserProfile();
}
function updateTopbarUserProfile(){
  const email=localStorage.getItem('scenery-last-login-email')||window.scenerySupabase?.user?.email||'h.adv.scenery@gmail.com';
  const nameEl=document.querySelector('.profile-text strong');
  if(nameEl)nameEl.textContent=email;
  const avatarEl=document.querySelector('.profile-button .avatar');
  if(avatarEl){
    const initial=(email.replace(/[^a-zA-Z0-9]/g,'').slice(0,2)||'HA').toUpperCase();
    avatarEl.textContent=initial;
  }
}
document.addEventListener('DOMContentLoaded',normalizeReceptionLabels);

/* Round 0 audit trail: every important local action is recorded and can be
 * mirrored to the configured backend by supabase-bridge.js. */
const AUDIT_LOG_KEY='scenery-audit-log';
function loadAuditLogs(){try{const value=JSON.parse(localStorage.getItem(AUDIT_LOG_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function saveAuditLogs(entries){try{localStorage.setItem(AUDIT_LOG_KEY,JSON.stringify(entries.slice(0,500)))}catch{}}
function recordAudit(action,entityType,entityId,beforeData=null,afterData=null,metadata={}){
  const entry={id:`AUD-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,action,entityType,entityId:String(entityId||''),beforeData,afterData,metadata,actor:window.scenerySupabase?.userEmail||'local-user',createdAt:new Date().toISOString()};
  saveAuditLogs([entry,...loadAuditLogs()]);
  renderAuditLog();
  try{window.scenerySupabase?.recordAudit?.(entry)}catch{}
  return entry;
}
function renderAuditLog(){
  const list=$('#view-audit .audit-list');
  if(!list)return;
  const rows=loadAuditLogs().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  list.innerHTML=rows.map(entry=>{const when=new Date(entry.createdAt);const time=Number.isNaN(when.getTime())?'-':when.toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'});const detail=entry.entityId?`${entry.entityType} ${entry.entityId}`:entry.entityType;return `<div class="audit-item"><span class="audit-icon brown"><span class="material-symbols-outlined">fact_check</span></span><div><strong>${esc(entry.action)} <b>${esc(detail)}</b></strong><p>${esc(entry.metadata?.reason||'บันทึกการทำรายการในระบบ')}</p><small>${esc(entry.actor||'ผู้ใช้งาน')} · ${esc(time)}</small></div><span class="status-chip neutral">${esc(entry.action)}</span></div>`}).join('')||'<div class="empty-state"><span class="material-symbols-outlined">fact_check</span><p>ยังไม่มีรายการตรวจสอบ</p><small>Audit Log จะแสดงเมื่อมีการทำรายการจริง</small></div>';
}
function exportAuditLogCsv(){
  const rows=loadAuditLogs(),headers=['Time','Action','Entity Type','Entity ID','Actor','Reason'];
  const values=rows.map(entry=>[entry.createdAt,entry.action,entry.entityType,entry.entityId,entry.actor,entry.metadata?.reason||'']);
  const csv='\uFEFF'+[headers,...values].map(row=>row.map(csvEscape).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`audit-log-${historyDateKey()}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('ส่งออก Audit Log เป็น CSV แล้ว');
}
document.addEventListener('DOMContentLoaded',()=>{renderAuditLog();const button=$('#view-audit .page-heading button');button?.addEventListener('click',exportAuditLogCsv)});
function closeRoundIsLocked(date){return loadClosedRounds().some(round=>round.businessDate===date&&['Submitted','Approved'].includes(round.status))}

/* Invoice history: real finalized invoices only, stored day by day. */
const INVOICE_HISTORY_KEY='scenery-invoice-history';
let historyRenderedDay='';
function historyDateKey(date=new Date()){
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}
function defaultSeedInvoices(){
  return [];
}

function loadInvoiceHistory(){
  try{
    const stored=localStorage.getItem(INVOICE_HISTORY_KEY);
    if(stored!==null){
      const raw=JSON.parse(stored);
      if(Array.isArray(raw)){
        return raw.filter(item=>item && typeof item === 'object' && (item.id || item.reference)).map(normalizeHistoryRecord);
      }
    }
    return [];
  }catch{
    return [];
  }
}
function saveInvoiceHistory(records){try{localStorage.setItem(INVOICE_HISTORY_KEY,JSON.stringify(records))}catch{showToast('บันทึกประวัติใบแจ้งหนี้ไม่สำเร็จ','error')}}
function historyPendingTotal(record){
  if(Number(record.pendingTotal||0)>0)return Math.max(0,Number(record.pendingTotal||0));
  return (record.pendingCollections||[]).reduce((sum,row)=>sum+Math.max(0,Number(row.amount||0)),0);
}
function historyStatus(record){
  const pending=historyPendingTotal(record);
  return pending>0?{label:'ค้างชำระ',className:'status-pending'}:{label:'ชำระแล้ว',className:'status-paid'};
}
function normalizeHistoryRecord(record){
  const total=Math.max(0,Number(record.netTotal??(Number(record.total||0)-Number(record.discount||0)))||0);
  const pendingTotal=historyPendingTotal(record);
  const status=historyStatus({...record,pendingTotal});
  const staff=staffDisplayName(record.cashier||record.preparer||record.closedBy||record.user);
  return {...record,id:record.id||record.reference||`INV-${Date.now()}`,reference:record.reference||record.id||'',businessDate:record.businessDate||historyDateKey(),time:record.time||'ไม่ระบุเวลา',cashier:staff,preparer:staff,total,netTotal:total,pendingTotal,status:status.label,statusClass:status.className};
}
function historyDisplayDate(key){
  const date=new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime())?key:date.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
}
function syncInvoiceHistoryState(){
  const allRecords=loadInvoiceHistory().sort((a,b)=>{
    const dCmp=String(b.businessDate||'').localeCompare(String(a.businessDate||''));
    return dCmp || String(b.time||'').localeCompare(String(a.time||''));
  });
  state.invoices=allRecords.map(record=>({
    id:record.id,
    reference:record.reference||record.id,
    customer:record.customer,
    villa:record.villa,
    businessDate:record.businessDate,
    time:record.time,
    total:record.total,
    pendingTotal:record.pendingTotal,
    status:record.status,
    statusClass:record.statusClass
  }));
  renderDashboard();
  if(typeof renderInvoiceHistoryAllRecords==='function')renderInvoiceHistoryAllRecords();
  else renderHistory();
}
function historyRowsForToday(){
  const query=($('#history-search')?.value||'').trim().toLowerCase();
  const statusFilter=$('#history-status-filter')?.value||'all';
  return loadInvoiceHistory().filter(record=>{
    const status=historyStatus(record);
    const haystack=[record.id,record.reference,record.customer,record.villa,record.time,record.businessDate,status.label,record.total,record.pendingTotal].join(' ').toLowerCase();
    return (!query||haystack.includes(query))&&(statusFilter==='all'||status.label===statusFilter);
  }).sort((a,b)=>String(b.time).localeCompare(String(a.time)));
}
function renderHistory(){
  if(typeof renderInvoiceHistoryAllRecords==='function'){
    renderInvoiceHistoryAllRecords();
    return;
  }
  const body=$('#history-body');
  if(!body)return;
  const today=historyDateKey();
  const dateFilter=$('#history-date-filter');
  if(dateFilter){dateFilter.innerHTML=`<option value="today">วันนี้ · ${historyDisplayDate(today)}</option>`;dateFilter.value='today'}
  const rows=historyRowsForToday();
  body.innerHTML=rows.map(record=>{
    const status=historyStatus(record),pending=historyPendingTotal(record);
    const cashierName=staffDisplayName(record.cashier||record.preparer||record.closedBy||record.user);
    return `<tr><td><button class="button button-text mono strong-link" type="button" data-history-view="${esc(record.id)}" style="padding:0;font-weight:700;color:var(--primary);text-decoration:underline;cursor:pointer;background:none;border:none;">${esc(record.id)}</button></td><td><strong>${esc(record.customer||'-')}</strong><small class="table-subtext">${esc(record.villa||'-')} · ${esc(record.time)} น.</small></td><td>${esc(historyDisplayDate(record.businessDate))}</td><td class="align-right strong-number">${money(record.total)}</td><td>${pending?`<span class="warning-text">รอเรียกเก็บ ${money(pending)}</span>`:'<span class="positive-text">ครบถ้วน</span>'}</td><td><span class="table-user" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--text);background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:12px;"><span class="material-symbols-outlined" style="font-size:15px;color:var(--muted);">person</span>${esc(cashierName)}</span></td><td><span class="status-chip ${status.className}">${status.label}</span></td><td><div class="history-actions"><button class="button button-outline action-small" data-history-view="${esc(record.id)}"><span class="material-symbols-outlined">receipt_long</span>ดู INFORMATION BILL</button><button class="button button-outline action-small" data-history-edit="${esc(record.id)}"><span class="material-symbols-outlined">edit</span>แก้ไข</button><button class="button button-danger action-small" data-history-delete="${esc(record.id)}"><span class="material-symbols-outlined">delete</span>ลบ</button></div></td></tr>`;
  }).join('')||'<tr><td colspan="8"><div class="empty-state"><span class="material-symbols-outlined">receipt_long</span><p>ยังไม่มีประวัติใบแจ้งหนี้</p><small>เมื่อยืนยันใบแจ้งหนี้แล้ว รายการจะปรากฏที่นี่</small></div></td></tr>';
  historyRenderedDay=today;
}
function openHistoryEdit(id){
  const record=loadInvoiceHistory().find(item=>item.id===id);
  if(!record)return;
  const currentCloser=staffDisplayName(record.cashier||record.preparer||record.closedBy||'');
  const body=`<div class="history-edit-form"><label>เลข Invoice<input value="${esc(record.id)}" disabled></label><label>ลูกค้า / บริษัท<input id="history-edit-customer" value="${esc(record.customer||'')}"></label><label>Villa / ห้องพัก<input id="history-edit-villa" value="${esc(record.villa||'')}"></label><label class="settlement-preparer">ผู้ปิดยอด / ผู้แก้ไขล่าสุด <b class="required-note" style="color:var(--danger,#d32f2f)">*</b><input id="history-edit-preparer" value="${esc(currentCloser)}" list="preparer-options" placeholder="เลือกหรือพิมพ์ชื่อผู้ปิดยอดคนล่าสุด" autocomplete="off" required><datalist id="preparer-options"><option value="Now Narit"><option value="Mhew Kusu"><option value="Nattaya Phung"><option value="Nummim"><option value="Ple Theresa"></datalist></label><label>ยอดสุทธิ<input id="history-edit-total" type="number" min="0" step="0.01" value="${Number(record.total||0)}"></label><label>ยอดรอเรียกเก็บ<input id="history-edit-pending" type="number" min="0" step="0.01" value="${historyPendingTotal(record)}"></label><small class="muted">ถ้ายอดรอเรียกเก็บมากกว่า 0 ระบบจะแสดงสถานะ “ค้างชำระ” อัตโนมัติ</small></div>`;
  openModal(`แก้ไขย้อนหลัง ${record.id}`,body,'<button class="button button-outline" data-close-modal>ยกเลิก</button><button class="button button-primary" data-history-save="'+esc(record.id)+'">บันทึกการแก้ไข</button>');
}
function editInvoiceHistory(id){
  const records=loadInvoiceHistory(),index=records.findIndex(record=>record.id===id);
  if(index<0)return;
  const total=Math.max(0,Number($('#history-edit-total')?.value||0)),pending=Math.max(0,Number($('#history-edit-pending')?.value||0));
  if(pending>total){showToast('ยอดรอเรียกเก็บต้องไม่มากกว่ายอดสุทธิ','error');return}
  const current=records[index];
  if(closeRoundIsLocked(current.businessDate)){showToast(`แก้ไขไม่ได้: รอบ ${current.businessDate} ถูก Submit และ Lock แล้ว`,'error');return}
  const enteredCloser=($('#history-edit-preparer')?.value||'').trim();
  if(!enteredCloser){
    showToast('กรุณาระบุชื่อผู้ปิดยอดคนล่าสุด','error');
    $('#history-edit-preparer')?.focus();
    return;
  }
  const latestCloser=staffDisplayName(enteredCloser);
  const now=new Date();
  records[index]=normalizeHistoryRecord({...current,customer:($('#history-edit-customer')?.value||'').trim(),villa:($('#history-edit-villa')?.value||'').trim(),cashier:latestCloser,preparer:latestCloser,closedBy:latestCloser,total,netTotal:total,discount:0,pendingTotal:pending,updatedAt:now.toISOString()});
  saveInvoiceHistory(records);
  state.closedBookings=state.closedBookings.map(record=>record.reference===id?{...record,customer:records[index].customer,villa:records[index].villa,cashier:latestCloser,preparer:latestCloser,closedBy:latestCloser,total,pendingTotal:pending,updatedAt:records[index].updatedAt}:record);
  saveClosedBookings();
  $('#modal-root').innerHTML='';
  syncInvoiceHistoryState();
  recordAudit('แก้ไข Invoice','Invoice',id,current,records[index],{reason:'แก้ไขจากประวัติใบแจ้งหนี้',updatedBy:latestCloser});
  showToast(`แก้ไขประวัติ ${id} และบันทึกผู้ปิดยอดล่าสุด (${latestCloser}) แล้ว`);
}
function deleteInvoiceHistory(id){
  const records=loadInvoiceHistory();
  const current=records.find(record=>record.id===id);
  if(!current)return;
  if(closeRoundIsLocked(current.businessDate)){showToast(`ลบไม่ได้: รอบ ${current.businessDate} ถูก Submit และ Lock แล้ว`,'error');return}
  saveInvoiceHistory(records.filter(record=>record.id!==id));
  state.closedBookings=state.closedBookings.filter(record=>record.reference!==id);
  saveClosedBookings();
  $('#modal-root').innerHTML='';
  syncInvoiceHistoryState();
  const actor=localStorage.getItem('scenery-last-login-email')||'Cashier';
  recordAudit('ลบ Invoice','Invoice',id,current,null,{reason:'ลบจากประวัติใบแจ้งหนี้',deletedBy:actor});
  showToast(`ลบประวัติ ${id} สำเร็จแล้ว`);
  if(typeof renderCloseRound==='function')renderCloseRound();
}
function requestDeleteInvoiceHistory(id){
  const record=loadInvoiceHistory().find(item=>item.id===id);
  if(!record)return;
  openModal(`ยืนยันลบประวัติ ${id}`,`<div class="history-delete-form"><p>ต้องการลบใบแจ้งหนี้ของ <strong>${esc(record.customer||'-')}</strong> (${esc(id)}) ออกจากประวัติใช่หรือไม่?</p><p class="muted">เมื่อกดยืนยัน รายการนี้จะถูกลบออกจากประวัติและตารางปิดรอบทันที</p></div>`,`<button class="button button-outline" data-close-modal>ยกเลิก</button><button class="button button-danger" data-history-delete-confirm="${esc(id)}"><span class="material-symbols-outlined">delete</span>ยืนยันลบ</button>`);
}
function exportInvoiceHistoryCsv(){
  const rows=historyRowsForToday();
  const headers=['Invoice','Customer','Villa','Business Date','Total','Pending','Cashier','Status'];
  const values=rows.map(record=>[record.id,record.customer,record.villa,record.businessDate,record.total,historyPendingTotal(record),record.cashier||record.preparer||localStorage.getItem('scenery-last-login-email')||'Cashier',historyStatus(record).label]);
  const csv='\uFEFF'+[headers,...values].map(row=>row.map(csvEscape).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download=`invoice-history-${historyDateKey()}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('ส่งออกประวัติใบแจ้งหนี้เป็น CSV แล้ว');
}
function installInvoiceHistory(){
  const filterBar=$('#view-history .filter-bar');
  if(filterBar){
    const selects=filterBar.querySelectorAll('select');
    if(selects[0]){selects[0].id='history-status-filter';selects[0].innerHTML='<option value="all">ทุกสถานะ</option><option value="ชำระแล้ว">ชำระแล้ว</option><option value="ค้างชำระ">ค้างชำระ</option>'}
    if(selects[1]){selects[1].id='history-date-filter';selects[1].disabled=true}
    const exportButton=filterBar.querySelector('button');
    if(exportButton&&!exportButton.dataset.historyExport){exportButton.dataset.historyExport='true';exportButton.addEventListener('click',exportInvoiceHistoryCsv)}
  }
  const realHistory=loadInvoiceHistory();
  state.invoices=realHistory.filter(record=>record.businessDate===historyDateKey()).map(record=>({id:record.id,customer:record.customer,time:record.time,total:record.total,status:record.status,statusClass:record.statusClass}));
  renderDashboard();renderHistory();
  $('#history-search')?.addEventListener('input',renderHistory);
  $('#history-status-filter')?.addEventListener('change',renderHistory);
  document.addEventListener('click',event=>{
    const edit=event.target.closest('[data-history-edit]');
    if(edit){event.preventDefault();openHistoryEdit(edit.dataset.historyEdit);return}
    const remove=event.target.closest('[data-history-delete]');
    if(remove){event.preventDefault();requestDeleteInvoiceHistory(remove.dataset.historyDelete);return}
    const confirmDelete=event.target.closest('[data-history-delete-confirm]');
    if(confirmDelete){event.preventDefault();deleteInvoiceHistory(confirmDelete.dataset.historyDeleteConfirm);return}
    const save=event.target.closest('[data-history-save]');
    if(save){event.preventDefault();editInvoiceHistory(save.dataset.historySave)}
  });
  if(typeof finalizeInvoice==='function'&&!finalizeInvoice.__historyWrapped){
    const baseFinalize=finalizeInvoice;
    const wrappedFinalize=async function(){
      const enteredPreparer=($('#settlement-preparer')?.value||'').trim();
      const selectedCashier=($('#cashier')?.value||'').trim();
      const beforeCount=state.closedBookings.length;
      await baseFinalize();
      if(state.closedBookings.length<=beforeCount)return;
      const source=state.closedBookings[0],now=new Date();
      const userStaff=enteredPreparer?staffDisplayName(enteredPreparer):(source.preparer?staffDisplayName(source.preparer):(selectedCashier?staffDisplayName(selectedCashier):'Now Narit'));
      source.preparer=userStaff;
      source.cashier=userStaff;
      source.closedBy=userStaff;
      source.villaCode=formValue('villa-code','');source.businessDate=source.docDate||historyDateKey(now);source.finalizedAt=now.toISOString();saveClosedBookings();
      const record=normalizeHistoryRecord({...source,id:source.reference,reference:source.reference,cashier:userStaff,preparer:userStaff,closedBy:userStaff,businessDate:historyDateKey(now),time:now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),finalizedAt:now.toISOString(),netTotal:Math.max(0,Number(source.total||0)-Number(source.discount||0))});
      record.businessDate=source.businessDate;
      const records=loadInvoiceHistory().filter(item=>item.id!==record.id);
      saveInvoiceHistory([record,...records]);
      syncInvoiceHistoryState();
      if(typeof renderInvoiceHistoryAllRecords==='function')renderInvoiceHistoryAllRecords();
      if(typeof renderCloseRound==='function'&&state.currentView==='close-round')renderCloseRound();
    };
    wrappedFinalize.__historyWrapped=true;
    finalizeInvoice=wrappedFinalize;
  }
  setInterval(()=>{const today=historyDateKey();if(today!==historyRenderedDay){syncInvoiceHistoryState()}},60000);
}
document.addEventListener('DOMContentLoaded',installInvoiceHistory);

/* Keep finalized invoices visible even when the invoice document date is not today. */
function renderInvoiceHistoryAllRecords(){
  const body=$('#history-body');
  if(!body)return;
  const records=loadInvoiceHistory();
  const dateFilter=$('#history-date-filter');
  const previousDate=dateFilter?.value||'all';
  const dates=[...new Set(records.map(record=>record.businessDate).filter(Boolean))].sort().reverse();
  if(dateFilter){
    dateFilter.innerHTML='<option value="all">ทุกวัน</option>'+dates.map(date=>`<option value="${esc(date)}">${esc(historyDisplayDate(date))}</option>`).join('');
    dateFilter.value=dates.includes(previousDate)?previousDate:'all';
    dateFilter.disabled=false;
  }
  const query=($('#history-search')?.value||'').trim().toLowerCase();
  const statusFilter=$('#history-status-filter')?.value||'all';
  const selectedDate=dateFilter?.value||'all';
  const rows=records.filter(record=>{
    const status=historyStatus(record);
    const cashierName=record.cashier||record.preparer||record.closedBy||record.user||'';
    const haystack=[record.id,record.reference,record.customer,record.villa,record.time,record.businessDate,cashierName,status.label,record.total,record.pendingTotal].join(' ').toLowerCase();
    return (selectedDate==='all'||record.businessDate===selectedDate)&&(!query||haystack.includes(query))&&(statusFilter==='all'||status.label===statusFilter);
  }).sort((a,b)=>{
    const dateCompare=String(b.businessDate||'').localeCompare(String(a.businessDate||''));
    return dateCompare||String(b.time||'').localeCompare(String(a.time||''));
  });
  body.innerHTML=rows.map(record=>{
    const status=historyStatus(record),pending=historyPendingTotal(record);
    const cashierName=staffDisplayName(record.cashier||record.preparer||record.closedBy||record.user);
    return `<tr><td><button class="button button-text mono strong-link" type="button" data-history-view="${esc(record.id)}" style="padding:0;font-weight:700;color:var(--primary);text-decoration:underline;cursor:pointer;background:none;border:none;">${esc(record.id)}</button></td><td><strong>${esc(record.customer||'-')}</strong><small class="table-subtext">${esc(record.villa||'-')} · ${esc(record.time||'-')} น.</small></td><td>${esc(historyDisplayDate(record.businessDate))}</td><td class="align-right strong-number">${money(record.total)}</td><td>${pending?`<span class="warning-text">รอเรียกเก็บ ${money(pending)}</span>`:'<span class="positive-text">ครบถ้วน</span>'}</td><td><span class="table-user" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--text);background:rgba(0,0,0,0.04);padding:2px 8px;border-radius:12px;"><span class="material-symbols-outlined" style="font-size:15px;color:var(--muted);">person</span>${esc(cashierName)}</span></td><td><span class="status-chip ${status.className}">${status.label}</span></td><td><div class="history-actions"><button class="button button-outline action-small" data-history-view="${esc(record.id)}"><span class="material-symbols-outlined">receipt_long</span>ดู INFORMATION BILL</button><button class="button button-outline action-small" data-history-edit="${esc(record.id)}"><span class="material-symbols-outlined">edit</span>แก้ไข</button><button class="button button-danger action-small" data-history-delete="${esc(record.id)}"><span class="material-symbols-outlined">delete</span>ลบ</button></div></td></tr>`;
  }).join('')||'<tr><td colspan="8"><div class="empty-state"><span class="material-symbols-outlined">receipt_long</span><p>ไม่พบประวัติใบแจ้งหนี้</p><small>เมื่อยืนยันใบแจ้งหนี้แล้ว รายการจะปรากฏที่นี่</small></div></td></tr>';
  historyRenderedDay=historyDateKey();
}

function installInvoiceHistoryFiltersFix(){
  const dateFilter=$('#history-date-filter');
  if(!dateFilter)return;
  const search=$('#history-search');
  const status=$('#history-status-filter');
  const date=dateFilter;
  [search,status,date].forEach(element=>{
    if(!element)return;
    const clone=element.cloneNode(true);
    element.replaceWith(clone);
  });
  renderHistory=renderInvoiceHistoryAllRecords;
  $('#history-search')?.addEventListener('input',renderHistory);
  $('#history-status-filter')?.addEventListener('change',renderHistory);
  $('#history-date-filter')?.addEventListener('change',renderHistory);
  renderHistory();
}
document.addEventListener('DOMContentLoaded',installInvoiceHistoryFiltersFix);

/* Centralized quantity handler so +/- keeps working after line rows are re-rendered. */
function adjustInvoiceLineQuantity(index,delta){
  const line=state.invoiceLines[Number(index)];
  if(!line)return;
  line.qty=Math.max(1,Math.floor(Number(line.qty||1)+Number(delta||0)));
  renderFormLines();
  if(typeof calculateInvoice==='function')calculateInvoice();
  if(typeof refreshInvoiceSummaryPanel==='function')refreshInvoiceSummaryPanel();
}
function installInvoiceQuantityControls(){
  if(document.documentElement.dataset.invoiceQuantityControls==='ready')return;
  document.documentElement.dataset.invoiceQuantityControls='ready';
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-line-index][data-qty]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    adjustInvoiceLineQuantity(button.dataset.lineIndex,button.dataset.qty);
  },true);
}
document.addEventListener('DOMContentLoaded',installInvoiceQuantityControls);

/* Search the large master-data lists before adding an invoice line. */
function installInvoiceItemSearch(){
  ['\u0e23\u0e31\u0e10 50%','\u0e17\u0e17\u0e17','\u0e44\u0e21\u0e48\u0e40\u0e23\u0e35\u0e22\u0e01\u0e40\u0e01\u0e47\u0e1a'].forEach(method=>{if(!paymentMethods.includes(method))paymentMethods.push(method)});
  [
    {type:'accommodation',selectId:'accommodation-select',inputId:'accommodation-search'},
    {type:'addon',selectId:'addon-select',inputId:'addon-search'}
  ].forEach(({type,selectId,inputId})=>{
    const select=$('#'+selectId);
    if(!select)return;
    const existing=$('#'+inputId);
    if(existing){
      if(existing.dataset.searchEnhanced)return;
      existing.dataset.searchEnhanced='true';
      const options=[...select.options].filter(option=>option.value!=='');
      const enhanceExistingSearch=()=>{
        const query=existing.value.trim().toLowerCase();
        const matches=options.filter(option=>option.textContent.toLowerCase().includes(query));
        const exact=options.find(option=>option.textContent.trim().toLowerCase()===query);
        if(exact||query&&matches.length===1){
          select.value=(exact||matches[0]).value;
          if(typeof fillRate==='function')fillRate(type);
        }else if(!query||!matches.length){
          select.value='';
        }
      };
      existing.addEventListener('input',enhanceExistingSearch);
      existing.addEventListener('change',enhanceExistingSearch);
      enhanceExistingSearch();
      return;
    }
    const input=document.createElement('input');
    input.id=inputId;
    input.type='search';
    input.className='invoice-search-input';
    input.placeholder='ค้นหารายการ...';
    input.setAttribute('aria-label','ค้นหารายการ');
    input.autocomplete='off';
    select.parentElement?.insertBefore(input,select);
    const options=[...select.options].filter(option=>option.value!=='');
    const filter=()=>{
      const query=input.value.trim().toLowerCase();
      const matches=options.filter(option=>option.textContent.toLowerCase().includes(query));
      options.forEach(option=>{option.hidden=Boolean(query)&&!option.textContent.toLowerCase().includes(query)});
      if(select.value&&!matches.some(option=>option.value===select.value))select.value='';
      if(query&&matches.length===1){
        select.value=matches[0].value;
        if(typeof fillRate==='function')fillRate(type);
      }
    };
    input.addEventListener('input',filter);
    filter();
  });
}

/* Normalize every finalized line into the workbook's income and payment columns. */
function installCloseRoundDataNormalization(){
  const categoryBase=closeRoundCategoryKey;
  closeRoundCategoryKey=function(line){
    const text=String(line?.category||'')+' '+String(line?.name||'');
    const value=text.toLowerCase();
    if(/extra.?bed|เตียงเสริม|ที่นอน/.test(value))return 'extraBed';
    if(/ht\s*\/?\s*sht|\bht\s*\d*/.test(value))return 'htSht';
    if(/food|beverage|bbq|package|afternoon|อาหาร|เครื่องดื่ม/.test(value))return 'food';
    const villaNames=Array.isArray(DATA?.villas)?DATA.villas.map(v=>String(v?.name||'').toLowerCase()).filter(Boolean):[];
    const isVilla=villaNames.some(name=>value.includes(name))||/villa|accommodation|วิลล่า|ห้องพัก|bathtub|jacuzzi|shower\s*duplex/.test(value);
    if(isVilla)return 'villa';
    if(/minibar|มินิบาร์/.test(value))return 'minibar';
    if(/dog|สุนัข|ชมสุนัข/.test(value))return 'dogActivity';
    if(/massage|นวด/.test(value))return 'massage';
    if(/\batv\b/.test(value))return 'atv';
    if(/\bev\b|charge\s*ev|ev\s*charger|ชาร์จ\s*ev/.test(value)&&!/e-voucher/.test(value))return 'ev';
    if(/souvenir|product|สินค้า|ของที่ระลึก/.test(value))return 'product';
    return categoryBase(line);
  };

  const paymentBase=closeRoundPaymentKey;
  closeRoundPaymentKey=function(method){
    const value=String(method||'').toLowerCase().replace(/\s+/g,'');
    if(/cash|เงินสด/.test(value))return 'cash';
    if(/card|credit|บัตรเครดิต/.test(value))return 'card';
    if(/qr|qrcode|คิวอาร์|คิวอาโค้ต/.test(value))return 'qr';
    if(/transfer|โอน|2c2p/.test(value))return 'transfer';
    if(/government|รัฐ50|รัฐบาล/.test(value))return 'government';
    if(/tat|ททท/.test(value))return 'tat';
    if(/nocharge|ไม่เรียกเก็บ|ฟรี/.test(value))return 'noCharge';
    return paymentBase(method);
  };

  const modelBase=closeRoundRecordModel;
  closeRoundRecordModel=function(record){
    const normalized={
      ...record,
      lines:Array.isArray(record?.lines)?record.lines.map(line=>({...line,qty:Math.max(1,Number(line.qty||1)),rate:Math.max(0,Number(line.rate||0)),deposit:Math.max(0,Number(line.deposit||0)),discountRate:Math.max(0,Number(line.discountRate||0)),discountAmount:Math.max(0,Number(line.discountAmount||0))})):[],
      payments:Array.isArray(record?.payments)?record.payments.map(payment=>({...payment,amount:Math.max(0,Number(payment.amount||0))})):[],
    };
    const row=modelBase(normalized);
    const pendingFromLines=normalized.lines.reduce((sum,line)=>sum+Math.max(0,Number(line.pendingCollection||0)),0);
    const pending=Math.max(0,Number(record?.pendingTotal||record?.pendingCollectionTotal||pendingFromLines||0));
    return {...row,pending,payments:{...row.payments,pending}};
  };
}

document.addEventListener('DOMContentLoaded',()=>{
  installInvoiceItemSearch();
  installCloseRoundDataNormalization();
});

/* Make the typed search value authoritative when adding an invoice line. */
function installInvoiceAddSelectionFix(){
  const customItemsKey='scenery-invoice-custom-items';
  const normalize=value=>cleanEnglishText(String(value||'')).trim().toLowerCase().replace(/\s+/g,' ');
  let customItems={accommodation:[],addon:[]};
  try{
    const saved=JSON.parse(localStorage.getItem(customItemsKey)||'{}');
    if(saved&&typeof saved==='object')customItems={accommodation:Array.isArray(saved.accommodation)?saved.accommodation:[],addon:Array.isArray(saved.addon)?saved.addon:[]};
  }catch{}
  const saveCustomItems=()=>{try{localStorage.setItem(customItemsKey,JSON.stringify(customItems))}catch{}};
  const baseItems=type=>type==='accommodation'?accommodationItems:addonItems;
  const allItems=type=>[...baseItems(type),...(customItems[type]||[])];
  const prefixFor=type=>type==='accommodation'?'accommodation':'addon';
  const optionsFor=type=>{
    const select=$(`#${prefixFor(type)}-select`);
    return [...select?.options||[]].filter(option=>option.value!=='');
  };
  const ensureSearchResults=type=>{
    const prefix=prefixFor(type),search=$(`#${prefix}-search`);
    if(!search)return null;
    let box=search.parentElement?.querySelector(`.invoice-search-results[data-results-for="${type}"]`);
    if(!box){box=document.createElement('div');box.className='invoice-search-results';box.dataset.resultsFor=type;search.insertAdjacentElement('afterend',box)}
    return box;
  };
  const renderSearchResults=type=>{
    const search=$(`#${prefixFor(type)}-search`),box=ensureSearchResults(type);
    if(!search||!box)return;
    const query=normalize(search.value);box.innerHTML='';
    if(!query){box.hidden=true;return}
    const matches=optionsFor(type).filter(option=>normalize(option.textContent).includes(query)).slice(0,50);
    if(!matches.length){box.hidden=true;return}
    matches.forEach(option=>{
      const button=document.createElement('button');button.type='button';button.className='invoice-search-result';button.textContent=option.textContent;button.addEventListener('mousedown',event=>event.preventDefault());button.addEventListener('click',()=>{search.value=option.textContent;const select=$(`#${prefixFor(type)}-select`);if(select)select.value=option.value;if(typeof fillRate==='function')fillRate(type);search.dispatchEvent(new Event('input',{bubbles:true}));search.focus()});box.appendChild(button);
    });
    box.hidden=false;
  };
  const refreshSuggestions=type=>{
    const prefix=prefixFor(type),select=$(`#${prefix}-select`),search=$(`#${prefix}-search`),list=$(`#${prefix}-options`);
    if(!select||!search)return;
    const query=normalize(search.value);
    if(list){
      list.innerHTML='';
      optionsFor(type).filter(option=>query&&normalize(option.textContent).includes(query)).forEach(option=>{
        const suggestion=document.createElement('option');suggestion.value=option.textContent;list.appendChild(suggestion);
      });
    }
    renderSearchResults(type);
  };
  const ensureCustomOptions=type=>{
    const select=$(`#${prefixFor(type)}-select`),base=baseItems(type);
    if(!select)return;
    (customItems[type]||[]).forEach((item,index)=>{
      const value=String(base.length+index);
      if([...select.options].some(option=>option.value===value))return;
      const option=document.createElement('option');option.value=value;option.textContent=item.name;option.dataset.custom='true';select.appendChild(option);
    });
  };
  const wireSearch=type=>{
    const prefix=prefixFor(type),search=$(`#${prefix}-search`),select=$(`#${prefix}-select`);
    if(!search||!select||search.dataset.addSelectionFix)return;
    search.dataset.addSelectionFix='true';
    ensureCustomOptions(type);
    const sync=()=>{
      const query=normalize(search.value),options=optionsFor(type),exact=options.find(option=>normalize(option.textContent)===query),matches=options.filter(option=>normalize(option.textContent).includes(query));
      if(exact){select.value=exact.value;if(typeof fillRate==='function')fillRate(type)}
      else if(query&&matches.length===1){select.value=matches[0].value;if(typeof fillRate==='function')fillRate(type)}
      else if(query&&!matches.some(option=>option.value===select.value))select.value='';
      refreshSuggestions(type);
    };
    search.addEventListener('input',sync);search.addEventListener('change',sync);search.addEventListener('focus',()=>refreshSuggestions(type));sync();
  };
  ['accommodation','addon'].forEach(type=>{ensureCustomOptions(type);wireSearch(type)});
  addLine=function(type){
    const prefix=prefixFor(type),select=$(`#${prefix}-select`),search=$(`#${prefix}-search`),categoryEl=type==='accommodation'?$('#accommodation-category'):$('#addon-category'),rateEl=type==='accommodation'?$('#accommodation-rate'):$('#addon-rate'),qtyEl=type==='accommodation'?$('#accommodation-qty'):$('#addon-qty'),items=allItems(type),query=normalize(search?.value),options=optionsFor(type),exact=options.find(option=>normalize(option.textContent)===query),matches=options.filter(option=>normalize(option.textContent).includes(query));
    let item=null,index=null;
    if(query){
      if(matches.length>1&&!exact){showToast('พบหลายรายการ กรุณาเลือกจากรายการที่แสดงก่อนเพิ่ม','error');return}
      const chosen=exact||matches[0];
      if(chosen){index=Number(chosen.value);item=items[index]}
      else item={name:cleanEnglishText(search.value.trim()),category:type==='accommodation'?'Accommodation':'Miscellaneous',rate:0,custom:true};
    }else if(select?.value!==''){
      index=Number(select.value);item=items[index];
    }
    if(!item){showToast('กรุณาเลือกรายการหรือพิมพ์รายการใหม่ก่อนเพิ่ม','error');return}
    const category=cleanEnglishText(categoryEl?.value?.trim()||item.category||(type==='accommodation'?'Accommodation':'Miscellaneous'));
    const rate=Math.max(0,Number(rateEl?.value||item.rate||0)),qty=Math.max(1,Number(qtyEl?.value||1));
    if(item.custom&&!customItems[type].some(saved=>normalize(saved.name)===normalize(item.name))){customItems[type].push({name:item.name,category,rate});saveCustomItems();ensureCustomOptions(type)}
    state.invoiceLines.push({type,name:item.name,category,sourceIndex:index,rate,deposit:0,depositMethod:'เงินสด',qty,discountRate:0,discountAmount:0,pendingCollection:0,pendingNote:''});
    if(select)select.value='';if(rateEl)rateEl.value='';if(qtyEl)qtyEl.value='1';if(search)search.value='';if(categoryEl)categoryEl.value='';refreshSuggestions(type);renderFormLines();if(typeof calculateInvoice==='function')calculateInvoice();showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`);
  };
}
document.addEventListener('DOMContentLoaded',installInvoiceAddSelectionFix);

function historyInvoiceDetailBody(record){
  const lines=Array.isArray(record.lines)?record.lines:[];
  const lineRows=lines.map(line=>{
    const gross=Math.max(0,Number(line.qty||0)*Number(line.rate||0));
    const rateDiscount=Math.min(100,Math.max(0,Number(line.discountRate||0)));
    const fixedDiscount=Math.max(0,Number(line.discountAmount||0));
    const discount=Math.min(gross,gross*rateDiscount/100+fixedDiscount);
    return '<tr><td>'+esc(line.category||'-')+'</td><td>'+esc(line.name||'-')+'</td><td class="align-center">'+Number(line.qty||0)+'</td><td class="align-right">'+money(line.rate)+'</td><td class="align-right">'+money(discount)+'</td><td class="align-right">'+money(line.deposit)+'</td><td class="align-right strong-number">'+money(Math.max(0,gross-discount))+'</td></tr>';
  }).join('');
  const paymentRows=(Array.isArray(record.payments)?record.payments:[]).filter(payment=>Number(payment.amount||0)>0).map(payment=>'<div><span>'+esc(payment.method||'-')+'</span><strong>'+money(payment.amount)+'</strong></div>').join('')||'<div><span>-</span><strong>'+money(0)+'</strong></div>';
  const subtotal=lines.reduce((sum,line)=>sum+Math.max(0,Number(line.qty||0)*Number(line.rate||0)),0);
  const pending=historyPendingTotal(record);
  const outstanding=Math.max(0,Number(record.total||0)-Number(record.deposit||0));
  return '<div class="history-invoice-form"><div class="form-grid three"><label>เลข Invoice<input value="'+esc(record.id||record.reference||'')+'" disabled></label><label>ลูกค้า / บริษัท<input value="'+esc(record.customer||'')+'" disabled></label><label>Villa / Room<input value="'+esc(record.villa||'')+'" disabled></label><label>Check-in<input value="'+esc(record.checkIn||'')+'" disabled></label><label>Check-out<input value="'+esc(record.checkOut||'')+'" disabled></label><label>วันที่เอกสาร<input value="'+esc(record.businessDate||record.docDate||'')+'" disabled></label><label>จำนวนคืน<input value="'+esc(record.nights||'')+'" disabled></label><label class="span-two">หมายเหตุ<input value="'+esc(record.remark||record.pendingCollectionNote||'')+'" disabled></label></div><div class="table-wrap"><table><thead><tr><th>หมวด</th><th>รายการ</th><th>จำนวน</th><th class="align-right">Rate</th><th class="align-right">ส่วนลด</th><th class="align-right">Deposit</th><th class="align-right">ยอดสุทธิ</th></tr></thead><tbody>'+lineRows+'</tbody></table></div><div class="history-payment-list"><h4>ช่องทางชำระเงิน</h4>'+paymentRows+'</div><div class="history-invoice-totals"><div><span>ยอดก่อนส่วนลด</span><strong>'+money(subtotal)+'</strong></div><div><span>ส่วนลด</span><strong>'+money(record.discount)+'</strong></div><div><span>Deposit รวม</span><strong>'+money(record.deposit)+'</strong></div><div><span>ยอดค้างชำระ</span><strong>'+money(outstanding)+'</strong></div><div><span>ยอดรอเก็บ</span><strong>'+money(pending)+'</strong></div><div class="total-row"><span>ยอดสุทธิ</span><strong>'+money(record.total)+'</strong></div></div></div>';
}

function historyInformationBillBody(record){
  const lines=Array.isArray(record.lines)?record.lines.map(line=>({...line,qty:Math.max(1,Number(line.qty||1)),rate:Math.max(0,Number(line.rate||0)),deposit:Math.max(0,Number(line.deposit||0)),discountAmount:Math.max(0,Number(line.discountAmount||0)),discountRate:Math.max(0,Number(line.discountRate||0))})):[];
  const payments=Array.isArray(record.payments)?record.payments.map(payment=>({...payment,amount:Math.max(0,Number(payment.amount||0))})):[];
  const subtotal=lines.reduce((sum,line)=>sum+lineAmount(line),0);
  const discount=Math.max(0,Number(record.discount||0));
  const deposit=lines.reduce((sum,line)=>sum+line.deposit,0)+payments.reduce((sum,payment)=>sum+payment.amount,0);
  const hasLineDiscount=lines.some(line=>line.discountAmount>0||line.discountRate>0);
  const discountScope=hasLineDiscount?'line':discount>0?'all':'none';
  const snapshot={subtotal,discount,discountScope,netTotal:Math.max(0,subtotal-discount),allAmount:discount,paymentDeposits:payments.reduce((sum,payment)=>sum+payment.amount,0)};
  
  const previousLines=state.invoiceLines,previousPayments=state.payments;
  let rows='';
  try{
    state.invoiceLines=lines;
    state.payments=payments;
    rows=previewItemRows(snapshot);
  }finally{
    state.invoiceLines=previousLines;
    state.payments=previousPayments;
  }
  
  const total=subtotal||Math.max(0,Number(record.total||0)+discount);
  const netTotal=Math.max(0,total-discount);
  const outstanding=Math.max(0,netTotal-deposit);
  const methods=[...new Set(payments.filter(payment=>payment.amount>0).map(payment=>payment.method||'-'))].join(', ')||'';
  const cashierName=staffDisplayName(record.cashier||record.preparer||record.closedBy);

  return `
    <div class="history-information-bill-wrap">
      <div class="invoice-preview-stage">
        <article class="invoice-preview-sheet history-information-bill">
          <header class="preview-header">
            <div class="preview-company">
              <img src="346973899_1639269593246469_4301917493848559029_n.jpg" alt="The Scenery">
              <div>
                <p>234 Moo 7, Suan Phueng</p>
                <p>Ratchaburi 70180</p>
                <p>Tel : +66 81 000 7070</p>
                <p>Fax : +66 32 206 370</p>
                <p>www.sceneryvintagefarm.com</p>
              </div>
            </div>
            <div class="preview-title">
              <h1>INFORMATION<br>BILL</h1>
              <div><span>Invoice No</span><strong>${esc(record.id||record.reference||'-')}</strong></div>
              <div><span>Date</span><strong>${esc(formatDate(record.docDate||record.businessDate||''))}</strong></div>
            </div>
          </header>
          <div class="preview-meta">
            <div><span>Reference No.</span><strong>${esc(record.reference||record.id||'-')}</strong></div>
            <div class="guest-meta"><span>Guest Name / No. of Guest</span><strong>${esc(record.customer||'-')}</strong></div>
            <div><span>Check-in Date</span><strong>${esc(formatDate(record.checkIn||''))}</strong></div>
            <div><span>Check-out Date</span><strong>${esc(formatDate(record.checkOut||''))}</strong></div>
            <div><span>No. of Nights</span><strong>${esc(record.nights||'1')}</strong></div>
            <div><span>Remark</span><strong>${esc(record.remark||methods||'-')}</strong></div>
          </div>
          <div class="preview-table-wrap">
            <table class="invoice-preview-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>QTY</th>
                  <th>Description</th>
                  <th>Rate<br>(per total QTY)</th>
                  <th>Deposit</th>
                  <th>Discount</th>
                  <th>Total THB</th>
                </tr>
              </thead>
              <tbody>
                ${rows||'<tr class="blank-line"><td colspan="7">-</td></tr>'}
              </tbody>
            </table>
          </div>
          <footer class="preview-footer">
            <div class="preview-agreement">
              I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company or association fails to pay for any part of the full amount of these charges.
              <div class="signature-row">
                <span>Guest Signature</span>
                <span>${esc(cashierName)} (Receptionist)</span>
              </div>
            </div>
            <div class="preview-totals">
              <div><span>Total</span><strong>${money(total)}</strong></div>
              <div><span>Deposit</span><strong>${money(deposit)}</strong></div>
              <div><span>Discount</span><strong>${money(discount)}</strong></div>
              <div class="total-outstanding"><span>Outstanding</span><strong>${outstanding===0?'฿0':money(outstanding)}</strong></div>
              <small>THAI BAHT</small>
            </div>
          </footer>
        </article>
      </div>
    </div>
  `;
}

function openInvoiceHistoryDetail(id){
  const record=loadInvoiceHistory().find(item=>String(item.id)===String(id)||String(item.reference)===String(id));
  if(!record)return;
  const actions=`
    <button class="button button-outline" type="button" data-history-load-invoice="${esc(record.id)}"><span class="material-symbols-outlined">edit</span>เปิดในหน้าสร้างใบแจ้งหนี้</button>
    <button class="button button-outline" type="button" onclick="window.print()"><span class="material-symbols-outlined">print</span>พิมพ์ใบแจ้งหนี้ / PDF</button>
    <button class="button button-primary" type="button" data-close-modal>ปิด</button>
  `;
  openModal('INFORMATION BILL · '+(record.id||record.reference||''),historyInformationBillBody(record),actions);
}

function installInvoiceHistoryDetailView(){
  const addViewButtons=()=>{
    document.querySelectorAll('#history-body [data-history-edit]').forEach(editButton=>{
      const actions=editButton.parentElement;
      if(!actions||actions.querySelector('[data-history-view]'))return;
      const button=document.createElement('button');
      button.type='button';
      button.className='button button-outline action-small';
      button.dataset.historyView=editButton.dataset.historyEdit;
      button.innerHTML='<span class="material-symbols-outlined">receipt_long</span>ดู INFORMATION BILL';
      actions.insertBefore(button,actions.firstChild);
    });
  };
  const baseRenderHistory=renderHistory;
  renderHistory=function(){baseRenderHistory();addViewButtons()};
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-history-view]');
    if(button){
      event.preventDefault();
      openInvoiceHistoryDetail(button.dataset.historyView);
      return;
    }
    const loadBtn=event.target.closest?.('[data-history-load-invoice]');
    if(loadBtn){
      event.preventDefault();
      const id=loadBtn.dataset.historyLoadInvoice;
      const rec=loadInvoiceHistory().find(item=>String(item.id)===String(id)||String(item.reference)===String(id));
      if(!rec)return;
      $('#modal-root').innerHTML='';
      if($('#folio'))$('#folio').value=rec.id||rec.reference||'';
      if($('#customer'))$('#customer').value=rec.customer||'';
      if($('#villa'))$('#villa').value=rec.villa||'';
      if($('#check-in'))$('#check-in').value=rec.checkIn||rec.docDate||'';
      if($('#check-out'))$('#check-out').value=rec.checkOut||rec.docDate||'';
      if($('#no-of-night'))$('#no-of-night').value=rec.nights||'1';
      if($('#remark'))$('#remark').value=rec.remark||'';
      if($('#doc-date'))$('#doc-date').value=rec.docDate||rec.businessDate||'';
      if($('#cashier'))$('#cashier').value=rec.cashier||rec.preparer||'';
      state.invoiceLines=Array.isArray(rec.lines)?rec.lines.map(l=>({...l})):[];
      state.payments=Array.isArray(rec.payments)?rec.payments.map(p=>({...p})):[];
      renderFormLines();
      renderPayments();
      calculateInvoice();
      renderInvoicePreview();
      setView('invoice');
      setInvoicePage('preview');
      showToast(`เปิดใบแจ้งหนี้ ${rec.id} ในหน้าใบแจ้งหนี้แล้ว`);
    }
  });
  renderHistory();
}
document.addEventListener('DOMContentLoaded',installInvoiceHistoryDetailView);

function installCloseRoundCategoryClarification(){
  const otherCategory=CLOSE_ROUND_CATEGORIES.find(item=>item.key==='other');
  if(otherCategory)otherCategory.label='\u0e2d\u0e37\u0e48\u0e19\u0e46 (Miscellaneous / Activities \u0e17\u0e35\u0e48\u0e44\u0e21\u0e48\u0e21\u0e35\u0e0a\u0e48\u0e2d\u0e07\u0e40\u0e09\u0e1e\u0e32\u0e30)';
  const previousCategoryKey=closeRoundCategoryKey;
  closeRoundCategoryKey=function(line){
    const value=(String(line?.category||'')+' '+String(line?.name||'')).toLowerCase();
    if(/complimentary|waffle|cake|muesli|yogurt|croissant|milk|e-voucher/.test(value))return 'food';
    if(/\bev\b|charge\s*ev|ev\s*charger/.test(value)&&!/e-voucher/.test(value))return 'ev';
    return previousCategoryKey(line);
  };
}
document.addEventListener('DOMContentLoaded',installCloseRoundCategoryClarification);

/* Invoice check-in/check-out date picker with a themed calendar popover. */
const invoiceCalendarMonths=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const invoiceCalendarWeekdays=['อา','จ','อ','พ','พฤ','ศ','ส'];
const invoiceCalendarState={inputId:null,year:new Date().getFullYear(),month:new Date().getMonth()};
function invoiceDateIso(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function invoiceDateObject(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return null;const [year,month,day]=String(value).split('-').map(Number),date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null}
function invoiceDateLabel(value){const date=invoiceDateObject(value);return date?date.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}):''}
function invoiceCalendarMinDate(inputId){return inputId==='check-out'?$('#check-in')?.dataset.dateValue||'':''}
function positionInvoiceCalendar(){const popover=$('#invoice-calendar-popover'),input=$(`#${invoiceCalendarState.inputId}`);if(!popover||!input)return;const rect=input.getBoundingClientRect(),width=popover.offsetWidth||310,height=popover.offsetHeight||360;let left=Math.min(Math.max(12,rect.left),window.innerWidth-width-12),top=rect.bottom+8;if(top+height>window.innerHeight-12)top=Math.max(12,rect.top-height-8);popover.style.left=`${left}px`;popover.style.top=`${top}px`}
function closeInvoiceCalendar(){invoiceCalendarState.inputId=null;$('#invoice-calendar-popover')?.remove()}
function renderInvoiceCalendar(){
  const input=$(`#${invoiceCalendarState.inputId}`);if(!input)return;
  let popover=$('#invoice-calendar-popover');if(!popover){popover=document.createElement('div');popover.id='invoice-calendar-popover';popover.className='invoice-calendar-popover';popover.setAttribute('role','dialog');popover.setAttribute('aria-label','เลือกวันที่');document.body.appendChild(popover)}
  const {year,month}=invoiceCalendarState,selected=input.dataset.dateValue||'',today=invoiceDateIso(new Date()),minDate=invoiceCalendarMinDate(input.id),firstDay=new Date(year,month,1).getDay(),daysInMonth=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:firstDay},()=>'<span class="invoice-calendar-empty" aria-hidden="true"></span>');
  for(let day=1;day<=daysInMonth;day++){const iso=invoiceDateIso(new Date(year,month,day)),disabled=minDate&&iso<minDate,classes=['invoice-calendar-day'];if(iso===selected)classes.push('selected');if(iso===today)classes.push('today');cells.push(`<button type="button" class="${classes.join(' ')}" data-invoice-calendar-action="select" data-date="${iso}" ${disabled?'disabled':''}>${day}</button>`)}
  popover.innerHTML=`<div class="invoice-calendar-head"><button type="button" class="invoice-calendar-nav" data-invoice-calendar-action="prev" aria-label="เดือนก่อนหน้า"><span class="material-symbols-outlined">chevron_left</span></button><div><strong>${invoiceCalendarMonths[month]}</strong><small>${year+543}</small></div><button type="button" class="invoice-calendar-nav" data-invoice-calendar-action="next" aria-label="เดือนถัดไป"><span class="material-symbols-outlined">chevron_right</span></button></div><div class="invoice-calendar-weekdays">${invoiceCalendarWeekdays.map(day=>`<span>${day}</span>`).join('')}</div><div class="invoice-calendar-grid">${cells.join('')}</div><div class="invoice-calendar-footer"><button type="button" class="invoice-calendar-today" data-invoice-calendar-action="today">วันนี้</button><button type="button" class="invoice-calendar-clear" data-invoice-calendar-action="clear">ล้างวันที่</button></div>`;
  requestAnimationFrame(positionInvoiceCalendar);
}
function openInvoiceCalendar(inputId){const input=$(`#${inputId}`);if(!input)return;const current=invoiceDateObject(input.dataset.dateValue),base=current||new Date();invoiceCalendarState.inputId=inputId;invoiceCalendarState.year=base.getFullYear();invoiceCalendarState.month=base.getMonth();renderInvoiceCalendar()}
function setInvoiceDate(inputId,value){const input=$(`#${inputId}`);if(!input)return;if(value){input.dataset.dateValue=value;input.value=invoiceDateLabel(value);input.classList.add('has-value');if(inputId==='check-in'){const checkout=$('#check-out');if(checkout?.dataset.dateValue&&checkout.dataset.dateValue<value){delete checkout.dataset.dateValue;checkout.value='';checkout.classList.remove('has-value')}}}else{delete input.dataset.dateValue;input.value='';input.classList.remove('has-value')}input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));closeInvoiceCalendar()}
function installInvoiceDatePickers(){
  ['check-in','check-out','doc-date'].forEach(id=>{const input=$(`#${id}`);if(!input||input.dataset.calendarReady)return;input.dataset.calendarReady='true';input.type='text';input.readOnly=true;input.placeholder='เลือกวันที่';input.classList.add('invoice-date-input');input.setAttribute('aria-haspopup','dialog');input.setAttribute('aria-readonly','true');const wrap=document.createElement('div');wrap.className='invoice-date-input-wrap';input.parentNode.insertBefore(wrap,input);wrap.append(input);const icon=document.createElement('span');icon.className='material-symbols-outlined invoice-date-icon';icon.textContent='calendar_month';wrap.append(icon)});
  document.addEventListener('click',event=>{const input=event.target.closest('.invoice-date-input');if(input){event.preventDefault();openInvoiceCalendar(input.id);return}const action=event.target.closest('[data-invoice-calendar-action]');if(action&&invoiceCalendarState.inputId){event.preventDefault();const type=action.dataset.invoiceCalendarAction;if(type==='prev'||type==='next'){invoiceCalendarState.month+=type==='next'?1:-1;if(invoiceCalendarState.month<0){invoiceCalendarState.month=11;invoiceCalendarState.year--}if(invoiceCalendarState.month>11){invoiceCalendarState.month=0;invoiceCalendarState.year++}renderInvoiceCalendar()}else if(type==='select'){setInvoiceDate(invoiceCalendarState.inputId,action.dataset.date)}else if(type==='today'){const today=invoiceDateIso(new Date()),min=invoiceCalendarMinDate(invoiceCalendarState.inputId);if(!min||today>=min)setInvoiceDate(invoiceCalendarState.inputId,today)}else if(type==='clear'){setInvoiceDate(invoiceCalendarState.inputId,'')}return}if(invoiceCalendarState.inputId&&!event.target.closest('#invoice-calendar-popover'))closeInvoiceCalendar()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeInvoiceCalendar()});
  document.addEventListener('click',event=>{if(event.target.closest('#reset-invoice'))setTimeout(()=>['check-in','check-out','doc-date'].forEach(id=>{const input=$(`#${id}`);if(input){delete input.dataset.dateValue;input.classList.remove('has-value')}}),0)});
  window.addEventListener('resize',positionInvoiceCalendar);window.addEventListener('scroll',positionInvoiceCalendar,true);
}
document.addEventListener('DOMContentLoaded',installInvoiceDatePickers);

/* Close round: mirror the source workbook columns while reading finalized invoices for the selected business date. */
const CLOSE_ROUND_CATEGORIES=[
  {key:'villa',label:'ค่าวิลล่า',className:'brown'},
  {key:'extraBed',label:'ที่นอนเสริม',className:'taupe'},
  {key:'food',label:'อาหาร',className:'green'},
  {key:'minibar',label:'มินิบาร์',className:'ochre'},
  {key:'htSht',label:'HT/SHT',className:'taupe'},
  {key:'dogActivity',label:'กิจกรรมชมสุนัข (92)',className:'ochre'},
  {key:'massage',label:'ค่านวด (0)',className:'brown'},
  {key:'product',label:'สินค้า (0)',className:'green'},
  {key:'atv',label:'ATV (0)',className:'ochre'},
  {key:'ev',label:'ชาร์จ EV (0)',className:'taupe'},
  {key:'other',label:'อื่นๆ',className:'brown'}
];
const CLOSE_ROUND_PAYMENTS=[
  {key:'cash',label:'เงินสด',className:'cash'},
  {key:'card',label:'บัตรเครดิต',className:'card'},
  {key:'qr',label:'QR Code',className:'qr'},
  {key:'transfer',label:'โอนเงิน SC',className:'deposit'},
  {key:'government',label:'รัฐ 50%',className:'deposit'},
  {key:'tat',label:'ลูกค้าททท.',className:'deposit'},
  {key:'noCharge',label:'ไม่เรียกเก็บ',className:'deposit'},
  {key:'pending',label:'ค้างชำระ',className:'pending'}
];
const CLOSE_ROUND_VILLA_CODES=[
  {value:'A — Rainy S',label:'A — Rainy S'},
  {value:'B — Rainy S',label:'B — Rainy S'},
  {value:'E1 — [โชว์]',label:'E1 — [โชว์]'},
  {value:'E2 — [โชว์+สปาคกิ้งไวน์]',label:'E2 — [โชว์+สปาคกิ้งไวน์]'},
  {value:'G1 — [Defender]',label:'G1 — [Defender]'},
  {value:'G2 จอง — [Range Rover]',label:'G2 จอง — [Range Rover]'},
  {value:'G3 เจ้าของ — [Range Rover]',label:'G3 เจ้าของ — [Range Rover]'},
  {value:'G5 — [08+Test Drive]',label:'G5 — [08+Test Drive]'},
  {value:'G6 — [08+Test Drive]',label:'G6 — [08+Test Drive]'}
];
function closeRoundVillaCodeField(value='',attrs=''){
  return `<input class="close-round-code-input" list="close-round-villa-code-options" value="${esc(value)}" data-close-round-edit="villaCode" aria-label="รหัส Villa / Room" placeholder="เช่น A — Rainy S" autocomplete="off"${attrs}>`;
}
const CLOSE_ROUND_DETAIL_EDITS_KEY='scenery-close-round-detail-edits';
function loadCloseRoundDetailEdits(){try{const value=JSON.parse(localStorage.getItem(CLOSE_ROUND_DETAIL_EDITS_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return{}}}
function closeRoundDetailEditFor(record){const key=String(record?.id||record?.reference||'');return loadCloseRoundDetailEdits()[key]||{}}
function saveCloseRoundDetailEdit(recordId,field,value){const key=String(recordId||'');if(!key)return;const date=closeRoundSelectedDate();if(closeRoundIsLocked(date)){showToast(`แก้ไขไม่ได้: รอบ ${date} ถูก Submit และ Lock แล้ว`,'error');renderCloseRound();return}const edits=loadCloseRoundDetailEdits();const before=edits[key]||{};edits[key]={...before,[field]:String(value||'').trim()};try{localStorage.setItem(CLOSE_ROUND_DETAIL_EDITS_KEY,JSON.stringify(edits));recordAudit('แก้ไขรายละเอียดปิดรอบ','Close Round',key,before,edits[key],{field,reason:'แก้ไขหมายเหตุหรือรหัส Villa'})}catch{showToast('บันทึกการแก้ไขรายละเอียดปิดรอบไม่สำเร็จ','error')}}
function closeRoundInvoiceDate(record){
  return String(record?.businessDate||record?.docDate||'').slice(0,10);
}
function closeRoundDefaultDate(){
  return historyDateKey();
}
function closeRoundSelectedDate(){
  const input=$('#close-round-date');
  if(!input)return closeRoundDefaultDate();
  return input.value||closeRoundDefaultDate();
}
function closeRoundCategoryKey(line){
  const text=`${line?.category||''} ${line?.name||''}`.toLowerCase();
  if(/extra.?bed|เตียงเสริม|ที่นอนเสริม|ที่นอน|เด้งราคา|extra.?person/.test(text))return 'extraBed';
  if(line?.type==='accommodation'||/villa|วิลล่า|ห้องพัก|accommodation/.test(text))return 'villa';
  if(/minibar|มินิบาร์/.test(text))return 'minibar';
  if(/ht\s*\/?\s*sht|ht\d|ht\s/.test(text))return 'htSht';
  if(/dog|สุนัข|ชมโชว์/.test(text))return 'dogActivity';
  if(/massage|นวด/.test(text))return 'massage';
  if(/atv/.test(text))return 'atv';
  if(/ev|ชาร์จ/.test(text))return 'ev';
  if(/souvenir|สินค้า|ของที่ระลึก|product/.test(text))return 'product';
  if(/food|อาหาร|beverage|เครื่องดื่ม|bbq|package|afternoon|waffle|cake/.test(text))return 'food';
  return 'other';
}
function closeRoundLineNet(line){
  const gross=Math.max(0,Number(line?.qty||0)*Number(line?.rate||0));
  const rate=Math.min(100,Math.max(0,Number(line?.discountRate||0)));
  const fixed=Math.max(0,Number(line?.discountAmount||0));
  return Math.max(0,gross-Math.min(gross,gross*rate/100+fixed));
}
function closeRoundPaymentKey(method){
  const value=String(method||'').toLowerCase();
  if(value.includes('สด'))return 'cash';
  if(value.includes('บัตร')||value.includes('card'))return 'card';
  if(value.includes('qr')||value.includes('คิว')||value.includes('code'))return 'qr';
  if(value.includes('โอน')||value.includes('transfer')||value.includes('2c2p'))return 'transfer';
  if(value.includes('รัฐ'))return 'government';
  if(value.includes('ททท'))return 'tat';
  if(value.includes('ไม่เรียกเก็บ'))return 'noCharge';
  return 'cash';
}
function closeRoundRecords(date){
  const target=String(date||'').slice(0,10);
  return loadInvoiceHistory().filter(record=>{
    const bDate = String(record?.businessDate||'').slice(0,10);
    const dDate = String(record?.docDate||'').slice(0,10);
    return bDate === target || dDate === target;
  });
}
function closeRoundRecordModel(record){
  const categories=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0]));
  (record.lines||[]).forEach(line=>{categories[closeRoundCategoryKey(line)]+=closeRoundLineNet(line)});
  const total=Math.max(0,Number(record.netTotal??(record.total||0)-Number(record.discount||0))||Object.values(categories).reduce((sum,value)=>sum+value,0));
  const payments=Object.fromEntries(CLOSE_ROUND_PAYMENTS.map(item=>[item.key,0]));
  (record.payments||[]).forEach(payment=>{payments[closeRoundPaymentKey(payment.method)]+=Math.max(0,Number(payment.amount||0))});
  const pending=Math.max(0,Number(record.pendingTotal||0));
  payments.pending+=pending;
  const deposit=Math.max(0,Number(record.deposit||0));
  return {...record,categories,payments,total,deposit,outstanding:Math.max(0,total-deposit),pending};
}
const baseCloseRoundCategoryKey=closeRoundCategoryKey;
closeRoundCategoryKey=function(line){const text=`${line?.category||''} ${line?.name||''}`.toLowerCase();if(line?.type!=='accommodation'&&/food|beverage|bbq|package|afternoon/.test(text))return 'food';return baseCloseRoundCategoryKey(line)}
const baseCloseRoundRecordModel=closeRoundRecordModel;
closeRoundRecordModel=function(record){
  const base=baseCloseRoundRecordModel(record),grossBy=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0]));
  let lineDiscountTotal=0;
  (record.lines||[]).forEach(line=>{const gross=Math.max(0,Number(line.qty||0)*Number(line.rate||0)),net=closeRoundLineNet(line),key=closeRoundCategoryKey(line);grossBy[key]+=gross;lineDiscountTotal+=Math.max(0,gross-net)});
  const billDiscount=Math.max(0,Number(record.discount||0)),remainingDiscount=Math.max(0,billDiscount-lineDiscountTotal),grossTotal=Object.values(grossBy).reduce((sum,value)=>sum+value,0),categories={...base.categories};
  if(remainingDiscount&&grossTotal){CLOSE_ROUND_CATEGORIES.forEach(item=>{categories[item.key]=Math.max(0,categories[item.key]-remainingDiscount*grossBy[item.key]/grossTotal)})}
  const total=Math.max(0,Number(record.netTotal??(Number(record.total||0)-billDiscount))||Object.values(categories).reduce((sum,value)=>sum+value,0)),categorySum=Object.values(categories).reduce((sum,value)=>sum+value,0),categoryCorrection=total-categorySum;
  if(Math.abs(categoryCorrection)>0.005)categories.other=Math.max(0,categories.other+categoryCorrection);
  const payments={...base.payments};
  (record.lines||[]).forEach(line=>{const amount=Math.max(0,Number(line.deposit||0));if(amount)payments[closeRoundPaymentKey(line.depositMethod||'เงินสด')]+=amount});
  payments.pending=Math.max(0,Number(record.pendingTotal||0));
  const villaMatch=DATA.villas.find(v=>v.name===record.villa||v.reference===record.villa);
  return {...base,villa:villaMatch?.name||record.villa||'',categories,payments,total,deposit:Math.max(0,Number(record.deposit||0)),outstanding:Math.max(0,total-Math.max(0,Number(record.deposit||0))),pending:payments.pending,villaCode:record.villaCode||''};
}
function formatDayOnly(dateStr){
  if(!dateStr||dateStr==='-')return '';
  const str=String(dateStr).trim();
  if(!str||str==='-')return '';
  const isoMatch=str.match(/^\d{4}-\d{2}-(\d{1,2})/);
  if(isoMatch)return String(parseInt(isoMatch[1],10));
  const slashMatch=str.match(/^(\d{1,2})[\/\-]/);
  if(slashMatch)return String(parseInt(slashMatch[1],10));
  const thaiMatch=str.match(/^(\d{1,2})\s+/);
  if(thaiMatch)return String(parseInt(thaiMatch[1],10));
  if(/^\d{1,2}$/.test(str))return str;
  const d=new Date(str);
  if(!isNaN(d.getDate()))return String(d.getDate());
  return str;
}
function closeRoundNumberCell(value){
  const num=Number(value||0);
  if(!num||Math.abs(num)<0.005)return '';
  const hasDecimals=Math.abs(num%1)>=0.005;
  return num.toLocaleString('en-US',{
    minimumFractionDigits:hasDecimals?2:0,
    maximumFractionDigits:2
  });
}
function closeRoundMoneyCell(value){return closeRoundNumberCell(value)}
function closeRoundVillaLabel(value){return String(value||'-').replace(/\s+Villa$/i,'')}
const MANUAL_SPLIT_STAYS_KEY = 'scenery-close-round-manual-split-stays';
function loadManualSplitStays(date) {
  try {
    const all = JSON.parse(localStorage.getItem(MANUAL_SPLIT_STAYS_KEY) || '[]');
    return Array.isArray(all) ? all.filter(s => !date || s.businessDate === date) : [];
  } catch { return []; }
}
function saveManualSplitStay(stay) {
  try {
    const all = JSON.parse(localStorage.getItem(MANUAL_SPLIT_STAYS_KEY) || '[]');
    all.push(stay);
    localStorage.setItem(MANUAL_SPLIT_STAYS_KEY, JSON.stringify(all));
  } catch {}
}

function addDaysToDateStr(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function matchVillaFromText(text) {
  if (!text) return '';
  const clean = String(text).trim();
  const found = CLOSE_ROUND_SOURCE_VILLAS.find(v => clean.toLowerCase().includes(v.toLowerCase()));
  if (found) return found;
  const match = clean.match(/^(?:Villa\s+)?(\d{2,3})/i);
  if (match) {
    const num = String(Number(match[1]));
    const foundByNum = CLOSE_ROUND_SOURCE_VILLAS.find(v => {
      const vMatch = v.match(/^(\d{2,3})/);
      return vMatch && String(Number(vMatch[1])) === num;
    });
    if (foundByNum) return foundByNum;
  }
  return clean;
}

function isActualVillaLine(line) {
  if (!line) return false;
  const name = String(line.name || '').trim();
  const category = String(line.category || '').trim();
  const text = `${name} ${category}`.toLowerCase();

  // Explicitly exclude Extra Bed, Packages, Complimentary, BBQ, Food, Waffles, Cakes, Minibar, Addons
  if (/extra\s*bed|เตียงเสริม|ที่นอนเสริม|extra\s*person|ผู้เข้าพักเสริม|ที่นอน|เด้งราคา|waffle|cake|muesli|yogurt|croissant|milk|bbq|food|package|voucher|coupon|dinner|lunch|breakfast|afternoon|souvenir|activity|massage|atv|ev\b|keycard|ice|น้ำแข็ง/i.test(text)) {
    return false;
  }

  // Must match one of the 11 base villas or have a villa number/name
  if (CLOSE_ROUND_SOURCE_VILLAS.some(v => text.includes(v.toLowerCase()))) {
    return true;
  }

  const matched = matchVillaFromText(name);
  if (matched && CLOSE_ROUND_SOURCE_VILLAS.includes(matched)) {
    return true;
  }

  if (/^(?:villa\s*)?\d{2,3}/i.test(name)) {
    return true;
  }

  return false;
}

function extractInvoiceStays(record) {
  if (!record) return [];
  const lines = Array.isArray(record.lines) ? record.lines : [];
  const villaLines = lines.filter(isActualVillaLine);

  const mainCheckIn = record.checkIn || record.docDate || record.businessDate || '';
  const mainCheckOut = record.checkOut || addDaysToDateStr(mainCheckIn, 1);
  const mainVilla = matchVillaFromText(record.villa) || (villaLines[0] ? matchVillaFromText(villaLines[0].name) : '') || '';

  if (villaLines.length <= 1) {
    return [{
      stayIndex: 1,
      isSplitStay: false,
      villa: mainVilla,
      villaCode: record.villaCode || '',
      customer: record.customer || '',
      checkIn: mainCheckIn,
      checkOut: mainCheckOut,
      rate: Number(record.total || 0),
      deposit: Number(record.deposit || 0),
      netTotal: Number(record.total || 0),
      record: record
    }];
  }

  let currentIn = mainCheckIn;
  return villaLines.map((line, index) => {
    const lineVilla = matchVillaFromText(line.name) || matchVillaFromText(line.villa) || (index === 0 ? mainVilla : `Villa ${index + 1}`);
    const lineNights = Math.max(1, Number(line.qty || 1));
    const lineIn = line.checkIn || currentIn;
    const lineOut = line.checkOut || addDaysToDateStr(lineIn, lineNights);
    currentIn = lineOut;

    const lineRate = Number(line.rate || 0) * lineNights;
    const lineDeposit = Number(line.deposit || 0);

    return {
      stayIndex: index + 1,
      isSplitStay: index > 0,
      villa: lineVilla,
      villaCode: line.villaCode || (index === 0 ? (record.villaCode || '') : ''),
      customer: record.customer || '',
      checkIn: lineIn,
      checkOut: lineOut,
      rate: lineRate,
      deposit: lineDeposit,
      line: line,
      record: record,
      parentVilla: index > 0 ? (matchVillaFromText(villaLines[0].name) || mainVilla) : ''
    };
  });
}

function closeRoundVillaTemplateKey(value){
  const match=String(value||'').trim().match(/^(\d{2,3})/);
  return match?String(Number(match[1])):String(value||'').trim().toLowerCase();
}
function closeRoundEmptyVillaRow(villa,locked,villaCode=''){
  const lockAttribute=locked?' disabled title="รอบถูก Submit และ Lock แล้ว"':'';
  const code=locked?'':closeRoundVillaCodeField(villaCode,' data-record-id=""');
  const note=locked?'':`<textarea class="close-round-note-input" rows="1" data-close-round-edit="remark" data-record-id="" aria-label="หมายเหตุ ${esc(villa)}" placeholder="" autocomplete="off"></textarea>`;
  const emptyCells=Array(CLOSE_ROUND_CATEGORIES.length+3+CLOSE_ROUND_PAYMENTS.length).fill('<td></td>').join('');
  return `<tr class="close-round-villa-placeholder"><td><strong>${esc(villa)}</strong></td><td>${code}</td><td></td><td></td><td></td>${emptyCells}<td>${note}</td></tr>`;
}
const CLOSE_ROUND_EXTRA_VILLAS_KEY='scenery-close-round-extra-villas';
function loadCloseRoundExtraVillas(){try{const value=JSON.parse(localStorage.getItem(CLOSE_ROUND_EXTRA_VILLAS_KEY)||'[]');return Array.isArray(value)?value.filter(item=>item&&String(item.name||'').trim()):[]}catch{return[]}}
function saveCloseRoundExtraVilla(name,code){const cleanName=String(name||'').trim(),cleanCode=String(code||'').trim();if(!cleanName)return false;const items=loadCloseRoundExtraVillas();if(items.some(item=>String(item.name).toLowerCase()===cleanName.toLowerCase()))return false;items.push({name:cleanName,code:cleanCode});try{localStorage.setItem(CLOSE_ROUND_EXTRA_VILLAS_KEY,JSON.stringify(items));return true}catch{return false}}
function closeRoundAddVillaRow(locked){
  const totalColumns=5+CLOSE_ROUND_CATEGORIES.length+3+CLOSE_ROUND_PAYMENTS.length+1;
  const controls=locked?'<span class="muted">รอบถูกล็อกแล้ว</span>':`<input class="close-round-new-villa-name" data-close-round-new-villa="name" placeholder="เช่น 014 New Villa" aria-label="ชื่อ Villa ใหม่" autocomplete="off"><input class="close-round-new-villa-code" data-close-round-new-villa="code" placeholder="รหัส Villa" aria-label="รหัส Villa ใหม่" autocomplete="off"><button class="button button-outline" type="button" data-close-round-add-villa>เพิ่ม Villa</button>`;
  return `<tr class="close-round-villa-add-row"><td colspan="${totalColumns}">${controls}</td></tr>`;
}

function closeRoundTemplateEntries(records, selectedDate){
  const date = selectedDate || closeRoundSelectedDate();
  const activeRecords = (Array.isArray(records) ? records : closeRoundRecords(date)).filter(r => r && r.status !== 'Void');
  const staysByVillaKey = new Map();
  const continuationStays = [];

  activeRecords.forEach(record => {
    const stays = extractInvoiceStays(record);
    const model = closeRoundRecordModel(record);

    if (!stays || stays.length <= 1) {
      const mainVilla = (stays && stays[0] && stays[0].villa) ? stays[0].villa : (model.villa || record.villa || '');
      const stay = {
        villa: mainVilla || 'Walk-in / อื่นๆ',
        villaCode: record.villaCode || '',
        customer: record.customer || 'ลูกค้าทั่วไป',
        checkIn: formatDayOnly(record.checkIn || record.docDate),
        checkOut: formatDayOnly(record.checkOut || record.checkIn || record.docDate),
        categories: model.categories || {},
        total: Number(model.total || 0),
        deposit: Number(model.deposit || 0),
        outstanding: Number(model.outstanding || 0),
        payments: model.payments || {},
        remark: record.remark || record.pendingCollectionNote || '',
        recordId: record.id || record.reference || '',
        record: record,
        isSplitStay: false
      };
      const vKey = closeRoundVillaTemplateKey(mainVilla);
      if (mainVilla && vKey && CLOSE_ROUND_SOURCE_VILLAS.some(v => closeRoundVillaTemplateKey(v) === vKey)) {
        if (!staysByVillaKey.has(vKey)) staysByVillaKey.set(vKey, []);
        staysByVillaKey.get(vKey).push(stay);
      } else {
        // รายการอื่นที่สร้างใบแจ้งหนี้ ที่ไม่ใช่บ้านพัก -> ไปอยู่เพิ่มเติม
        continuationStays.push(stay);
      }
    } else {
      // Multiple stays in invoice: คืนล่าสุด (Last stay) -> ตารางหลัก 02-013; คืนแรก/คืนก่อนหน้า -> เพิ่มเติม
      stays.forEach((stay, idx) => {
        const isLatest = idx === stays.length - 1;
        const isFirst = idx === 0;
        const stayRate = Number(stay.rate || 0);
        const stayDeposit = Number(stay.deposit || (isLatest ? model.deposit : 0));
        const stayOutstanding = Math.max(0, stayRate - stayDeposit);

        const categories = {};
        CLOSE_ROUND_CATEGORIES.forEach(cat => {
          if (cat.key === 'villa') {
            categories[cat.key] = stayRate;
          } else if (isLatest) {
            categories[cat.key] = model.categories[cat.key] || 0;
          } else {
            categories[cat.key] = 0;
          }
        });

        const payments = {};
        CLOSE_ROUND_PAYMENTS.forEach(pay => {
          if (isLatest) {
            payments[pay.key] = model.payments[pay.key] || 0;
          } else {
            payments[pay.key] = pay.key === 'cash' ? stayOutstanding : 0;
          }
        });

        const otherStaysRate = stays.filter((_, i) => i !== (stays.length - 1)).reduce((s, x) => s + Number(x.rate || 0), 0);
        const stayTotal = isLatest ? Math.max(0, model.total - otherStaysRate) : stayRate;
        const stayRow = {
          villa: stay.villa || (idx === 0 ? model.villa : `Villa ${idx + 1}`),
          villaCode: stay.villaCode || (isLatest ? (record.villaCode || '') : ''),
          customer: record.customer || '',
          checkIn: formatDayOnly(stay.checkIn || record.checkIn),
          checkOut: formatDayOnly(stay.checkOut || record.checkOut),
          categories: categories,
          total: Number(stayTotal),
          deposit: Number(stayDeposit),
          outstanding: isLatest ? Math.max(0, stayTotal - stayDeposit) : Number(stayOutstanding),
          payments: payments,
          remark: stay.remark || record.remark || (isLatest ? (stay.parentVilla ? `พักต่อเนื่องจาก ${stay.parentVilla} (${record.id || ''})` : `พักต่อเนื่อง (${record.id || ''})`) : `พักคืนแรก (${record.id || ''})`),
          recordId: record.id || record.reference || '',
          record: record,
          isSplitStay: !isLatest
        };

        if (isLatest) {
          const vKey = closeRoundVillaTemplateKey(stayRow.villa);
          if (vKey && CLOSE_ROUND_SOURCE_VILLAS.some(v => closeRoundVillaTemplateKey(v) === vKey)) {
            if (!staysByVillaKey.has(vKey)) staysByVillaKey.set(vKey, []);
            staysByVillaKey.get(vKey).push(stayRow);
          } else {
            continuationStays.push(stayRow);
          }
        } else {
          // คืนแรก / คืนก่อนหน้า -> ลงในส่วน "เพิ่มเติม"
          continuationStays.push(stayRow);
        }
      });
    }
  });

  const baseEntries = [];

  // 1. The 11 base villas
  CLOSE_ROUND_SOURCE_VILLAS.forEach(villaName => {
    const vKey = closeRoundVillaTemplateKey(villaName);
    const matches = staysByVillaKey.get(vKey) || [];
    if (matches.length > 0) {
      matches.forEach(item => {
        baseEntries.push({
          hasData: true,
          villa: villaName,
          villaCode: item.villaCode || '',
          customer: item.customer || '',
          checkIn: item.checkIn || '',
          checkOut: item.checkOut || '',
          categories: item.categories || {},
          total: Number(item.total || 0),
          deposit: Number(item.deposit || 0),
          outstanding: Number(item.outstanding || 0),
          payments: item.payments || {},
          remark: item.remark || '',
          recordId: item.recordId || '',
          record: item.record || null,
          isSplitStay: false
        });
      });
    } else {
      baseEntries.push({
        hasData: false,
        villa: villaName,
        villaCode: '',
        customer: '',
        checkIn: '',
        checkOut: '',
        categories: {},
        total: 0,
        deposit: 0,
        outstanding: 0,
        payments: {},
        remark: '',
        recordId: '',
        record: null,
        isSplitStay: false
      });
    }
  });

  // 2. Extra entries under เพิ่มเติม (คืนแรก + บิลอื่นที่ไม่ใช่บ้านพัก)
  const extraEntries = [];
  continuationStays.forEach(item => {
    if (!item.customer && !item.total && !item.villa) return;
    extraEntries.push({
      hasData: true,
      villa: item.villa || 'Walk-in / อื่นๆ',
      villaCode: item.villaCode || '',
      customer: item.customer || '',
      checkIn: item.checkIn || '',
      checkOut: item.checkOut || '',
      categories: item.categories || {},
      total: Number(item.total || 0),
      deposit: Number(item.deposit || 0),
      outstanding: Number(item.outstanding || 0),
      payments: item.payments || {},
      remark: item.remark || '',
      recordId: item.recordId || '',
      record: item.record || null,
      isSplitStay: item.isSplitStay || false
    });
  });

  const allEntries = [...baseEntries, ...extraEntries];
  allEntries.baseEntries = baseEntries;
  allEntries.extraEntries = extraEntries;
  return allEntries;
}

function closeRoundRows(records, date){
  const selectedDate = date || closeRoundSelectedDate();
  const locked = closeRoundIsLocked(selectedDate);
  const lockAttr = locked ? ' disabled title="รอบถูก Submit และ Lock แล้ว"' : '';
  const data = closeRoundTemplateEntries(records, selectedDate);
  const baseEntries = data.baseEntries || data;
  const extraEntries = data.extraEntries || [];
  const totalColumns = 5 + CLOSE_ROUND_CATEGORIES.length + 3 + CLOSE_ROUND_PAYMENTS.length + 1;

  const catTotals = Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(c => [c.key, 0]));
  const payTotals = Object.fromEntries(CLOSE_ROUND_PAYMENTS.map(p => [p.key, 0]));
  let grandTotal = 0;
  let grandDeposit = 0;
  let grandOutstanding = 0;

  const renderSingleRow = (entry) => {
    const edit = entry.recordId ? closeRoundDetailEditFor({ id: entry.recordId }) : {};
    const villaCode = edit.villaCode !== undefined ? edit.villaCode : entry.villaCode;
    const remark = edit.remark !== undefined ? edit.remark : entry.remark;

    if (!entry.hasData) {
      return closeRoundEmptyVillaRow(entry.villa, locked, villaCode);
    }

    grandTotal += Number(entry.total || 0);
    grandDeposit += Number(entry.deposit || 0);
    grandOutstanding += Number(entry.outstanding || 0);
    CLOSE_ROUND_CATEGORIES.forEach(c => {
      catTotals[c.key] += Number(entry.categories[c.key] || 0);
    });
    CLOSE_ROUND_PAYMENTS.forEach(p => {
      payTotals[p.key] += Number(entry.payments[p.key] || 0);
    });

    const codeField = closeRoundVillaCodeField(villaCode, ` data-record-id="${esc(entry.recordId)}"${lockAttr}`);
    const noteField = `<textarea class="close-round-note-input" rows="1" data-close-round-edit="remark" data-record-id="${esc(entry.recordId)}" aria-label="หมายเหตุ" placeholder="พิมพ์หมายเหตุ" autocomplete="off"${lockAttr}>${esc(remark)}</textarea>`;

    const catCells = CLOSE_ROUND_CATEGORIES.map(c => `<td class="align-right">${closeRoundMoneyCell(entry.categories[c.key])}</td>`).join('');
    const payCells = CLOSE_ROUND_PAYMENTS.map(p => `<td class="align-right">${closeRoundMoneyCell(entry.payments[p.key])}</td>`).join('');
    const rowClass = entry.isSplitStay ? ' class="close-round-split-stay-row" style="background:#fcf8f3;"' : '';

    return `<tr${rowClass}>
      <td><strong>${esc(closeRoundVillaLabel(entry.villa))}</strong></td>
      <td>${codeField}</td>
      <td>${esc(entry.customer)}</td>
      <td class="align-center">${esc(entry.checkIn)}</td>
      <td class="align-center">${esc(entry.checkOut)}</td>
      ${catCells}
      <td class="align-right strong-number">${closeRoundNumberCell(entry.total)}</td>
      <td class="align-right">${closeRoundMoneyCell(entry.deposit)}</td>
      <td class="align-right ${entry.outstanding ? 'warning-text' : 'positive-text'}">${closeRoundMoneyCell(entry.outstanding)}</td>
      ${payCells}
      <td>${noteField}</td>
    </tr>`;
  };

  const baseRowsHtml = baseEntries.map(renderSingleRow).join('');

  let extraRowsHtml = '';
  if (extraEntries && extraEntries.length > 0) {
    const separatorHtml = `<tr class="close-round-separator-row" style="background:#f4ebe1;font-weight:700;border-top:2px solid #8a5d32;border-bottom:2px solid #8a5d32;">
      <td colspan="${totalColumns}" style="padding:6px 12px;font-size:12px;color:#5a3617;">
        <strong>เพิ่มเติม</strong>
      </td>
    </tr>`;
    extraRowsHtml = separatorHtml + extraEntries.map(renderSingleRow).join('');
  }

  const addVillaRow = closeRoundAddVillaRow(locked);
  return baseRowsHtml + extraRowsHtml + addVillaRow;
}
const closeRoundRowsFromInvoice = closeRoundRows;
const closeRoundEditableRowsFromInvoice = closeRoundRows;

function closeRoundAnomalies(records, date){
  const targetDate = String(date || closeRoundSelectedDate()).slice(0, 10);
  const allHistory = typeof loadInvoiceHistory === 'function' ? loadInvoiceHistory() : [];
  
  const dateRecords = allHistory.filter(r => {
    const bDate = String(r?.businessDate || '').slice(0, 10);
    const dDate = String(r?.docDate || '').slice(0, 10);
    return bDate === targetDate || dDate === targetDate;
  });

  const sourceList = dateRecords.length > 0 ? dateRecords : (Array.isArray(records) ? records : []);
  
  const anomalyRows = sourceList.map(closeRoundRecordModel).filter(row => {
    const pendingVal = Number(row.pending || 0) || Number(row.pendingTotal || 0) || Number(row.payments?.pending || 0);
    const frontDue = Math.max(0, Number(row.total || 0) - Number(row.deposit || 0));
    const frontPaid = CLOSE_ROUND_PAYMENTS.filter(p => p.key !== 'pending').reduce((sum, p) => sum + Number(row.payments?.[p.key] || 0), 0);
    const hasUnpaid = frontDue > 0 && frontPaid < frontDue;
    return pendingVal > 0 || hasUnpaid || String(row.status || '').includes('ค้าง');
  });

  if (!anomalyRows.length) {
    return '<div class="close-round-empty"><span class="material-symbols-outlined" style="color:var(--success,#2e7d32);">task_alt</span><p>ไม่พบรายการมียอดค้างชำระในวันที่เลือก (ชำระเงินครบถ้วนแล้ว)</p></div>';
  }

  return anomalyRows.map(row => {
    const id = row.id || row.reference || '-';
    const pendingVal = Number(row.pending || 0) || Number(row.pendingTotal || 0) || Number(row.payments?.pending || 0);
    const frontDue = Math.max(0, Number(row.total || 0) - Number(row.deposit || 0));
    const frontPaid = CLOSE_ROUND_PAYMENTS.filter(p => p.key !== 'pending').reduce((sum, p) => sum + Number(row.payments?.[p.key] || 0), 0);
    const unpaidVal = Math.max(0, frontDue - frontPaid);
    const displayAmount = pendingVal > 0 ? pendingVal : (unpaidVal > 0 ? unpaidVal : Number(row.total || 0));

    return `<div class="anomaly-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fff8f4;border:1px solid #ebd2c1;border-radius:12px;margin-bottom:10px;gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:38px;height:38px;border-radius:8px;background:#faeae5;color:#c94a29;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:22px;">warning</span>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button type="button" class="button button-text mono strong-link" data-history-view="${esc(id)}" style="padding:0;font-size:14px;font-weight:700;color:var(--primary);text-decoration:underline;cursor:pointer;background:none;border:none;">${esc(id)}</button>
            <span style="font-size:12.5px;background:#fde8e4;color:#b3261e;padding:2px 10px;border-radius:12px;font-weight:700;">
              มียอดค้างชำระ ${money(displayAmount)}
            </span>
          </div>
          <p style="margin:4px 0 0;font-size:12.5px;color:#66584e;">
            ลูกค้า: <strong>${esc(row.customer||'-')}</strong> · Villa: <strong>${esc(closeRoundVillaLabel(row.villa))}</strong> · ยอดรวม: ${money(row.total)}
          </p>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="button button-primary action-small" type="button" data-history-load-invoice="${esc(id)}">
          <span class="material-symbols-outlined" style="font-size:16px;">receipt_long</span>ไปยังใบแจ้งหนี้นี้
        </button>
        <button class="button button-outline action-small" type="button" data-history-view="${esc(id)}">
          <span class="material-symbols-outlined" style="font-size:16px;">visibility</span>ดูบิล
        </button>
      </div>
    </div>`;
  }).join('');
}
function csvEscape(value){return `"${String(value??'').replace(/"/g,'""')}"`}
function exportCloseRoundCsv(records,date){
  const headers=['Business Date','Villa','Villa Code','Invoice','Guest','Check-in','Check-out',...CLOSE_ROUND_CATEGORIES.map(item=>item.label),'Total Q','Deposit R','Outstanding S',...CLOSE_ROUND_PAYMENTS.map(item=>item.label),'Remark'];
  const rows=records.map(record=>{const row=closeRoundRecordModel(record);return [date,row.villa,row.villaCode,row.id||row.reference,row.customer,row.checkIn,row.checkOut,...CLOSE_ROUND_CATEGORIES.map(item=>row.categories[item.key]),row.total,row.deposit,row.outstanding,...CLOSE_ROUND_PAYMENTS.map(item=>row.payments[item.key]),row.remark||row.pendingCollectionNote||'']});
  const csv='\uFEFF'+[headers,...rows].map(row=>row.map(csvEscape).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`close-round-${date}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast(`ส่งออกข้อมูลปิดรอบ ${date} เป็น CSV แล้ว`);
}
function closeRoundPrintTable(source){
  const table=source?.cloneNode(true);
  if(!table)return null;
  table.querySelectorAll('input,textarea,select').forEach(field=>{
    const value=field.tagName==='SELECT'?(field.options[field.selectedIndex]?.textContent||''):field.value;
    const text=document.createElement('span');
    text.textContent=String(value||'');
    field.replaceWith(text);
  });
  table.querySelectorAll('button').forEach(button=>button.remove());
  table.querySelectorAll('.empty-state').forEach(empty=>empty.textContent='ยังไม่มีรายการ');
  return table;
}
function closeRoundBottomSummaryHtml(entries) {
  const activeList = (Array.isArray(entries) ? entries : []).filter(e => e && e.hasData);
  const totalSales = activeList.reduce((sum, e) => sum + Number(e.total || 0), 0);
  const totalDeposit = activeList.reduce((sum, e) => sum + Number(e.deposit || 0), 0);
  const frontIncome = Math.max(0, totalSales - totalDeposit);

  const payTotals = Object.fromEntries(CLOSE_ROUND_PAYMENTS.map(p => [p.key, 0]));
  activeList.forEach(e => {
    CLOSE_ROUND_PAYMENTS.forEach(p => {
      payTotals[p.key] += Number(e.payments?.[p.key] || 0);
    });
  });

  const pending = activeList.reduce((sum, e) => sum + (Number(e.payments?.pending || 0) || Number(e.outstanding || 0)), 0);

  return `<div class="close-round-bottom-summary-wrap" style="display:flex;justify-content:flex-end;margin-top:8px;">
    <table class="close-round-bottom-summary-table" style="width:280px;border-collapse:collapse;font-size:10px;line-height:1.15;border:1px solid #d2c2b4;background:#fff;border-radius:4px;overflow:hidden;">
      <tbody>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#493c31;font-weight:600;">รวม</td><td style="padding:3px 8px;text-align:right;font-weight:700;color:#2c2017;">${closeRoundMoneyCell(totalSales)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#55483d;">หักค่าบ้านพักชำระล่วงหน้า</td><td style="padding:3px 8px;text-align:right;color:#b25e16;font-weight:600;">${closeRoundMoneyCell(totalDeposit)}</td></tr>
        <tr style="border-bottom:1.5px solid #8a5d32;background:#f5eee6;"><td style="padding:4px 8px;font-weight:700;color:#5a3617;">รวมรายได้หน้า Front วันนี้</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:#5a3617;font-size:11px;">${closeRoundMoneyCell(frontIncome)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">เงินสด</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.cash)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">บัตรเครดิต</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.card)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">QR Code</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.qr)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">โอนเงิน SC</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.transfer)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">รัฐ 50%</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.government)}</td></tr>
        <tr style="border-bottom:1px solid #eee5dd;"><td style="padding:3px 8px;color:#66584e;">ททท.</td><td style="padding:3px 8px;text-align:right;font-weight:600;">${closeRoundMoneyCell(payTotals.tat)}</td></tr>
        <tr style="background:#faf7f4;">
          <td style="padding:3px 8px;color:#66584e;">ไม่เรียกเก็บ: <strong style="color:#2c2017;">${closeRoundMoneyCell(payTotals.noCharge)}</strong></td>
          <td style="padding:3px 8px;text-align:right;color:#a83232;">ค้างชำระ: <strong style="color:#a83232;">${closeRoundMoneyCell(pending)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function closeRoundPrintSummaryMarkup(records){
  const entries=closeRoundTemplateEntries(records);
  return closeRoundBottomSummaryHtml(entries);
}
function closeRoundSinglePageExcel(records,date){
  const source=document.querySelector('#view-close-round .close-round-detail-table'),table=closeRoundPrintTable(source);
  if(!table){showToast('ยังไม่มีตารางปิดรอบสำหรับส่งออก','error');return}
  const heading=`<div class="report-heading"><strong>รายละเอียดรายการปิดรอบ</strong><span>Business Date: ${esc(date)}</span></div>`,summary=closeRoundPrintSummaryMarkup(records);
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:6mm}html,body{margin:0;padding:0;background:#fff;color:#211a15;font-family:Arial,"Tahoma",sans-serif}.sheet{width:100%;mso-page-orientation:landscape;mso-fit-to-page:yes}.report-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm;padding-bottom:2mm;border-bottom:2px solid #6e442d;font-size:12px}.report-heading span{font-size:9px;color:#66584e}.close-round-detail-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:5px}.close-round-detail-table th,.close-round-detail-table td{border:1px solid #1f1b18;padding:2px 1px;line-height:1.15;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word}.close-round-detail-table th{background:#eee3d8;font-weight:700;text-align:center}.close-round-detail-table td{text-align:left}.close-round-detail-table .align-right{text-align:right}.close-round-detail-table th:nth-child(1),.close-round-detail-table td:nth-child(1){width:5.5%}.close-round-detail-table th:nth-child(2),.close-round-detail-table td:nth-child(2){width:6%}.close-round-detail-table th:nth-child(3),.close-round-detail-table td:nth-child(3){width:9%}.close-round-detail-table th:nth-child(4),.close-round-detail-table td:nth-child(4),.close-round-detail-table th:nth-child(5),.close-round-detail-table td:nth-child(5){width:3.5%}.close-round-detail-table th:nth-child(n+6):nth-child(-n+16),.close-round-detail-table td:nth-child(n+6):nth-child(-n+16){width:2.8%}.close-round-detail-table th:nth-child(n+17):nth-child(-n+19),.close-round-detail-table td:nth-child(n+17):nth-child(-n+19){width:3.8%}.close-round-detail-table th:nth-child(n+20):nth-child(-n+27),.close-round-detail-table td:nth-child(n+20):nth-child(-n+27){width:2.8%}.close-round-detail-table th:nth-child(28),.close-round-detail-table td:nth-child(28){width:7%}.close-round-bottom-summary-wrap{display:flex;justify-content:flex-end;margin-top:4mm}.close-round-bottom-summary-table{width:65mm;border-collapse:collapse;font-size:5.5px}.close-round-bottom-summary-table td{border:1px solid #1f1b18;padding:1px 2px}</style></head><body><div class="sheet">${heading}${table.outerHTML}${summary}</div></body></html>`;
  const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`close-round-${date}-single-page.xls`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast(`ส่งออกปิดรอบ ${date} เป็น Excel หน้าเดียวแล้ว`);
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-close-round-export]');if(!button||!button.textContent.includes('Excel'))return;event.preventDefault();event.stopImmediatePropagation();closeRoundSinglePageExcel(closeRoundRecords(closeRoundSelectedDate()),closeRoundSelectedDate())},true);
const CLOSE_ROUND_TEXT_TEMPLATES = [
  {
    id: 'others',
    title: 'หัวข้อ: อื่นๆ',
    badge: 'ทั่วไป / นวด / กิจกรรม',
    text: `อื่นๆ Grandma's Cafe by the Creek = ......... บาท
ปิคนิค ATV ยอด 100 บาท = เรียกเก็บ 0
ปิคนิค ATV ยอด 60 บาท = เรียกเก็บ 0
ตระกร้าปิคนิค เรียกเก็บ Defender = 500 บาท
อื่นๆ ม้าหมุน = ................. บาท
อื่นๆ SPS 3 = .............. บาท
อื่นๆ SPS 2 = .............. บาท
อื่นๆ กิจกรรมหน้าฟาร์ม = ............. บาท
อื่นๆ Happy Birthday Cake (23) = 200 บาท
อื่นๆ Happy Birthday วาฟเฟิล (22) = 195 บาท
----------------------------------------
- นวดไทย 1 ชั่วโมง จ่ายหมอนวด 300 บาท
- นวดอโรม่า 1 ชั่วโมง จ่ายหมอนวด 400 บาท
- นวดฝ่าเท้า 1 ชั่วโมง จ่ายหมอนวด 300 บาท
- นวดแก้อาการ 1 ชั่วโมง จ่ายหมอนวด 400 บาท
- นวดคอบ่าไหล่ 1 ชั่วโมง จ่ายหมอนวด 400 บาท
----------------------------------------
- ค่าTest Driveทดสอบรถ (ซื้อเพิ่ม) =4,500 บาท
-Pizzy DIY   = เเพ็กเกจ 0  ส่วนต่าง 80 บาท รายได้ 0`
  },
  {
    id: 'g3',
    title: 'หัวข้อ: G3 เจ้าของ [Range Rover]',
    badge: 'Range Rover',
    text: `[Range Rover]

ค่าวิลล่า ส่วนลด 15%=5,100 บาท (เรียกเก็บอินซ์เคป) 
ที่นอนเสริมปกติ = ...............บาท (เรียกเก็บอินซ์เคป) 
ค่าตะกร้าออกรูท = ................. บาท (เรียกเก็บอินซ์เคป) 
อาหารเย็นตรีมกระเหรี่ยง  = .................. บาท  (เรียกเก็บอินซ์เคป)  
มินิบาร์ปกติ /มีค่าใช้จ่ายทุกรายการ =........บาท (เรียกเก็บอินซ์เคป) 
ค่าชมสุนัข = 1,800 บาท (เรียกเก็บอินซ์เคป)`
  },
  {
    id: 'g5',
    title: 'หัวข้อ: G5 [08+Test Drive]',
    badge: '08+Test Drive',
    text: `[08+Test Drive]

ค่าวิลล่า(ส่วนลด15%) = 5,100 บาท (เก็บอินเคป)
ค่าตะกร้ารูทใหญ่ = 500 บาท (เก็บอินเคป)
อาหาร 800 บาท = เเพ็กเกจ 0  
HT 800 บาท = เเพ็กเกจ 0`
  },
  {
    id: 'g6',
    title: 'หัวข้อ: G6 [08+Test Drive]',
    badge: 'แพ็กเกจ 15,000.-',
    text: `[08+Test Drive]

ชำระบัตรเครดิต วันที่ ....................................
อาหาร 800 บาท = เเพ็กเกจ 0  
HT 800 บาท = เเพ็กเกจ 0   

แพ็จเกจ G6 = 15,000.-
ยอดค้างชำระ ........ (มาจากช่องค้างชำระ)
-ส่วนต่างหักจากค่าบ้าน = .........
(มาจาก 15,000 - ค่าบ้านเปล่า)
-ส่วนลด 15% ให้ Defender = .....(มาจากบ้านเปล่า ลด 15% เป็นยอดที่ลดไปเท่าไหร่)
รวมยอด .....+.......= ......
(มาจาก ยอดค้างชำระ + ยอดส่วนลดค่าบ้านที่ลดไปเท่าไหร่)
-หักค่าตะกร้าปิกนิค 500.-
เหลือยอดต้องชำระให้ Defender = ......
(มาจากเอายอดรวม - ตะกร้า 500 บาท)`
  },
  {
    id: 'g6_6000',
    title: 'หัวข้อ: (G6) สำหรับ **ค่าวิลล่า6,000 **',
    badge: 'วิลล่า 6,000.-',
    text: `(G6)  สำหรับ **ค่าวิลล่า6,000 **

ชำระบัตรเครดิต วันที่ ....................................
อาหาร 800 บาท = เเพ็กเกจ 0  
HT 800 บาท = เเพ็กเกจ 0   

ยอดค้างชำระ 9,400.-
-ส่วนต่างหักจากค่าบ้าน = 9,000.-
-ส่วนลด 15% ให้ Defender = 900.-
รวมยอด 9,000+900= 9,900.-
-หักค่าตะกร้าปิกนิค 500.-
เหลือยอดต้องชำระให้ Defender = 9,400.-`
  },
  {
    id: 'g6_7200',
    title: 'หัวข้อ: (G6) สำหรับ **ค่าวิลล่า7,200 **',
    badge: 'วิลล่า 7,200.-',
    text: `(G6)  สำหรับ **ค่าวิลล่า7,200 **

ชำระบัตรเครดิต วันที่ ....................................
อาหาร 800 บาท = เเพ็กเกจ 0  
HT 800 บาท = เเพ็กเกจ 0   

ยอดค้างชำระ 8,380.-
-ส่วนต่างหักจากค่าบ้าน =7,800.-
-ส่วนลด 15% ให้ Defender = 1,080.-
รวมยอด 7,800+1,080= 8,880.
-หักค่าตะกร้าปิกนิค 500.-
เหลือยอดต้องชำระให้ Defender = 8,380.-`
  }
];

function copyTextToClipboard(text, successCallback) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (typeof successCallback === 'function') successCallback();
    }).catch(() => fallbackCopyText(text, successCallback));
  } else {
    fallbackCopyText(text, successCallback);
  }
}

function fallbackCopyText(text, successCallback) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    if (typeof successCallback === 'function') successCallback();
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  textArea.remove();
}

function openCloseRoundNotesModal() {
  const cardsHtml = CLOSE_ROUND_TEXT_TEMPLATES.map((item, idx) => {
    const lineCount = (item.text.match(/\n/g) || []).length + 2;
    return `
    <div class="close-round-note-card" style="background:#ffffff;border:1px solid #e3d3c4;border-radius:12px;padding:14px 16px;margin-bottom:16px;box-shadow:0 2px 6px rgba(0,0,0,0.04);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:6px;">
          <strong style="font-size:14.5px;color:#3d2211;">${esc(item.title)}</strong>
          <span style="font-size:11px;background:#f4ebe1;color:#7a4b2a;padding:2px 8px;border-radius:12px;border:1px solid #dfcfbe;font-weight:600;">${esc(item.badge)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <button type="button" class="button button-outline action-small" data-copy-selection-index="${idx}" title="ลากคลุมเฉพาะคำที่ต้องการในช่อง แล้วกดปุ่มนี้เพื่อคัดลอก" style="display:inline-flex;align-items:center;gap:4px;font-size:11.5px;cursor:pointer;padding:4px 10px;border-radius:6px;">
            <span class="material-symbols-outlined" style="font-size:15px;">content_cut</span>
            <span>คัดลอกเฉพาะคำที่เลือก</span>
          </button>
          <button type="button" class="button button-primary action-small" data-copy-note-index="${idx}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;padding:5px 12px;border-radius:6px;">
            <span class="material-symbols-outlined" style="font-size:16px;">content_copy</span>
            <span>คัดลอกทั้งหัวข้อ</span>
          </button>
          <button type="button" class="button button-soft action-small" data-reset-note-index="${idx}" title="คืนค่าข้อความเริ่มต้น" style="display:inline-flex;align-items:center;gap:3px;font-size:11.5px;cursor:pointer;padding:4px 8px;border-radius:6px;color:#8a5433;">
            <span class="material-symbols-outlined" style="font-size:15px;">restart_alt</span>
          </button>
        </div>
      </div>
      <div style="position:relative;">
        <textarea id="note-textarea-${idx}" rows="${Math.min(14, Math.max(5, lineCount))}" style="width:100%;box-sizing:border-box;margin:0;padding:10px 12px;background:#faf6f2;border:1px solid #ebdccb;border-radius:8px;font-size:13px;line-height:1.6;color:#2c1e14;font-family:Consolas,Monaco,'Courier New',Courier,monospace;resize:vertical;outline:none;user-select:text !important;-webkit-user-select:text !important;" placeholder="แก้ไขข้อความหรือระบุยอดเงินที่นี่...">${esc(item.text)}</textarea>
      </div>
      <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
        <small style="color:#8c786a;font-size:11px;">💡 สามารถพิมพ์แก้ตัวเลข หรือลากเมาส์คลุมเฉพาะคำที่ต้องการแล้วกดคัดลอกได้</small>
      </div>
    </div>
  `;
  }).join('');

  const modalBody = `
    <div style="margin-bottom:14px;background:#fdf9f5;padding:12px 14px;border-radius:10px;border:1px solid #f0e2d5;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
      <div>
        <p style="margin:0;font-size:13px;color:#5a3820;font-weight:600;">เลือกวิธีคัดลอกได้ตามสะดวก:</p>
        <small style="color:#786555;display:block;margin-top:2px;">• <strong>คัดลอกทั้งหมด</strong> หรือ <strong>คัดลอกทั้งหัวข้อ</strong> หรือ <strong>ลากคลุมเฉพาะคำ/บรรทัดที่ต้องการ</strong> แล้วกดคัดลอกได้เลย</small>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button type="button" class="button button-outline action-small" id="btn-copy-selected-any" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:6px 12px;">
          <span class="material-symbols-outlined" style="font-size:16px;">content_cut</span>
          <span>คัดลอกคำที่ไฮไลต์</span>
        </button>
        <button type="button" class="button button-primary action-small" id="btn-copy-all-notes" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:6px 14px;background:linear-gradient(135deg,#8a5433 0%,#6b3f21 100%);">
          <span class="material-symbols-outlined" style="font-size:16px;">library_add_check</span>
          <span>คัดลอกทั้งหมดทุกหัวข้อ</span>
        </button>
      </div>
    </div>
    <div style="max-height:68vh;overflow-y:auto;padding-right:4px;">
      ${cardsHtml}
    </div>
  `;

  openModal(
    'ข้อความและหมายเหตุสำหรับปิดรอบ',
    modalBody,
    '<button class="button button-outline" data-close-modal>ปิดหน้าต่าง</button>'
  );

  const root = $('#modal-root');
  if (!root) return;

  // 1. Copy entire topic (with current textarea edits)
  root.querySelectorAll('[data-copy-note-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.copyNoteIndex);
      const template = CLOSE_ROUND_TEXT_TEMPLATES[idx];
      const ta = root.querySelector(`#note-textarea-${idx}`);
      const textToCopy = ta ? ta.value : template?.text;
      if (!textToCopy) return;

      copyTextToClipboard(textToCopy, () => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">check</span><span>คัดลอกแล้ว!</span>';
        btn.style.background = '#2e7d32';
        btn.style.borderColor = '#2e7d32';
        btn.style.color = '#ffffff';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
        showToast(`คัดลอก "${template?.title || 'ข้อความ'}" เรียบร้อยแล้ว`);
      });
    });
  });

  // 2. Copy selected words/lines inside specific textarea
  root.querySelectorAll('[data-copy-selection-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.copySelectionIndex);
      const ta = root.querySelector(`#note-textarea-${idx}`);
      let selectedText = '';
      if (ta && typeof ta.selectionStart === 'number' && typeof ta.selectionEnd === 'number' && ta.selectionStart !== ta.selectionEnd) {
        selectedText = ta.value.substring(ta.selectionStart, ta.selectionEnd).trim();
      }
      if (!selectedText) {
        const globalSel = window.getSelection() ? window.getSelection().toString().trim() : '';
        if (globalSel) selectedText = globalSel;
      }

      if (!selectedText) {
        showToast('กรุณาลากเมาส์คลุมคำที่ต้องการคัดลอกในกล่องข้อความก่อนครับ', 'warning');
        return;
      }

      copyTextToClipboard(selectedText, () => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;">check</span><span>คัดลอกคำแล้ว!</span>';
        btn.style.borderColor = '#2e7d32';
        btn.style.color = '#2e7d32';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
        showToast(`คัดลอกคำที่เลือก (${selectedText.length > 20 ? selectedText.slice(0, 20) + '...' : selectedText}) เรียบร้อยแล้ว`);
      });
    });
  });

  // 3. Reset textarea to original template
  root.querySelectorAll('[data-reset-note-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.resetNoteIndex);
      const template = CLOSE_ROUND_TEXT_TEMPLATES[idx];
      const ta = root.querySelector(`#note-textarea-${idx}`);
      if (ta && template) {
        ta.value = template.text;
        showToast(`คืนค่าข้อความ "${template.title}" เป็นค่าเริ่มต้นแล้ว`);
      }
    });
  });

  // 4. Copy all topics combined
  root.querySelector('#btn-copy-all-notes')?.addEventListener('click', () => {
    const allText = CLOSE_ROUND_TEXT_TEMPLATES.map((t, idx) => {
      const ta = root.querySelector(`#note-textarea-${idx}`);
      const val = ta ? ta.value : t.text;
      return `${t.title}\n${val}`;
    }).join('\n\n========================================\n\n');

    copyTextToClipboard(allText, () => {
      showToast('คัดลอกข้อความทุกหัวข้อเรียบร้อยแล้ว');
    });
  });

  // 5. Copy highlighted selection anywhere in modal
  root.querySelector('#btn-copy-selected-any')?.addEventListener('click', () => {
    let selectedText = '';
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      const s = activeEl.selectionStart;
      const e = activeEl.selectionEnd;
      if (typeof s === 'number' && typeof e === 'number' && s !== e) {
        selectedText = activeEl.value.substring(s, e).trim();
      }
    }
    if (!selectedText) {
      const sel = window.getSelection();
      if (sel) selectedText = sel.toString().trim();
    }

    if (!selectedText) {
      showToast('กรุณาลากเมาส์คลุมคำที่ต้องการคัดลอกก่อนครับ', 'warning');
      return;
    }

    copyTextToClipboard(selectedText, () => {
      showToast(`คัดลอกคำที่ไฮไลต์ (${selectedText.length > 25 ? selectedText.slice(0, 25) + '...' : selectedText}) แล้ว`);
    });
  });
}

function formatCloseRoundThaiDate(dateStr){
  if(!dateStr)return '';
  const str=String(dateStr).trim();
  const d=new Date(str.includes('T')?str:`${str}T00:00:00`);
  if(isNaN(d.getTime()))return str;
  const thMonths=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `ประจำวันที่ ${d.getDate()} ${thMonths[d.getMonth()]} ${d.getFullYear()+543}`;
}
function renderCloseRound(){
  const view=$('#view-close-round');if(!view)return;
  const oldOptions=$('#close-round-villa-code-options');
  if(oldOptions)oldOptions.remove();
  const date=closeRoundSelectedDate(),records=closeRoundRecords(date),entries=closeRoundTemplateEntries(records,date);
  const sales=entries.reduce((sum,row)=>sum+(row.hasData?Number(row.total||0):0),0);
  const deposit=entries.reduce((sum,row)=>sum+(row.hasData?Number(row.deposit||0):0),0);
  const outstanding=entries.reduce((sum,row)=>sum+(row.hasData?Number(row.outstanding||0):0),0);
  const pending=entries.reduce((sum,row)=>sum+(row.hasData?Number(row.payments?.pending||0):0),0);
  const closed=loadClosedRounds().some(row=>row.businessDate===date&&row.status==='Submitted');
  view.innerHTML=`<div class="page-heading close-round-header" style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#ffffff 0%,#fbf7f2 100%);padding:18px 24px;border-radius:14px;border:1px solid #ebdccb;margin-bottom:20px;box-shadow:0 2px 8px rgba(110,68,45,0.05);flex-wrap:wrap;gap:16px;">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#8a5433 0%,#5a331c 100%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(90,51,28,0.22);flex-shrink:0;">
        <span class="material-symbols-outlined" style="font-size:26px;">account_balance</span>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="margin:0;font-size:21px;font-weight:700;color:#351f11;letter-spacing:-0.2px;line-height:1.2;">รายงานปิดรอบประจำวัน</h2>
          <span style="font-size:13.5px;color:#6e4022;background:#f3e5d7;border:1px solid #dfcfbe;padding:3px 12px;border-radius:20px;font-weight:600;display:inline-flex;align-items:center;gap:5px;">
            <span class="material-symbols-outlined" style="font-size:16px;color:#8a5433;">calendar_month</span>${esc(formatCloseRoundThaiDate(date))}
          </span>
        </div>
        <p class="muted" style="margin:5px 0 0;font-size:13px;color:#78695d;">เดอะ ซีนเนอรี่ วินเทจ ฟาร์ม รีสอร์ท · ดึงเฉพาะ Invoice ที่ Finalized แล้วตาม Business Date</p>
      </div>
    </div>
    <div class="heading-actions" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span class="status-chip ${closed?'success':'warning'}">${closed?'ปิดรอบแล้ว':'รอตรวจสอบ'}</span>
      <button class="button button-soft" type="button" id="btn-close-round-notes-modal" style="display:inline-flex;align-items:center;gap:5px;font-size:12.5px;padding:6px 12px;cursor:pointer;background:#f5ece2;color:#6b3f21;border:1px solid #dfcfbe;border-radius:8px;font-weight:600;" title="คัดลอกข้อความสรุป / หมายเหตุปิดรอบ"><span class="material-symbols-outlined" style="font-size:18px;color:#8a5433;">content_paste</span><span>ข้อความสรุป / หมายเหตุ</span></button>
      <button class="button button-primary" id="submit-round" ${closed?'disabled':''}><span class="material-symbols-outlined">${closed?'lock':'lock_clock'}</span>${closed?'รอบถูกล็อกแล้ว':'Submit และ Lock รอบ'}</button>
      <button class="button button-outline" type="button" data-close-round-export="pdf"><span class="material-symbols-outlined">picture_as_pdf</span>PDF</button>
      <button class="button button-outline" type="button" data-close-round-export="excel"><span class="material-symbols-outlined">download</span>Excel</button>
  </div><div class="round-toolbar panel"><label>Business Date<input id="close-round-date" type="date" value="${esc(date)}"></label><label>รอบการปิด<select id="close-round-shift"><option value="daily">รอบประจำวัน · RECEPTION</option><option value="shift">รอบกะที่เลือกจากลิ้นชัก</option></select></label><div class="round-health"><span class="online-dot"></span><div><strong>${records.length?'ข้อมูลพร้อมตรวจสอบ':'รอข้อมูล Finalized'}</strong><small>${records.length?`${records.length} Invoice · อัปเดตตามวันที่เลือก`:'ยังไม่มีรายการของวันนี้'}</small></div></div></div><div class="round-metrics"><article><small>ยอดรวม (Q)</small><strong>${money(sales)}</strong><span>${records.length} Invoice Finalized</span></article><article><small>ชำระล่วงหน้า / Deposit (R)</small><strong>${money(deposit)}</strong><span>${entries.filter(row=>row.hasData&&row.deposit>0).length} รายการ</span></article><article><small>ยอดเรียกเก็บหน้า Front (S = Q - R)</small><strong>${money(outstanding)}</strong><span class="positive-text">${entries.filter(row=>row.hasData&&row.outstanding>0).length} รายการรับชำระหน้า Front</span></article><article><small>ค้างชำระ / ตรวจสอบ</small><strong class="${pending?'warning-text':'positive-text'}">${money(pending)}</strong><span class="${pending?'warning-text':'positive-text'}">${pending?`${entries.filter(row=>row.hasData&&row.payments?.pending>0).length} รายการรอเรียกเก็บ`:'ชำระครบถ้วนแล้ว (฿0)'}</span></article></div><article class="panel close-round-detail-panel"><div class="panel-heading" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;"><div style="display:flex;align-items:center;gap:10px;"><span class="title-icon"><span class="material-symbols-outlined">receipt_long</span></span><div><h3 style="margin:0;">รายละเอียดรายการตาม Villa และ Invoice</h3><small style="color:var(--muted);font-size:11px;">28 คอลัมน์ · แยกตามหมวดรายได้และการรับชำระ</small></div></div><div style="display:flex;align-items:center;gap:8px;"><span class="count-chip">${entries.filter(e=>e.hasData).length} รายการมีข้อมูล</span><div class="table-view-toggle-group" style="display:inline-flex;background:#ede4dc;padding:3px;border-radius:8px;gap:2px;"><button type="button" class="view-toggle-btn active" data-view-mode="standard" style="padding:4px 9px;border-radius:6px;border:0;font-size:11.5px;font-weight:600;cursor:pointer;background:#fff;color:var(--brown);box-shadow:0 1px 3px rgba(0,0,0,0.08);display:inline-flex;align-items:center;gap:4px;" title="โหมดสบายตา กว้าง อ่านตัวเลขชัดเจน"><span class="material-symbols-outlined" style="font-size:16px;">table_rows</span><span>สบายตา (กว้าง)</span></button><button type="button" class="view-toggle-btn" data-view-mode="fit" style="padding:4px 9px;border-radius:6px;border:0;font-size:11.5px;font-weight:600;cursor:pointer;background:transparent;color:var(--muted);display:inline-flex;align-items:center;gap:4px;" title="โหมดย่อพอดีจอ"><span class="material-symbols-outlined" style="font-size:16px;">fit_screen</span><span>พอดีจอ</span></button><button type="button" class="view-toggle-btn" data-view-mode="fullscreen" style="padding:4px 9px;border-radius:6px;border:0;font-size:11.5px;font-weight:600;cursor:pointer;background:transparent;color:var(--muted);display:inline-flex;align-items:center;gap:4px;" title="โหมดขยายเต็มหน้าจอ"><span class="material-symbols-outlined" style="font-size:16px;">fullscreen</span><span>เต็มจอ</span></button></div></div></div><div class="table-wrap close-round-detail-wrap"><table class="close-round-detail-table"><thead><tr><th rowspan="2">Villa Name</th><th rowspan="2">รหัส</th><th rowspan="2">ชื่อลูกค้า</th><th rowspan="2">In</th><th rowspan="2">Out</th>${CLOSE_ROUND_CATEGORIES.map(item=>`<th rowspan="2">${item.label}</th>`).join('')}<th rowspan="2" style="background:#e8dcce;color:#351d0d;">ยอดรวม (Q)</th><th rowspan="2">Deposit (R)</th><th rowspan="2" style="background:#efe1ce;color:#3e240f;">คงเหลือ (S)</th><th colspan="${CLOSE_ROUND_PAYMENTS.length}" style="background:#e4ebf5;color:#203a60;">รายได้หน้า Front (T–AA)</th><th rowspan="2">หมายเหตุ (AB)</th></tr><tr>${CLOSE_ROUND_PAYMENTS.map(item=>`<th>${item.label}</th>`).join('')}</tr></thead><tbody>${closeRoundRows(records,date)}</tbody></table></div></article><article class="panel anomalies"><div class="panel-heading"><div><span class="title-icon alert-icon"><span class="material-symbols-outlined">error</span></span><h3>รายการที่ต้องตรวจสอบ</h3></div><span class="status-chip ${pending>0?'warning':'success'}">${pending>0?`${entries.filter(row=>row.hasData&&row.payments?.pending>0).length} รายการค้างชำระ`:'เรียบร้อย'}</span></div><div class="anomaly-list">${closeRoundAnomalies(records,date)}</div></article>`;
  const codeOptions=document.createElement('datalist');
  codeOptions.id='close-round-villa-code-options';
  codeOptions.innerHTML=CLOSE_ROUND_VILLA_CODES.map(item=>`<option value="${esc(item.value)}">${esc(item.label)}</option>`).join('');
  view.append(codeOptions);
  $('#close-round-date')?.addEventListener('change',event=>{event.target.dataset.userSelected='true';renderCloseRound()});
  $('#submit-round')?.addEventListener('click',()=>openModal('ยืนยัน Submit และ Lock รอบ','<p>เมื่อยืนยันแล้ว รอบนี้จะถูกล็อกและไม่ควรแก้ไขรายการย้อนหลังโดยตรง</p><p class="muted">กรุณาตรวจสอบยอดค้างชำระและรายการผิดปกติก่อนส่งฝ่ายบัญชี</p>','<button class="button button-outline" data-close-modal>ยกเลิก</button><button class="button button-primary" data-submit-round>ยืนยัน Submit และ Lock</button>'));
  view.querySelector('[data-close-round-export="pdf"]')?.addEventListener('click',()=>printCloseRoundDetailOnePage());
  view.querySelector('[data-close-round-export="excel"]')?.addEventListener('click',()=>closeRoundSinglePageExcel(records,date));
  view.querySelector('#btn-close-round-notes-modal')?.addEventListener('click',()=>openCloseRoundNotesModal());
  view.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = btn.dataset.viewMode;
      const panel = view.querySelector('.close-round-detail-panel');
      if (!panel) return;
      view.querySelectorAll('.view-toggle-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--muted)';
        b.style.boxShadow = 'none';
      });
      btn.classList.add('active');
      btn.style.background = '#fff';
      btn.style.color = 'var(--brown)';
      btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';

      panel.classList.remove('fit-mode', 'fullscreen-mode');
      if (mode === 'fit') {
        panel.classList.add('fit-mode');
        try { localStorage.setItem('scenery-close-round-table-view', 'fit'); } catch(err){}
      } else if (mode === 'fullscreen') {
        panel.classList.add('fullscreen-mode');
      } else {
        try { localStorage.setItem('scenery-close-round-table-view', 'standard'); } catch(err){}
      }
    });
  });
  try {
    const savedMode = localStorage.getItem('scenery-close-round-table-view');
    if (savedMode === 'fit') {
      const fitBtn = view.querySelector('.view-toggle-btn[data-view-mode="fit"]');
      if (fitBtn) fitBtn.click();
    }
  } catch(err){}
  if(typeof installCloseRoundDetailTools==='function')installCloseRoundDetailTools();
}
function installCloseRound(){
  renderCloseRound();
  const view=$('#view-close-round');
  if(!view||view.dataset.detailEditsReady)return;
  view.dataset.detailEditsReady='true';
  const saveField=event=>{
    const field=event.target.closest('[data-close-round-edit]');
    if(!field)return;
    saveCloseRoundDetailEdit(field.dataset.recordId,field.dataset.closeRoundEdit,field.value);
  };
  const addVilla=event=>{
    const button=event.target.closest('[data-close-round-add-villa]');
    if(!button)return;
    const row=button.closest('tr'),name=row?.querySelector('[data-close-round-new-villa="name"]')?.value,code=row?.querySelector('[data-close-round-new-villa="code"]')?.value;
    if(!String(name||'').trim()){showToast('กรุณาระบุชื่อ Villa ใหม่','error');return}
    if(!saveCloseRoundExtraVilla(name,code)){showToast('ชื่อ Villa นี้มีอยู่แล้ว หรือบันทึกไม่สำเร็จ','error');return}
    showToast(`เพิ่ม Villa ${String(name).trim()} แล้ว`);
    renderCloseRound();
  };
  view.addEventListener('input',saveField);
  view.addEventListener('change',saveField);
  view.addEventListener('click',addVilla);
}
document.addEventListener('DOMContentLoaded',installCloseRound);
function persistCloseRoundDetailEdits(){
  document.querySelectorAll('#view-close-round [data-close-round-edit]').forEach(field=>saveCloseRoundDetailEdit(field.dataset.recordId,field.dataset.closeRoundEdit,field.value));
}
function resizeCloseRoundNote(field){if(!field)return;field.style.height='auto';field.style.height=`${Math.max(36,field.scrollHeight)}px`}
function closeRoundPrintCell(cell){
  const copy=cell.cloneNode(true);
  copy.querySelectorAll('input,textarea,select').forEach(field=>{
    const value=field.tagName==='SELECT'?(field.options[field.selectedIndex]?.textContent||''):field.value;
    const text=document.createElement('span');
    text.className='close-round-print-value';
    text.textContent=String(value||'-');
    field.replaceWith(text);
  });
  const value=document.createElement('div');
  value.className=`close-round-print-cell-content${cell.classList.contains('align-right')?' align-right':''}`;
  value.innerHTML=copy.innerHTML;
  return value;
}
function closeRoundPrintField(row,index,labels,wide=false){
  const field=document.createElement('div');
  field.className=`close-round-print-field${wide?' wide':''}`;
  const label=document.createElement('span');
  label.className='close-round-print-label';
  label.textContent=labels[index]||'';
  field.append(label,closeRoundPrintCell(row.cells[index]));
  return field;
}
function closeRoundPrintCard(row,labels){
  const card=document.createElement('article');
  card.className='close-round-print-card';
  const identity=document.createElement('div');
  identity.className='close-round-print-identity';
  [0,1,2,3,4].forEach(index=>identity.append(closeRoundPrintField(row,index,labels)));
  card.append(identity);
  const categories=document.createElement('div');
  categories.className='close-round-print-block';
  categories.innerHTML='<h5>รายการและหมวดรายได้</h5>';
  const categoryGrid=document.createElement('div');
  categoryGrid.className='close-round-print-grid categories';
  for(let index=5;index<=15;index++)categoryGrid.append(closeRoundPrintField(row,index,labels));
  categories.append(categoryGrid);card.append(categories);
  const totals=document.createElement('div');
  totals.className='close-round-print-totals';
  [16,17,18].forEach(index=>totals.append(closeRoundPrintField(row,index,labels)));
  card.append(totals);
  const payments=document.createElement('div');
  payments.className='close-round-print-block';
  payments.innerHTML='<h5>รายได้หน้า Front และช่องทางชำระเงิน</h5>';
  const paymentGrid=document.createElement('div');
  paymentGrid.className='close-round-print-grid payments';
  for(let index=19;index<=26;index++)paymentGrid.append(closeRoundPrintField(row,index,labels));
  payments.append(paymentGrid);card.append(payments);
  const note=document.createElement('div');
  note.className='close-round-print-note';
  note.append(closeRoundPrintField(row,27,labels,true));
  card.append(note);
  return card;
}
function prepareCloseRoundDetailPrint(){
  const panel=$('#view-close-round .close-round-detail-panel'),source=panel?.querySelector('.close-round-detail-table');
  if(!panel||!source)return;
  panel.querySelector('.close-round-print-layout')?.remove();
  const layout=document.createElement('div');
  layout.className='close-round-print-layout';
  const top=[...(source.tHead?.rows?.[0]?.cells||[])],second=[...(source.tHead?.rows?.[1]?.cells||[])];
  const labels=[...top.slice(0,19).map(cell=>cell.textContent.trim()),...second.map(cell=>cell.textContent.trim()),top[20]?.textContent.trim()||'หมายเหตุ'];
  const heading=document.createElement('div');
  heading.className='close-round-print-layout-heading';
  heading.innerHTML='<strong>รายละเอียดรายการส่งบัญชี</strong><span>Business Date: '+esc(closeRoundSelectedDate())+'</span>';
  layout.append(heading);
  const rows=[...(source.tBodies[0]?.rows||[])].filter(row=>row.cells.length>=28);
  rows.forEach(row=>layout.append(closeRoundPrintCard(row,labels)));
  if(!rows.length){const empty=document.createElement('p');empty.className='close-round-print-empty';empty.textContent='ยังไม่มี Invoice ที่ Finalized ในวันที่เลือก';layout.append(empty)}
  panel.append(layout);
}
/* Accounting print: replace the wide Front-income columns with one payment-channel column. */
function closeRoundPrintPaymentChannel(record){
  const row=closeRoundRecordModel(record);
  const channels=CLOSE_ROUND_PAYMENTS.filter(item=>Number(row.payments[item.key]||0)>0).map(item=>item.label);
  return channels.join(', ')||'-';
}
function closeRoundPrintTextCell(value,alignRight=false){
  const cell=document.createElement('td');
  if(alignRight)cell.className='align-right';
  const content=document.createElement('span');
  content.textContent=String(value??'').trim()||'';
  cell.append(content);
  return cell;
}
function closeRoundCompactPrintTable(source,records){
  const top=[...(source?.tHead?.rows?.[0]?.cells||[])];
  const headers=[...top.slice(0,19).map(cell=>cell.textContent.trim()),'ช่องทางชำระเงิน',top[20]?.textContent.trim()||'หมายเหตุ'];
  const table=document.createElement('table');
  const entries=closeRoundTemplateEntries(records),density=entries.length>40?'dense':entries.length>24?'compact':'regular';
  table.className=`close-round-detail-table close-round-print-compact-table close-round-print-density-${density}`;
  table.dataset.printRowCount=String(entries.length);
  const thead=document.createElement('thead');
  const headerRow=document.createElement('tr');
  headers.forEach(label=>{const th=document.createElement('th');th.textContent=label;headerRow.append(th)});
  thead.append(headerRow);table.append(thead);
  const tbody=document.createElement('tbody');
  entries.forEach(({record,villa})=>{
    if(!record){
      const values=[villa,'','','','',...Array(CLOSE_ROUND_CATEGORIES.length+3).fill(''),'', ''];
      const row=document.createElement('tr');
      values.forEach((value,index)=>row.append(closeRoundPrintTextCell(value,index>=5&&index<=18)));
      tbody.append(row);
      return;
    }
    const model=closeRoundRecordModel(record),edit=closeRoundDetailEditFor(record);
    const villaCode=Object.prototype.hasOwnProperty.call(edit,'villaCode')?edit.villaCode:model.villaCode;
    const remark=Object.prototype.hasOwnProperty.call(edit,'remark')?edit.remark:(model.remark||model.pendingCollectionNote||'');
    const values=[
      closeRoundVillaLabel(model.villa),villaCode,model.customer,formatDayOnly(model.checkIn),formatDayOnly(model.checkOut),
      ...CLOSE_ROUND_CATEGORIES.map(item=>closeRoundMoneyCell(model.categories[item.key])),
      closeRoundMoneyCell(model.total),closeRoundMoneyCell(model.deposit),closeRoundMoneyCell(model.outstanding),
      closeRoundPrintPaymentChannel(record),remark
    ];
    const row=document.createElement('tr');
    values.forEach((value,index)=>row.append(closeRoundPrintTextCell(value,index>=5&&index<=18)));
    tbody.append(row);
  });
  table.append(tbody);
  return table;
}
function prepareCloseRoundDetailPrint(){
  const date=arguments[0]||closeRoundSelectedDate();
  const panel=$('#view-close-round .close-round-detail-panel'),source=panel?.querySelector('.close-round-detail-wrap .close-round-detail-table')||panel?.querySelector('.close-round-detail-table');
  if(!panel||!source)return;
  panel.querySelector('.close-round-print-layout')?.remove();
  const layout=document.createElement('div');
  layout.className='close-round-print-layout';
  const heading=document.createElement('div');
  heading.className='close-round-print-layout-heading';
  heading.innerHTML='<strong>รายละเอียดรายการปิดรอบ</strong><span>Business Date: '+esc(date)+'</span>';
  const records=closeRoundRecords(date),table=closeRoundCompactPrintTable(source,records),summary=document.createElement('div');
  summary.innerHTML=closeRoundPrintSummaryMarkup(records);
  if(table)layout.append(heading,table,summary.firstElementChild);
  panel.append(layout);
}
function printCloseRoundDetailOnePage(){
  const date=closeRoundSelectedDate();
  persistCloseRoundDetailEdits();
  installCloseRoundDetailTools();
  prepareCloseRoundDetailPrint(date);
  const layout=document.querySelector('#view-close-round .close-round-print-layout');
  if(!layout){showToast('ไม่พบรายละเอียดสำหรับพิมพ์','error');return}
  document.querySelector('#close-round-print-frame')?.remove();
  const frame=document.createElement('iframe');
  frame.id='close-round-print-frame';
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  const printCss=`
    @page{size:A4 landscape;margin:0}
    *{box-sizing:border-box}
    html,body{width:297mm;height:210mm;margin:0;padding:0;overflow:hidden;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}
    .sheet{width:297mm;height:210mm;padding:5mm;overflow:hidden;background:#fff}
    .close-round-print-layout{width:287mm;height:200mm;overflow:hidden}
    .close-round-print-layout-heading{height:8mm;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1.5px solid #6e442d;padding:0 0 1.5mm;margin:0 0 2mm;font-size:10px;line-height:1.2}
    .close-round-print-layout-heading span{font-size:8px;color:#66584e}
    .close-round-detail-table{width:287mm;border-collapse:collapse;table-layout:fixed;font-size:5px;line-height:1.08}
    .close-round-detail-table th,.close-round-detail-table td{border:1px solid #29231e;padding:1px .7px;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word}
    .close-round-detail-table th{background:#eee3d8;font-weight:700;text-align:center}
    .close-round-detail-table td{text-align:left}
    .close-round-detail-table .align-right{text-align:right}
    .close-round-detail-table th:nth-child(1),.close-round-detail-table td:nth-child(1){width:7%}
    .close-round-detail-table th:nth-child(2),.close-round-detail-table td:nth-child(2){width:6%}
    .close-round-detail-table th:nth-child(3),.close-round-detail-table td:nth-child(3){width:13%}
    .close-round-detail-table th:nth-child(4),.close-round-detail-table td:nth-child(4),.close-round-detail-table th:nth-child(5),.close-round-detail-table td:nth-child(5){width:4%}
    .close-round-detail-table th:nth-child(n+6):nth-child(-n+16),.close-round-detail-table td:nth-child(n+6):nth-child(-n+16){width:2.8%}
    .close-round-detail-table th:nth-child(n+17):nth-child(-n+19),.close-round-detail-table td:nth-child(n+17):nth-child(-n+19){width:4.2%}
    .close-round-detail-table th:nth-child(20),.close-round-detail-table td:nth-child(20){width:9.6%}
    .close-round-detail-table th:nth-child(21),.close-round-detail-table td:nth-child(21){width:13%}
    .close-round-print-density-compact{font-size:4.7px}
    .close-round-print-density-dense{font-size:4.35px;line-height:1.02}
    .close-round-print-density-dense th,.close-round-print-density-dense td{padding:.5px .6px}
    .close-round-print-summary{display:flex;flex-wrap:wrap;gap:1.2mm;margin-top:2.2mm;padding-top:1.2mm;border-top:1.5px solid #6e442d;font-size:6px;line-height:1.1}
    .close-round-print-summary>div{flex:1 1 24mm;min-width:24mm;border:1px solid #b9a99d;padding:1mm;text-align:center}
    .close-round-print-summary>div.close-round-print-summary-heading{flex:0 0 100%;border:0;padding:0;text-align:left;font-weight:700;font-size:7px;color:#6e442d}
    .close-round-print-summary span,.close-round-print-summary strong{display:block}
    .close-round-print-summary span{font-size:5.5px;color:#66584e}
    .close-round-print-summary strong{font-size:7px;margin-top:.5mm}
    .close-round-detail-table{font-size:5.7px}
    .close-round-print-density-compact{font-size:5.7px}
    .close-round-print-density-dense{font-size:5.4px;line-height:1.02}
    .close-round-print-summary{font-size:5.2px}
    .close-round-print-summary span{font-size:4.8px}
    .close-round-print-summary strong{font-size:6px}
    .close-round-print-summary>div.close-round-print-summary-heading{font-size:5.8px}
    .close-round-print-summary p{margin:0;font-size:5.8px;line-height:1.2}
  `;
  frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดปิดรอบ ${esc(date)}</title><style>${printCss}</style></head><body><div class="sheet">${layout.outerHTML}</div></body></html>`;
  document.body.append(frame);
  const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};
  window.addEventListener('afterprint',cleanup,{once:true});
  frame.addEventListener('load',()=>{
    const printWindow=frame.contentWindow;
    if(!printWindow)return;
    printWindow.focus();
    setTimeout(()=>printWindow.print(),150);
    setTimeout(cleanup,15000);
  },{once:true});
}
function installCloseRoundDetailTools(){
  const panel=$('#view-close-round .close-round-detail-panel');if(!panel)return;
  panel.querySelectorAll('.close-round-note-input').forEach(field=>{if(field.dataset.autoResizeReady)return;field.dataset.autoResizeReady='true';field.addEventListener('input',()=>resizeCloseRoundNote(field));resizeCloseRoundNote(field)});
  const heading=panel.querySelector('.panel-heading');if(!heading||heading.querySelector('[data-close-round-detail-print]'))return;
  const button=document.createElement('button');button.type='button';button.className='button button-outline';button.dataset.closeRoundDetailPrint='true';button.innerHTML='<span class="material-symbols-outlined">print</span>พิมพ์รายละเอียดส่งบัญชี';
  const count=heading.querySelector('.count-chip');if(count)count.before(button);else heading.append(button);
}
document.addEventListener('click',event=>{const button=event.target.closest('[data-close-round-detail-print]');if(!button)return;event.preventDefault();printCloseRoundDetailOnePage()});
window.addEventListener('afterprint',()=>{document.body.classList.remove('close-round-printing');document.body.classList.remove('close-round-detail-printing')});

/* Cash drawer: independent change-float control, never sourced from invoices. */
const CASH_DRAWER_DENOMINATIONS=[
  {value:1,label:'เหรียญ 1 บาท'},
  {value:2,label:'เหรียญ 2 บาท'},
  {value:5,label:'เหรียญ 5 บาท'},
  {value:10,label:'เหรียญ 10 บาท'},
  {value:20,label:'ธนบัตร 20 บาท'},
  {value:50,label:'ธนบัตร 50 บาท'},
  {value:100,label:'ธนบัตร 100 บาท'},
  {value:500,label:'ธนบัตร 500 บาท'},
  {value:1000,label:'ธนบัตร 1,000 บาท'}
];
const CASH_DRAWER_KEY='scenery-cash-drawer';
let cashDrawerStore={activeShift:null,history:[],openingCashDefault:null};
window.cashDrawerStore=cashDrawerStore;

function loadCashDrawerStore(){
  try{
    const value=JSON.parse(localStorage.getItem(CASH_DRAWER_KEY)||'{}');
    const activeShift=(value.activeShift&&value.activeShift.code)?value.activeShift:null;
    const storedOpening=Number(value.openingCashDefault);
    const shiftOpening=Number(activeShift?.openingCash);
    const openingCashDefault=Number.isFinite(storedOpening)&&storedOpening>=0?storedOpening:Number.isFinite(shiftOpening)&&activeShift?.openingCash!==null?shiftOpening:null;
    const store={activeShift,history:Array.isArray(value.history)?value.history:[],openingCashDefault};
    window.cashDrawerStore=store;
    return store;
  }catch{
    const store={activeShift:null,history:[],openingCashDefault:null};
    window.cashDrawerStore=store;
    return store;
  }
}
window.loadCashDrawerStore=loadCashDrawerStore;

function saveCashDrawerStore(){
  try{
    window.cashDrawerStore=cashDrawerStore;
    localStorage.setItem(CASH_DRAWER_KEY,JSON.stringify(cashDrawerStore));
  }catch{
    showToast('บันทึกข้อมูลลิ้นชักไม่สำเร็จ','error');
  }
}
window.saveCashDrawerStore=saveCashDrawerStore;

function cashDrawerMoney(value){return money(Math.max(0,Number(value||0)))}
function cashDrawerDateTime(value){return value?new Date(value).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}):'-'}
function cashDrawerShiftCode(){return `SHIFT-${historyDateKey().replaceAll('-','')}-${String(Date.now()).slice(-4)}`}
function cashDrawerCountTotal(counts={}){return CASH_DRAWER_DENOMINATIONS.reduce((sum,denomination)=>sum+denomination.value*Math.max(0,Number(counts[denomination.value]||0)),0)}

/* Cash drawer V2 rules */
function cashDrawerV2Expected(shift){
  const used=(shift.cashUses||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.amount||0)),0);
  const returned=(shift.cashReturns||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.amount||0)),0);
  return Math.max(0,Number(shift.openingCash||0)-used+returned);
}
function cashDrawerV2Difference(shift){return cashDrawerCountTotal(shift.counts||{})-cashDrawerV2Expected(shift)}
function cashDrawerV2ReadCounts(){const counts={};$$('[data-cash-drawer-denom]').forEach(input=>{counts[input.dataset.cashDrawerDenom]=Math.max(0,Math.floor(Number(input.value||0)))});return counts}
function cashDrawerV2DenominationInputs(counts={},ready=true){return CASH_DRAWER_DENOMINATIONS.map(denomination=>`<label class="cash-denomination"><span>${denomination.label}</span><input type="number" min="0" step="1" value="${Math.max(0,Number(counts[denomination.value]||0))}" data-cash-drawer-denom="${denomination.value}" aria-label="${denomination.label} กี่ชิ้น" ${ready?'':'disabled'} style="height:36px;padding:4px 8px;border-radius:6px;border:1px solid #d4c4b5;background:#fff;"></label>`).join('')}

function cashDrawerV2Render(){
  const view=$('#view-drawer');if(!view)return;
  const shift=cashDrawerStore.activeShift,ready=Boolean(shift&&shift.openingCash!==null&&shift.openingCash!==undefined),expected=shift?cashDrawerV2Expected(shift):0,counted=shift?cashDrawerCountTotal(shift.counts||{}):0,difference=counted-expected;
  const navBadge=$('.nav-item[data-view="drawer"] .nav-badge');if(navBadge)navBadge.textContent=shift?'กะเปิด':'กะปิด';
  const status=shift?'<span class="status-chip success large"><i></i> กะเปิดอยู่</span>':'<span class="status-chip neutral large">ยังไม่เปิดกะ</span>';
  const uses=(shift?.cashUses||[]).reduce((sum,item)=>sum+Number(item.amount||0),0),returns=(shift?.cashReturns||[]).reduce((sum,item)=>sum+Number(item.amount||0),0);
  view.innerHTML=`
    <div class="page-heading compact">
      <div>
        <p class="eyebrow">OPERATIONS / CASH DRAWER</p>
        <h2>ลิ้นชักเก็บเงินทอน</h2>
        <p class="muted">เงินทอนแยกจากใบแจ้งหนี้ · ตรวจนับตามชนิดเงินและประวัติกะ</p>
      </div>
      ${status}
    </div>
    <div class="drawer-grid">
      <article class="panel drawer-status">
        <div class="drawer-hero">
          <span class="drawer-circle"><span class="material-symbols-outlined">payments</span></span>
          <div>
            <small>${shift?'กะที่กำลังดำเนินการ':'สถานะลิ้นชัก'}</small>
            <h3>${esc(shift?.code||'ยังไม่มีรหัสกะ')}</h3>
            <p>${shift?`เปิดโดย ${esc(shift.openedBy)} · ${esc(cashDrawerDateTime(shift.openedAt))}`:'เปิดกะด้วยชื่อผู้รับผิดชอบ'}</p>
          </div>
        </div>
        ${shift?`
          <div class="drawer-stat-grid">
            <div><small>เงินตั้งต้น</small><strong>${ready?cashDrawerMoney(shift.openingCash):'ยังไม่กำหนด'}</strong></div>
            <div><small>นำออกไปใช้</small><strong>${cashDrawerMoney(uses)}</strong></div>
            <div><small>เงินคืนจากกะอื่น</small><strong>${cashDrawerMoney(returns)}</strong></div>
            <div><small>ยอดที่ควรเหลือ</small><strong class="accent-text">${cashDrawerMoney(expected)}</strong></div>
          </div>
          <div class="drawer-opening-form" style="background:#fffcf9;border:1px solid #ebdccb;border-radius:10px;padding:14px;margin-top:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <strong style="font-size:13px;color:#5a3820;">กำหนดเงินตั้งต้นของกะ</strong>
              <small style="color:#7c695c;">เงินทอนเริ่มต้น</small>
            </div>
            <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
              <label class="drawer-field" style="flex:1;min-width:130px;display:grid;gap:5px;margin:0;">
                <span style="font-size:11.5px;font-weight:700;color:#5a3820;">เงินตั้งต้น (บาท)</span>
                <input id="drawer-v2-opening-cash" type="number" min="0" step="0.01" value="${ready?Number(shift.openingCash):''}" placeholder="ยอดเงินตั้งต้น" style="width:100%;height:38px;padding:6px 12px;border:1px solid #d4c4b5;border-radius:8px;font-size:13.5px;box-sizing:border-box;background:#fff;">
              </label>
              <button class="button button-soft" data-cash-drawer-v2="set-opening" style="height:38px;padding:0 14px;display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;white-space:nowrap;border-radius:8px;cursor:pointer;">
                <span class="material-symbols-outlined" style="font-size:16px;">save</span>
                <span>บันทึกเงินตั้งต้น</span>
              </button>
            </div>
          </div>
          <div class="drawer-close-auth" style="background:#fffaf7;border:1px solid #ebdccb;border-radius:10px;padding:14px;margin-top:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <strong style="font-size:13px;color:#5a3820;">ปิดกะลิ้นชักเก็บเงิน</strong>
              <small style="color:#7c695c;">ปิดกะเมื่อสิ้นสุดเวร</small>
            </div>
            <div style="display:grid;gap:10px;">
              <label class="drawer-field" style="display:grid;gap:5px;margin:0;">
                <span style="font-size:11.5px;font-weight:700;color:#5a3820;">ชื่อผู้ปิดกะ <b class="required-note" style="color:#c62828;">*</b></span>
                <input id="drawer-v2-close-name" placeholder="กรอกชื่อผู้ปิดกะ" required autocomplete="name" style="width:100%;height:38px;padding:6px 12px;border:1px solid #d4c4b5;border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff;">
              </label>
              <button class="button button-primary full-width" data-cash-drawer-v2="close" style="height:40px;border-radius:8px;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
                <span class="material-symbols-outlined" style="font-size:18px;">lock</span>
                <span>ปิดกะและบันทึกประวัติ</span>
              </button>
            </div>
          </div>
        `:`
          <div class="drawer-open-auth drawer-open-gate">
            <div class="drawer-gate-title">
              <span class="material-symbols-outlined">lock_open</span>
              <div>
                <strong>เปิดลิ้นชักเก็บเงิน</strong>
                <small>กรอกชื่อผู้รับผิดชอบก่อนเปิดกะ</small>
              </div>
            </div>
            <label class="drawer-field" style="display:grid;gap:6px;margin-bottom:12px;">
              <span style="font-size:12px;font-weight:700;color:#5a3820;">ชื่อผู้เปิดกะ <b class="required-note" style="color:#c62828;">*</b></span>
              <input id="drawer-v2-open-name" placeholder="ลงชื่อผู้รับผิดชอบ" required autocomplete="name" autofocus style="height:40px;padding:8px 12px;border:1px solid #d4c4b5;border-radius:8px;font-size:13.5px;box-sizing:border-box;background:#fff;">
            </label>
            <button class="button button-primary full-width" data-cash-drawer-v2="open" style="height:42px;border-radius:8px;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span class="material-symbols-outlined" style="font-size:18px;">lock_open</span>
              <span>เปิดกะและสร้างรหัสกะ</span>
            </button>
          </div>
        `}
      </article>
      <article class="panel reconciliation">
        <div class="panel-heading">
          <div>
            <span class="title-icon"><span class="material-symbols-outlined">fact_check</span></span>
            <h3>ตรวจนับเงินในลิ้นชัก</h3>
          </div>
          <span class="status-chip ${!shift?'neutral':!ready?'warning':difference===0?'success':'warning'}">${!shift?'รอเปิดกะ':!ready?'รอเงินตั้งต้น':difference===0?'ยอดตรงกัน':'มีส่วนต่าง'}</span>
        </div>
        ${shift?`
          ${!ready?'<div class="drawer-notice">กรุณากำหนดเงินตั้งต้นด้านซ้ายก่อนเริ่มนับเงิน</div>':''}
          <div class="reconcile-row"><span>ยอดที่ควรเหลือ</span><strong>${cashDrawerMoney(expected)}</strong></div>
          <div class="cash-denomination-grid">${cashDrawerV2DenominationInputs(shift.counts,ready)}</div>
          <div class="reconcile-row"><span>นับได้จริง</span><strong id="drawer-v2-counted-total">${cashDrawerMoney(counted)}</strong></div>
          <div class="reconcile-row difference"><span>ส่วนต่าง</span><strong id="drawer-v2-difference" class="${difference===0?'positive-text':'warning-text'}">${difference<0?'-':''}${cashDrawerMoney(Math.abs(difference))}</strong></div>
          <button class="button button-outline full-width" data-cash-drawer-v2="save-count" ${ready?'':'disabled'} style="height:38px;margin:8px 0 16px;border-radius:8px;font-size:12.5px;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:16px;">save</span>
            <span>บันทึกผลการนับ</span>
          </button>
          <div class="drawer-use-form" style="background:#fffcf9;border:1px solid #ebdccb;border-radius:12px;padding:16px;margin-top:16px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span class="material-symbols-outlined" style="font-size:20px;color:#8a5433;">shopping_bag</span>
              <strong style="font-size:13.5px;color:#4a2b16;">กรณีนำเงินออกไปใช้</strong>
            </div>
            <small style="color:#78695d;display:block;margin-bottom:12px;">ระบุเหตุผลและยอดเงิน ระบบจะหักจากยอดที่ควรเหลือ (สามารถคลิกลากมุมขวาล่างเพื่อขยายช่องได้)</small>
            <div class="drawer-use-fields-clean" style="display:grid;grid-template-columns:1fr;gap:10px;">
              <label class="drawer-field" style="display:grid;gap:5px;margin:0;">
                <span style="font-size:11.5px;font-weight:700;color:#5a3e2b;">เหตุผล / หมายเหตุ (ขยายได้) <b class="required-note" style="color:#c62828;">*</b></span>
                <textarea id="drawer-v2-use-note" rows="2" placeholder="พิมพ์เหตุผล เช่น ซื้ออุปกรณ์สำนักงาน หรือสำรองจ่าย" style="width:100%;min-height:54px;resize:vertical;padding:8px 12px;border:1px solid #d4c4b5;border-radius:8px;font-size:13px;font-family:inherit;line-height:1.4;box-sizing:border-box;background:#fff;"></textarea>
              </label>
              <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
                <label class="drawer-field" style="flex:1;min-width:140px;display:grid;gap:5px;margin:0;">
                  <span style="font-size:11.5px;font-weight:700;color:#5a3e2b;">ยอดเงิน (บาท) <b class="required-note" style="color:#c62828;">*</b></span>
                  <input id="drawer-v2-use-amount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;height:38px;padding:6px 12px;border:1px solid #d4c4b5;border-radius:8px;font-size:14px;font-weight:600;color:#8a5433;box-sizing:border-box;background:#fff;">
                </label>
                <button type="button" class="button button-soft" data-cash-drawer-v2="add-use" ${ready?'':'disabled'} style="height:38px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:600;border-radius:8px;white-space:nowrap;cursor:pointer;">
                  <span class="material-symbols-outlined" style="font-size:16px;">remove_circle_outline</span>
                  <span>บันทึกเงินที่นำออก</span>
                </button>
              </div>
            </div>
            ${(shift.cashUses||[]).length?`
              <div class="drawer-use-list" style="margin-top:12px;">
                ${shift.cashUses.map((item,index)=>`
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:6px;background:#f9f4ef;margin-bottom:6px;font-size:12.5px;">
                    <span style="flex:1;color:#554336;white-space:pre-wrap;word-break:break-word;">${esc(item.note)}</span>
                    <strong style="color:#8a5433;white-space:nowrap;font-size:13px;">${cashDrawerMoney(item.amount)}</strong>
                    <button class="icon-button" data-cash-drawer-v2="remove-use" data-cash-use-index="${index}" aria-label="ลบรายการนำเงินออก" style="cursor:pointer;color:#c62828;">
                      <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            `:''}
          </div>
          <div class="drawer-use-form drawer-return-form" style="background:#f6f9fc;border:1px solid #d3e2f0;border-radius:12px;padding:16px;margin-top:16px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span class="material-symbols-outlined" style="font-size:20px;color:#1e6091;">savings</span>
              <strong style="font-size:13.5px;color:#184e77;">เงินคืนจากกะอื่น</strong>
            </div>
            <small style="color:#52796f;display:block;margin-bottom:12px;">เติมเงินกลับเข้าลิ้นชัก โดยระบุว่าคืนมาจากกะไหน</small>
            <div class="drawer-return-fields-clean" style="display:grid;grid-template-columns:1fr;gap:10px;">
              <div style="display:grid;grid-template-columns:minmax(120px, 1fr) 1.5fr;gap:10px;">
                <label class="drawer-field" style="display:grid;gap:5px;margin:0;">
                  <span style="font-size:11.5px;font-weight:700;color:#184e77;">รหัสกะต้นทาง <b class="required-note" style="color:#c62828;">*</b></span>
                  <input id="drawer-v2-return-shift" placeholder="SHIFT-..." style="width:100%;height:38px;padding:6px 12px;border:1px solid #b5cddf;border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff;">
                </label>
                <label class="drawer-field" style="display:grid;gap:5px;margin:0;">
                  <span style="font-size:11.5px;font-weight:700;color:#184e77;">หมายเหตุเพิ่มเติม (ขยายได้)</span>
                  <textarea id="drawer-v2-return-note" rows="1" placeholder="รายละเอียดการคืนเงิน" style="width:100%;min-height:38px;resize:vertical;padding:6px 12px;border:1px solid #b5cddf;border-radius:8px;font-size:13px;font-family:inherit;line-height:1.4;box-sizing:border-box;background:#fff;"></textarea>
                </label>
              </div>
              <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
                <label class="drawer-field" style="flex:1;min-width:140px;display:grid;gap:5px;margin:0;">
                  <span style="font-size:11.5px;font-weight:700;color:#184e77;">ยอดเงินที่คืน (บาท) <b class="required-note" style="color:#c62828;">*</b></span>
                  <input id="drawer-v2-return-amount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;height:38px;padding:6px 12px;border:1px solid #b5cddf;border-radius:8px;font-size:14px;font-weight:600;color:#184e77;box-sizing:border-box;background:#fff;">
                </label>
                <button type="button" class="button button-primary" data-cash-drawer-v2="add-return" ${ready?'':'disabled'} style="height:38px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:600;border-radius:8px;background:linear-gradient(135deg,#1e6091,#184e77);border-color:#184e77;color:#fff;white-space:nowrap;cursor:pointer;">
                  <span class="material-symbols-outlined" style="font-size:16px;">add_circle_outline</span>
                  <span>บันทึกเงินคืน</span>
                </button>
              </div>
            </div>
            ${(shift.cashReturns||[]).length?`
              <div class="drawer-use-list" style="margin-top:12px;">
                ${shift.cashReturns.map((item,index)=>`
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:6px;background:#eef5fa;margin-bottom:6px;font-size:12.5px;">
                    <span style="flex:1;color:#184e77;white-space:pre-wrap;word-break:break-word;">คืนจาก <strong>${esc(item.fromShift)}</strong>${item.note?` · ${esc(item.note)}`:''}</span>
                    <strong style="color:#184e77;white-space:nowrap;font-size:13px;">${cashDrawerMoney(item.amount)}</strong>
                    <button class="icon-button" data-cash-drawer-v2="remove-return" data-cash-return-index="${index}" aria-label="ลบรายการเงินคืน" style="cursor:pointer;color:#c62828;">
                      <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            `:''}
          </div>
        `:`
          <div class="empty-state">
            <span class="material-symbols-outlined">point_of_sale</span>
            <p>ยังไม่มีรอบให้ตรวจนับ</p>
            <small>เปิดกะก่อน แล้วจึงนับเหรียญและธนบัตร</small>
          </div>
        `}
      </article>
    </div>
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span class="title-icon"><span class="material-symbols-outlined">history</span></span>
          <h3>ประวัติการเปิด–ปิดกะ</h3>
        </div>
        <span class="count-chip">${cashDrawerStore.history.length} รอบ</span>
      </div>
      ${cashDrawerStore.history.length?`
        <div class="table-wrap">
          <table class="cash-drawer-history">
            <thead>
              <tr>
                <th>รหัสกะ</th>
                <th>ผู้เปิดกะ / เวลา</th>
                <th>ผู้ปิดกะ / เวลา</th>
                <th class="align-right">ยอดเริ่ม</th>
                <th class="align-right">ยอดปิดจริง</th>
                <th class="align-right">ส่วนต่าง</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${cashDrawerStore.history.map((item,index)=>`
                <tr>
                  <td class="mono">${esc(item.code)}</td>
                  <td><strong>${esc(item.openedBy)}</strong><small class="table-subtext">${esc(cashDrawerDateTime(item.openedAt))}</small></td>
                  <td><strong>${esc(item.closedBy||'-')}</strong><small class="table-subtext">${esc(cashDrawerDateTime(item.closedAt))}</small></td>
                  <td class="align-right">${cashDrawerMoney(item.openingCash)}</td>
                  <td class="align-right">${cashDrawerMoney(item.countedTotal)}</td>
                  <td class="align-right ${Number(item.difference||0)===0?'positive-text':'warning-text'}">${Number(item.difference||0)<0?'-':''}${cashDrawerMoney(Math.abs(Number(item.difference||0)))}</td>
                  <td><button class="button button-danger action-small" data-cash-drawer-v2="delete-history" data-cash-history-index="${index}"><span class="material-symbols-outlined">delete</span>ลบ</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `:`
        <div class="empty-state">
          <span class="material-symbols-outlined">history</span>
          <p>ยังไม่มีประวัติการเปิด–ปิดกะ</p>
          <small>ประวัติจะถูกบันทึกเมื่อปิดกะสำเร็จ</small>
        </div>
      `}
    </article>
  `;
}

function cashDrawerV2Open(){
  const name=($('#drawer-v2-open-name')?.value||'').trim();
  if(!name||name==='ยังไม่ระบุชื่อ'){
    showToast('กรุณากรอกชื่อผู้เปิดกะก่อนเปิดกะ','error');
    $('#drawer-v2-open-name')?.focus();
    return;
  }
  const openingCash=Number.isFinite(Number(cashDrawerStore.openingCashDefault))?Number(cashDrawerStore.openingCashDefault):null;
  cashDrawerStore.activeShift={code:cashDrawerShiftCode(),openedBy:name,openedAt:new Date().toISOString(),openingCash,cashUses:[],cashReturns:[],counts:{},lastCountAt:null};
  saveCashDrawerStore();cashDrawerV2Render();showToast(`เปิดกะ ${cashDrawerStore.activeShift.code} สำเร็จ (ผู้เปิดกะ: ${name})`);
  if(typeof window.renderDashboard==='function')window.renderDashboard();
}
function cashDrawerV2SetOpening(){
  const shift=cashDrawerStore.activeShift;if(!shift)return;
  const amount=Number($('#drawer-v2-opening-cash')?.value);
  if(!Number.isFinite(amount)||amount<0){showToast('กรุณาระบุเงินตั้งต้นให้ถูกต้อง','error');return}
  cashDrawerStore.openingCashDefault=amount;shift.openingCash=amount;saveCashDrawerStore();cashDrawerV2Render();showToast('บันทึกเงินตั้งต้นแล้ว และจะใช้ยอดนี้ต่อจนกว่าจะเปลี่ยน');
  if(typeof window.renderDashboard==='function')window.renderDashboard();
}
function cashDrawerV2SaveCount(){
  const shift=cashDrawerStore.activeShift;if(!shift)return;
  if(shift.openingCash===null||shift.openingCash===undefined){showToast('กรุณากำหนดเงินตั้งต้นก่อนนับเงิน','error');return}
  shift.counts=cashDrawerV2ReadCounts();shift.lastCountAt=new Date().toISOString();saveCashDrawerStore();cashDrawerV2Render();showToast('บันทึกผลการนับเงินแล้ว');
}
function cashDrawerV2AddUse(){
  const shift=cashDrawerStore.activeShift;if(!shift)return;
  const note=($('#drawer-v2-use-note')?.value||'').trim(),amount=Math.max(0,Number($('#drawer-v2-use-amount')?.value||0));
  if(!note||amount<=0){showToast('กรุณาระบุเหตุผลและยอดเงินที่นำออก','error');return}
  if(amount>cashDrawerV2Expected(shift)){showToast('ยอดที่นำออกมากกว่ายอดเงินที่ควรเหลือ','error');return}
  shift.cashUses=[...(shift.cashUses||[]),{note,amount,at:new Date().toISOString()}];saveCashDrawerStore();cashDrawerV2Render();showToast('บันทึกเงินที่นำออกพร้อมเหตุผลแล้ว');
}
function cashDrawerV2AddReturn(){
  const shift=cashDrawerStore.activeShift;if(!shift)return;
  const fromShift=($('#drawer-v2-return-shift')?.value||'').trim(),note=($('#drawer-v2-return-note')?.value||'').trim(),amount=Math.max(0,Number($('#drawer-v2-return-amount')?.value||0));
  if(!fromShift||amount<=0){showToast('กรุณาระบุรหัสกะต้นทางและยอดเงินที่คืน','error');return}
  if(fromShift===shift.code){showToast('กะต้นทางต้องเป็นกะอื่น','error');return}
  shift.cashReturns=[...(shift.cashReturns||[]),{fromShift,note,amount,at:new Date().toISOString()}];saveCashDrawerStore();cashDrawerV2Render();showToast('บันทึกเงินคืนจากกะอื่นแล้ว');
}
function cashDrawerV2Close(){
  const shift=cashDrawerStore.activeShift;if(!shift)return;
  const name=($('#drawer-v2-close-name')?.value||'').trim();
  if(!name||name==='ยังไม่ระบุชื่อ'){
    showToast('กรุณากรอกชื่อผู้ปิดกะก่อนปิดกะ','error');
    $('#drawer-v2-close-name')?.focus();
    return;
  }
  const counted=cashDrawerCountTotal(shift.counts||{});
  const expected=cashDrawerV2Expected(shift);
  const difference=counted-expected;
  const closedAt=new Date().toISOString();
  cashDrawerStore.history.unshift({...shift,closedBy:name,closedAt,countedTotal:counted,difference});
  cashDrawerStore.history=cashDrawerStore.history.slice(0,100);
  cashDrawerStore.activeShift=null;
  saveCashDrawerStore();
  cashDrawerV2Render();
  showToast(`ปิดกะ ${shift.code} เรียบร้อยแล้ว (ผู้ปิดกะ: ${name})`);
  if(typeof window.renderDashboard==='function')window.renderDashboard();
}
function cashDrawerV2DeleteHistory(index){
  const item=cashDrawerStore.history[Number(index)];if(!item)return;
  openModal(`ยืนยันลบประวัติกะ ${item.code}`,`<div class="history-delete-form"><p>ต้องการลบประวัติกะ <strong>${esc(item.code)}</strong> (ผู้เปิด: ${esc(item.openedBy)}) ใช่หรือไม่?</p><p class="muted">เพื่อความปลอดภัยและการตรวจสอบ กรุณากรอกอีเมลผู้มีอำนาจลบรายการ</p><label class="drawer-field"><span>อีเมลผู้ลบรายการ <b class="required-note">*</b></span><input id="drawer-v2-supervisor-email" type="email" placeholder="กรอกอีเมล (เช่น admin@thescenery.co)" required autofocus autocomplete="email"></label></div>`,`<button class="button button-outline" data-close-modal>ยกเลิก</button><button class="button button-danger" data-cash-drawer-v2="confirm-delete-history" data-cash-history-index="${Number(index)}"><span class="material-symbols-outlined">delete</span>ยืนยันลบ</button>`);
}
function cashDrawerV2ConfirmDelete(index){
  const email=($('#drawer-v2-supervisor-email')?.value||'').trim();
  if(!email||!email.includes('@')){
    showToast('กรุณากรอกอีเมลผู้ลบรายการให้ถูกต้อง','error');
    $('#drawer-v2-supervisor-email')?.focus();
    return;
  }
  const item=cashDrawerStore.history[Number(index)];
  cashDrawerStore.history.splice(Number(index),1);
  saveCashDrawerStore();
  $('#modal-root').innerHTML='';
  cashDrawerV2Render();
  showToast(`ลบประวัติกะสำเร็จ โดย ${email}`);
}
function installCashDrawerV2(){
  cashDrawerStore=loadCashDrawerStore();
  window.cashDrawerStore=cashDrawerStore;
  window.cashDrawerV2Open=cashDrawerV2Open;
  window.cashDrawerV2Close=cashDrawerV2Close;
  window.cashDrawerV2Render=cashDrawerV2Render;
  window.cashDrawerV2Expected=cashDrawerV2Expected;
  const view=$('#view-drawer');if(!view)return;
  cashDrawerV2Render();
  view.addEventListener('input',event=>{if(!event.target.matches('[data-cash-drawer-denom]'))return;const shift=cashDrawerStore.activeShift;if(!shift)return;const total=cashDrawerCountTotal(cashDrawerV2ReadCounts()),difference=total-cashDrawerV2Expected(shift);if($('#drawer-v2-counted-total'))$('#drawer-v2-counted-total').textContent=cashDrawerMoney(total);if($('#drawer-v2-difference')){$('#drawer-v2-difference').textContent=`${difference<0?'-':''}${cashDrawerMoney(Math.abs(difference))}`;$('#drawer-v2-difference').className=difference===0?'positive-text':'warning-text'}});
  view.addEventListener('click',event=>{const action=event.target.closest('[data-cash-drawer-v2]');if(!action)return;event.preventDefault();const type=action.dataset.cashDrawerV2;if(type==='open')cashDrawerV2Open();if(type==='set-opening')cashDrawerV2SetOpening();if(type==='save-count')cashDrawerV2SaveCount();if(type==='add-use')cashDrawerV2AddUse();if(type==='add-return')cashDrawerV2AddReturn();if(type==='remove-use'){cashDrawerStore.activeShift.cashUses.splice(Number(action.dataset.cashUseIndex),1);saveCashDrawerStore();cashDrawerV2Render()}if(type==='remove-return'){cashDrawerStore.activeShift.cashReturns.splice(Number(action.dataset.cashReturnIndex),1);saveCashDrawerStore();cashDrawerV2Render()}if(type==='close')cashDrawerV2Close();if(type==='delete-history')cashDrawerV2DeleteHistory(action.dataset.cashHistoryIndex)});
  document.addEventListener('click',event=>{const action=event.target.closest('[data-cash-drawer-v2="confirm-delete-history"]');if(action){event.preventDefault();cashDrawerV2ConfirmDelete(action.dataset.cashHistoryIndex)}});
}
window.installCashDrawerV2=installCashDrawerV2;
document.addEventListener('DOMContentLoaded',installCashDrawerV2);

function buildInvoiceWorkspace(){
  const view=$('#view-invoice');
  if(!view)return;
  const villaMarkup=[...new Map(villaOptions.filter(v=>v?.name).map(v=>[v.name,v])).values()].map(v=>`<option value="${esc(v.name)}">${esc(v.name)}</option>`).join('');
  const categoryOptions=items=>[...new Set(items.map(item=>cleanEnglishText(item.category)).filter(Boolean))].map(category=>`<option value="${esc(category)}">${esc(category)}</option>`).join('');
  const aOptions=accommodationItems.map((item,index)=>`<option value="${index}">${esc(item.name)}</option>`).join('');
  const bOptions=addonItems.map((item,index)=>`<option value="${index}">${esc(item.name)}</option>`).join('');
  view.innerHTML=`
    <div class="page-heading compact"><div><p class="eyebrow">TRANSACTION / INFORMATION BILL</p><h2>สร้างใบแจ้งหนี้</h2><p class="muted">กรอกข้อมูลในหน้าแรก แล้วตรวจใบแจ้งหนี้จากแบบฟอร์ม INFO BILL ในหน้าที่สอง</p></div><div class="heading-actions"><span class="save-state"><span class="material-symbols-outlined">sync</span>ข้อมูลเชื่อมกันอัตโนมัติ</span><button class="button button-outline" id="reset-invoice" type="button"><span class="material-symbols-outlined">refresh</span>เริ่มใหม่</button></div></div>
    <div class="invoice-page-tabs" role="tablist"><button class="invoice-page-tab active" type="button" data-invoice-page="form"><span>01</span><strong>หน้ากรอกข้อมูล</strong><small>กรอกข้อมูลผู้เข้าพักและรายการ</small></button><button class="invoice-page-tab" type="button" data-invoice-page="preview"><span>02</span><strong>หน้าใบแจ้งหนี้</strong><small>พรีวิวตามแบบ INFO BILL</small></button></div>
    <section class="invoice-page active" data-invoice-page="form"><div class="invoice-entry-layout"><form class="invoice-entry-main" id="invoice-entry-form">
      <article class="panel invoice-entry-card"><div class="panel-heading"><div><span class="title-icon"><span class="material-symbols-outlined">badge</span></span><h3>ข้อมูลบนหัวใบแจ้งหนี้</h3></div><span class="required-note">* จำเป็นเฉพาะชื่อลูกค้า</span></div><div class="form-grid three"><label>Reference No. <input id="folio" value="" placeholder="เลขอ้างอิง (สร้างให้อัตโนมัติ)"></label><label class="span-two">Guest Name <input id="customer" value="" placeholder="กรอกชื่อลูกค้า (จำเป็น)" required autofocus></label><label>Check-in Date <input id="check-in" type="date"></label><label>Check-out Date <input id="check-out" type="date"></label><label>No. Of Night <input id="no-of-night" type="number" min="0" value="" placeholder="จำนวนคืน"></label><label>Remark <input id="remark" value="" placeholder="หมายเหตุ"></label><label>วันที่ทำเอกสาร <input id="doc-date" type="date"></label><label class="span-two">Villa / Room <select id="villa"><option value="">เลือก Villa / Room (ไม่ระบุก็ได้)</option>${villaMarkup}</select></label></div></article>
      <article class="panel invoice-entry-card invoice-lines-card"><div class="panel-heading"><div><span class="title-icon"><span class="material-symbols-outlined">list_alt</span></span><h3>รายการในใบแจ้งหนี้</h3></div><span class="required-note">เลือกลำดับ หมวด → รายการ</span></div>
        <div class="invoice-add-grid"><div class="invoice-add-box"><h4>Accommodation &amp; Inclusive Package</h4><div class="invoice-add-fields category-first-fields"><select id="accommodation-category" class="invoice-category-select"><option value="">เลือกหมวด</option>${categoryOptions(accommodationItems)}</select><select id="accommodation-select" disabled><option value="">เลือกรายการในหมวด</option>${aOptions}</select><input id="accommodation-rate" type="number" min="0" step="0.01" placeholder="Rate"><input id="accommodation-qty" type="number" min="1" value="1" placeholder="จำนวน" aria-label="จำนวน Accommodation"><button class="button button-primary" id="add-accommodation" type="button"><span class="material-symbols-outlined">add</span>เพิ่มรายการ</button></div></div>
        <div class="invoice-add-box"><h4>Food and Beverages (add-on) and Other Expenses</h4><div class="invoice-add-fields category-first-fields"><select id="addon-category" class="invoice-category-select"><option value="">เลือกหมวด</option>${categoryOptions(addonItems)}</select><select id="addon-select" disabled><option value="">เลือกรายการในหมวด</option>${bOptions}</select><input id="addon-rate" type="number" min="0" step="0.01" placeholder="Rate"><input id="addon-qty" type="number" min="1" value="1" placeholder="จำนวน" aria-label="จำนวนค่าใช้จ่ายทั่วไป"><button class="button button-primary" id="add-addon" type="button"><span class="material-symbols-outlined">add</span>เพิ่มรายการ</button></div></div></div>
        <section class="invoice-line-group"><div class="line-group-heading" style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div><strong>Accommodation &amp; Inclusive Package</strong><small>รายการค่าบ้านและ Inclusive ทั้งหมด</small></div><button type="button" class="button button-soft action-small" id="btn-add-split-stay-invoice" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;padding:4px 10px;"><span class="material-symbols-outlined" style="font-size:16px;">night_shelter</span> + พักต่อคืนที่ 2 (คนละบ้าน)</button></div><div class="table-wrap"><table><thead><tr><th>หมวด</th><th>รายการ</th><th class="align-center">จำนวน</th><th class="align-right">Rate</th><th>ส่วนลด</th><th class="align-right">ยอดรวม</th><th></th></tr></thead><tbody id="form-accommodation-lines"></tbody></table><div id="accommodation-empty" class="empty-state"><p>ยังไม่มีรายการ</p></div></div></section>
        <section class="invoice-line-group"><div class="line-group-heading"><strong>Food and Beverages (add-on) and Other Expenses</strong><small>รายการค่าใช้จ่ายทั่วไปทั้งหมด</small></div><div class="table-wrap"><table><thead><tr><th>หมวด</th><th>รายการ</th><th class="align-center">จำนวน</th><th class="align-right">Rate</th><th>ส่วนลด</th><th class="align-right">ยอดรวม</th><th></th></tr></thead><tbody id="form-addon-lines"></tbody></table><div id="addon-empty" class="empty-state"><p>ยังไม่มีรายการ</p></div></div></section>
        <section class="invoice-adjustments"><div class="line-group-heading"><strong>ยอดปรับและการชำระเงิน</strong><small>Deposit จะรวมจากรายการชำระด้านล่าง</small></div><div class="form-grid three compact-grid"><label>รูปแบบส่วนลด <select id="discount-scope"><option value="line">ส่วนลดตามรายการ</option><option value="all">ส่วนลดทั้งบิล</option><option value="none">ไม่มีส่วนลด</option></select></label><label>ส่วนลดทั้งบิล <select id="discount-all-rate">${discountRateOptions(0)}</select></label><label>พนักงาน <select id="cashier"><option value="">เลือกพนักงาน</option><option>Now Narit</option><option>Mhew Kusu</option><option>Nattaya Phung</option><option>Nummim</option><option>Ple Theresa</option></select></label></div><div class="payment-entry"><select id="payment-method"><option value="เงินสด">เงินสด</option><option value="บัตรเครดิต">บัตรเครดิต</option><option value="QR Code">QR Code</option><option value="โอนเงิน SC">โอนเงิน SC</option></select><input id="payment-amount" type="number" min="0" placeholder="จำนวนเงินที่รับ"><button class="button button-outline" id="add-payment" type="button"><span class="material-symbols-outlined">add</span>บันทึกการชำระ</button></div><div id="payment-list" class="payment-list"></div></section>
      </article>
    </form><aside class="invoice-entry-side"><article class="panel live-summary"><span class="status-chip draft">DRAFT</span><h3>สรุปยอดใบแจ้งหนี้</h3><p>เลือกหมวดก่อน แล้วเลือกสินค้าที่อยู่ในหมวดนั้น</p><div class="live-summary-row"><span>Total</span><strong id="summary-total">฿0.00</strong></div><div class="live-summary-row"><span>Deposit</span><strong id="summary-deposit">฿0.00</strong></div><div class="live-summary-row"><span>Discount</span><strong id="summary-discount">฿0.00</strong></div><div class="live-summary-row outstanding"><span>Outstanding</span><strong id="summary-outstanding">฿0.00</strong></div><button class="button button-primary full-width" type="button" data-invoice-page="preview"><span class="material-symbols-outlined">visibility</span>ดูหน้าใบแจ้งหนี้</button></article></aside></div></section>
    <section class="invoice-page" data-invoice-page="preview"><div class="preview-toolbar"><div><strong>หน้าใบแจ้งหนี้</strong><span>แบบฟอร์มอิงจาก INFO BILL.pdf</span></div><div><button class="button button-outline" type="button" data-invoice-page="form"><span class="material-symbols-outlined">edit</span>กลับไปแก้ไขข้อมูล</button><button class="button button-outline" type="button" id="export-pdf"><span class="material-symbols-outlined">picture_as_pdf</span>ส่งออก PDF</button><button class="button button-primary" type="button" id="close-invoice"><span class="material-symbols-outlined">task_alt</span>ปิดยอดและเก็บหลักฐาน</button></div></div><div class="invoice-preview-stage"><article class="invoice-preview-sheet" id="invoice-preview-sheet"><header class="preview-header"><div class="preview-company"><img src="346973899_1639269593246469_4301917493848559029_n.jpg" alt="The Scenery"><div><p>234 Moo 7, Suan Phueng</p><p>Ratchabuti 70180</p><p>Tel : +66 81 000 7070</p><p>Fax : +66 32 206 370</p><p>www.sceneryvintagefarm.com</p></div></div><div class="preview-title"><h1>INFORMATION<br>BILL</h1><div><span>Invoice No</span><strong id="preview-reference"></strong></div><div><span>Date</span><strong id="preview-invoice-date"></strong></div></div></header><div class="preview-meta"><div><span>Reference No.</span><strong id="preview-reference-meta"></strong></div><div class="guest-meta"><span>Guest Name</span><strong id="preview-customer"></strong></div><div><span>Check-in Date</span><strong id="preview-check-in"></strong></div><div><span>Check-out Date</span><strong id="preview-check-out"></strong></div><div><span>No. Of Night</span><strong id="preview-nights"></strong></div><div><span>Remark</span><strong id="preview-remark"></strong></div></div><div class="preview-table-wrap"><table class="invoice-preview-table"><thead><tr><th>Category</th><th>QTY</th><th>Description</th><th>Rate<br>(per total QTY)</th><th>Deposit</th><th>Discount</th><th>Total THB</th></tr></thead><tbody id="preview-invoice-lines"></tbody></table></div><footer class="preview-footer"><div class="preview-agreement">I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company or association fails to pay for any part of the full amount of these charges.<div class="signature-row"><span>Guest Signature</span><span>Receptionist</span></div></div><div class="preview-totals"><div><span>Total</span><strong id="preview-total">฿0.00</strong></div><div><span>Deposit</span><strong id="preview-deposit">฿0.00</strong></div><div><span>Discount</span><strong id="preview-discount">฿0.00</strong></div><div class="total-outstanding"><span>Outstanding</span><strong id="preview-outstanding">฿0.00</strong></div><small>THAI BAHT</small></div></footer></article></div></section>`;
  setInvoicePage('form');
}

/* Invoice item flow: category first, then only the items in that category. */
function installInvoiceCategoryFirstSelection(){
  const configs=[
    {type:'accommodation',categoryId:'accommodation-category',selectId:'accommodation-select',rateId:'accommodation-rate',qtyId:'accommodation-qty',items:accommodationItems},
    {type:'addon',categoryId:'addon-category',selectId:'addon-select',rateId:'addon-rate',qtyId:'addon-qty',items:addonItems}
  ];
  configs.forEach(config=>{
    const categoryEl=$(`#${config.categoryId}`),select=$(`#${config.selectId}`),rateEl=$(`#${config.rateId}`),qtyEl=$(`#${config.qtyId}`);
    if(!categoryEl||!select||select.dataset.categoryFirstReady)return;
    select.dataset.categoryFirstReady='true';
    document.querySelectorAll(`#${config.type}-search, #${config.type}-options`).forEach(element=>element.remove());
    select.hidden=false;
    const renderItems=()=>{
      const category=categoryEl.value;
      const matches=config.items.map((item,index)=>({item,index})).filter(({item})=>cleanEnglishText(item.category)===category);
      select.innerHTML=`<option value="">${category?'เลือกรายการในหมวดนี้':'เลือกหมวดก่อน'}</option>${matches.map(({item,index})=>`<option value="${index}">${esc(item.name)}</option>`).join('')}`;
      select.disabled=!category||!matches.length;
      if(rateEl)rateEl.value='';
    };
    categoryEl.addEventListener('change',renderItems);
    select.addEventListener('change',()=>fillRate(config.type));
    renderItems();
  });
  addLine=function(type){
    const config=configs.find(item=>item.type===type),categoryEl=$(`#${config.categoryId}`),select=$(`#${config.selectId}`),rateEl=$(`#${config.rateId}`),qtyEl=$(`#${config.qtyId}`),item=select?.value===''?null:config.items[Number(select?.value)];
    if(!categoryEl?.value){showToast('กรุณาเลือกหมวดก่อนเลือกรายการ','error');return}
    if(!item){showToast('กรุณาเลือกรายการในหมวดก่อนเพิ่ม','error');return}
    state.invoiceLines.push({type,name:item.name,category:cleanEnglishText(item.category),sourceIndex:Number(select.value),rate:Math.max(0,Number(rateEl?.value||item.rate||0)),deposit:0,depositMethod:'เงินสด',qty:Math.max(1,Number(qtyEl?.value||1)),discountRate:0,discountAmount:0,pendingCollection:0,pendingNote:''});
    categoryEl.value='';
    select.innerHTML='<option value="">เลือกหมวดก่อน</option>';
    select.value='';
    select.disabled=true;
    if(rateEl)rateEl.value='';
    if(qtyEl)qtyEl.value='1';
    renderFormLines();
    if(typeof calculateInvoice==='function')calculateInvoice();
    showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`);
  };
}
document.addEventListener('DOMContentLoaded',installInvoiceCategoryFirstSelection);
document.addEventListener('click',event=>{
  if(!event.target.closest?.('#reset-invoice'))return;
  setTimeout(()=>['accommodation','addon'].forEach(type=>{
    const categoryEl=$(`#${type}-category`);
    if(categoryEl){categoryEl.value='';categoryEl.dispatchEvent(new Event('change',{bubbles:true}))}
  }),0);
});

/* Source workbook dictionary for Close Round and the system/data pages. */
const CLOSE_ROUND_SOURCE_DATE='2026-04-22';
const CLOSE_ROUND_SOURCE_GROUPS=[
  ['A–E','ชื่อวิลล่า, รหัส, ชื่อลูกค้า, In, Out','ตัวตนของผู้เข้าพักและช่วงเข้าพัก'],
  ['F–P','ค่าวิลล่า, ที่นอนเสริม, อาหาร, มินิบาร์, HT/SHT, กิจกรรมชมสุนัข (92), ค่านวด (0), สินค้า (0), ATV (0), ชาร์จ EV (0), อื่น ๆ','หมวดรายได้จากรายการใน Invoice'],
  ['Q–S','ยอดรวม, ชำระล่วงหน้า / Deposit, คงเหลือยอดชำระ','ยอดรวมและยอดที่ต้องติดตาม'],
  ['T–AA','เงินสด, บัตรเครดิต, QR Code, โอนเงิน SC, รัฐ 50%, ลูกค้าททท., ไม่เรียกเก็บ, ค้างชำระ','รายได้หน้า Front และช่องทางรับชำระ'],
  ['AB','หมายเหตุ','เหตุผล/รายละเอียดเพิ่มเติมของรายการ']
];
function closeRoundSourceTemplateRows(){
  return CLOSE_ROUND_SOURCE_VILLAS.map(villa=>`<tr><td><strong>${esc(villa)}</strong></td><td class="mono">-</td><td class="align-right">-</td><td class="align-right">-</td><td class="align-right">-</td><td>-</td></tr>`).join('');
}
function renderCloseRoundSourceTemplate(){
  const view=$('#view-close-round');
  if(!view)return;
  const reportHeading=view.querySelector('.page-heading h2');
  if(reportHeading)reportHeading.textContent='รายงานปิดรอบประจำวันของเดอะซีนเนอรี่ รีสอร์ท';
  const reportDate=view.querySelector('#close-round-date')?.value,reportSubtitle=view.querySelector('.page-heading .muted');
  if(reportSubtitle)reportSubtitle.textContent=`วันที่ทำเอกสาร: ${reportDate||'-'} · ดึงเฉพาะ Invoice ที่ Finalized แล้ว`;
  view.querySelector('#close-round-source-template')?.remove();
  return;
  let panel=$('#close-round-source-template');
  if(!panel){
    panel=document.createElement('article');
    panel.id='close-round-source-template';
    panel.className='panel close-round-source-template';
    const detail=view.querySelector('.close-round-detail-panel');
    (detail||view.lastElementChild)?.before(panel);
  }
  panel.innerHTML=`<div class="panel-heading"><div><span class="title-icon"><span class="material-symbols-outlined">dataset</span></span><div><h3>ข้อมูลวิลล่าตามไฟล์ต้นทาง</h3><small class="muted">ชีต สำเนาของ 22 · แถวข้อมูลตัวอย่าง 5–15 · A2 Serial Date 46134.0 = 22 เม.ย. 2569</small></div></div><span class="count-chip">${CLOSE_ROUND_SOURCE_VILLAS.length} Villa</span></div><p class="close-round-template-note">รายการด้านล่างเป็นโครงสร้างตั้งต้นจาก <strong>หน้าปิดรอบ.xlsx</strong> ค่าทางการเงินเป็น 0 ตามไฟล์ต้นฉบับ และจะถูกแทนด้วยข้อมูล Invoice ที่ Finalized เมื่อมีรายการจริง</p><div class="table-wrap"><table class="close-round-template-table"><thead><tr><th>ชื่อวิลล่า</th><th>รหัส</th><th class="align-right">ยอดรวม Q</th><th class="align-right">Deposit R</th><th class="align-right">คงเหลือ S</th><th>หมายเหตุ AB</th></tr></thead><tbody>${closeRoundSourceTemplateRows()}</tbody></table></div>`;
  const sourceNote=view.querySelector('.close-round-source-note small');
  if(sourceNote)sourceNote.textContent='ต้นทาง: หน้าปิดรอบ.xlsx · ชีต สำเนาของ 22 · รายงานวันที่ 22 เม.ย. 2569 (Excel Serial 46134.0) · แสดง Villa/รหัส/ลูกค้า/In–Out, F–P, Q–S, T–AA และ AB';
  const metric=view.querySelector('.round-metrics article:nth-child(4)');
  if(metric){
    const metricValue=selector=>Number(String(view.querySelector(selector)?.textContent||'').replace(/[^0-9.-]/g,'').replace(/,/g,''))||0;
    const outstanding=metricValue('.round-metrics article:nth-child(3) strong');
    const pending=metricValue('.round-metrics article:nth-child(4) strong');
    const difference=Math.max(0,outstanding-pending);
    metric.querySelector('small').textContent='ยอดต่าง / Payment Difference';
    metric.querySelector('strong').textContent=money(difference);
    metric.querySelector('strong').className=difference?'warning-text':'positive-text';
    metric.querySelector('span').textContent=pending?`ค้างชำระในช่อง AA ${money(pending)}`:'ยอดรับชำระตรงกับยอดที่ต้องติดตาม';
  }
}

function renderCloseRoundSystemData(){
  const master=$('#view-master');
  if(master&&!$('#close-round-data-dictionary')){
    const panel=document.createElement('article');
    panel.id='close-round-data-dictionary';
    panel.className='panel close-round-data-dictionary';
    panel.innerHTML=`<div class="panel-heading"><div><span class="title-icon"><span class="material-symbols-outlined">account_tree</span></span><div><h3>โครงสร้างข้อมูลหน้าปิดรอบ</h3><small class="muted">อ้างอิงหน้าปิดรอบ.xlsx · ชีต สำเนาของ 22</small></div></div><span class="status-chip success">พร้อมใช้งาน</span></div><div class="table-wrap"><table><thead><tr><th>ช่วงคอลัมน์</th><th>หัวข้อจากไฟล์</th><th>การใช้งานในระบบ</th></tr></thead><tbody>${CLOSE_ROUND_SOURCE_GROUPS.map(group=>`<tr><td class="mono">${group[0]}</td><td>${group[1]}</td><td>${group[2]}</td></tr>`).join('')}</tbody></table></div>`;
    master.append(panel);
  }
  const importView=$('#view-import');
  if(importView){
    const fileName=importView.querySelector('.import-file strong');
    if(fileName)fileName.textContent='หน้าปิดรอบ.xlsx';
    const fileMeta=importView.querySelector('.import-file small');
    if(fileMeta)fileMeta.textContent='ชีต: สำเนาของ 22 · A2: Excel Serial Date 46134.0 (22 เม.ย. 2569)';
    const status=importView.querySelector('.import-status .status-chip');
    if(status)status.textContent='อ่านโครงสร้างแล้ว';
    const summary=importView.querySelectorAll('.import-summary > div');
    const summaryData=[['28','คอลัมน์ต้นทาง'],[String(CLOSE_ROUND_SOURCE_VILLAS.length),'Villa ในแบบฟอร์ม'],['0','ข้อมูลผิดปกติ']];
    summaryData.forEach((item,index)=>{const block=summary[index];if(!block)return;const value=block.querySelector('strong');const label=block.querySelector('small');if(value)value.textContent=item[0];if(label)label.textContent=item[1]});
    const issues=importView.querySelectorAll('.issue-list .issue-list > div, .issue-list > div');
    if(issues[0]){const title=issues[0].querySelector('strong'),body=issues[0].querySelector('p');if(title)title.textContent='หัวตารางหลายระดับตามแบบฟอร์ม';if(body)body.textContent='แถว 1–4 เป็นหัวรายงานและหัวคอลัมน์ แถวข้อมูลเริ่มจากแถว 5 จึงต้องอ่านตามชื่อคอลัมน์'}
    if(issues[1]){const title=issues[1].querySelector('strong'),body=issues[1].querySelector('p');if(title)title.textContent='เชื่อมยอด Q:AA จาก Invoice';if(body)body.textContent='ยอดรวม, Deposit, คงเหลือ และช่องทางชำระเงินต้องมาจาก Invoice ที่เชื่อมด้วยรหัส ไม่กรอกซ้ำในระบบ'}
  }
}
document.addEventListener('DOMContentLoaded',renderCloseRoundSystemData);

/* Keep legacy accommodation records from falling into the Other bucket. */
const closeRoundCategoryKeyBeforeLegacyFix=closeRoundCategoryKey;
closeRoundCategoryKey=function(line){
  return closeRoundConditionCategoryKey(line);
};
const closeRoundRecordModelBeforeLegacyFix=closeRoundRecordModel;
closeRoundRecordModel=function(record){
  const model=closeRoundRecordModelBeforeLegacyFix(record),lines=Array.isArray(record?.lines)?record.lines:[],hasVillaLine=lines.some(line=>closeRoundCategoryKey(line)==='villa');
  if(model.total>0&&!lines.length&&(record?.villa||record?.villaCode)){
    model.categories.villa=model.total;
    model.categories.other=0;
  }else if(model.total>0&&(record?.villa||record?.villaCode)&&!hasVillaLine&&lines.length<=1){
    const nonOtherTotal=Object.entries(model.categories).filter(([key])=>key!=='other').reduce((sum,[,value])=>sum+Number(value||0),0),otherTotal=Number(model.categories.other||0);
    if(nonOtherTotal<=0.005&&otherTotal>=model.total-0.005){
      model.categories.villa=model.total;
      model.categories.other=0;
    }
  }else if(model.total>0&&hasVillaLine){
    const categorySum=Object.values(model.categories).reduce((sum,value)=>sum+Number(value||0),0),difference=model.total-categorySum;
    if(Math.abs(difference)>0.005){
      model.categories.villa=Math.max(0,Number(model.categories.villa||0)+difference);
      model.categories.other=0;
    }
  }
  return model;
};

/*
 * LOCKED CLOSE-ROUND ACCOUNTING CONTRACT
 *
 * This is the protected boundary for the Close Round report. Keep these
 * rules independent from invoice editing, payment allocation, and display
 * formatting:
 *   - category columns = each invoice line's GROSS amount (qty x rate)
 *   - "ไม่เรียกเก็บ" = invoice discount only
 *   - total Q = sum of gross category amounts
 *
 * A raw payment amount, pending amount, net total, or outstanding amount must
 * never be used as the No Charge value. Any future Close Round change should
 * call the locked helpers below instead of reimplementing these calculations.
 */
const CLOSE_ROUND_LOCKED_RULES=Object.freeze({
  categoryAmount:'line.gross',
  noChargeAmount:'invoice.discount',
  totalAmount:'sum(category.gross)'
});
function closeRoundDeclaredDiscount(record){
  const payload=record?.payload&&typeof record.payload==='object'?record.payload:null;
  const source=payload&&Object.prototype.hasOwnProperty.call(payload,'discount')?payload:record;
  const value=Number(source?.discount);
  return Number.isFinite(value)?Math.max(0,value):null;
}
function closeRoundLineDiscountTotal(record){
  const lines=Array.isArray(record?.lines)?record.lines:[];
  return lines.reduce((sum,line)=>{
    const gross=Math.max(0,Number(line.qty||0)*Number(line.rate||0));
    return sum+Math.max(0,gross-closeRoundLineNet(line));
  },0);
}
function closeRoundDiscountOnly(record){
  const declared=closeRoundDeclaredDiscount(record);
  if(declared!==null)return declared;
  return closeRoundLineDiscountTotal(record);
}

/* Exact mapping from หน้าปิดรอบ เงื่อนไข.txt with full food & food-package coverage. */
function closeRoundConditionCategoryKey(line){
  const rawCat = String(line?.category || '').trim();
  const rawName = String(line?.name || '').trim();
  const category = rawCat.toLowerCase().replace(/_/g, ' ');
  const name = rawName.toLowerCase();
  const text = `${category} ${name}`;

  // 1. Extra Bed (ที่นอนเสริม)
  if (/extra.?bed|เตียงเสริม|ที่นอนเสริม|ที่นอน|extra.?person/.test(text)) return 'extraBed';

  // 2. Minibar (มินิบาร์)
  if (category === 'minibar' || /minibar|มินิบาร์/.test(category)) return 'minibar';

  // 3. HT / SHT (Afternoon Tea)
  if (/afternoon tea|afternoon_tea|high tea|high_tea|ht_sht|ht\/sht/.test(category) ||
      /\b(?:afternoon tea|high tea|ht\s*\/?\s*sht)\b/.test(name) ||
      /\b(?:ht|sht)\s*(?:800|900|1,?200)\b/.test(name) ||
      /^เครื่องดื่มและเบเกอรี\s+ราคา\s*888/i.test(name)) {
    return 'htSht';
  }

  // 4. Dog Activity (กิจกรรมชมสุนัข 123 ไร่)
  if (/กิจกรรมชมสุนัข|ชมสุนัข|สุนัข|dog|ชมโชว์/.test(text) || category.includes('กิจกรรมชมสุนัข')) return 'dogActivity';

  // 5. Massage (ค่านวด)
  if ((/activit|กิจกรรม/.test(category) && /massage|นวด/.test(text)) || /นวดแผนไทย|นวดน้ำมัน|นวดฝ่าเท้า|นวดแก้อาการ|นวดคอ|นวดประคบ|นวด/.test(name)) return 'massage';

  // 6. EV Charging (ชาร์จ EV)
  if ((/miscellaneous|เบ็ดเตล็ด/.test(category) || category === 'ev') && (/\bev\b|ชาร์จ/i.test(name) || /charge\s*ev|ev\s*charger|หัว\s*[abc]/i.test(name)) && !/voucher/i.test(name)) return 'ev';

  // 7. Souvenir / Products (สินค้า)
  if (/souvenir|souvinir|สินค้า|ของที่ระลึก/.test(category) || /สินค้าที่ระลึก|โลชั่นลาโนลีน|ครีมอาบน้ำ|ชาโรสวนิลา|ที่เป่าฟอง|หมอนรองคอ|ไม้ปัดขนแกะ|ชาถัวดาว|welcome drink|สารบำรุงดิน|นมอัดเม็ด|placenta|หมวกหน้าแกะ|พรมขนแกะ|พวงกุญแจ|ตุ๊กตา|ผ้าห่มขนแกะ|กระเป๋า|แกะคอโยก|ดินสอหัวแกะ|ผ้าขนหนู|พรมเช็ดเท้า|ถุงเท้า|เสื้อตอปก|ผ้าพันคอ|เตาปิ้งย่างใหญ่/i.test(name)) {
    return 'product';
  }

  // 8. Food & Beverages / BBQ / Food Packages / Picnic / Shabu (รายการที่เป็นอาหารทั้งหมดในใบแจ้งหนี้ รวมถึงแพ็กเกจที่เป็นอาหาร)
  // 8.1 หมวด Food_Beverage และ BBQ ทุกรายการ
  if (/food ?&? ?beverage|food beverage|อาหารและเครื่องดื่ม|อาหาร|bbq|บาร์บีคิว/.test(category)) return 'food';

  // 8.2 ตระกร้าปิคนิค / ปิกนิก (ตระกร้าปิคนิค Defender, ATV เช้า/บ่าย ฯลฯ ทุกหมวด)
  if (/ปิ[คก]นิก|picnic|ต[ระ]*กร้า|ตะหน้า/.test(name)) return 'food';

  // 8.3 ชาบู / Shabu (Rainy Season Free ชาบู หมู/เนื้อ, ชาบูหมู, ชาบูเนื้อ ทุกหมวด)
  if (/ชาบู|shabu/.test(name)) return 'food';

  // 8.4 หมวด Complimentary รายการอาหาร ขนม นม เบเกอรี่
  if (/complimentary/.test(category) || /complimentary/.test(name)) {
    if (/waffle|วาฟเฟิล|cake|เค้ก|muesli|มูสลี่|yogurt|โยเกิร์ต|croissant|ครัวซองต์|milk|นม|อาหาร|food|ขนม/.test(name)) {
      return 'food';
    }
  }

  // 8.5 หมวด Package ทุกรายการที่เป็นอาหาร (ชุดอาหารไทย/ยุโรป, BBQ package, Dinner voucher, ฯลฯ)
  if (/package/.test(category) || /package/.test(name)) {
    if (/dinner|lunch|breakfast|ชาบู|shabu|หมู|เนื้อ|ไก่|food|meal|bbq|บาร์บีคิว|buffet|บุฟเฟต์|ปิ[คก]นิก|picnic|waffle|cake|muesli|yogurt|croissant|milk|fondue|sausage|wings|marshmallow|ปิ้งย่าง|อาหาร|voucher|ชุดอาหาร|เซตอาหาร|steak|สเต็ก/i.test(name)) {
      return 'food';
    }
  }

  // 8.6 ตรวจจับคีย์เวิร์ดอาหารและบาร์บีคิวทั่วไปในรายการ
  if (/ชาบู|shabu|บาร์บีคิว|อาหารเย็น|อาหารเช้า|อาหารกลางวัน|พิซซ่า|pizza|fondue|german sausage|buffalo wings|marshmallow|vegetable set|chicken set|pork set|meat set/i.test(name)) {
    return 'food';
  }

  // 9. ATV (กิจกรรม ATV ยกเว้นที่เป็นตระกร้าอาหารปิคนิคที่ถูกจัดเข้า food ไปแล้ว)
  if (/atv/.test(text)) return 'atv';

  // 10. Villa / Accommodation (ค่าวิลล่า)
  if (line?.type === 'accommodation' ||
      /accommodation|villa|วิลล่า|ห้องพัก|ค่าวิลล่า|ค่าบ้าน|บ้านพัก|ค่าที่พัก|ที่พัก|bathtub_deluxe|jacuzzi_deluxe|jacuzzi|bathtub|bath ?tub/.test(category) ||
      /pangola|hamata|barbados|merino|corriedale|corredale|katahdin|mulato|napier|setaria|alfalfa|rapunzel|แพงโกล่า|ฮามาต้า|บาร์บาโดส|เมอริโน่|คอร์ริเดล|คาทาดิน|มูลาโต้|เนเปียร์|เซทาเรีย|อัลฟัลฟ่า|ราพันเซล|ruzi|pre-wedding/i.test(name)) {
    return 'villa';
  }

  // 11. Drinks & Bakery (เครื่องดื่มและเบเกอรี่ - Grandma's Cafe) -> other
  if (/เครื่องดื่มและเบเกอรี่/.test(category) || /เครื่องดื่มและเบเกอรี่/.test(name)) return 'other';

  // 12. Miscellaneous / Compensation / Other
  return 'other';
}
const closeRoundRecordModelBeforeExactConditions=closeRoundRecordModel;
closeRoundRecordModel=function(record){
  const model=closeRoundRecordModelBeforeExactConditions(record),lines=Array.isArray(record?.lines)?record.lines:[],categories=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0])),grossBy=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0]));
  lines.forEach(line=>{const gross=Math.max(0,Number(line.qty||0)*Number(line.rate||0)),key=closeRoundConditionCategoryKey(line);categories[key]+=gross;grossBy[key]+=gross});
  const grossTotal=Object.values(grossBy).reduce((sum,value)=>sum+value,0),discount=Math.max(0,closeRoundDeclaredDiscount(record)??0),total=grossTotal||Math.max(0,Number(record?.total||0)+discount),deposit=Math.max(0,Number(record?.deposit||0)),pending=Math.max(0,Number(record?.pendingTotal||0)),payments=Object.fromEntries(CLOSE_ROUND_PAYMENTS.map(item=>[item.key,0]));
  (record?.payments||[]).forEach(payment=>{payments[closeRoundPaymentKey(payment.method)]+=Math.max(0,Number(payment.amount||0))});
  payments.noCharge=discount;
  payments.pending=pending;
  return {...model,categories,payments,total,deposit,outstanding:Math.max(0,total-discount-deposit),pending,villaCode:record?.villaCode||'',villa:record?.villa||model.villa||''};
};

/* Final category model: each line stays in its own category at gross value.
   Discounts are reported separately in the No Charge column. Q remains the
   invoice gross total and is never inflated by the discount. */
const closeRoundRecordModelWithCategorySemantics=closeRoundRecordModel;
closeRoundRecordModel=function(record){
  const model=closeRoundRecordModelWithCategorySemantics(record),lines=Array.isArray(record?.lines)?record.lines:[],categories=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0]));
  const grossBy=Object.fromEntries(CLOSE_ROUND_CATEGORIES.map(item=>[item.key,0]));
  let lineDiscountTotal=0;
  lines.forEach(line=>{
    const key=closeRoundConditionCategoryKey(line);
    const gross=Math.max(0,Number(line.qty||0)*Number(line.rate||0)),net=closeRoundLineNet(line);
    grossBy[key]+=gross;categories[key]+=gross;lineDiscountTotal+=Math.max(0,gross-net);
  });
  const declaredDiscount=Math.max(0,closeRoundDeclaredDiscount(record)??0);
  // A payment row named "No Charge" can contain the invoice total in older
  // records.  It is not a discount source, so never copy that raw payment
  // amount into the Close Round No Charge column.  Use only the discount
  // recorded on the invoice, plus discounts calculable from its lines.
  // Locked rule: No Charge is the declared invoice discount. Line discounts
  // are only a fallback for legacy records that have no invoice discount.
  const totalDiscount=closeRoundDeclaredDiscount(record)===null?lineDiscountTotal:declaredDiscount;
  if(!lines.length&&model.categories.villa){categories.villa=Math.max(0,Number(model.categories.villa||0));}
  model.categories=categories;
  if(model.payments)model.payments.noCharge=totalDiscount;
  return model;
};


closeRoundPaymentRows=function(records){
  const totals=Object.fromEntries(CLOSE_ROUND_PAYMENTS.map(item=>[item.key,0]));
  records.forEach(record=>{const row=closeRoundRecordModel(record);CLOSE_ROUND_PAYMENTS.forEach(item=>{totals[item.key]+=item.key==='noCharge'?closeRoundDiscountOnly(record):row.payments[item.key]})});
  const grand=Object.values(totals).reduce((sum,value)=>sum+value,0);
  return CLOSE_ROUND_PAYMENTS.map(item=>{const value=totals[item.key],width=grand?Math.round(value/grand*100):0;return `<div class="payment-bar-row"><div><span><i class="payment-dot ${item.className}"></i>${item.label}</span><strong>${closeRoundMoneyCell(value)}</strong></div><div class="bar"><i style="width:${width}%"></i></div></div>`}).join('')+`<div class="payment-foot"><span>รวมรับชำระ / รอเรียกเก็บ</span><strong>${money(grand)}</strong></div>`;
};

/* Master Data: render the real loaded catalog instead of the starter mockup. */
function masterDataCatalogRows(tab,query=''){
  const needle=String(query||'').trim().toLowerCase();
  const villas=[...new Map(villaOptions.filter(item=>item?.name).map(item=>[item.name,item])).values()];
  const products=[...accommodationItems.map(item=>({...item,source:'Accommodation'})),...addonItems.map(item=>({...item,source:'Add-on'}))];
  const packages=products.filter(item=>/package|voucher|set/i.test(`${item.category||''} ${item.name||''}`));
  const payments=(Array.isArray(CLOSE_ROUND_PAYMENTS)?CLOSE_ROUND_PAYMENTS:paymentMethods.map(label=>({label}))).map(item=>({name:item.label||item.name,category:'Payment Channel',rate:null,reference:item.key||''}));
  const source=tab==='villas'?villas:tab==='packages'?packages:tab==='payments'?payments:products;
  const matches=source.filter(item=>!needle||`${item.name||''} ${item.category||''} ${item.reference||''} ${item.description||''}`.toLowerCase().includes(needle));
  if(!matches.length)return '<tr><td colspan="6"><div class="empty-state"><p>ไม่พบข้อมูลจริงตามที่ค้นหา</p></div></td></tr>';
  return matches.map((item,index)=>{
    const isVilla=tab==='villas',isPayment=tab==='payments';
    const code=isVilla?String(item.name||'').match(/^\d{2,3}/)?.[0]||`V-${index+1}`:isPayment?item.reference||'-':`${item.source==='Accommodation'?'ACC':'ADD'}-${String(index+1).padStart(3,'0')}`;
    const category=isVilla?item.description||'Villa':item.category||'-';
    const detail=isVilla?item.reference||'-':item.source||'';
    const price=item.rate===null||item.rate===undefined?'—':money(item.rate);
    return `<tr><td class="mono">${esc(code)}</td><td><strong>${esc(item.name||'-')}</strong><small class="table-subtext">${esc(detail)}</small></td><td>${esc(category)}</td><td class="align-right strong-number">${esc(price)}</td><td><span class="status-chip success">ข้อมูลจริง</span></td><td>${isPayment?'ช่องทางรับชำระ':isVilla?'Villa / Room':'รายการจากฐานข้อมูล'}</td></tr>`;
  }).join('');
}
function renderMasterDataActual(tab='products',query=''){
  const view=$('#view-master');if(!view)return;
  const villas=[...new Map(villaOptions.filter(item=>item?.name).map(item=>[item.name,item])).values()];
  const products=[...accommodationItems,...addonItems];
  const packages=products.filter(item=>/package|voucher|set/i.test(`${item.category||''} ${item.name||''}`));
  const payments=Array.isArray(CLOSE_ROUND_PAYMENTS)?CLOSE_ROUND_PAYMENTS:paymentMethods.map(label=>({label}));
  const tabs=[['products','สินค้าและบริการ',products.length],['villas','Villa / ห้องพัก',villas.length],['packages','แพ็กเกจ',packages.length],['payments','ช่องทางชำระเงิน',payments.length]];
  view.innerHTML=`<div class="page-heading compact"><div><p class="eyebrow">MASTER DATA / LIVE CATALOG</p><h2>ข้อมูลหลัก</h2><p class="muted">ข้อมูลจริงจากรายการ Villa สินค้า แพ็กเกจ และช่องทางชำระเงินของระบบ</p></div><span class="status-chip success">เชื่อมข้อมูลจริงแล้ว</span></div><article class="panel"><div class="master-tabs">${tabs.map(([key,label,count])=>`<button class="${key===tab?'active':''}" type="button" data-master-tab="${key}">${label} <b>${count}</b></button>`).join('')}</div><div class="filter-bar"><div class="search-field"><span class="material-symbols-outlined">search</span><input data-master-search placeholder="ค้นหาชื่อ รหัส หรือหมวด..." value="${esc(query)}"></div><span class="data-quality"><span class="material-symbols-outlined">verified</span>แสดงจากข้อมูลจริง ${masterDataCatalogRows(tab,query).match(/<tr>/g)?.length||0} รายการ</span></div><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>รายการ</th><th>หมวด</th><th class="align-right">ราคา</th><th>สถานะ</th><th>แหล่งข้อมูล</th></tr></thead><tbody>${masterDataCatalogRows(tab,query)}</tbody></table></div></article>`;
  const search=view.querySelector('[data-master-search]');
  search?.addEventListener('input',event=>renderMasterDataActual(tab,event.target.value));
  view.querySelectorAll('[data-master-tab]').forEach(button=>button.addEventListener('click',()=>renderMasterDataActual(button.dataset.masterTab,'')));
}
document.addEventListener('DOMContentLoaded',()=>renderMasterDataActual());

/* Accounting output: A4 landscape, fit to width, readable type, and allow
 * additional A4 pages instead of shrinking the table into unreadable text. */
const closeRoundA4PrintCss=`
  @page{size:A4 landscape;margin:0}
  *{box-sizing:border-box}
  html,body{width:297mm;min-height:210mm;margin:0;padding:0;overflow:visible;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}
  .sheet{width:297mm;min-height:210mm;padding:8mm;background:#fff}
  .close-round-print-layout{width:281mm;min-height:194mm;overflow:visible}
  .close-round-print-layout-heading{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1.5px solid #6e442d;padding:0 0 2mm;margin:0 0 3mm;font-size:12px;line-height:1.2}
  .close-round-print-layout-heading span{font-size:10px;color:#66584e}
  .close-round-detail-table{width:281mm;border-collapse:collapse;table-layout:fixed;font-size:9px;line-height:1.2}
  .close-round-detail-table th,.close-round-detail-table td{border:1px solid #29231e;padding:2.5px 1.8px;vertical-align:middle;overflow-wrap:anywhere;word-break:break-word}
  .close-round-detail-table th{background:#eee3d8;font-weight:700;text-align:center}
  .close-round-detail-table td{text-align:left}
  .close-round-detail-table .align-right{text-align:right}
  .close-round-detail-table thead{display:table-header-group}
  .close-round-detail-table tr{break-inside:avoid;page-break-inside:avoid}
  .close-round-detail-table th:nth-child(1),.close-round-detail-table td:nth-child(1){width:7%}
  .close-round-detail-table th:nth-child(2),.close-round-detail-table td:nth-child(2){width:6%}
  .close-round-detail-table th:nth-child(3),.close-round-detail-table td:nth-child(3){width:13%}
  .close-round-detail-table th:nth-child(4),.close-round-detail-table td:nth-child(4),.close-round-detail-table th:nth-child(5),.close-round-detail-table td:nth-child(5){width:4%}
  .close-round-detail-table th:nth-child(n+6):nth-child(-n+16),.close-round-detail-table td:nth-child(n+6):nth-child(-n+16){width:2.8%}
  .close-round-detail-table th:nth-child(n+17):nth-child(-n+19),.close-round-detail-table td:nth-child(n+17):nth-child(-n+19){width:4.2%}
  .close-round-detail-table th:nth-child(20),.close-round-detail-table td:nth-child(20){width:9.6%}
  .close-round-detail-table th:nth-child(21),.close-round-detail-table td:nth-child(21){width:13%}
  .close-round-print-density-compact{font-size:8.6px}
  .close-round-print-density-dense{font-size:8.2px;line-height:1.15}
  .close-round-print-summary{display:flex;flex-wrap:wrap;gap:2mm;margin-top:3mm;padding-top:2mm;border-top:1.5px solid #6e442d;font-size:8px;line-height:1.2}
  .close-round-print-summary>div{flex:1 1 30mm;min-width:30mm;border:1px solid #b9a99d;padding:1.5mm;text-align:center}
  .close-round-print-summary>div.close-round-print-summary-heading{flex:0 0 100%;border:0;padding:0;text-align:left;font-weight:700;font-size:8px;color:#6e442d}
  .close-round-print-summary span,.close-round-print-summary strong{display:block}
  .close-round-print-summary span{font-size:7.5px;color:#66584e}
  .close-round-print-summary strong{font-size:9px;margin-top:.5mm}
  .close-round-print-summary p{margin:0;font-size:8px;line-height:1.2}
`;
printCloseRoundDetailOnePage=function(){
  const date=closeRoundSelectedDate();persistCloseRoundDetailEdits();installCloseRoundDetailTools();prepareCloseRoundDetailPrint(date);
  const layout=document.querySelector('#view-close-round .close-round-print-layout');
  if(!layout){showToast('ไม่พบรายละเอียดสำหรับพิมพ์','error');return}
  document.querySelector('#close-round-print-frame')?.remove();
  const frame=document.createElement('iframe');frame.id='close-round-print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดปิดรอบ ${esc(date)}</title><style>${closeRoundA4PrintCss}</style></head><body><div class="sheet">${layout.outerHTML}</div></body></html>`;
  document.body.append(frame);
  const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  frame.addEventListener('load',()=>{const printWindow=frame.contentWindow;if(!printWindow)return;printWindow.focus();setTimeout(()=>printWindow.print(),150);setTimeout(cleanup,15000)},{once:true});
};

/* Final print override: keep the original single accounting table layout. */
prepareCloseRoundDetailPrint=function(date){
  const selectedDate=date||closeRoundSelectedDate();
  const panel=$('#view-close-round .close-round-detail-panel');
  const source=panel?.querySelector('.close-round-detail-wrap .close-round-detail-table')||panel?.querySelector('.close-round-detail-table');
  if(!panel||!source)return;
  panel.querySelector('.close-round-print-layout')?.remove();
  const layout=document.createElement('div');layout.className='close-round-print-layout';
  const heading=document.createElement('div');heading.className='close-round-print-layout-heading';
  heading.innerHTML='<strong>รายละเอียดรายการปิดรอบ</strong><span>Business Date: '+esc(selectedDate)+'</span>';
  const records=closeRoundRecords(selectedDate),table=closeRoundCompactPrintTable(source,records),summary=document.createElement('div');
  summary.innerHTML=closeRoundPrintSummaryMarkup(records);
  if(table)layout.append(heading,table,summary.firstElementChild);
  panel.append(layout);
};
printCloseRoundDetailOnePage=function(){
  const date=closeRoundSelectedDate();persistCloseRoundDetailEdits();installCloseRoundDetailTools();prepareCloseRoundDetailPrint(date);
  const layout=document.querySelector('#view-close-round .close-round-print-layout');if(!layout){showToast('ไม่พบรายละเอียดสำหรับพิมพ์','error');return}
  document.querySelector('#close-round-print-frame')?.remove();
  const frame=document.createElement('iframe');frame.id='close-round-print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดรายการปิดรอบ '+esc(date)+'</title><style>'+closeRoundA4PrintCss+'</style></head><body><div class="sheet">'+layout.outerHTML+'</div></body></html>';
  document.body.append(frame);const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  frame.addEventListener('load',()=>{const printWindow=frame.contentWindow;if(!printWindow)return;printWindow.focus();setTimeout(()=>printWindow.print(),150);setTimeout(cleanup,15000)},{once:true});
};

/* Keep the original accounting table layout for printing, with A4 landscape
 * width and readable type. */
prepareCloseRoundDetailPrint=function(date){
  const selectedDate=date||closeRoundSelectedDate(),panel=$('#view-close-round .close-round-detail-panel'),source=panel?.querySelector('.close-round-detail-wrap .close-round-detail-table')||panel?.querySelector('.close-round-detail-table');
  if(!panel||!source)return;
  panel.querySelector('.close-round-print-layout')?.remove();
  const layout=document.createElement('div');layout.className='close-round-print-layout';
  const heading=document.createElement('div');heading.className='close-round-print-layout-heading';heading.innerHTML='<strong>รายละเอียดรายการปิดรอบ</strong><span>Business Date: '+esc(selectedDate)+'</span>';
  const records=closeRoundRecords(selectedDate),table=closeRoundCompactPrintTable(source,records),summary=document.createElement('div');summary.innerHTML=closeRoundPrintSummaryMarkup(records);
  if(table)layout.append(heading,table,summary.firstElementChild);panel.append(layout);
};
printCloseRoundDetailOnePage=function(){
  const date=closeRoundSelectedDate();persistCloseRoundDetailEdits();installCloseRoundDetailTools();prepareCloseRoundDetailPrint(date);
  const layout=document.querySelector('#view-close-round .close-round-print-layout');if(!layout){showToast('ไม่พบรายละเอียดสำหรับพิมพ์','error');return}
  document.querySelector('#close-round-print-frame')?.remove();
  const frame=document.createElement('iframe');frame.id='close-round-print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดรายการปิดรอบ ${esc(date)}</title><style>${closeRoundA4PrintCss}</style></head><body><div class="sheet">${layout.outerHTML}</div></body></html>`;
  document.body.append(frame);const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  frame.addEventListener('load',()=>{const printWindow=frame.contentWindow;if(!printWindow)return;printWindow.focus();setTimeout(()=>printWindow.print(),150);setTimeout(cleanup,15000)},{once:true});
};
closeRoundSinglePageExcel=function(records,date){
  const source=document.querySelector('#view-close-round .close-round-detail-table'),table=closeRoundCompactPrintTable(source,records);
  if(!table){showToast('ยังไม่มีตารางปิดรอบสำหรับส่งออก','error');return}
  const heading=`<div class="report-heading"><strong>รายละเอียดรายการปิดรอบ</strong><span>Business Date: ${esc(date)}</span></div>`,summary=closeRoundPrintSummaryMarkup(records);
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>${closeRoundA4PrintCss}.report-heading{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm;padding-bottom:2mm;border-bottom:2px solid #6e442d;font-size:14px}.report-heading span{font-size:11px;color:#66584e}.sheet{mso-page-orientation:landscape}.close-round-print-summary{font-size:8px}.close-round-print-summary p{font-size:8px}</style></head><body><div class="sheet">${heading}${table.outerHTML}${summary}</div></body></html>`;
  const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`close-round-${date}-A4-landscape.xls`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast(`ส่งออกปิดรอบ ${date} เป็น Excel A4 แนวนอนแล้ว`);
};

/* Full-detail accounting printout: use the whole A4 landscape page for each
 * Villa detail block instead of squeezing every accounting column into a tiny grid. */
const closeRoundFullA4PrintCss=`
  @page{size:A4 landscape;margin:0}
  *{box-sizing:border-box}
  html,body{width:297mm;min-height:210mm;margin:0;padding:0;overflow:visible;background:#fff;color:#211a15;font-family:Arial,Tahoma,sans-serif}
  .sheet{width:297mm;min-height:210mm;padding:8mm;background:#fff}
  .close-round-print-layout{width:281mm;min-height:194mm}
  .close-round-print-layout-heading{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #6e442d;padding:0 0 2.5mm;margin:0 0 4mm;font-size:15px;line-height:1.2}
  .close-round-print-layout-heading span{font-size:11px;color:#66584e}
  .close-round-print-card{border:1.5px solid #6e442d;border-radius:1mm;padding:3mm;margin:0 0 4mm;break-inside:avoid;page-break-inside:avoid}
  .close-round-print-identity{display:grid;grid-template-columns:1.35fr 1fr 2fr .8fr .8fr;gap:2mm}
  .close-round-print-field{min-height:11mm;border:1px solid #c4b2a4;border-radius:.7mm;padding:1.5mm;background:#fff}
  .close-round-print-label{display:block;color:#66584e;font-size:7.5px;line-height:1.1;margin-bottom:1mm;font-weight:700}
  .close-round-print-cell-content{font-size:10px;line-height:1.2;overflow-wrap:anywhere;word-break:break-word}
  .close-round-print-cell-content .close-round-print-value{font-size:10px}
  .close-round-print-block{margin-top:3mm}
  .close-round-print-block h5{margin:0 0 1.5mm;color:#6e442d;font-size:10px;line-height:1.2}
  .close-round-print-grid{display:grid;gap:1.5mm}
  .close-round-print-grid.categories{grid-template-columns:repeat(6,minmax(0,1fr))}
  .close-round-print-grid.payments{grid-template-columns:repeat(4,minmax(0,1fr))}
  .close-round-print-totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5mm;margin-top:3mm}
  .close-round-print-totals .close-round-print-field{background:#f5eee8}
  .close-round-print-note{margin-top:3mm}
  .close-round-print-note .close-round-print-field{min-height:13mm}
  .close-round-print-empty{font-size:11px;padding:15mm 0;text-align:center}
  .close-round-print-summary{display:flex;flex-wrap:wrap;gap:2mm;margin-top:3mm;padding-top:2mm;border-top:2px solid #6e442d;font-size:9px;line-height:1.2}
  .close-round-print-summary p{margin:0;font-size:9px}
`;
prepareCloseRoundDetailPrintFull=function(date){
  const selectedDate=date||closeRoundSelectedDate(),panel=$('#view-close-round .close-round-detail-panel'),source=panel?.querySelector('.close-round-detail-wrap .close-round-detail-table')||panel?.querySelector('.close-round-detail-table');
  if(!panel||!source)return;
  panel.querySelector('.close-round-print-layout')?.remove();
  const layout=document.createElement('div');layout.className='close-round-print-layout';
  const heading=document.createElement('div');heading.className='close-round-print-layout-heading';heading.innerHTML='<strong>รายละเอียดรายการส่งบัญชี</strong><span>Business Date: '+esc(selectedDate)+'</span>';layout.append(heading);
  const top=[...(source.tHead?.rows?.[0]?.cells||[])],second=[...(source.tHead?.rows?.[1]?.cells||[])],labels=[...top.slice(0,19).map(cell=>cell.textContent.trim()),...second.map(cell=>cell.textContent.trim()),top[20]?.textContent.trim()||'หมายเหตุ'];
  const rows=[...(source.tBodies[0]?.rows||[])].filter(row=>row.cells.length>=28);
  rows.forEach(row=>layout.append(closeRoundPrintCard(row,labels)));
  if(!rows.length){const empty=document.createElement('p');empty.className='close-round-print-empty';empty.textContent='ยังไม่มี Invoice ที่ Finalized ในวันที่เลือก';layout.append(empty)}
  panel.append(layout);
};
printCloseRoundDetailOnePageFull=function(){
  const date=closeRoundSelectedDate();persistCloseRoundDetailEdits();installCloseRoundDetailTools();prepareCloseRoundDetailPrint(date);
  const layout=document.querySelector('#view-close-round .close-round-print-layout');if(!layout){showToast('ไม่พบรายละเอียดสำหรับพิมพ์','error');return}
  document.querySelector('#close-round-print-frame')?.remove();
  const frame=document.createElement('iframe');frame.id='close-round-print-frame';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none';
  frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>รายละเอียดส่งบัญชี ${esc(date)}</title><style>${closeRoundFullA4PrintCss}</style></head><body><div class="sheet">${layout.outerHTML}</div></body></html>`;
  document.body.append(frame);const cleanup=()=>{frame.remove();window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});
  frame.addEventListener('load',()=>{const printWindow=frame.contentWindow;if(!printWindow)return;printWindow.focus();setTimeout(()=>printWindow.print(),150);setTimeout(cleanup,15000)},{once:true});
};
