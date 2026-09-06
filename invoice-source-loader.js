/* Invoice source loader - delegates to core app-source.js category-first selection */
(() => {
  function init() {
    if (typeof window.installInvoiceCategoryFirstSelection === 'function') {
      window.installInvoiceCategoryFirstSelection();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

