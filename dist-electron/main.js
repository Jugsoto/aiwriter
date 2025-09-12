import { app as i, BrowserWindow as d, ipcMain as a, shell as m } from "electron";
import r from "path";
import { fileURLToPath as p } from "url";
import T from "better-sqlite3";
const c = r.join(i.getPath("userData"), "aiwriter.db"), n = new T(c);
function b() {
  try {
    console.log("Initializing database at:", c), n.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const e = n.prepare("SELECT COUNT(*) as count FROM books").get();
    console.log(`Database initialized successfully with ${e.count} existing books`);
  } catch (e) {
    throw console.error("Failed to initialize database:", e), e;
  }
}
function h() {
  return n.prepare("SELECT * FROM books ORDER BY updated_at DESC").all();
}
function E(e) {
  return n.prepare("SELECT * FROM books WHERE id = ?").get(e);
}
function w(e) {
  const s = n.prepare(`
    INSERT INTO books (name) VALUES (?)
  `).run(e.name);
  return E(s.lastInsertRowid);
}
function f(e, o) {
  return n.prepare(`
    UPDATE books SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(o.name, e), E(e);
}
function R(e) {
  n.prepare("DELETE FROM books WHERE id = ?").run(e);
}
function g() {
  n.close();
}
const l = r.dirname(p(import.meta.url));
let t = null;
function u() {
  t = new d({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: !1,
    transparent: !1,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      preload: r.join(l, "../dist-electron/preload.js")
    },
    icon: r.join(l, "../public/logo.ico")
  }), process.env.NODE_ENV === "development" ? (t.loadURL("http://localhost:5173"), t.webContents.openDevTools()) : t.loadFile(r.join(l, "../dist/index.html")), t.webContents.setWindowOpenHandler(({ url: e }) => (m.openExternal(e), { action: "deny" })), t.on("closed", () => {
    t = null;
  });
}
i.whenReady().then(() => {
  b(), u();
});
i.on("window-all-closed", () => {
  process.platform !== "darwin" && i.quit();
});
i.on("activate", () => {
  d.getAllWindows().length === 0 && u();
});
a.handle("get-app-version", () => i.getVersion());
a.handle("window-minimize", () => {
  t?.minimize();
});
a.handle("window-maximize", () => {
  t?.isMaximized() ? t.unmaximize() : t?.maximize();
});
a.handle("window-close", () => {
  t?.close();
});
a.handle("get-books", () => h());
a.handle("create-book", (e, o) => w(o));
a.handle("update-book", (e, o, s) => f(o, s));
a.handle("delete-book", (e, o) => (R(o), { success: !0 }));
i.on("before-quit", () => {
  g();
});
