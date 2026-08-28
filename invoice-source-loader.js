/* Invoice form data is driven by ข้อมูลสร้างใบแจ้งหนี้.txt. */
(() => {
  const CUSTOM_KEY = 'scenery-invoice-custom-items';
  const clean = value => String(value ?? '').replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
  const numberFrom = value => Number(String(value ?? '').replace(/,/g, '')) || 0;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function parseItem(line) {
    let name = clean(line);
    if (!name || /^มีรายการ/.test(name)) return null;
    let rate = 0;
    let price = name.match(/\s+ราคา\s*([\d,]+(?:\.\d+)?)\s*(?:บาท|Bath|Baht)?\s*$/i);
    if (!price) price = name.match(/\s+([\d,]+(?:\.\d+)?)\s*(?:บาท|Bath|Baht)?\s*$/i);
    if (price) {
      rate = numberFrom(price[1]);
      name = name.slice(0, price.index).trim();
    }
    name = name.replace(/\s+เด้ง$/, '').trim();
    return name ? { name, rate } : null;
  }

  function parseSource(text) {
    const result = { accommodation: [], addon: [] };
    let family = '';
    let category = '';
    String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).forEach(rawLine => {
      const line = clean(rawLine);
      if (!line) return;
      const heading = line.match(/^หัวข้อ\s+(.+)$/);
      if (heading) { family = heading[1]; category = ''; return; }
      const categoryMatch = line.match(/^หมวด\s+(.+)$/);
      if (categoryMatch) {
        category = clean(categoryMatch[1]);
        const target = /^Accommodation/i.test(family) ? result.accommodation : result.addon;
        if (!target.some(item => item.category === category)) target.push({ category, items: [] });
        return;
      }
      if (!category) return;
      const parsed = parseItem(line);
      if (!parsed) return;
      const target = /^Accommodation/i.test(family) ? result.accommodation : result.addon;
      const bucket = target.find(item => item.category === category);
      if (bucket && !bucket.items.some(item => item.name === parsed.name)) bucket.items.push({ ...parsed, category });
    });
    return result;
  }

  function readCustom() {
    try {
      const value = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function saveCustom(items) {
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(items)); } catch {}
  }

  function flatten(data) {
    return Object.values(data).flatMap(groups => groups.flatMap(group => group.items.map(item => ({ ...item }))));
  }

  function mergeCustom(data) {
    const custom = readCustom();
    custom.forEach(item => {
      const groups = data[item.type] || [];
      let bucket = groups.find(group => group.category === item.category);
      if (!bucket) { bucket = { category: item.category, items: [] }; groups.push(bucket); }
      if (!bucket.items.some(existing => existing.name === item.name)) bucket.items.push({ name: item.name, rate: numberFrom(item.rate), category: item.category, custom: true });
    });
  }

  function optionList(group) {
    return group.map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}${item.rate ? ` — ${item.rate.toLocaleString('th-TH')}` : ''}</option>`).join('');
  }

  function replaceWithClone(element) {
    if (!element) return null;
    const clone = element.cloneNode(true);
    element.replaceWith(clone);
    return clone;
  }

  function applyForm(data) {
    const villa = document.querySelector('#villa');
    if (villa) {
      const numberedVillas = [
        '02 Pangola', '03 Hamata', '04 Barbados', '05 Merino', '06 Corriedale',
        '07 Katahdin', '08 Mulato', '010 Napier', '011 Setaria', '012 Alfalfa', '013 Rapunzel'
      ];
      villa.innerHTML = `<option value="">เลือก Villa / Room (ไม่ระบุก็ได้)</option>${numberedVillas.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}`;
    }
    const villaCode = document.querySelector('#villa-code');
    if (villaCode) {
      const codeOptions = [
        'A — Rainy S', 'B — Rainy S', 'E1 — [โชว์]', 'E2 — [โชว์+สปาคกิ้งไวน์]',
        'G1 — [Defender]', 'G2 จอง — [Range Rover]', 'G3 เจ้าของ — [Range Rover]',
        'G5 — [08+Test Drive]', 'G6 — [08+Test Drive]'
      ];
      let dl = document.querySelector('#invoice-villa-code-options');
      if (!dl) {
        dl = document.createElement('datalist');
        dl.id = 'invoice-villa-code-options';
        villaCode.insertAdjacentElement('afterend', dl);
      }
      dl.innerHTML = codeOptions.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      villaCode.setAttribute('list', 'invoice-villa-code-options');
    }

    const configs = [
      { type: 'accommodation', categoryId: 'accommodation-category', selectId: 'accommodation-select', rateId: 'accommodation-rate', qtyId: 'accommodation-qty', source: data.accommodation },
      { type: 'addon', categoryId: 'addon-category', selectId: 'addon-select', rateId: 'addon-rate', qtyId: 'addon-qty', source: data.addon }
    ];
    configs.forEach(config => {
      let categoryEl = replaceWithClone(document.querySelector(`#${config.categoryId}`));
      const oldSelect = document.querySelector(`#${config.selectId}`);
      document.querySelectorAll(`#${config.type}-search, #${config.type}-options`).forEach(element => element.remove());
      if (!categoryEl || !oldSelect) return;
      categoryEl.innerHTML = `<option value="">เลือกหมวด</option>${config.source.map(group => `<option value="${escapeHtml(group.category)}">${escapeHtml(group.category)}</option>`).join('')}`;

      const itemInput = document.createElement('input');
      itemInput.id = `${config.type}-item-input`;
      itemInput.className = 'invoice-item-input';
      itemInput.type = 'text';
      itemInput.setAttribute('list', `${config.type}-source-options`);
      itemInput.placeholder = 'เลือกหรือพิมพ์รายการใหม่';
      itemInput.autocomplete = 'off';
      oldSelect.replaceWith(itemInput);
      const datalist = document.createElement('datalist');
      datalist.id = `${config.type}-source-options`;
      itemInput.insertAdjacentElement('afterend', datalist);
      const rateEl = document.querySelector(`#${config.rateId}`);
      const qtyEl = document.querySelector(`#${config.qtyId}`);
      const button = replaceWithClone(document.querySelector(`#add-${config.type}`));

      const selectedGroup = () => config.source.find(group => group.category === categoryEl.value);
      const refreshItems = () => {
        const group = selectedGroup();
        itemInput.value = '';
        if (rateEl) rateEl.value = '';
        datalist.innerHTML = group ? optionList(group.items) : '';
        itemInput.disabled = !group;
        itemInput.placeholder = group ? 'เลือกหรือพิมพ์รายการใหม่' : 'เลือกหมวดก่อน';
      };
      const fillKnownRate = () => {
        const group = selectedGroup();
        const item = group?.items.find(entry => entry.name.toLowerCase() === itemInput.value.trim().toLowerCase());
        if (item && rateEl) rateEl.value = item.rate || '';
      };
      categoryEl.addEventListener('change', refreshItems);
      itemInput.addEventListener('input', fillKnownRate);
      itemInput.addEventListener('change', fillKnownRate);
      button?.addEventListener('click', event => {
        event.preventDefault();
        const group = selectedGroup();
        const name = itemInput.value.trim();
        if (!group) { showToast('กรุณาเลือกหมวดก่อนเพิ่มรายการ', 'error'); return; }
        if (!name) { showToast('กรุณาเลือกรายการหรือพิมพ์รายการใหม่ก่อนเพิ่ม', 'error'); return; }
        let item = group.items.find(entry => entry.name.toLowerCase() === name.toLowerCase());
        if (!item) {
          item = { name, rate: numberFrom(rateEl?.value), category: group.category, custom: true };
          group.items.push(item);
          const custom = readCustom().filter(entry => !(entry.type === config.type && entry.category === group.category && entry.name.toLowerCase() === name.toLowerCase()));
          custom.push({ type: config.type, category: group.category, name, rate: item.rate });
          saveCustom(custom);
          datalist.innerHTML = optionList(group.items);
        }
        const amount = numberFrom(rateEl?.value || item.rate);
        const lines = window.sceneryAppState?.invoiceLines;
        if (!lines) return;
        lines.push({ type: config.type, name: item.name, category: group.category, sourceIndex: null, rate: amount, deposit: 0, depositMethod: 'เงินสด', qty: Math.max(1, numberFrom(qtyEl?.value || 1)), discountRate: 0, discountAmount: 0, pendingCollection: 0, pendingNote: '' });
        categoryEl.value = '';
        itemInput.value = '';
        if (rateEl) rateEl.value = '';
        if (qtyEl) qtyEl.value = '1';
        refreshItems();
        if (typeof renderFormLines === 'function') renderFormLines();
        if (typeof calculateInvoice === 'function') calculateInvoice();
        showToast(`เพิ่ม ${item.name} ลงในใบแจ้งหนี้แล้ว`);
      });
      refreshItems();
    });
  }

  async function load() {
    try {
      const response = await fetch(`invoice-source.txt?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const text = await response.text();
        const data = parseSource(text);
        mergeCustom(data);
        window.INVOICE_SOURCE_DATA = data;
        applyForm(data);
        return;
      }
    } catch (e) {}

    // Graceful fallback from window.DATA or custom items
    try {
      const custom = readCustom();
      const fallbackData = { accommodation: [], addon: [] };
      if (window.DATA?.villas) {
        fallbackData.accommodation.push({
          category: 'Villa / Room',
          items: window.DATA.villas.map(v => ({ name: v.name, rate: v.rate || 0, category: 'Accommodation' }))
        });
      }
      if (window.DATA?.items) {
        fallbackData.addon.push({
          category: 'สินค้าและบริการ',
          items: window.DATA.items.map(i => ({ name: i.name, rate: i.rate || 0, category: i.category || 'General' }))
        });
      }
      mergeCustom(fallbackData);
      window.INVOICE_SOURCE_DATA = fallbackData;
      applyForm(fallbackData);
    } catch (err) {
      console.warn('Invoice form initialized with default controls');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
