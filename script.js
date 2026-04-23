const frame        = document.getElementById('page-frame');
const layoutSelect = document.getElementById('layout-select');
const titleList    = document.getElementById('title-list');
const detailsList  = document.getElementById('details-list');

let layouts       = {};
let currentLayout = null;

// Wire frame load BEFORE fetch — outside the .then()
frame.addEventListener('load', () => {
  restoreState();
  fitPageFrame();
});

// Boot: fetch layouts, populate dropdown, set initial layout
fetch('layouts.json')
  .then(r => r.json())
  .then(data => {
    layouts = data;

    layoutSelect.innerHTML = '';
    Object.entries(layouts).forEach(([key, val]) => {
      const opt = document.createElement('option');
      opt.value       = key;
      opt.textContent = val.label || key;
      layoutSelect.appendChild(opt);
    });

    const firstKey = Object.keys(layouts)[0];
    currentLayout  = JSON.parse(JSON.stringify(layouts[firstKey]));

    // iframe may already be loaded by now, so push immediately
    restoreState();
  })
  .catch(err => console.error('Failed to load layouts.json:', err));

function restoreState() {
  if (!currentLayout) return;
  syncAllUI();
  applyToPage();
}

function getPageWindow() { return frame.contentWindow; }
function applyToPage()   { if (currentLayout) getPageWindow().applyLayout(currentLayout); }

// Sync all controls from currentLayout
function syncAllUI() {
  syncMarginsUI();
  syncFontSizeUI();
  syncTitleUI();
  syncDetailsUI();
  document.getElementById('session-text').value = currentLayout.session?.text || '';
}

function syncMarginsUI() {
  document.getElementById('margin-left').value   = parseInt(currentLayout.pageStyle.marginLeft);
  document.getElementById('margin-right').value  = parseInt(currentLayout.pageStyle.marginRight);
  document.getElementById('margin-top').value    = parseInt(currentLayout.pageStyle.marginTop);
  document.getElementById('margin-bottom').value = parseInt(currentLayout.pageStyle.marginBottom);
}

function syncFontSizeUI() {
  ['title', 'details', 'session'].forEach(group => {
    const el = document.getElementById('fs-' + group);
    if (el) el.textContent = currentLayout.fontSize?.[group] ?? defaultFS(group);
  });
}

function defaultFS(group) {
  return { title: 5, details: 4, session: 4.5 }[group] ?? 4;
}

// Font size A+ / A-
document.querySelectorAll('.btn-fs').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    const dir   = parseFloat(btn.dataset.dir);
    if (!currentLayout.fontSize) currentLayout.fontSize = {};
    const current = parseFloat(currentLayout.fontSize[group] ?? defaultFS(group));
    const next    = Math.max(1, Math.round((current + dir * 0.5) * 10) / 10);
    currentLayout.fontSize[group] = next;
    document.getElementById('fs-' + group).textContent = next;
    applyToPage();
  });
});

// Title UI
function syncTitleUI() {
  titleList.innerHTML = '';
  currentLayout.title.forEach((line, index) => {
    const wrap = document.createElement('div');

    const textInput = document.createElement('input');
    textInput.type        = 'text';
    textInput.value       = line.text || '';
    textInput.placeholder = 'Title text';
    textInput.addEventListener('input', () => { line.text = textInput.value; applyToPage(); });

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:4px;margin-top:4px;';

    const boldBtn = makeToggle('bi-type-bold',      line.bold,      () => { line.bold      = !line.bold;      boldBtn.classList.toggle('active', line.bold);      applyToPage(); });
    const itBtn   = makeToggle('bi-type-italic',    line.italic,    () => { line.italic    = !line.italic;    itBtn.classList.toggle('active', line.italic);      applyToPage(); });
    const ulBtn   = makeToggle('bi-type-underline', line.underline, () => { line.underline = !line.underline; ulBtn.classList.toggle('active', line.underline);   applyToPage(); });
    const delBtn  = makeAction('bi-trash',          () => { currentLayout.title.splice(index, 1); syncTitleUI(); applyToPage(); });

    [boldBtn, itBtn, ulBtn, delBtn].forEach(b => toolbar.appendChild(b));
    wrap.appendChild(textInput);
    wrap.appendChild(toolbar);
    titleList.appendChild(wrap);
  });
}

