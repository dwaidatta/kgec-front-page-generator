const frame = document.getElementById('page-frame');

// Set default layout style (just for margins)
let currentLayout = {
  pageStyle: { marginLeft: "15mm", marginRight: "15mm", marginTop: "15mm", marginBottom: "15mm" }
};

frame.addEventListener('load', () => {
  restoreState();
  fitPageFrame();
  setupTwoWaySync();
  setupFontSize();
  setupAutoAdvance();
});

function restoreState() {
  syncMarginsUI();
  applyToPage();
}

function getPageWindow() { return frame.contentWindow; }
function applyToPage()   { if (currentLayout && getPageWindow().applyLayout) getPageWindow().applyLayout(currentLayout); }

function syncMarginsUI() {
  document.getElementById('margin-left').value   = parseInt(currentLayout.pageStyle.marginLeft);
  document.getElementById('margin-right').value  = parseInt(currentLayout.pageStyle.marginRight);
  document.getElementById('margin-top').value    = parseInt(currentLayout.pageStyle.marginTop);
  document.getElementById('margin-bottom').value = parseInt(currentLayout.pageStyle.marginBottom);
}

// Margin controls
['left','right','top','bottom'].forEach(side => {
  const el = document.getElementById('margin-' + side);
  if (el) {
    el.addEventListener('input', e => {
      const key = 'margin' + side.charAt(0).toUpperCase() + side.slice(1);
      currentLayout.pageStyle[key] = (e.target.value || '0') + 'mm';
      applyToPage();
    });
  }
});

// Save as PDF
const downloadBtn = document.getElementById('download-pdf');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('pdf-filename');
    const name = nameInput ? nameInput.value.trim() : '';
    const pw   = getPageWindow();
    const prev = document.title;  // save parent title

    if (name) document.title = name;  // set parent title, not pw.document.title

    pw.addEventListener('afterprint', function handler() {
      document.title = prev;  // restore parent title
      pw.removeEventListener('afterprint', handler);
      setTimeout(() => restoreState(), 100);
      const starPopup = document.getElementById('star-popup');
      if (starPopup) starPopup.classList.add('visible');
    }, { once: true });

    pw.print();
  });
}

// Fit page frame
function fitPageFrame() {
  const pane    = document.querySelector('.page-pane');
  const wrap    = document.querySelector('.page-frame-wrap');
  const frameEl = document.getElementById('page-frame');
  if (!pane || !wrap || !frameEl) return;
  const frameW  = 794;
  const frameH  = 1123;
  const availW  = pane.clientWidth  - 32;
  const availH  = pane.clientHeight - 32;
  const scale   = Math.min(availW / frameW, availH / frameH);

  frameEl.style.transform       = `scale(${scale})`;
  frameEl.style.transformOrigin = 'top left';
  wrap.style.width              = (frameW * scale) + 'px';
  wrap.style.height             = (frameH * scale) + 'px';
  frameEl.style.visibility      = 'visible';
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    restoreState();
  }
});

window.addEventListener('resize', fitPageFrame);
fitPageFrame();

const starPopupClose = document.getElementById('star-popup-close');
if (starPopupClose) {
  starPopupClose.addEventListener('click', () => {
    document.getElementById('star-popup').classList.remove('visible');
  });
}

const starPopup = document.getElementById('star-popup');
if (starPopup) {
  starPopup.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('visible');
    }
  });
}

// Two-way sync for Details
// Two-way sync for Details
function setupTwoWaySync() {
  const pw = getPageWindow();
  if (!pw || !pw.document) return;

  // Text inputs
  const sideInputs = document.querySelectorAll('.side-input');
  sideInputs.forEach(sideInput => {
    const targetId = sideInput.dataset.target;
    const pageInput = pw.document.getElementById(targetId);
    
    if (pageInput) {
      if (sideInput.value) {
        pageInput.value = sideInput.value;
      } else if (pageInput.value) {
        sideInput.value = pageInput.value;
      }

      sideInput.addEventListener('input', () => { pageInput.value = sideInput.value; });
      pageInput.addEventListener('input', () => { sideInput.value = pageInput.value; });
    }
  });

  // Checkboxes
  const sideCheckboxes = document.querySelectorAll('.side-checkbox');
  sideCheckboxes.forEach(sideCheck => {
    const targetId = sideCheck.dataset.target;
    const pageCheck = pw.document.getElementById(targetId);
    
    if (pageCheck) {
      if (sideCheck.checked) {
        pageCheck.checked = sideCheck.checked;
      } else if (pageCheck.checked) {
        sideCheck.checked = pageCheck.checked;
      }

      sideCheck.addEventListener('change', () => { pageCheck.checked = sideCheck.checked; });
      pageCheck.addEventListener('change', () => { sideCheck.checked = pageCheck.checked; });
    }
  });
}

// Font Size controls
// Font Size controls
let currentFontSize = 4.5;
document.querySelectorAll('.btn-fs').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = parseFloat(btn.dataset.dir);
    currentFontSize = Math.max(2, currentFontSize + dir);
    document.getElementById('fs-inputs').textContent = currentFontSize;
    setupFontSize();
  });
});

function setupFontSize() {
  const pw = getPageWindow();
  if (pw && pw.document) {
    const inputs = pw.document.querySelectorAll('.blue-input');
    inputs.forEach(input => {
      input.style.fontSize = currentFontSize + 'mm';
    });
  }
}

// Auto move to next line for multi-line fields
function setupAutoAdvance() {
  const pw = getPageWindow();
  if (!pw || !pw.document) return;
  
  const setupGroup = (ids) => {
    ids.forEach((id, index) => {
      const el = pw.document.getElementById(id);
      if (!el) return;

      el.addEventListener('input', () => {
        if (el.scrollWidth > el.clientWidth && index < ids.length - 1) {
          const nextEl = pw.document.getElementById(ids[index + 1]);
          if (nextEl) {
            const lastChar = el.value.slice(-1);
            el.value = el.value.slice(0, -1);
            nextEl.value = lastChar + nextEl.value;
            nextEl.focus();
            nextEl.setSelectionRange(1, 1);
            // Manually trigger input events to update side panel
            el.dispatchEvent(new Event('input', { bubbles: true }));
            nextEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && el.value === '' && index > 0) {
          const prevEl = pw.document.getElementById(ids[index - 1]);
          if (prevEl) {
            e.preventDefault();
            prevEl.focus();
            // Optional: Set cursor to end of prevEl
            const len = prevEl.value.length;
            prevEl.setSelectionRange(len, len);
          }
        }
      });
    });
  };

  setupGroup(['title-input-1', 'title-input-2']);
  setupGroup(['learning-input-1', 'learning-input-2', 'learning-input-3']);
}