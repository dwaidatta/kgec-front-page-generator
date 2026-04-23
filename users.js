const STORAGE_KEY = "fp_users_data";
const META_KEY = "fp_meta_data";

const DEFAULT_STATE = {
  users: {
    "__none__": {
      name: "",
      dept: "",
      roll: "",
      reg: "",
    },
    "agniva": {
      name: "Agniva Sen",
      dept: "CSE",
      roll: "123",
      reg: "2023-001",
    }
  },
  activeUser: "__none__",
  lastUsedLayout: null
};

function getState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // First time: save defaults
    saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
  return JSON.parse(stored);
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setActiveUser(userId) {
  const state = getState();
  if (state.users[userId]) {
    state.activeUser = userId;
    saveState(state);
    return true;
  }
  return false;
}

function addUser(userId, userData) {
  const state = getState();
  state.users[userId] = { ...state.users["__none__"], ...userData };
  saveState(state);
  return true;
}

function getActiveUser() {
  const state = getState();
  return state.users[state.activeUser] || null;
}

function getAllUsers() {
  const state = getState();
  return state.users;
}

function getMeta() {
  const data = localStorage.getItem(META_KEY);
  return data ? JSON.parse(data) : {
    lastUser: "__none__",
    lastLayout: null,
    lastSession: ""
  };
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// expose globally
window.userStore = {
  getState,
  saveState,
  setActiveUser,
  addUser,
  getActiveUser,
  getAllUsers,
  getMeta,
  saveMeta
};