// Details UI
function syncDetailsUI() {
  detailsList.innerHTML = '';
  currentLayout.details.forEach((row, index) => {
    const wrap = document.createElement('div');

    const fieldInput = document.createElement('input');
    fieldInput.type        = 'text';
    fieldInput.placeholder = 'Field';
    fieldInput.value       = row.label || '';
    fieldInput.addEventListener('input', () => { row.label = fieldInput.value; applyToPage(); });

    const valueInput = document.createElement('input');
    valueInput.type        = 'text';
    valueInput.placeholder = 'Value';
    valueInput.value       = row.value || '';
    valueInput.addEventListener('input', () => { row.value = valueInput.value; applyToPage(); });

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;justify-content:space-between;margin-top:4px;';

    // reorder arrows (left side)
    const arrowWrap = document.createElement('div');
    arrowWrap.style.cssText = 'display:flex;gap:4px;';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'btn-arrow';
    upBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => {
      if (index === 0) return;
      [currentLayout.details[index - 1], currentLayout.details[index]] =
        [currentLayout.details[index], currentLayout.details[index - 1]];
      syncDetailsUI();
      applyToPage();
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'btn-arrow';
    downBtn.innerHTML = '<i class="bi bi-arrow-down"></i>';
    downBtn.disabled = index === currentLayout.details.length - 1;
    downBtn.addEventListener('click', () => {
      if (index === currentLayout.details.length - 1) return;
      [currentLayout.details[index], currentLayout.details[index + 1]] =
        [currentLayout.details[index + 1], currentLayout.details[index]];
      syncDetailsUI();
      applyToPage();
    });

    arrowWrap.appendChild(upBtn);
    arrowWrap.appendChild(downBtn);

    // delete (right side)
    const delBtn = makeAction('bi-trash', () => {
      currentLayout.details.splice(index, 1);
      syncDetailsUI();
      applyToPage();
    });

    toolbar.appendChild(arrowWrap);
toolbar.appendChild(delBtn);

    wrap.appendChild(fieldInput);
    wrap.appendChild(valueInput);
    wrap.appendChild(toolbar);
    detailsList.appendChild(wrap);
  });
}

// Button helpers
function makeToggle(icon, active, onClick) {
  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 'btn-secondary' + (active ? ' active' : '');
  btn.innerHTML = `<i class="bi ${icon}"></i>`;
  btn.addEventListener('click', onClick);
  return btn;
}

function makeAction(icon, onClick) {
  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 'btn-secondary';
  btn.innerHTML = `<i class="bi ${icon}"></i>`;
  btn.addEventListener('click', onClick);
  return btn;
}

// Layout dropdown
layoutSelect.addEventListener('change', e => {
  currentLayout = JSON.parse(JSON.stringify(layouts[e.target.value]));
  syncAllUI();
  applyToPage();
});

// Margin controls
['left','right','top','bottom'].forEach(side => {
  document.getElementById('margin-' + side).addEventListener('input', e => {
    const key = 'margin' + side.charAt(0).toUpperCase() + side.slice(1);
    currentLayout.pageStyle[key] = (e.target.value || '0') + 'mm';
    applyToPage();
  });
});

// Add title line (max 2)
document.getElementById('add-title-line').addEventListener('click', () => {
  if (currentLayout.title.length >= 2) return;
  currentLayout.title.push({ text: '', bold: false, italic: false, underline: false });
  syncTitleUI();
  applyToPage();
});

// Add detail row
document.getElementById('add-detail-row').addEventListener('click', () => {
  currentLayout.details.push({ label: '', value: '' });
  syncDetailsUI();
  applyToPage();
});

// Session
document.getElementById('session-text').addEventListener('input', e => {
  currentLayout.session.text = e.target.value;
  applyToPage();
});

// Save as PDF
document.getElementById('download-pdf').addEventListener('click', () => {
  const name = document.getElementById('pdf-filename').value.trim();
  const pw   = getPageWindow();
  const prev = document.title;  // save parent title

  if (name) document.title = name;  // set parent title, not pw.document.title

  pw.addEventListener('afterprint', function handler() {
    document.title = prev;  // restore parent title
    pw.removeEventListener('afterprint', handler);
    setTimeout(() => restoreState(), 100);

    const randomNum = Math.floor(Math.random() * 5) + 1;
    if (randomNum === 2) {
      document.getElementById('star-popup').classList.add('visible');
    }
  }, { once: true });

  pw.print();
});

// Fit page frame to available pane space (no scroll, no overflow)
function fitPageFrame() {
  const pane    = document.querySelector('.page-pane');
  const wrap    = document.querySelector('.page-frame-wrap');
  const frameEl = document.getElementById('page-frame');
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









document.getElementById('star-popup-close').addEventListener('click', () => {
  document.getElementById('star-popup').classList.remove('visible');
});

// also close on backdrop click
document.getElementById('star-popup').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('visible');
  }
});