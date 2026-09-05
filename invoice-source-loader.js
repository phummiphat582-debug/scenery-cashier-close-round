/* Invoice form data is driven by ข้อมูลสร้างใบแจ้งหนี้.txt & Master Data. */
(() => {
  const CUSTOM_KEY = 'scenery-invoice-custom-items';
  const clean = value => String(value ?? '').replace(/\t+/g, ' ').replace(/\s+/g, ' ').trim();
  const numberFrom = value => Number(String(value ?? '').replace(/,/g, '')) || 0;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function normalizeCategory(c) {
    return String(c || '')
      .toLowerCase()
      .replace(/[_\s\-\/&]+/g, '')
      .replace(/[^a-z0-9\u0E00-\u0E7F]/gi, '')
      .trim();
  }

  function isMatchingCategory(itemCat, selectedCat, item) {
    const nItem = normalizeCategory(itemCat);
    const nSel = normalizeCategory(selectedCat);
    if (!nSel) return false;
    if (nItem === nSel) return true;
    
    // Accommodation / Villa matching:
    const isAccSel = /^(accommodation|villa|room|ที่พัก|วิลล่า)/i.test(nSel) || /^(bathtub|jacuzzi)/i.test(nSel);
    const isAccItem = item?.type === 'accommodation' || /^(accommodation|villa|room|bathtub|jacuzzi)/i.test(nItem) || Boolean(item?.villa);
    
    if (isAccSel && isAccItem) {
      if (/^(accommodation|villa|room|ที่พัก|วิลล่า)/i.test(nSel)) {
        if (item?.villa || /^(accommodation|villa|room|bathtub|jacuzzi)/i.test(nItem)) return true;
      }
      if (nSel.includes('bathtubdeluxe') && (nItem.includes('bathtubdeluxe') || /01\s*ruzi|07\s*katahdin/i.test(item?.name || ''))) return true;
      if (nSel.includes('jacuzzideluxe') && (nItem.includes('jacuzzideluxe') || /04\s*barbados|04ab/i.test(item?.name || ''))) return true;
      if (nSel === 'bathtub' && (nItem === 'bathtub' || /05\s*merino|06\s*corriedale|06\s*corredale/i.test(item?.name || ''))) return true;
      if (nSel === 'jacuzzi' && (nItem === 'jacuzzi' || /02\s*pangola|03\s*hamata|08\s*mulato|010\s*napier|011\s*setaria|012\s*alfalfa/i.test(item?.name || ''))) return true;
    }
    
    if (nSel.includes('extrabed') && nItem.includes('extrabed')) return true;
    if (nSel.includes('complimentary') && nItem.includes('complimentary')) return true;
    if (nSel.includes('package') && nItem.includes('package')) return true;
    if (nSel.includes('food') && (nItem.includes('food') || nItem.includes('fnb') || nItem.includes('beverage'))) return true;
    if (nSel.includes('bbq') && nItem.includes('bbq')) return true;
    if ((nSel.includes('afternoon') || nSel.includes('bakery') || nSel.includes('เบเกอรี่')) && (nItem.includes('afternoon') || nItem.includes('bakery') || nItem.includes('เบเกอรี่'))) return true;
    if (nSel.includes('minibar') && nItem.includes('minibar')) return true;
    if (nSel.includes('souvenir') && nItem.includes('souvenir')) return true;
    if ((nSel.includes('activit') || nSel.includes('กิจกรรม') || nSel.includes('massage') || nSel.includes('นวด')) && !nSel.includes('สุนัข') && !nSel.includes('123') && (nItem.includes('activit') || nItem.includes('massage') || nItem.includes('นวด')) && !nItem.includes('สุนัข') && !nItem.includes('123')) return true;
    if ((nSel.includes('สุนัข') || nSel.includes('123') || nSel.includes('dog')) && (nItem.includes('สุนัข') || nItem.includes('123') || nItem.includes('dog'))) return true;
    if ((nSel.includes('misc') || nSel.includes('other') || nSel.includes('อื่น')) && (nItem.includes('misc') || nItem.includes('other') || nItem.includes('อื่น'))) return true;
    
    return false;
  }

  function applyCategorySelection() {
    const accCategorySelect = document.querySelector('#accommodation-category');
    const accItemSelect = document.querySelector('#accommodation-select');
    const accRateInput = document.querySelector('#accommodation-rate');
    const accQtyInput = document.querySelector('#accommodation-qty');

    const addonCategorySelect = document.querySelector('#addon-category');
    const addonItemSelect = document.querySelector('#addon-select');
    const addonRateInput = document.querySelector('#addon-rate');
    const addonQtyInput = document.querySelector('#addon-qty');

    // Remove old search inputs or datalists that hid the select
    document.querySelectorAll('#accommodation-search, #accommodation-options, #addon-search, #addon-options, #accommodation-item-input, #accommodation-source-options, #addon-item-input, #addon-source-options').forEach(el => el.remove());

    const accItems = (window.DATA_MASTER?.accommodationItems || []).map((it, idx) => ({ ...it, _idx: idx }));
    const addonItems = (window.DATA_MASTER?.addonItems || []).map((it, idx) => ({ ...it, _idx: idx }));

    if (accCategorySelect && (!accCategorySelect.options.length || accCategorySelect.options.length <= 1)) {
      accCategorySelect.innerHTML = `
        <option value="">เลือกหมวด</option>
        <option value="Accommodation">Accommodation (วิลล่า/ห้องพัก)</option>
        <option value="Extra Bed">Extra Bed (เตียงเสริม)</option>
        <option value="Complimentary">Complimentary (อภินันทนาการ)</option>
        <option value="Package">Package (แพ็กเกจ)</option>
      `;
    }

    if (addonCategorySelect && (!addonCategorySelect.options.length || addonCategorySelect.options.length <= 1)) {
      addonCategorySelect.innerHTML = `
        <option value="">เลือกหมวด</option>
        <option value="Food & Beverage">Food & Beverage (อาหารและเครื่องดื่ม)</option>
        <option value="BBQ">BBQ (บาร์บีคิว)</option>
        <option value="Afternoon Tea">Afternoon Tea (ชุดน้ำชา)</option>
        <option value="เครื่องดื่มและเบเกอรี่">เครื่องดื่มและเบเกอรี่</option>
        <option value="Minibar">Minibar (มินิบาร์และของใช้)</option>
        <option value="Souvenir">Souvenir (ของที่ระลึก)</option>
        <option value="Activities">Activities (กิจกรรมและสปา)</option>
        <option value="กิจกรรมชมสุนัขที่123ไร่">กิจกรรมชมสุนัขที่ 123 ไร่</option>
        <option value="Miscellaneous">Miscellaneous (อื่น ๆ)</option>
      `;
    }

    function setupGroup(categoryEl, selectEl, rateEl, qtyEl, items, type) {
      if (!categoryEl || !selectEl) return;
      selectEl.hidden = false;
      selectEl.style.display = '';

      const onCategoryChange = () => {
        const cat = categoryEl.value;
        if (!cat) {
          selectEl.innerHTML = '<option value="">เลือกหมวดก่อน</option>';
          selectEl.disabled = true;
          if (rateEl) rateEl.value = '';
          return;
        }
        const matches = items.filter(it => isMatchingCategory(it.category, cat, it));
        selectEl.innerHTML = `<option value="">-- เลือกรายการในหมวด (${matches.length} รายการ) --</option>` +
          matches.map(it => `<option value="${it._idx}" data-rate="${it.rate || 0}" data-name="${escapeHtml(it.name)}" data-cat="${escapeHtml(it.category)}">${escapeHtml(it.name)}${it.rate ? ` (฿${Number(it.rate).toLocaleString('th-TH')})` : ''}</option>`).join('');
        selectEl.disabled = matches.length === 0;
        if (rateEl) rateEl.value = '';
      };

      const onItemChange = () => {
        const opt = selectEl.options[selectEl.selectedIndex];
        if (opt && opt.value !== '') {
          const rate = opt.dataset.rate || 0;
          if (rateEl) rateEl.value = rate;
        } else {
          if (rateEl) rateEl.value = '';
        }
      };

      categoryEl.onchange = onCategoryChange;
      selectEl.onchange = onItemChange;
      if (categoryEl.value) {
        onCategoryChange();
      }
    }

    setupGroup(accCategorySelect, accItemSelect, accRateInput, accQtyInput, accItems, 'accommodation');
    setupGroup(addonCategorySelect, addonItemSelect, addonRateInput, addonQtyInput, addonItems, 'addon');
  }

  window.installInvoiceCategoryFirstSelection = applyCategorySelection;
  window.isMatchingCategory = isMatchingCategory;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCategorySelection);
  } else {
    applyCategorySelection();
  }
})();
