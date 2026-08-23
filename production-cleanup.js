/* Remove prototype/demo presentation data from the production UI. */
(() => {
  const loginEmailKey = 'scenery-last-login-email';
  const state = () => window.sceneryAppState || {};
  const money = value => {
    const number = Number(value || 0);
    const magnitude = Math.abs(number);
    const hasDecimals = Math.abs(number % 1) >= 0.005;
    const formatted = magnitude.toLocaleString('th-TH', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    });
    return `${number < 0 ? '-' : ''}฿${formatted}`;
  };

  function replaceDemoText(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      node.nodeValue = node.nodeValue
        .replace(/Somchai\s+R\.?/gi, 'ผู้ใช้งาน')
        .replace(/somchai@[^\s<]+/gi, '');
    });
  }

  function clearLoginDemo() {
    const username = document.querySelector('#username');
    const password = document.querySelector('#password');
    if (username) {
      let rememberedEmail = '';
      try { rememberedEmail = localStorage.getItem(loginEmailKey) || ''; } catch {}
      username.value = rememberedEmail;
      username.placeholder = 'อีเมลผู้ใช้งาน';
      username.type = 'email';
    }
    if (password) password.value = '';
    document.querySelector('.demo-hint')?.remove();
  }

  function setProfile(user) {
    const email = user?.email || localStorage.getItem('scenery-last-login-email') || 'h.adv.scenery@gmail.com';
    const name = document.querySelector('.profile-text strong');
    const role = document.querySelector('.profile-text small');
    const avatar = document.querySelector('.profile-button .avatar');
    if (name) name.textContent = email;
    if (role) role.textContent = email ? 'SENIOR CASHIER' : 'ยังไม่ได้เข้าสู่ระบบ';
    if (avatar) {
      const initial = (email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || 'HA').toUpperCase();
      avatar.textContent = initial;
    }

    renderUsersView(email);
  }

  function renderUsersView(email) {
    const currentEmail = email || localStorage.getItem('scenery-last-login-email') || 'h.adv.scenery@gmail.com';
    const tbody = document.querySelector('#view-users tbody');
    if (tbody && currentEmail) {
      const initial = (currentEmail.split('@')[0] || currentEmail).slice(0, 2).toUpperCase();
      tbody.innerHTML = `
        <tr>
          <td>
            <div class="user-cell">
              <span class="avatar small">${initial || 'HA'}</span>
              <div>
                <strong>${currentEmail}</strong>
                <small>${currentEmail}</small>
              </div>
            </div>
          </td>
          <td><span class="role-chip supervisor">Authorized Staff</span></td>
          <td>Front Desk - Zone A</td>
          <td>กำลังใช้งาน (Online)</td>
          <td><span class="status-chip success"><i></i> Active</span></td>
          <td></td>
        </tr>
      `;
      const quality = document.querySelector('#view-users .data-quality');
      if (quality) quality.innerHTML = `<span class="online-dot"></span>ผู้ใช้งานออนไลน์: ${currentEmail}`;
      const tableWrap = document.querySelector('#view-users .table-wrap table');
      if (tableWrap) tableWrap.classList.remove('empty-table');
    }
  }

  function emptyRow(colspan, icon, title, note = '') {
    return `<tr><td colspan="${colspan}"><div class="empty-state"><span class="material-symbols-outlined">${icon}</span><p>${title}</p>${note ? `<small>${note}</small>` : ''}</div></td></tr>`;
  }

  function cleanDashboard() {
    const currentState = state();
    currentState.drafts = [];
    document.querySelector('#view-dashboard .alert-banner')?.remove();

    const historyRecords = (typeof window.loadInvoiceHistory === 'function' ? window.loadInvoiceHistory() : []) || [];
    const stateInvoices = Array.isArray(currentState.invoices) ? currentState.invoices : [];
    const invoices = historyRecords.length > 0 ? historyRecords : stateInvoices;

    const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const outstanding = invoices.reduce((sum, invoice) => {
      const pending = typeof window.historyPendingTotal === 'function' ? window.historyPendingTotal(invoice) : Number(invoice.pendingTotal || 0);
      return sum + (pending > 0 ? pending : (String(invoice.status || '').includes('ค้าง') ? Number(invoice.total || 0) : 0));
    }, 0);
    const metrics = document.querySelectorAll('#view-dashboard .metric-card strong');
    if (metrics[0]) metrics[0].textContent = money(total);
    if (metrics[1]) metrics[1].textContent = '0 รายการ';
    if (metrics[2]) metrics[2].textContent = `${invoices.length} บิล`;
    if (metrics[3]) {
      metrics[3].textContent = money(outstanding);
      metrics[3].className = outstanding > 0 ? 'critical-text' : 'positive-text';
    }
    document.querySelectorAll('#view-dashboard .metric-card .trend').forEach(element => {
      element.textContent = 'จากข้อมูลจริง';
      element.className = 'status-chip neutral';
    });
    const dashboardInvoices = document.querySelector('#dashboard-invoices');
    if (dashboardInvoices && !invoices.length) {
      dashboardInvoices.innerHTML = emptyRow(6, 'receipt_long', 'ยังไม่มีใบแจ้งหนี้', 'เมื่อบันทึกใบแจ้งหนี้แล้ว รายการจะแสดงที่นี่');
    }
    const draftList = document.querySelector('#draft-list');
    if (draftList) draftList.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">draw</span><p>ยังไม่มีใบแจ้งหนี้แบบร่าง</p><small>แบบร่างที่บันทึกจริงจะแสดงที่นี่</small></div>';
    const draftCount = document.querySelector('#view-dashboard .drafts-panel .count-chip');
    if (draftCount) draftCount.textContent = '0 รายการ';

    const progress = document.querySelectorAll('#view-dashboard .progress-row');
    const finalizedCount = invoices.filter(i => !String(i.status || '').includes('ร่าง')).length;
    const paidCount = invoices.filter(i => String(i.status || '') === 'ชำระแล้ว' || (Number(i.pendingTotal || 0) === 0 && !String(i.status || '').includes('ค้าง'))).length;
    if (progress[0]) {
      const val = progress[0].querySelector('.progress-label strong');
      const bar = progress[0].querySelector('.progress-track i');
      if (val) val.textContent = `${finalizedCount} / ${invoices.length || 0}`;
      if (bar) bar.style.width = invoices.length ? `${Math.round((finalizedCount / invoices.length) * 100)}%` : '0%';
    }
    if (progress[1]) {
      const val = progress[1].querySelector('.progress-label strong');
      const bar = progress[1].querySelector('.progress-track i');
      if (val) val.textContent = `${paidCount} / ${invoices.length || 0}`;
      if (bar) bar.style.width = invoices.length ? `${Math.round((paidCount / invoices.length) * 100)}%` : '0%';
    }
    const progressStatus = document.querySelector('#view-dashboard .progress-panel .status-chip');
    if (progressStatus) {
      if (invoices.length > 0) {
        progressStatus.className = 'status-chip success';
        progressStatus.textContent = 'ข้อมูลพร้อมใช้งาน';
      } else {
        progressStatus.className = 'status-chip neutral';
        progressStatus.textContent = 'ยังไม่มีข้อมูล';
      }
    }
    const shift = document.querySelector('#view-dashboard .shift-panel');
    if (shift) {
      const active = window.cashDrawerStore?.activeShift;
      const status = shift.querySelector('.status-chip');
      const values = shift.querySelectorAll('.shift-details strong');
      if (active) {
        if (status) {
          status.className = 'status-chip success';
          status.innerHTML = '<i></i> กะเปิดอยู่';
        }
        const expected = typeof window.cashDrawerV2Expected === 'function' ? window.cashDrawerV2Expected(active) : Number(active.openingCash || 0);
        const shiftValues = [
          active.code || 'กะปัจจุบัน',
          active.openedBy || 'ผู้รับผิดชอบ',
          money(active.openingCash || 0),
          money(expected)
        ];
        shiftValues.forEach((value, index) => {
          if (values[index]) values[index].textContent = value;
        });
      } else {
        if (status) {
          status.className = 'status-chip neutral';
          status.innerHTML = 'ยังไม่เปิดกะ';
        }
        ['ยังไม่มีข้อมูล', '-', '฿0.00', '฿0.00'].forEach((value, index) => {
          if (values[index]) values[index].textContent = value;
        });
      }
    }
    const updated = document.querySelector('#last-updated');
    if (updated) updated.textContent = `ข้อมูลล่าสุดเมื่อ: ${new Date().toLocaleString('th-TH')}`;
  }

  function removeOtherPrototypeRows() {
    renderUsersView();
    document.querySelectorAll('#view-audit .audit-list').forEach(element => {
      element.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">fact_check</span><p>ยังไม่มีรายการตรวจสอบ</p><small>Audit Log จริงจะแสดงเมื่อมีการทำรายการ</small></div>';
    });
    if (typeof window.renderAuditLog === 'function') window.renderAuditLog();
  }

  function boot() {
    clearLoginDemo();
    setProfile(null);
    cleanDashboard();
    removeOtherPrototypeRows();
    replaceDemoText();
    const originalRenderDashboard = window.renderDashboard;
    if (typeof originalRenderDashboard === 'function' && !originalRenderDashboard.__productionWrapped) {
      const wrapped = (...args) => {
        originalRenderDashboard(...args);
        cleanDashboard();
      };
      wrapped.__productionWrapped = true;
      window.renderDashboard = wrapped;
    }
    const originalSync = window.syncInvoiceHistoryState;
    if (typeof originalSync === 'function' && !originalSync.__productionWrapped) {
      const wrapped = (...args) => {
        originalSync(...args);
        cleanDashboard();
      };
      wrapped.__productionWrapped = true;
      window.syncInvoiceHistoryState = wrapped;
    }
    if (window.scenerySupabase?.client) {
      window.scenerySupabase.client.auth.getUser().then(result => setProfile(result.data?.user || null)).catch(() => {});
      if (!window.scenerySupabase.__profileListener) {
        window.scenerySupabase.client.auth.onAuthStateChange((_event, session) => setProfile(session?.user || null));
        window.scenerySupabase.__profileListener = true;
      }
    }
  }

  boot();
  document.addEventListener('DOMContentLoaded', () => {
    boot();
    setTimeout(boot, 250);
  });
})();
