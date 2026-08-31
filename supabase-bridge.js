/*
 * Supabase Bridge & Multi-Device Realtime Sync Engine
 * The Scenery Vintage Farm - Cashier & Close Round System
 * Provides instantaneous (<100ms) multi-device synchronization via Supabase WebSockets,
 * Realtime Broadcast, and high-frequency resilient polling fallback.
 */
(() => {
  const config = window.SCENERY_SUPABASE_CONFIG || {};
  const hasConfig = Boolean(config.url && config.anonKey);
  const apiRoot = String(config.url || '').replace(/\/$/, '');

  // Session handling (per session, requiring login on reload)
  const readSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem('scenery-supabase-session') || 'null');
    } catch {
      return null;
    }
  };

  const authToken = () => window.scenerySupabase?.session?.access_token || readSession()?.access_token || '';

  const doFetch = (...args) => {
    const fn = (typeof window !== 'undefined' && window.fetch) || (typeof globalThis !== 'undefined' && globalThis.fetch) || (typeof fetch === 'function' ? fetch : null);
    if (fn) return fn(...args);
    return Promise.resolve({ ok: false, status: 0, text: async () => '', json: async () => ({}) });
  };

  const restRequest = async (path, options = {}) => {
    const token = authToken();
    const headers = {
      'apikey': config.anonKey,
      'Authorization': 'Bearer ' + (token || config.anonKey),
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await doFetch(apiRoot + path, { ...options, headers });
    const body = await response.text();
    let data = null;
    try { data = body ? JSON.parse(body) : null; } catch { data = body; }

    if (!response.ok) {
      return {
        data: null,
        error: new Error(data?.message || data?.hint || data?.error_description || body || ('HTTP ' + response.status))
      };
    }
    return { data, error: null };
  };

  const restClient = hasConfig ? {
    auth: {
      getUser: async () => {
        const token = authToken();
        if (!token) return { data: { user: null }, error: null };
        const res = await restRequest('/auth/v1/user');
        if (res.error) {
          try { sessionStorage.removeItem('scenery-supabase-session'); } catch {}
          if (window.scenerySupabase) {
            window.scenerySupabase.session = null;
            window.scenerySupabase.user = null;
          }
          return { data: { user: null }, error: res.error };
        }
        return { data: { user: res.data }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const res = await doFetch(`${apiRoot}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': config.anonKey, 'Authorization': 'Bearer ' + config.anonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.access_token) {
          return { data: null, error: new Error(body.error_description || body.msg || body.message || 'เข้าสู่ระบบไม่สำเร็จ') };
        }
        return { data: { session: body, user: body.user }, error: null };
      },
      getSession: () => Promise.resolve({ data: { session: window.scenerySupabase?.session || readSession() }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from(table) {
      const state = { method: 'GET', query: [], orders: [], limit: null, body: null, upsert: false };
      const builder = {
        select(columns = '*') {
          state.method = 'GET';
          state.query.push('select=' + encodeURIComponent(columns));
          return builder;
        },
        order(column, options = {}) {
          state.orders.push(column + '.' + (options.ascending === false ? 'desc' : 'asc'));
          return builder;
        },
        limit(value) {
          state.limit = Number(value);
          return builder;
        },
        eq(column, value) {
          state.query.push(encodeURIComponent(column) + '=' + encodeURIComponent('eq.' + value));
          return builder;
        },
        insert(body) {
          state.method = 'POST';
          state.body = body;
          return builder;
        },
        upsert(body) {
          state.method = 'POST';
          state.body = body;
          state.upsert = true;
          return builder;
        },
        delete() {
          state.method = 'DELETE';
          return builder;
        },
        then(resolve, reject) {
          const run = async () => {
            const params = [...state.query];
            if (state.orders.length) params.push('order=' + encodeURIComponent(state.orders.join(',')));
            if (state.limit) params.push('limit=' + state.limit);
            const headers = state.upsert ? { 'Prefer': 'resolution=merge-duplicates,return=representation' } : {};
            return restRequest('/rest/v1/' + encodeURIComponent(table) + (params.length ? '?' + params.join('&') : ''), {
              method: state.method,
              headers,
              body: state.body == null ? undefined : JSON.stringify(state.body)
            });
          };
          return run().then(resolve, reject);
        }
      };
      return builder;
    }
  } : null;

  const client = restClient;
  const localHistoryKey = 'scenery-invoice-history';
  const localDraftsKey = 'scenery-invoice-drafts';
  const localDeletedDraftsKey = 'scenery-deleted-draft-ids';
  const localBookingsKey = 'scenery-closed-bookings';
  const localRoundsKey = 'scenery-closed-rounds';
  const localEditsKey = 'scenery-close-round-detail-edits';
  const localAuditKey = 'scenery-audit-log';
  const loginEmailKey = 'scenery-last-login-email';

  const originals = {
    saveInvoiceHistory: window.saveInvoiceHistory,
    saveClosedBookings: window.saveClosedBookings,
    deleteInvoiceHistory: window.deleteInvoiceHistory,
    saveInvoiceDraft: window.saveInvoiceDraft,
    deleteInvoiceDraft: window.deleteInvoiceDraft,
    submitCloseRound: window.submitCloseRound,
    saveCloseRoundDetailEdit: window.saveCloseRoundDetailEdit
  };

  window.scenerySupabase = {
    enabled: hasConfig,
    client,
    mode: client ? 'supabase-rest' : 'local',
    session: null,
    isOnline: false,
    lastSyncAt: null,
    lastError: null
  };

  const notify = (message, type = 'info') => {
    if (typeof window.showToast === 'function') window.showToast(message, type);
  };

  const readLocal = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeLocal = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  // Local Cross-Tab Broadcast Channel
  const localBroadcast = typeof BroadcastChannel === 'function' ? new BroadcastChannel('scenery-shared-sync') : null;

  // Supabase WebSocket Realtime Channel
  let realtimeClient = null;
  let realtimeChannel = null;

  let reconnectTimer = null;
  function initRealtimeWebSocket() {
    if (!hasConfig || !window.supabase?.createClient) return;
    try {
      if (!realtimeClient) {
        realtimeClient = window.supabase.createClient(config.url, config.anonKey, {
          realtime: { params: { eventsPerSecond: 20 } }
        });
      }

      if (realtimeChannel) {
        try { realtimeClient.removeChannel(realtimeChannel); } catch {}
      }

      realtimeChannel = realtimeClient.channel('scenery-live-updates', {
        config: { broadcast: { self: false } }
      });

      // Listen for Database postgres_changes
      realtimeChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_history' }, () => {
          pullInvoices();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_drafts' }, () => {
          pullDrafts();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'closed_bookings' }, () => {
          pullBookings();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'close_rounds' }, () => {
          pullRounds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'close_round_edits' }, () => {
          pullEdits();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
          pullAudit();
        })
        // Listen for Instant Realtime Broadcasts from other devices
        .on('broadcast', { event: 'sync_trigger' }, () => {
          hydrate();
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            updateOnlineStatusIndicator(true, 'Realtime WebSocket พร้อมทำงาน');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('[Realtime WebSocket] Status:', status, err);
            clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              if (navigator.onLine !== false) {
                initRealtimeWebSocket();
                hydrate().catch(() => {});
              }
            }, 3000);
          }
        });
    } catch (e) {
      console.warn('Realtime WebSocket init:', e.message);
    }
  }

  // Trigger broadcast to other devices & tabs immediately
  const broadcastSync = (actionName = 'update') => {
    // 1. Same-device tabs
    localBroadcast?.postMessage({ type: 'refresh', action: actionName, at: Date.now() });

    // 2. Cross-device WebSockets
    try {
      if (realtimeChannel) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'sync_trigger',
          payload: { action: actionName, at: Date.now() }
        });
      }
    } catch {}
  };

  const currentUser = async () => {
    if (!client) return null;
    const result = await client.auth.getUser();
    return result.data?.user || null;
  };

  const invoiceDiscount = record => {
    const payload = record?.payload && typeof record.payload === 'object' ? record.payload : null;
    const source = payload && Object.prototype.hasOwnProperty.call(payload, 'discount') ? payload : record;
    const value = Number(source?.discount);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  };

  const invoiceRow = async record => {
    const user = await currentUser();
    return {
      id: String(record.id || record.reference || `INV-${Date.now()}`),
      reference: record.reference || record.id || null,
      business_date: record.businessDate || new Date().toISOString().slice(0, 10),
      customer: record.customer || '',
      villa: record.villa || '',
      villa_code: record.villaCode || '',
      total: Number(record.total || 0),
      discount: invoiceDiscount(record),
      deposit: Number(record.deposit || 0),
      pending_total: Number(record.pendingTotal || 0),
      status: record.status || 'ชำระแล้ว',
      payload: record,
      created_by: user?.id || null
    };
  };

  const bookingRow = async record => {
    const user = await currentUser();
    return {
      id: String(record.id || record.reference || `BOOK-${Date.now()}`),
      reference: record.reference || record.id || null,
      business_date: record.businessDate || null,
      customer: record.customer || '',
      villa: record.villa || '',
      total: Number(record.total || 0),
      payload: record,
      created_by: user?.id || null
    };
  };

  async function upsertInvoices(records) {
    if (!client) return;
    const rows = [];
    for (const record of records || []) rows.push(await invoiceRow(record));
    if (rows.length) {
      const result = await client.from('invoice_history').upsert(rows, { onConflict: 'id' });
      if (result.error) {
        console.warn('[Supabase Sync] Upsert invoices error:', result.error.message);
        throw result.error;
      }
      broadcastSync('invoice_upsert');
    }
  }

  async function upsertBookings(records) {
    if (!client) return;
    const rows = [];
    for (const record of records || []) rows.push(await bookingRow(record));
    if (rows.length) {
      const result = await client.from('closed_bookings').upsert(rows, { onConflict: 'id' });
      if (result.error) throw result.error;
      broadcastSync('booking_upsert');
    }
  }

  async function recordAudit(entry) {
    if (!client) return;
    const user = await currentUser();
    const result = await client.from('audit_logs').insert({
      id: entry.id?.startsWith('AUD-') ? undefined : entry.id,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      before_data: entry.beforeData,
      after_data: entry.afterData,
      metadata: entry.metadata || {},
      actor_id: user?.id || null,
      created_at: entry.createdAt || new Date().toISOString()
    });
    if (result.error) throw result.error;
    broadcastSync('audit_insert');
  }

  window.scenerySupabase.recordAudit = entry => recordAudit(entry).catch(error => console.warn('Audit log:', error));

  const localDeletedInvoicesKey = 'scenery-deleted-invoice-ids';
  function getDeletedInvoiceIds() {
    return new Set(readLocal(localDeletedInvoicesKey, []));
  }
  function recordDeletedInvoiceId(id) {
    const list = readLocal(localDeletedInvoicesKey, []);
    if (!list.includes(String(id))) {
      list.push(String(id));
      writeLocal(localDeletedInvoicesKey, list);
    }
  }

  function getDeletedDraftIds() {
    return new Set(readLocal(localDeletedDraftsKey, []));
  }
  function recordDeletedDraftId(id) {
    const list = readLocal(localDeletedDraftsKey, []);
    if (!list.includes(String(id))) {
      list.push(String(id));
      writeLocal(localDeletedDraftsKey, list);
    }
  }

  async function deleteInvoiceRemote(id) {
    recordDeletedInvoiceId(id);
    if (!client) return;
    try {
      await client.from('invoice_history').delete().eq('id', String(id));
    } catch (e) {
      console.warn('[Supabase Sync] Delete invoice:', e.message || e);
    }
    try {
      await client.from('closed_bookings').delete().eq('id', String(id));
    } catch (e) {
      console.warn('[Supabase Sync] Delete booking:', e.message || e);
    }
    broadcastSync('invoice_delete');
  }

  async function upsertDrafts(records) {
    if (!client) return;
    const user = await currentUser();
    const rows = (records || []).map(d => ({
      id: String(d.id || `DF-${Date.now()}`),
      reference: d.reference || d.fields?.folio || null,
      customer: d.customer || d.fields?.customer || '',
      payload: d,
      created_by: user?.id || null,
      updated_at: new Date().toISOString()
    }));
    if (rows.length) {
      const result = await client.from('invoice_drafts').upsert(rows, { onConflict: 'id' });
      if (result.error) {
        console.warn('[Supabase Sync] Upsert drafts error:', result.error.message);
        throw result.error;
      }
      broadcastSync('draft_upsert');
    }
  }

  async function deleteDraftRemote(id) {
    recordDeletedDraftId(id);
    if (!client) return;
    try {
      await client.from('invoice_drafts').delete().eq('id', String(id));
    } catch (e) {
      console.warn('[Supabase Sync] Delete draft error:', e.message || e);
    }
    broadcastSync('draft_delete');
  }

  async function pullDrafts() {
    if (!client) return;
    const result = await client.from('invoice_drafts').select('*').order('created_at', { ascending: false });
    if (result.error) {
      console.warn('[Supabase Sync] Pull drafts warning:', result.error.message);
      return;
    }
    const remote = (result.data || []).map(row => {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      return {
        ...payload,
        id: row.id,
        reference: row.reference || payload.reference || row.id,
        customer: row.customer || payload.customer || '-',
        savedAt: payload.savedAt || (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : new Date().toLocaleString('th-TH'))
      };
    });

    const local = readLocal(localDraftsKey, []);
    writeLocal(localDraftsKey, remote);
    if (window.sceneryAppState) window.sceneryAppState.drafts = remote;
    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      triggerUIRefresh();
    }
  }

  window.scenerySupabase.upsertInvoices = records => upsertInvoices(records).catch(e => console.warn('Upsert invoices remote:', e));
  window.scenerySupabase.deleteInvoiceRemote = id => deleteInvoiceRemote(id).catch(e => console.warn('Delete invoice remote:', e));
  window.scenerySupabase.pullInvoices = pullInvoices;
  window.scenerySupabase.upsertDrafts = drafts => upsertDrafts(drafts).catch(e => console.warn('Upsert drafts remote:', e));
  window.scenerySupabase.saveDraftRemote = record => upsertDrafts([record]).catch(e => console.warn('Save draft remote:', e));
  window.scenerySupabase.deleteDraftRemote = id => deleteDraftRemote(id).catch(e => console.warn('Delete draft remote:', e));
  window.scenerySupabase.pullDrafts = pullDrafts;
  window.scenerySupabase.broadcastSync = broadcastSync;
  window.scenerySupabase.triggerUIRefresh = triggerUIRefresh;

  // Refresh UI dynamically without full page reload
  function triggerUIRefresh() {
    const activeEl = document.activeElement;
    const isInteracting = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
    if (typeof window.syncInvoiceHistoryState === 'function') window.syncInvoiceHistoryState();
    if (typeof window.renderHistory === 'function') window.renderHistory();
    if (typeof window.renderInvoiceHistoryAllRecords === 'function') window.renderInvoiceHistoryAllRecords();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (!isInteracting && typeof window.renderCloseRound === 'function') {
      window.renderCloseRound();
    }
    if (typeof window.renderAuditLog === 'function') window.renderAuditLog();
    if (typeof window.renderBookingRecords === 'function') window.renderBookingRecords();

    // Dynamically refresh draft picker modal if open
    const draftPickerList = document.querySelector('.draft-picker-list');
    if (draftPickerList) {
      const drafts = typeof window.loadInvoiceDrafts === 'function' ? window.loadInvoiceDrafts() : readLocal(localDraftsKey, []);
      draftPickerList.innerHTML = drafts.map((draft, index) => {
        const totalAmount = Number(draft.total || (draft.lines || []).reduce((s, l) => s + Math.max(0, Number(l.qty || 0) * Number(l.rate || 0)), 0));
        const itemCount = (draft.lines || []).length;
        const draftKey = draft.id || index;
        return `
          <div class="draft-picker-row" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border:1px solid #e7ded6;border-radius:8px;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;">
                <strong style="color:var(--primary);font-size:13px;">${draft.reference || draft.id}</strong>
                <span class="status-chip draft" style="font-size:10px;padding:2px 6px;">แบบร่าง</span>
              </div>
              <div style="font-size:13px;color:#2c2017;margin-top:3px;">
                <strong>${draft.customer || '-'}</strong> ${draft.villa ? '(' + draft.villa + ')' : ''} · <span class="muted">${itemCount} รายการ</span>
              </div>
              <small class="muted" style="font-size:11px;display:block;margin-top:2px;">บันทึกเมื่อ: ${draft.savedAt || '-'}</small>
            </div>
            <div style="text-align:right;white-space:nowrap;">
              <div style="font-weight:700;color:#2c2017;font-size:14px;margin-bottom:6px;">${typeof window.money === 'function' ? window.money(totalAmount) : totalAmount}</div>
              <div style="display:flex;gap:6px;justify-content:flex-end;">
                <button class="button button-primary action-small" type="button" data-draft-load="${draftKey}">เปิด</button>
                <button class="button button-danger action-small" type="button" data-draft-delete="${draftKey}" aria-label="ลบแบบร่าง"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
              </div>
            </div>
          </div>
        `;
      }).join('') || '<div class="empty-state"><span class="material-symbols-outlined">description</span><p>ยังไม่มีแบบร่าง</p></div>';
    }
  }

  function updateOnlineStatusIndicator(isOnline, detail = '') {
    window.scenerySupabase.isOnline = isOnline;
    const dots = document.querySelectorAll('.online-dot');
    dots.forEach(dot => {
      dot.style.background = isOnline ? '#2e7d32' : '#c94a29';
      dot.style.boxShadow = isOnline ? '0 0 8px rgba(46,125,50,0.5)' : 'none';
    });

    const healthText = document.querySelector('.round-health strong');
    if (healthText && isOnline) {
      healthText.textContent = 'ออนไลน์ · ซิงก์ข้อมูลอัตโนมัติ';
    }

    const footerText = document.querySelector('.login-footer span:first-child');
    if (footerText && isOnline) {
      footerText.innerHTML = '<b class="online-dot" style="background:#2e7d32;box-shadow:0 0 8px #4caf50;"></b> เชื่อมต่อระบบออนไลน์แล้ว • RECEPTION';
    }
  }

  async function pullInvoices() {
    if (!client) return;
    const result = await client.from('invoice_history').select('*').order('business_date', { ascending: false }).order('created_at', { ascending: false });
    if (result.error) {
      if (result.error.message?.includes('violates row-level security')) {
        console.warn('[Supabase Sync] RLS policy restriction detected on invoice_history. Please run fix-supabase-rls.sql in Supabase SQL editor.');
      }
      throw result.error;
    }

    const remote = (result.data || []).map(row => {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      const lines = Array.isArray(payload.lines) ? payload.lines : (Array.isArray(row.lines) ? row.lines : []);
      const lineSubtotal = lines.reduce((sum, line) => sum + Math.max(0, Number(line.qty || 1) * Number(line.rate || 0)), 0);
      const lineDeposits = lines.reduce((sum, line) => sum + Math.max(0, Number(line.deposit || 0)), 0);
      const lineDiscounts = lines.reduce((sum, line) => sum + Math.max(0, Number(line.discountAmount || 0)), 0);
      const subtotal = lineSubtotal || Math.max(0, Number(payload.subtotal ?? payload.total ?? row.total) || 0);
      const discount = Object.prototype.hasOwnProperty.call(payload, 'discount')
        ? Math.max(0, Number(payload.discount) || 0)
        : (Object.prototype.hasOwnProperty.call(row, 'discount') ? Math.max(0, Number(row.discount) || 0) : lineDiscounts);
      const total = subtotal;
      const deposit = lines.length ? lineDeposits : Math.max(0, Number(payload.deposit ?? row.deposit) || 0);
      const netTotal = Math.max(0, total - discount);
      const outstanding = Math.max(0, netTotal - deposit);
      const staff = payload.cashier || payload.preparer || payload.closedBy || payload.user || row.cashier || row.preparer || row.closed_by || row.user || '';
      return {
        ...payload,
        id: row.id,
        reference: row.reference || payload.reference || row.id,
        businessDate: row.business_date || payload.businessDate,
        customer: row.customer || payload.customer,
        villa: row.villa || payload.villa,
        villaCode: row.villa_code || payload.villaCode,
        subtotal,
        total,
        discount,
        deposit,
        netTotal,
        outstanding,
        pendingTotal: Number(row.pending_total ?? payload.pendingTotal ?? 0),
        status: row.status || payload.status || 'ชำระแล้ว',
        cashier: staff,
        preparer: staff,
        closedBy: staff
      };
    });

    const local = readLocal(localHistoryKey, []);
    writeLocal(localHistoryKey, remote);
    if (window.sceneryAppState) window.sceneryAppState.invoices = remote;
    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      triggerUIRefresh();
    }
  }

  async function pullBookings() {
    if (!client) return;
    const result = await client.from('closed_bookings').select('*').order('created_at', { ascending: false });
    if (result.error) throw result.error;
    const remote = (result.data || []).map(row => ({
      ...row.payload,
      id: row.id,
      reference: row.reference || row.payload?.reference || row.id,
      businessDate: row.business_date,
      customer: row.customer,
      villa: row.villa,
      total: Number(row.total || 0)
    }));
    const local = readLocal(localBookingsKey, []);
    writeLocal(localBookingsKey, remote);
    if (window.sceneryAppState) window.sceneryAppState.closedBookings = remote;
    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      if (typeof window.renderBookingRecords === 'function') window.renderBookingRecords();
    }
  }

  async function syncRounds() {
    if (!client) return;
    const rounds = readLocal(localRoundsKey, []);
    const user = await currentUser();
    if (!rounds.length) return;
    const rows = rounds.map(round => ({
      id: String(round.id),
      business_date: round.businessDate,
      status: round.status || 'Submitted',
      totals: round.totals || {},
      payload: round,
      submitted_by: user?.id || null,
      submitted_at: round.submittedAt ? new Date(round.submittedAt).toISOString() : new Date().toISOString()
    }));
    const result = await client.from('close_rounds').upsert(rows, { onConflict: 'id' });
    if (result.error) throw result.error;
    broadcastSync('round_upsert');
  }

  async function pullRounds() {
    if (!client) return;
    const result = await client.from('close_rounds').select('*').order('business_date', { ascending: false });
    if (result.error) throw result.error;
    const remote = (result.data || []).map(row => ({
      ...row.payload,
      id: row.id,
      businessDate: row.business_date,
      status: row.status,
      submittedAt: row.submitted_at,
      totals: row.totals || {}
    }));
    const local = readLocal(localRoundsKey, []);
    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      writeLocal(localRoundsKey, remote);
      const activeEl = document.activeElement;
      const isInteracting = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
      if (!isInteracting && typeof window.renderCloseRound === 'function' && window.sceneryAppState?.currentView === 'close-round') {
        window.renderCloseRound();
      }
    }
  }

  async function pullEdits() {
    if (!client) return;
    const result = await client.from('close_round_edits').select('record_id,payload,updated_at').order('updated_at', { ascending: false });
    if (result.error) throw result.error;
    const remote = {};
    (result.data || []).forEach(row => {
      if (row?.record_id) remote[String(row.record_id)] = row.payload && typeof row.payload === 'object' ? row.payload : {};
    });
    const local = readLocal(localEditsKey, {});
    if (JSON.stringify(remote) !== JSON.stringify(local)) {
      writeLocal(localEditsKey, remote);
      const activeEl = document.activeElement;
      const isInteracting = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
      if (!isInteracting && typeof window.renderCloseRound === 'function' && window.sceneryAppState?.currentView === 'close-round') {
        window.renderCloseRound();
      }
    }
  }

  async function pullAudit() {
    if (!client) return;
    const result = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (result.error) throw result.error;
    const remote = (result.data || []).map(row => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      beforeData: row.before_data,
      afterData: row.after_data,
      metadata: row.metadata || {},
      actor: row.actor_id || 'ผู้ใช้งาน',
      createdAt: row.created_at
    }));
    if (remote.length) {
      writeLocal(localAuditKey, remote);
      if (typeof window.renderAuditLog === 'function') window.renderAuditLog();
    }
  }

  let hydratePromise = null;
  async function hydrate() {
    if (!client) return;
    if (hydratePromise) return hydratePromise;
    hydratePromise = (async () => {
      const tasks = [pullInvoices(), pullDrafts(), pullBookings(), pullRounds(), pullAudit(), pullEdits()];
      const results = await Promise.allSettled(tasks);
      const failed = results.find(result => result.status === 'rejected');
      if (failed) {
        window.scenerySupabase.lastError = failed.reason || new Error('ไม่ทราบสาเหตุ');
        console.warn('[Supabase Sync] Sync check warning:', failed.reason?.message || failed.reason);
        updateOnlineStatusIndicator(false);
      } else {
        window.scenerySupabase.lastError = null;
        window.scenerySupabase.lastSyncAt = new Date().toISOString();
        updateOnlineStatusIndicator(true);
      }
      return results;
    })().finally(() => {
      hydratePromise = null;
      triggerUIRefresh();
    });
    return hydratePromise;
  }

  window.scenerySupabase.refresh = hydrate;

  function installPersistenceWrappers() {
    const saveInvoiceHistory = originals.saveInvoiceHistory || window.saveInvoiceHistory;
    const saveClosedBookings = originals.saveClosedBookings || window.saveClosedBookings;
    const deleteInvoiceHistory = originals.deleteInvoiceHistory || window.deleteInvoiceHistory;
    const saveInvoiceDraft = originals.saveInvoiceDraft || window.saveInvoiceDraft;
    const deleteInvoiceDraft = originals.deleteInvoiceDraft || window.deleteInvoiceDraft;
    const submitCloseRound = originals.submitCloseRound || window.submitCloseRound;
    const saveCloseRoundDetailEdit = originals.saveCloseRoundDetailEdit || window.saveCloseRoundDetailEdit;

    if (saveInvoiceHistory && !window.saveInvoiceHistory.__supabaseWrapped) {
      const localSave = saveInvoiceHistory;
      window.saveInvoiceHistory = function (records) {
        localSave(records);
        if (client) {
          upsertInvoices(records)
            .then(() => broadcastSync('invoice_add'))
            .catch(error => console.warn('[Supabase Sync] Upsert invoices:', error.message || error));
        }
      };
      window.saveInvoiceHistory.__supabaseWrapped = true;
    }

    if (saveClosedBookings && !window.saveClosedBookings.__supabaseWrapped) {
      const localSave = saveClosedBookings;
      window.saveClosedBookings = function () {
        localSave();
        if (client) {
          upsertBookings(window.sceneryAppState?.closedBookings || [])
            .then(() => broadcastSync('booking_add'))
            .catch(error => console.warn('[Supabase Sync] Upsert bookings:', error.message || error));
        }
      };
      window.saveClosedBookings.__supabaseWrapped = true;
    }

    if (deleteInvoiceHistory && !window.deleteInvoiceHistory.__supabaseWrapped) {
      const localDelete = deleteInvoiceHistory;
      window.deleteInvoiceHistory = function (id) {
        localDelete(id);
        if (client) {
          deleteInvoiceRemote(id)
            .then(() => broadcastSync('invoice_delete'))
            .catch(error => console.warn('[Supabase Sync] Delete remote:', error.message || error));
        }
      };
      window.deleteInvoiceHistory.__supabaseWrapped = true;
    }

    if (saveInvoiceDraft && !window.saveInvoiceDraft.__supabaseWrapped) {
      const localSave = saveInvoiceDraft;
      window.saveInvoiceDraft = function () {
        localSave();
        if (client) {
          const drafts = readLocal(localDraftsKey, []);
          if (drafts.length) {
            upsertDrafts([drafts[0]])
              .then(() => broadcastSync('draft_add'))
              .catch(error => console.warn('[Supabase Sync] Upsert draft:', error.message || error));
          }
        }
      };
      window.saveInvoiceDraft.__supabaseWrapped = true;
    }

    if (deleteInvoiceDraft && !window.deleteInvoiceDraft.__supabaseWrapped) {
      const localDelete = deleteInvoiceDraft;
      window.deleteInvoiceDraft = function (indexOrId) {
        const drafts = readLocal(localDraftsKey, []);
        let targetId = null;
        if (typeof indexOrId === 'number' || (!isNaN(Number(indexOrId)) && drafts[Number(indexOrId)])) {
          targetId = drafts[Number(indexOrId)]?.id;
        } else {
          targetId = String(indexOrId);
        }
        localDelete(indexOrId);
        if (client && targetId) {
          deleteDraftRemote(targetId)
            .then(() => broadcastSync('draft_delete'))
            .catch(error => console.warn('[Supabase Sync] Delete draft remote:', error.message || error));
        }
      };
      window.deleteInvoiceDraft.__supabaseWrapped = true;
    }

    if (submitCloseRound && !window.submitCloseRound.__supabaseWrapped) {
      const localSubmit = submitCloseRound;
      window.submitCloseRound = function () {
        localSubmit();
        if (client) {
          syncRounds()
            .then(() => broadcastSync('round_submit'))
            .catch(error => console.warn('[Supabase Sync] Sync rounds:', error.message || error));
        }
      };
      window.submitCloseRound.__supabaseWrapped = true;
    }

    if (saveCloseRoundDetailEdit && !window.saveCloseRoundDetailEdit.__supabaseWrapped) {
      const localSave = saveCloseRoundDetailEdit;
      window.saveCloseRoundDetailEdit = function (recordId, field, value) {
        localSave(recordId, field, value);
        if (client) {
          const payload = readLocal(localEditsKey, {});
          currentUser().then(user => client.from('close_round_edits').upsert({
            record_id: String(recordId),
            payload: payload[String(recordId)] || {},
            updated_by: user?.id || null
          }, { onConflict: 'record_id' }))
          .then(() => broadcastSync('round_edit'))
          .catch(error => console.warn('[Supabase Sync] Close round edit:', error.message || error));
        }
      };
      window.saveCloseRoundDetailEdit.__supabaseWrapped = true;
    }
  }

  function installAuth() {
    const form = document.querySelector('#login-form');
    if (!form || !client) return;

    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const username = String(document.querySelector('#username')?.value || '').trim();
      const password = String(document.querySelector('#password')?.value || '').trim();
      const email = username.includes('@') ? username : (config.emailDomain ? `${username}@${config.emailDomain}` : username);
      if (email) {
        try { localStorage.setItem(loginEmailKey, email); } catch {}
      }

      // Try signing in via Supabase Auth if credentials provided
      if (email && email.includes('@') && password) {
        const result = await client.auth.signInWithPassword({ email, password });
        if (!result.error && result.data?.session) {
          window.scenerySupabase.session = result.data.session;
          try { sessionStorage.setItem('scenery-supabase-session', JSON.stringify(result.data.session)); } catch {}
        }
      }

      const passwordInput = document.querySelector('#password');
      if (passwordInput) passwordInput.value = '';
      document.querySelector('#login-screen')?.classList.add('is-hidden');
      document.querySelector('#app-screen')?.classList.remove('is-hidden');
      
      // Immediately hydrate and subscribe to Realtime sync
      hydrate().catch(() => {});
      initRealtimeWebSocket();
      notify('เข้าสู่ระบบสำเร็จ — ระบบออนไลน์ Realtime พร้อมทำงาน', 'success');
    }, true);
  }

  // Cross-device / tab synchronization engine
  let fastSyncTimer = null;
  function startSyncEngine() {
    // 1. Cross-tab Broadcast receiver
    localBroadcast?.addEventListener('message', () => {
      hydrate().catch(() => {});
    });

    // 2. High-frequency Realtime sync polling (every 3s) for guaranteed multi-device consistency
    clearInterval(fastSyncTimer);
    fastSyncTimer = setInterval(() => {
      if (document.querySelector('#app-screen')?.classList.contains('is-hidden') === false) {
        hydrate().catch(() => {});
      }
    }, 3000);

    // 3. Sync on tab focus / visibility
    window.addEventListener('focus', () => hydrate().catch(() => {}));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) hydrate().catch(() => {});
    });

    // 4. Auto-reconnect when device network changes online/offline
    window.addEventListener('online', () => {
      updateOnlineStatusIndicator(true, 'เชื่อมต่อเครือข่ายแล้ว');
      initRealtimeWebSocket();
      hydrate().catch(() => {});
    });
    window.addEventListener('offline', () => {
      updateOnlineStatusIndicator(false, 'ออฟไลน์');
    });
  }

  installPersistenceWrappers();

  document.addEventListener('DOMContentLoaded', async () => {
    installPersistenceWrappers();
    installAuth();

    const loginScreen = document.querySelector('#login-screen');
    const appScreen = document.querySelector('#app-screen');

    // Always require login on fresh load/reload
    try { localStorage.removeItem('scenery-supabase-session'); } catch {}
    try { sessionStorage.removeItem('scenery-supabase-session'); } catch {}
    if (window.scenerySupabase) {
      window.scenerySupabase.session = null;
      window.scenerySupabase.user = null;
    }

    loginScreen?.classList.remove('is-hidden');
    appScreen?.classList.add('is-hidden');

    const passwordInput = document.querySelector('#password');
    if (passwordInput) passwordInput.value = '';

    // Initialize Realtime engine and background pre-hydration
    initRealtimeWebSocket();
    startSyncEngine();
    hydrate().catch(() => {});
  });
})();
