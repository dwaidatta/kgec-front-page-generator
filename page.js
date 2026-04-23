function applyLayout(layout) {
  const inner = document.querySelector('.inner-frame');

  // margins
  const ps = layout.pageStyle || {};
  if (ps.marginLeft)   inner.style.setProperty('--margin-left',   ps.marginLeft);
  if (ps.marginRight)  inner.style.setProperty('--margin-right',  ps.marginRight);
  if (ps.marginTop)    inner.style.setProperty('--margin-top',    ps.marginTop);
  if (ps.marginBottom) inner.style.setProperty('--margin-bottom', ps.marginBottom);

  // font sizes
  const fs = layout.fontSize || {};
  if (fs.title   != null) inner.style.setProperty('--fs-title',   fs.title   + 'mm');
  if (fs.details != null) inner.style.setProperty('--fs-details', fs.details + 'mm');
  if (fs.session != null) inner.style.setProperty('--fs-session', fs.session + 'mm');

  // title group
  const titleEl = document.getElementById('group-title');
  titleEl.innerHTML = '';
  (layout.title || []).forEach(line => {
    const p = document.createElement('p');
    p.textContent          = line.text || '';
    p.style.fontWeight     = line.bold      ? '700'       : '400';
    p.style.fontStyle      = line.italic    ? 'italic'    : 'normal';
    p.style.textDecoration = line.underline ? 'underline' : 'none';
    titleEl.appendChild(p);
  });

  // details group
  const detailsEl = document.getElementById('group-details');
  detailsEl.innerHTML = '';
  (layout.details || []).forEach(row => {
    const div = document.createElement('div');
    div.className = 'details-row';

    const label = document.createElement('span');
    label.className   = 'details-label';
    label.textContent = (row.label || '') + ': ';

    const value = document.createElement('span');
    value.className   = 'details-value';
    let val = window.resolveValue
  ? window.resolveValue(row.label, row.value)
  : (row.value || '');

value.textContent = val || "__________";

    div.appendChild(label);
    div.appendChild(value);
    detailsEl.appendChild(div);
  });

  // session group
  const sessionEl = document.getElementById('group-session');
  sessionEl.innerHTML = '';
  if (layout.session && layout.session.text) {
    const span = document.createElement('span');
    span.textContent = 'Academic Session: ' + layout.session.text;
    sessionEl.appendChild(span);
  }
}

window.applyLayout = applyLayout;