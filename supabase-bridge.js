/* Supabase bridge for the current static app.
 * The UI remains usable in local mode, while configured deployments persist
 * finalized invoices, closed bookings, close rounds and edits in Supabase.
 */
(() => {
  const config=window.SCENERY_SUPABASE_CONFIG||{};
  const hasConfig=Boolean(config.url&&config.anonKey);
  const apiRoot=String(config.url||'').replace(/\/$/,'');
  const persistedSession=(()=>{try{return JSON.parse(localStorage.getItem('scenery-supabase-session')||'null')}catch{return null}})();
  const authToken=()=>window.scenerySupabase?.session?.access_token||persistedSession?.access_token||'';
  const restRequest=async(path,options={})=>{
    const headers={'apikey':config.anonKey,'Content-Type':'application/json',...(options.headers||{})};
    const token=authToken();if(token)headers.Authorization='Bearer '+token;
    const response=await fetch(apiRoot+path,{...options,headers});
    const body=await response.text();let data=null;try{data=body?JSON.parse(body):null}catch{data=body}
    if(!response.ok)return{data:null,error:new Error(data?.message||data?.hint||data?.error_description||body||('HTTP '+response.status))};
    return{data,error:null};
  };
  const restClient=hasConfig?{
    auth:{
      getUser:()=>{const token=authToken();return token?restRequest('/auth/v1/user'):Promise.resolve({data:{user:null},error:null})},
      getSession:()=>Promise.resolve({data:{session:window.scenerySupabase?.session||null},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
    },
    from(table){
      const state={method:'GET',query:[],orders:[],limit:null,body:null,upsert:false};
      const builder={
        select(columns='*'){state.method='GET';state.query.push('select='+encodeURIComponent(columns));return builder},
        order(column,options={}){state.orders.push(column+'.'+(options.ascending===false?'desc':'asc'));return builder},
        limit(value){state.limit=Number(value);return builder},
        eq(column,value){state.query.push(encodeURIComponent(column)+'='+encodeURIComponent('eq.'+value));return builder},
        insert(body){state.method='POST';state.body=body;return builder},
        upsert(body){state.method='POST';state.body=body;state.upsert=true;return builder},
        delete(){state.method='DELETE';return builder},
        then(resolve,reject){
          const run=async()=>{
            const params=[...state.query];if(state.orders.length)params.push('order='+encodeURIComponent(state.orders.join(',')));if(state.limit)params.push('limit='+state.limit);
            const headers=state.upsert?{'Prefer':'resolution=merge-duplicates,return=representation'}:{};
            return restRequest('/rest/v1/'+encodeURIComponent(table)+(params.length?'?'+params.join('&'):''),{method:state.method,headers,body:state.body==null?undefined:JSON.stringify(state.body)});
          };
          return run().then(resolve,reject);
        }
      };
      return builder;
    },
    channel(){
      const channel={on(){return channel},subscribe(){return channel}};
      return channel;
    }
  }:null;
  // The login form uses the REST fallback before the optional CDN finishes
  // loading. Keep reads and writes on the same REST client so its access token
  // is used consistently after login.
  const client=restClient;
  const localHistoryKey='scenery-invoice-history',localBookingsKey='scenery-closed-bookings',localRoundsKey='scenery-closed-rounds',localEditsKey='scenery-close-round-detail-edits',localAuditKey='scenery-audit-log',loginEmailKey='scenery-last-login-email';
  const originals={saveInvoiceHistory:window.saveInvoiceHistory,saveClosedBookings:window.saveClosedBookings,deleteInvoiceHistory:window.deleteInvoiceHistory,submitCloseRound:window.submitCloseRound,saveCloseRoundDetailEdit:window.saveCloseRoundDetailEdit};
  window.scenerySupabase={enabled:hasConfig,client,mode:client?'supabase-rest':'local',session:persistedSession};
  const notify=(message,type='info')=>{if(typeof window.showToast==='function')window.showToast(message,type)};
  const readLocal=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}};
  const writeLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const recordKey=record=>String(record?.id||record?.reference||'');
  const mergeSharedRecords=(remote,local)=>{
    const merged=new Map((remote||[]).map(record=>[recordKey(record),record]));
    (local||[]).forEach(record=>{const key=recordKey(record);if(key&&!merged.has(key))merged.set(key,record)});
    return [...merged.values()];
  };
  const broadcast=typeof BroadcastChannel==='function'?new BroadcastChannel('scenery-shared-sync'):null;
  const announceSync=()=>broadcast?.postMessage({type:'refresh',at:Date.now()});
  const currentUser=async()=>{if(!client)return null;const result=await client.auth.getUser();return result.data?.user||null};
  const invoiceDiscount=record=>{const payload=record?.payload&&typeof record.payload==='object'?record.payload:null;const source=payload&&Object.prototype.hasOwnProperty.call(payload,'discount')?payload:record;const value=Number(source?.discount);return Number.isFinite(value)?Math.max(0,value):0};
  const invoiceRow=async record=>{const user=await currentUser();return{id:String(record.id||record.reference||`INV-${Date.now()}`),reference:record.reference||record.id||null,business_date:record.businessDate||new Date().toISOString().slice(0,10),customer:record.customer||'',villa:record.villa||'',villa_code:record.villaCode||'',total:Number(record.total||0),discount:invoiceDiscount(record),deposit:Number(record.deposit||0),pending_total:Number(record.pendingTotal||0),status:record.status||'ชำระแล้ว',payload:record,created_by:user?.id||null};};
  const bookingRow=async record=>{const user=await currentUser();return{id:String(record.id||record.reference||`BOOK-${Date.now()}`),reference:record.reference||record.id||null,business_date:record.businessDate||null,customer:record.customer||'',villa:record.villa||'',total:Number(record.total||0),payload:record,created_by:user?.id||null};};
  async function upsertInvoices(records){if(!client)return;const rows=[];for(const record of records||[])rows.push(await invoiceRow(record));if(rows.length){const result=await client.from('invoice_history').upsert(rows,{onConflict:'id'});if(result.error)throw result.error}}
  async function upsertBookings(records){if(!client)return;const rows=[];for(const record of records||[])rows.push(await bookingRow(record));if(rows.length){const result=await client.from('closed_bookings').upsert(rows,{onConflict:'id'});if(result.error)throw result.error}}
  async function recordAudit(entry){if(!client)return;const user=await currentUser();const result=await client.from('audit_logs').insert({id:entry.id?.startsWith('AUD-')?undefined:entry.id,action:entry.action,entity_type:entry.entityType,entity_id:entry.entityId||null,before_data:entry.beforeData,after_data:entry.afterData,metadata:entry.metadata||{},actor_id:user?.id||null,created_at:entry.createdAt||new Date().toISOString()});if(result.error)throw result.error}
  window.scenerySupabase.recordAudit=entry=>recordAudit(entry).catch(error=>notify(`บันทึก Audit Log ไม่สำเร็จ: ${error.message||error}`,'error'));
  async function deleteInvoiceRemote(id){if(!client)return;const invoiceResult=await client.from('invoice_history').delete().eq('id',String(id));if(invoiceResult.error)throw invoiceResult.error;const bookingResult=await client.from('closed_bookings').delete().eq('id',String(id));if(bookingResult.error)throw bookingResult.error}
  async function pullInvoices(){
    if(!client)return;
    const result=await client.from('invoice_history').select('*').order('business_date',{ascending:false}).order('created_at',{ascending:false});
    if(result.error)throw result.error;
    const repairs=[];
    const remote=(result.data||[]).map(row=>{const payload=row.payload&&typeof row.payload==='object'?row.payload:{},payloadHasDiscount=Object.prototype.hasOwnProperty.call(payload,'discount'),discount=payloadHasDiscount?Math.max(0,Number(payload.discount)||0):Math.max(0,Number(row.discount)||0),record={...payload,id:row.id,reference:row.reference||payload.reference||row.id,businessDate:row.business_date,customer:row.customer,villa:row.villa,villaCode:row.villa_code,total:Number(row.total||0),discount,deposit:Number(row.deposit||0),pendingTotal:Number(row.pending_total||0),status:row.status};if(payloadHasDiscount&&Math.abs(Number(row.discount||0)-discount)>0.005)repairs.push(record);return record});
    const local=readLocal(localHistoryKey,[]);
    if(remote.length){
      const missing=local.filter(record=>!remote.some(item=>recordKey(item)===recordKey(record)));
      if(missing.length)await upsertInvoices(missing);
      writeLocal(localHistoryKey,mergeSharedRecords(remote,local));
      if(repairs.length)await upsertInvoices(repairs);
    }else if(local.length){await upsertInvoices(local)}
    if(typeof window.syncInvoiceHistoryState==='function')window.syncInvoiceHistoryState();
    if(typeof window.renderCloseRound==='function'&&window.sceneryAppState?.currentView==='close-round')window.renderCloseRound();
  }
  async function pullBookings(){
    if(!client)return;
    const result=await client.from('closed_bookings').select('*').order('created_at',{ascending:false});
    if(result.error)throw result.error;
    const remote=(result.data||[]).map(row=>({...row.payload,id:row.id,reference:row.reference||row.payload?.reference||row.id,businessDate:row.business_date,customer:row.customer,villa:row.villa,total:Number(row.total||0)}));
    const local=readLocal(localBookingsKey,[]);
    if(remote.length){
      const missing=local.filter(record=>!remote.some(item=>recordKey(item)===recordKey(record)));
      if(missing.length)await upsertBookings(missing);
      const merged=mergeSharedRecords(remote,local);
      writeLocal(localBookingsKey,merged);
      if(window.sceneryAppState)window.sceneryAppState.closedBookings=merged;
    }
    else if(local.length)await upsertBookings(local);
    if(typeof window.renderBookingRecords==='function')window.renderBookingRecords();
  }
  async function syncRounds(){
    if(!client)return;
    const rounds=readLocal(localRoundsKey,[]),user=await currentUser();
    if(!rounds.length)return;
    const rows=rounds.map(round=>({id:String(round.id),business_date:round.businessDate,status:round.status||'Submitted',totals:round.totals||{},payload:round,submitted_by:user?.id||null,submitted_at:round.submittedAt?new Date(round.submittedAt).toISOString():new Date().toISOString()}));
    const result=await client.from('close_rounds').upsert(rows,{onConflict:'id'});if(result.error)throw result.error;
  }
  async function pullRounds(){
    if(!client)return;
    const result=await client.from('close_rounds').select('*').order('business_date',{ascending:false});
    if(result.error)throw result.error;
    const remote=(result.data||[]).map(row=>({...row.payload,id:row.id,businessDate:row.business_date,status:row.status,submittedAt:row.submitted_at,totals:row.totals||{}}));
    const local=readLocal(localRoundsKey,[]);
    if(remote.length){writeLocal(localRoundsKey,mergeSharedRecords(remote,local));if(typeof window.renderCloseRound==='function')window.renderCloseRound()}
    else if(local.length)await syncRounds();
  }
  async function pullEdits(){
    if(!client)return;
    const result=await client.from('close_round_edits').select('record_id,payload,updated_at').order('updated_at',{ascending:false});
    if(result.error)throw result.error;
    const remote={};
    (result.data||[]).forEach(row=>{if(row?.record_id)remote[String(row.record_id)]=row.payload&&typeof row.payload==='object'?row.payload:{}});
    const local=readLocal(localEditsKey,{});
    if(Object.keys(remote).length){
      writeLocal(localEditsKey,{...local,...remote});
      if(typeof window.renderCloseRound==='function'&&window.sceneryAppState?.currentView==='close-round')window.renderCloseRound();
    }else if(Object.keys(local).length){
      const user=await currentUser();
      for(const [recordId,payload] of Object.entries(local)){
        const saved=await client.from('close_round_edits').upsert({record_id:String(recordId),payload,updated_by:user?.id||null},{onConflict:'record_id'});
        if(saved.error)throw saved.error;
      }
    }
  }
  async function pullAudit(){
    if(!client)return;
    const result=await client.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(500);
    if(result.error)throw result.error;
    const remote=(result.data||[]).map(row=>({id:row.id,action:row.action,entityType:row.entity_type,entityId:row.entity_id,beforeData:row.before_data,afterData:row.after_data,metadata:row.metadata||{},actor:row.actor_id||'ผู้ใช้งาน',createdAt:row.created_at}));
    if(remote.length){writeLocal(localAuditKey,remote);if(typeof window.renderAuditLog==='function')window.renderAuditLog()}
  }
  let hydratePromise=null;
  async function hydrate(){
    if(!client)return;
    if(hydratePromise)return hydratePromise;
    hydratePromise=(async()=>{
      const tasks=[pullInvoices(),pullBookings(),pullRounds(),pullAudit(),pullEdits()];
      const results=await Promise.allSettled(tasks);
      const failed=results.find(result=>result.status==='rejected');
      if(failed){
        const error=failed.reason||new Error('ไม่ทราบสาเหตุ');
        window.scenerySupabase.lastError=error;
        notify(`ซิงก์ Supabase บางส่วนไม่สำเร็จ: ${error.message||error}`,'error');
      }else{
        window.scenerySupabase.lastError=null;
        window.scenerySupabase.lastSyncAt=new Date().toISOString();
      }
      return results;
    })().finally(()=>{hydratePromise=null});
    return hydratePromise;
  }
  // Expose the same sync operation to the REST auth fallback. The fallback
  // can finish login before the optional Supabase CDN bundle is available;
  // without this hook the screen opens but remote data is not pulled until a
  // later focus/poll event.
  window.scenerySupabase.refresh=hydrate;
  function installPersistenceWrappers(){
    const saveInvoiceHistory=originals.saveInvoiceHistory||window.saveInvoiceHistory;
    const saveClosedBookings=originals.saveClosedBookings||window.saveClosedBookings;
    const deleteInvoiceHistory=originals.deleteInvoiceHistory||window.deleteInvoiceHistory;
    const submitCloseRound=originals.submitCloseRound||window.submitCloseRound;
    const saveCloseRoundDetailEdit=originals.saveCloseRoundDetailEdit||window.saveCloseRoundDetailEdit;
    if(saveInvoiceHistory&&!window.saveInvoiceHistory.__supabaseWrapped){
      const localSave=saveInvoiceHistory;
      window.saveInvoiceHistory=function(records){localSave(records);if(client)upsertInvoices(records).catch(error=>notify(`บันทึก Invoice ขึ้น Supabase ไม่สำเร็จ: ${error.message||error}`,'error'))};
      window.saveInvoiceHistory.__supabaseWrapped=true;
    }
    if(saveClosedBookings&&!window.saveClosedBookings.__supabaseWrapped){
      const localSave=saveClosedBookings;
      window.saveClosedBookings=function(){localSave();if(client)upsertBookings(window.sceneryAppState?.closedBookings||[]).catch(error=>notify(`บันทึกหลักฐานการจองไม่สำเร็จ: ${error.message||error}`,'error'))};
      window.saveClosedBookings.__supabaseWrapped=true;
    }
    if(deleteInvoiceHistory&&!window.deleteInvoiceHistory.__supabaseWrapped){
      const localDelete=deleteInvoiceHistory;
      window.deleteInvoiceHistory=function(id){localDelete(id);if(client)deleteInvoiceRemote(id).catch(error=>notify(`ลบ Invoice จาก Supabase ไม่สำเร็จ: ${error.message||error}`,'error'))};
      window.deleteInvoiceHistory.__supabaseWrapped=true;
    }
    if(submitCloseRound&&!window.submitCloseRound.__supabaseWrapped){
      const localSubmit=submitCloseRound;
      window.submitCloseRound=function(){localSubmit();if(client)syncRounds().catch(error=>notify(`บันทึกปิดรอบขึ้น Supabase ไม่สำเร็จ: ${error.message||error}`,'error'))};
      window.submitCloseRound.__supabaseWrapped=true;
    }
    if(saveCloseRoundDetailEdit&&!window.saveCloseRoundDetailEdit.__supabaseWrapped){
      const localSave=saveCloseRoundDetailEdit;
      window.saveCloseRoundDetailEdit=function(recordId,field,value){localSave(recordId,field,value);if(client){const payload=readLocal(localEditsKey,{});currentUser().then(user=>client.from('close_round_edits').upsert({record_id:String(recordId),payload:payload[String(recordId)]||{},updated_by:user?.id||null},{onConflict:'record_id'})).catch(error=>notify(`บันทึกหมายเหตุปิดรอบไม่สำเร็จ: ${error.message||error}`,'error'))}};
      window.saveCloseRoundDetailEdit.__supabaseWrapped=true;
    }
  }
  function installAuth(){
    const form=document.querySelector('#login-form');if(!form||!client)return;
    form.addEventListener('submit',async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      const username=String(document.querySelector('#username')?.value||'').trim(),password=String(document.querySelector('#password')?.value||'').trim();
      const email=username.includes('@')?username:(config.emailDomain?`${username}@${config.emailDomain}`:'');
      if(!email){notify('กรุณาใส่ชื่อผู้ใช้เป็นอีเมล หรือกำหนด emailDomain ใน supabase-config.js','error');return}
      try{localStorage.setItem(loginEmailKey,email)}catch{}
      const result=await client.auth.signInWithPassword({email,password});
      if(result.error){notify(`เข้าสู่ระบบ Supabase ไม่สำเร็จ: ${result.error.message}`,'error');return}
      const passwordInput=document.querySelector('#password');if(passwordInput)passwordInput.value='';
      document.querySelector('#login-screen')?.classList.add('is-hidden');document.querySelector('#app-screen')?.classList.remove('is-hidden');await hydrate();notify('เข้าสู่ระบบและเชื่อมฐานข้อมูล Supabase แล้ว');
    },true);
  }
  let syncTimer=null;
  function installRealtime(){
    if(!client)return;
    broadcast?.addEventListener('message',event=>{if(event.data?.type==='refresh')hydrate().catch(()=>{})});
    client.channel('scenery-shared-data')
      .on('postgres_changes',{event:'*',schema:'public',table:'invoice_history'},()=>pullInvoices().catch(()=>{}))
      .on('postgres_changes',{event:'*',schema:'public',table:'closed_bookings'},()=>pullBookings().catch(()=>{}))
      .on('postgres_changes',{event:'*',schema:'public',table:'close_rounds'},()=>pullRounds().catch(()=>{}))
      .on('postgres_changes',{event:'*',schema:'public',table:'close_round_edits'},()=>pullEdits().catch(()=>{}))
      .on('postgres_changes',{event:'*',schema:'public',table:'audit_logs'},()=>pullAudit().catch(()=>{}))
      .subscribe((status,error)=>{
        window.scenerySupabase.realtimeStatus=status;
        if(error)window.scenerySupabase.realtimeError=error;
      });
    clearInterval(syncTimer);
    syncTimer=setInterval(()=>hydrate().catch(()=>{}),5000);
    window.addEventListener('focus',()=>hydrate().catch(()=>{}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)hydrate().catch(()=>{})});
  }
  installPersistenceWrappers();
  document.addEventListener('DOMContentLoaded',async()=>{
    installPersistenceWrappers();
    installAuth();
    if(!client){window.scenerySupabase.mode='local';return}
    document.querySelector('#login-screen')?.classList.remove('is-hidden');
    document.querySelector('#app-screen')?.classList.add('is-hidden');
    const session=await client.auth.getSession();
    if(session.data?.session){document.querySelector('#login-screen')?.classList.add('is-hidden');document.querySelector('#app-screen')?.classList.remove('is-hidden');await hydrate()}
    client.auth.onAuthStateChange((event,sessionState)=>{
      if(sessionState&&['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))hydrate().catch(()=>{});
    });
    installRealtime();
  });
})();
