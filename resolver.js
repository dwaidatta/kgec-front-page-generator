let LABELS = null;

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

// Load labels once and expose ready promise
window.labelsReady = fetch('master_labels.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load master_labels.json');
    return res.json();
  })
  .then(data => {
    LABELS = data;
    console.log('Labels loaded successfully:', LABELS);
  })
  .catch(err => {
    console.error('Error loading master_labels.json:', err);
    LABELS = {}; // empty fallback
  });

function resolveKey(label) {
  if (!LABELS || typeof LABELS !== 'object') return null;

  const norm = normalize(label);

  for (const key in LABELS) {
    const aliases = LABELS[key];
    if (Array.isArray(aliases) && aliases.includes(norm)) {
      return key;
    }
  }

  return null;
}

window.resolveValue = function(label, fallback) {
  const user = window.userStore?.getActiveUser();

  if (!user) return fallback || "";

  const key = resolveKey(label);
  if (!key) return fallback || "";

  return user[key] || fallback || "";
};