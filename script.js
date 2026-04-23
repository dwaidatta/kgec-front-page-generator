// ==========================
// ELEMENTS
// ==========================
const frame = document.getElementById("page-frame");
const layoutSelect = document.getElementById("layout-select");
const titleList = document.getElementById("title-list");
const detailsList = document.getElementById("details-list");

const userSelect = document.getElementById("user-select");

const userInputs = {
  id: document.getElementById("user-id"),
  name: document.getElementById("user-name"),
  dept: document.getElementById("user-dept"),
  roll: document.getElementById("user-roll"),
  reg: document.getElementById("user-reg"),
};

// ==========================
// STATE
// ==========================
let layouts = {};
let currentLayout = null;

// ==========================
// FRAME LOAD
// ==========================
frame.addEventListener("load", () => {
  if (currentLayout) {
    const win = getPageWindow();
    if (win.applyLayout) {
      win.applyLayout(currentLayout);
    }
  }

  restoreState();
  fitPageFrame();
});

// ==========================
// LOAD LAYOUTS
// ==========================
fetch("layouts.json")
  .then((r) => r.json())
  .then((data) => {
    layouts = data;

    layoutSelect.innerHTML = "";
    Object.entries(layouts).forEach(([key, val]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = val.label || key;
      layoutSelect.appendChild(opt);
    });

    const firstKey = Object.keys(layouts)[0];
    currentLayout = JSON.parse(JSON.stringify(layouts[firstKey]));

    applyToPage();
    restoreState();
  });

layoutSelect.addEventListener("change", (e) => {
  const key = e.target.value;
  currentLayout = JSON.parse(JSON.stringify(layouts[key]));
  applyToPage();

  const meta = window.userStore.getMeta();
  meta.lastLayout = key;
  window.userStore.saveMeta(meta);
});

// ==========================
// USER SYSTEM
// ==========================
function loadUsersUI() {
  const users = window.userStore.getAllUsers();
  const state = window.userStore.getState();

  userSelect.innerHTML = "";

  // Force None first
  const ids = Object.keys(users).sort((a, b) => {
    if (a === "__none__") return -1;
    if (b === "__none__") return 1;
    return a.localeCompare(b);
  });

  ids.forEach((id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id === "__none__" ? "— None —" : id;

    if (id === state.activeUser) opt.selected = true;

    userSelect.appendChild(opt);
  });
}

function fillUserForm(id) {
  const user = window.userStore.getAllUsers()[id];
  if (!user) return;

  if (id === "__none__") {
    userInputs.id.value = "";
    userInputs.id.disabled = false;
  } else {
    userInputs.id.value = id;
    userInputs.id.disabled = true;
  }

  userInputs.name.value = user.name || "";
  userInputs.dept.value = user.dept || "";
  userInputs.roll.value = user.roll || "";
  userInputs.reg.value = user.reg || "";
}

userSelect.addEventListener("change", (e) => {
  window.userStore.setActiveUser(e.target.value);
  fillUserForm(e.target.value);
  const meta = window.userStore.getMeta();
  meta.lastUser = e.target.value;
  window.userStore.saveMeta(meta);
  applyToPage();
});

// NEW PROFILE
document.getElementById("new-user").addEventListener("click", () => {
  Object.values(userInputs).forEach((i) => (i.value = ""));
  userInputs.id.disabled = false;
});

// SAVE PROFILE
document.getElementById("save-user").addEventListener("click", () => {
  const id = userInputs.id.value.trim();
  if (!id) return alert("Profile name required");

  const state = window.userStore.getState();

  state.users[id] = {
    name: userInputs.name.value,
    dept: userInputs.dept.value,
    roll: userInputs.roll.value,
    reg: userInputs.reg.value,
  };

  state.activeUser = id;
  window.userStore.saveState(state);

  loadUsersUI();
  applyToPage();
});

// DELETE
document.getElementById("delete-user").addEventListener("click", () => {
  const state = window.userStore.getState();
  const id = state.activeUser;

  if (id === "__none__") return;

  delete state.users[id];
  state.activeUser = "__none__";

  window.userStore.saveState(state);

  loadUsersUI();
  applyToPage();
});

// ==========================
// MAIN FLOW
// ==========================
function restoreState() {
  if (!currentLayout) return;

  const meta = window.userStore.getMeta();
  const state = window.userStore.getState();

  if (!state.activeUser || !state.users[state.activeUser]) {
    state.activeUser = "__none__";
    window.userStore.saveState(state);
  }

  // restore user
  if (meta.lastUser && state.users[meta.lastUser]) {
    state.activeUser = meta.lastUser;
    window.userStore.saveState(state);
  }

  // restore layout
  if (meta.lastLayout && layouts[meta.lastLayout]) {
    currentLayout = JSON.parse(JSON.stringify(layouts[meta.lastLayout]));
    layoutSelect.value = meta.lastLayout;
  }

  // restore session
  if (meta.lastSession) {
    currentLayout.session.text = meta.lastSession;
  }

  loadUsersUI();
  syncAllUI();
  applyToPage();
}

function getPageWindow() {
  return frame.contentWindow;
}

function applyToPage() {
  const win = getPageWindow();
  if (!win || !win.applyLayout) return;

  win.applyLayout(currentLayout);
}

