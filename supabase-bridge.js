/*
 * Supabase Bridge & Realtime Sync Engine for The Scenery Cashier & Close Round
 * Provides instantaneous (<100ms) multi-device synchronization via Supabase WebSockets & Realtime Broadcast.
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

  const doFetch = (...args) => (typeof window !== 'undefined' && window.fetch ? window.fetch(...args) : (typeof globalThis !== 'undefined' && globalThis.fetch ? globalThis.fetch(...args) : fetch(...args)));

  const restRequest = async (path, options = {}) => {
    const headers = {
      'apikey': config.anonKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const token = authToken();
    if (token) headers.Authorization = 'Bearer ' + token;

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
          headers: { 'apikey': config.anonKey, 'Content-Type': 'application/json' },
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
  const localBookingsKey = 'scenery-closed-bookings';
  const localRoundsKey = 'scenery-closed-rounds';
  const localEditsKey = 'scenery-close-round-detail-edits';
  const localAuditKey = 'scenery-audit-log';
  const loginEmailKey = 'scenery-last-login-email';

  const originals = {
    saveInvoiceHistory: window.saveInvoiceHistory,
    saveClosedBookings: window.saveClosedBookings,
    deleteInvoiceHistory: window.deleteInvoiceHistory,
    submitCloseRound: window.submitCloseRound,
    saveCloseRoundDetailEdit: window.saveCloseRoundDetailEdit
  };

  window.scenerySupabase = {
    enabled: hasConfig,
    client,
    mode: client ? 'supabase-rest' : 'local',
    session: null
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

  const recordKey = record => String(record?.id || record?.reference || '');

  // Local Cross-Tab Broadcast Channel
  const localBroadcast = typeof BroadcastChannel === 'function' ? new BroadcastChannel('scenery-shared-sync') : null;

  // Supabase WebSocket Realtime Channel
  let realtimeClient = null;
  let realtimeChannel = null;

  function initRealtimeWebSocket() {
    if (!hasConfig || !window.supabase?.createClient) return;
    try {
      if (!realtimeClient) {
        realtimeClient = window.supabase.createClient(config.url, config.anonKey, {
          realtime: { params: { eventsPerSecond: 20 } }
        });
      }

      if (realtimeChannel) realtimeClient.removeChannel(realtimeChannel);

      realtimeChannel = realtimeClient.channel('scenery-live-updates', {
        config: { broadcast: { self: false } }
      });

      // Listen for Database postgres_changes
      realtimeChannel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoice_history' }, () => {
          console.log('[Realtime] invoice_history changed on remote device');
          pullInvoices();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'closed_bookings' }, () => {
          console.log('[Realtime] closed_bookings changed on remote device');
          pullBookings();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'close_rounds' }, () => {
          console.log('[Realtime] close_rounds changed on remote device');
          pullRounds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'close_round_edits' }, () => {
          console.log('[Realtime] close_round_edits changed on remote device');
          pullEdits();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
          console.log('[Realtime] audit_logs changed on remote device');
          pullAudit();
        })
        // Listen for Instant Realtime Broadcasts from other devices
        .on('broadcast', { event: 'sync_trigger' }, (payload) => {
          console.log('[Realtime Broadcast] Instant sync received from another device:', payload);
          hydrate();
        })
        .subscribe((status) => {
          console.log('[Realtime] Channel status:', status);
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
      if (result.error) throw result.error;
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

  async function deleteInvoiceRemote(id) {
    if (!client) return;
    const invoiceResult = await client.from('invoice_history').delete().eq('id', String(id));
    if (invoiceResult.error) throw invoiceResult.error;
    const bookingResult = await client.from('closed_bookings').delete().eq('id', String(id));
    if (bookingResult.error) throw bookingResult.error;
    broadcastSync('invoice_delete');
  }

  // Refresh UI dynamically without full page reload
  function triggerUIRefresh() {
    if (typeof window.syncInvoiceHistoryState === 'function') window.syncInvoiceHistoryState();
    if (typeof window.renderInvoiceHistoryAllRecords === 'function') window.renderInvoiceHistoryAllRecords();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderCloseRound === 'function') window.renderCloseRound();
    if (typeof window.renderAuditLog === 'function') window.renderAuditLog();
    if (typeof window.renderBookingRecords === 'function') window.renderBookingRecords();
  }

  async function pullInvoices() {
    if (!client) return;
    const result = await client.from('invoice_history').select('*').order('business_date', { ascending: false }).order('created_at', { ascending: false });
    if (result.error) throw result.error;

    const remote = (result.data || []).map(row => {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      const payloadHasDiscount = Object.prototype.hasOwnProperty.call(payload, 'discount');
      const discount = payloadHasDiscount ? Math.max(0, Number(payload.discount) || 0) : Math.max(0, Number(row.discount) || 0);
      return {
        ...payload,
        id: row.id,
        reference: row.reference || payload.reference || row.id,
        businessDate: row.business_date,
        customer: row.customer,
        villa: row.villa,
        villaCode: row.villa_code,
        total: Number(row.total || 0),
        discount,
        deposit: Number(row.deposit || 0),
        pendingTotal: Number(row.pending_total || 0),
        status: row.status
      };
    });

    writeLocal(localHistoryKey, remote);
    if (window.sceneryAppState) window.sceneryAppState.invoices = remote;
    triggerUIRefresh();
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
    writeLocal(localBookingsKey, remote);
    if (window.sceneryAppState) window.sceneryAppState.closedBookings = remote;
    if (typeof window.renderBookingRecords === 'function') window.renderBookingRecords();
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
    writeLocal(localRoundsKey, remote);
    if (typeof window.renderCloseRound === 'function') window.renderCloseRound();
  }

  async function pullEdits() {
    if (!client) return;
    const result = await client.from('close_round_edits').select('record_id,payload,updated_at').order('updated_at', { ascending: false });
    if (result.error) throw result.error;
    const remote = {};
    (result.data || []).forEach(row => {
      if (row?.record_id) remote[String(row.record_id)] = row.payload && typeof row.payload === 'object' ? row.payload : {};
    });
    writeLocal(localEditsKey, remote);
    if (typeof window.renderCloseRound === 'function') window.renderCloseRound();
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
      const tasks = [pullInvoices(), pullBookings(), pullRounds(), pullAudit(), pullEdits()];
      const results = await Promise.allSettled(tasks);
      const failed = results.find(result => result.status === 'rejected');
      if (failed) {
        window.scenerySupabase.lastError = failed.reason || new Error('ไม่ทราบสาเหตุ');
      } else {
        window.scenerySupabase.lastError = null;
        window.scenerySupabase.lastSyncAt = new Date().toISOString();
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
    const submitCloseRound = originals.submitCloseRound || window.submitCloseRound;
    const saveCloseRoundDetailEdit = originals.saveCloseRoundDetailEdit || window.saveCloseRoundDetailEdit;

    if (saveInvoiceHistory && !window.saveInvoiceHistory.__supabaseWrapped) {
      const localSave = saveInvoiceHistory;
      window.saveInvoiceHistory = function (records) {
        localSave(records);
        if (client) {
          upsertInvoices(records)
            .then(() => broadcastSync('invoice_add'))
            .catch(error => notify(`บันทึก Invoice ขึ้น Supabase ไม่สำเร็จ: ${error.message || error}`, 'error'));
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
            .catch(error => notify(`บันทึกการจองไม่สำเร็จ: ${error.message || error}`, 'error'));
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
            .catch(error => notify(`ลบ Invoice จาก Supabase ไม่สำเร็จ: ${error.message || error}`, 'error'));
        }
      };
      window.deleteInvoiceHistory.__supabaseWrapped = true;
    }

    if (submitCloseRound && !window.submitCloseRound.__supabaseWrapped) {
      const localSubmit = submitCloseRound;
      window.submitCloseRound = function () {
        localSubmit();
        if (client) {
          syncRounds()
            .then(() => broadcastSync('round_submit'))
            .catch(error => notify(`บันทึกปิดรอบขึ้น Supabase ไม่สำเร็จ: ${error.message || error}`, 'error'));
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
          .catch(error => notify(`บันทึกหมายเหตุปิดรอบไม่สำเร็จ: ${error.message || error}`, 'error'));
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
      const email = username.includes('@') ? username : (config.emailDomain ? `${username}@${config.emailDomain}` : '');
      if (!email) {
        notify('กรุณาใส่อีเมลผู้ใช้งานให้ถูกต้อง', 'error');
        return;
      }
      try { localStorage.setItem(loginEmailKey, email); } catch {}
      const result = await client.auth.signInWithPassword({ email, password });
      if (result.error) {
        notify(`เข้าสู่ระบบ Supabase ไม่สำเร็จ: ${result.error.message}`, 'error');
        return;
      }
      if (result.data?.session) {
        window.scenerySupabase.session = result.data.session;
        try { sessionStorage.setItem('scenery-supabase-session', JSON.stringify(result.data.session)); } catch {}
      }
      const passwordInput = document.querySelector('#password');
      if (passwordInput) passwordInput.value = '';
      document.querySelector('#login-screen')?.classList.add('is-hidden');
      document.querySelector('#app-screen')?.classList.remove('is-hidden');
      await hydrate();
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

    // 2. High-frequency Realtime sync polling (every 2.5s) as bulletproof fallback
    clearInterval(fastSyncTimer);
    fastSyncTimer = setInterval(() => {
      if (document.querySelector('#app-screen')?.classList.contains('is-hidden') === false) {
        hydrate().catch(() => {});
      }
    }, 2500);

    // 3. Sync on tab focus / visibility
    window.addEventListener('focus', () => hydrate().catch(() => {}));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) hydrate().catch(() => {});
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

    // Initialize Realtime engine
    initRealtimeWebSocket();
    startSyncEngine();
  });
})();
