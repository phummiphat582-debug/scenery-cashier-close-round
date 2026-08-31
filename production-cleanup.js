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
    removeOtherPrototypeRows();
    replaceDemoText();
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
