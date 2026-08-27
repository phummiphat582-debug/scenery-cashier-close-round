/* Compact legacy-style screen layout for invoice and close-round pages.
 * Loaded after the split application bundle so it cannot be overwritten by
 * later bundle parts. Printing keeps its separate A4 layout.
 */
(() => {
  'use strict';
  if (window.__sceneryCloseRoundLegacyCompat) return;
  window.__sceneryCloseRoundLegacyCompat = true;

  const style = document.createElement('style');
  style.id = 'close-round-legacy-compat-style';
  style.textContent = `
    @media screen {
      #view-invoice .invoice-preview-stage { padding: 14px; }
      #view-invoice .invoice-preview-sheet {
        width: min(100%, 820px);
        min-width: 0;
        padding: 22px 24px 20px;
      }
      #view-invoice .preview-header { min-height: 112px; gap: 20px; }
      #view-invoice .preview-company { gap: 11px; padding-top: 4px; font-size: 10px; }
      #view-invoice .preview-company img { width: 78px; height: 78px; }
      #view-invoice .preview-title { min-width: 220px; }
      #view-invoice .preview-title h1 { font-size: 30px; margin-bottom: 10px; }
      #view-invoice .preview-meta { gap: 8px 12px; }
      #view-invoice .preview-table-wrap { overflow-x: auto; }

      #view-close-round .close-round-detail-wrap {
        max-width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      #view-close-round .close-round-detail-table {
        min-width: 1800px;
        font-size: 12px;
      }
      #view-close-round .close-round-detail-table th,
      #view-close-round .close-round-detail-table td { padding: 5px 6px; }
      #view-close-round .close-round-detail-table th:nth-child(1),
      #view-close-round .close-round-detail-table td:nth-child(1) { min-width: 105px; }
      #view-close-round .close-round-detail-table th:nth-child(2),
      #view-close-round .close-round-detail-table td:nth-child(2) { min-width: 110px; }
      #view-close-round .close-round-detail-table th:nth-child(3),
      #view-close-round .close-round-detail-table td:nth-child(3) { min-width: 145px; }
      #view-close-round .close-round-detail-table th:nth-child(4),
      #view-close-round .close-round-detail-table th:nth-child(5) { min-width: 58px; }
      #view-close-round .close-round-detail-table th:last-child,
      #view-close-round .close-round-detail-table td:last-child { min-width: 120px; }
      #view-close-round .close-round-detail-table input,
      #view-close-round .close-round-detail-table select,
      #view-close-round .close-round-detail-table textarea { min-height: 32px; padding: 5px 6px; }
    }

    @media screen and (max-width: 860px) {
      #view-invoice .invoice-preview-sheet { padding: 16px; }
      #view-invoice .preview-header { min-height: 96px; gap: 12px; }
      #view-invoice .preview-company img { width: 64px; height: 64px; }
      #view-invoice .preview-title { min-width: 175px; }
      #view-invoice .preview-title h1 { font-size: 24px; }
    }
  `;
  document.head.appendChild(style);

  function useCleanLogo(root = document) {
    root.querySelectorAll('img[src*="346973899_1639269593246469_4301917493848559029_n.jpg"]')
      .forEach(image => {
        if (image.dataset.cleanLogoReady) return;
        image.dataset.cleanLogoReady = 'true';
        const original = image.getAttribute('src');
        image.addEventListener('error', () => {
          image.onerror = null;
          image.src = original;
          image.style.clipPath = 'inset(4px 0 0 0)';
        }, { once: true });
        image.src = './login-logo.png?v=20260816-clean-logo-3';
      });
  }

  function useLegacyOtherLabel(root = document) {
    root.querySelectorAll('#view-close-round th, #view-close-round h3, #view-close-round label, #view-close-round option')
      .forEach(node => {
        if (/^อื่นๆ\s*\(/.test(node.textContent.trim())) node.textContent = 'อื่นๆ';
      });
  }

  function apply() {
    useCleanLogo();
    useLegacyOtherLabel();
    const categories = window.CLOSE_ROUND_CATEGORIES;
    const other = Array.isArray(categories) && categories.find(item => item.key === 'other');
    if (other) other.label = 'อื่นๆ';
  }

  apply();
  document.addEventListener('DOMContentLoaded', apply);
  new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
})();
