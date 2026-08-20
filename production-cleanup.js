/* Remove prototype/demo presentation data from the production UI. */
(() => {
  const loginEmailKey = 'scenery-last-login-email';
  const state = () => window.sceneryAppState || {};
  const money = value => {
    const number = Number(value || 0);
    return `${number < 0 ? '-' : ''}฿${Math.abs(number).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    const email = user?.email || localStorage.getItem('scenery-last-login-email') || '';
    const name = document.querySelector('.profile-text strong');
    const role = document.querySelector('.profile-text small');
    const avatar = document.querySelector('.profile-button .avatar');
    if (name) name.textContent = email || 'ผู้ใช้งาน';
    if (role) role.textContent = email ? 'ONLINE USER' : 'ยังไม่ได้เข้าสู่ระบบ';
    if (avatar) avatar.textContent = email ? (email.split('@')[0] || email).slice(0, 2).toUpperCase() : 'U';

    renderUsersView(email);
  }

  function renderUsersView(email) {
    const currentEmail = email || localStorage.getItem('scenery-last-login-email') || '';
    const tbody = document.querySelector('#view-users tbody');
    if (tbody && currentEmail) {
      const initial = (currentEmail.split('@')[0] || currentEmail).slice(0, 2).toUpperCase();
      tbody.innerHTML = `
        <tr>
          <td>
            <div class="user-cell">
              <span class="avatar small">${initial}</span>
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

    const invoices = Array.isArray(currentState.invoices) ? currentState.invoices : [];
    const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const outstanding = invoices.reduce((sum, invoice) => {
      return sum + (String(invoice.status || '').includes('ค้าง') ? Number(invoice.total || 0) : 0);
    }, 0);
    const metrics = document.querySelectorAll('#view-dashboard .metric-card strong');
    if (metrics[0]) metrics[0].textContent = money(total);
    if (metrics[1]) metrics[1].textContent = '0 รายการ';
    if (metrics[2]) metrics[2].textContent = `${invoices.length} บิล`;
    if (metrics[3]) metrics[3].textContent = money(outstanding);
    document.querySelectorAll('#view-dashboard .metric-card .trend').forEach(element => {
      element.textContent = 'จากข้อมูลจริง';
      element.className = 'status-chip neutral';
    });
    const dashboardInvoices = document.querySelector('#dashboard-invoices');
    if (dashboardInvoices && !invoices.length) dashboardInvoices.innerHTML = emptyRow(6, 'receipt_long', 'ยังไม่มีใบแจ้งหนี้', 'เมื่อบันทึกใบแจ้งหนี้แล้ว รายการจะแสดงที่นี่');
    const draftList = document.querySelector('#draft-list');
    if (draftList) draftList.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">draw</span><p>ยังไม่มีใบแจ้งหนี้แบบร่าง</p><small>แบบร่างที่บันทึกจริงจะแสดงที่นี่</small></div>';
    const draftCount = document.querySelector('#view-dashboard .drafts-panel .count-chip');
    if (draftCount) draftCount.textContent = '0 รายการ';

    const progress = document.querySelectorAll('#view-dashboard .progress-row');
    progress.forEach(row => {
      const value = row.querySelector('.progress-label strong');
      const bar = row.querySelector('.progress-track i');
      if (value) value.textContent = '0 / 0';
      if (bar) bar.style.width = '0%';
    });
    const progressStatus = document.querySelector('#view-dashboard .progress-panel .status-chip');
    if (progressStatus) progressStatus.textContent = 'ยังไม่มีข้อมูล';
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