// ==========================
// UI SYNC
// ==========================
function syncAllUI() {
  syncMarginsUI();
  syncFontSizeUI();
  syncTitleUI();
  syncDetailsUI();
  document.getElementById("session-text").value =
    currentLayout.session?.text || "";
}
function syncMarginsUI() {
  document.getElementById("margin-left").value = parseInt(
    currentLayout.pageStyle.marginLeft,
  );

  document.getElementById("margin-right").value = parseInt(
    currentLayout.pageStyle.marginRight,
  );

  document.getElementById("margin-top").value = parseInt(
    currentLayout.pageStyle.marginTop,
  );

  document.getElementById("margin-bottom").value = parseInt(
    currentLayout.pageStyle.marginBottom,
  );
}
["margin-left", "margin-right", "margin-top", "margin-bottom"].forEach((id) => {
  document.getElementById(id).addEventListener("input", (e) => {
    const keyMap = {
      "margin-left": "marginLeft",
      "margin-right": "marginRight",
      "margin-top": "marginTop",
      "margin-bottom": "marginBottom",
    };

    const key = keyMap[id];
    currentLayout.pageStyle[key] = e.target.value + "mm";

    applyToPage();
  });
});

function syncFontSizeUI() {
  ["title", "details", "session"].forEach((group) => {
    const el = document.getElementById("fs-" + group);
    if (el) {
      el.textContent = currentLayout.fontSize?.[group] ?? 4;
    }
  });
}
document.querySelectorAll(".btn-fs").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group;
    const dir = parseInt(btn.dataset.dir);

    if (!currentLayout.fontSize) currentLayout.fontSize = {};

    const current = currentLayout.fontSize[group] ?? 4;
    const next = Math.max(1, current + dir);

    currentLayout.fontSize[group] = next;

    syncFontSizeUI();
    applyToPage();
  });
});

// ==========================
// TITLE
// ==========================
function syncTitleUI() {
  titleList.innerHTML = "";

  currentLayout.title.forEach((line, index) => {
    const wrap = document.createElement("div");

    const input = document.createElement("input");
    input.value = line.text || "";
    input.oninput = () => {
      line.text = input.value;
      applyToPage();
    };

    const del = document.createElement("button");
    del.className = "btn-secondary";
    del.innerText = "Delete";
    del.onclick = () => {
      currentLayout.title.splice(index, 1);
      syncTitleUI();
      applyToPage();
    };

    wrap.appendChild(input);
    wrap.appendChild(del);
    titleList.appendChild(wrap);
  });
}

document.getElementById("add-title-line").addEventListener("click", () => {
  currentLayout.title.push({ text: "" });
  syncTitleUI();
  applyToPage();
});

// ==========================
// DETAILS
// ==========================
function syncDetailsUI() {
  detailsList.innerHTML = "";

  currentLayout.details.forEach((row, index) => {
    const wrap = document.createElement("div");

    const field = document.createElement("input");
    field.value = row.label || "";
    field.oninput = () => {
      row.label = field.value;
      applyToPage();
    };

    const value = document.createElement("input");
    value.value = row.value || "";
    value.oninput = () => {
      row.value = value.value;
      applyToPage();
    };

    const del = document.createElement("button");
    del.className = "btn-secondary";
    del.innerText = "Delete";
    del.onclick = () => {
      currentLayout.details.splice(index, 1);
      syncDetailsUI();
      applyToPage();
    };

    wrap.appendChild(field);
    wrap.appendChild(value);
    wrap.appendChild(del);

    detailsList.appendChild(wrap);
  });
}

document.getElementById("add-detail-row").addEventListener("click", () => {
  currentLayout.details.push({ label: "", value: "" });
  syncDetailsUI();
  applyToPage();
});

// ==========================
// SESSION
// ==========================
document.getElementById("session-text").addEventListener("input", (e) => {
  currentLayout.session.text = e.target.value;
  const meta = window.userStore.getMeta();
  meta.lastSession = e.target.value;
  window.userStore.saveMeta(meta);
  applyToPage();
});

// ==========================
// FRAME SCALE
// ==========================
function fitPageFrame() {
  const pane = document.querySelector(".page-pane");
  const wrap = document.querySelector(".page-frame-wrap");
  const frameEl = document.getElementById("page-frame");

  const scale = Math.min(
    (pane.clientWidth - 32) / 794,
    (pane.clientHeight - 32) / 1123,
  );

  frameEl.style.transform = `scale(${scale})`;
  wrap.style.width = 794 * scale + "px";
  wrap.style.height = 1123 * scale + "px";
  frameEl.style.visibility = "visible";
}

window.addEventListener("resize", fitPageFrame);

document.getElementById("download-pdf").addEventListener("click", async () => {
  const iframe = document.getElementById("page-frame");
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

  const content = iframeDoc.querySelector(".page-wrap");

  if (!content) {
    alert("Page not ready");
    return;
  }

  // use browser print (simplest + reliable)
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
});

document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-users").click();
});

document.getElementById("export-users").addEventListener("click", () => {
  const state = window.userStore.getState();
  const activeId = state.activeUser;

  if (!activeId || activeId === "__none__") {
    alert("No active profile to export ❌");
    return;
  }

  const user = state.users[activeId];

  // 🔥 remove unwanted fields
  const cleanUser = {
    name: user.name,
    dept: user.dept,
    roll: user.roll,
    reg: user.reg,
  };

  const data = {
    [activeId]: cleanUser,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = activeId + ".json";
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById("import-users").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const importedUsers = JSON.parse(event.target.result);

      const state = window.userStore.getState();

      // merge users
      Object.keys(importedUsers).forEach((id) => {
        const u = importedUsers[id];

        // 🔥 only keep allowed fields
        state.users[id] = {
          name: u.name || "",
          dept: u.dept || "",
          roll: u.roll || "",
          reg: u.reg || "",
        };
      });

      window.userStore.saveState(state);

      alert("Import successful ✅");

      loadUsersUI();
      applyToPage();
    } catch (err) {
      alert("Invalid JSON file ❌");
    }
  };

  reader.readAsText(file);
});
