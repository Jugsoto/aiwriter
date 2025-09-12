import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
const dbPath = path.join(app.getPath("userData"), "aiwriter.db");
const db = new Database(dbPath);
function initDatabase() {
  try {
    console.log("Initializing database at:", dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const count = db.prepare("SELECT COUNT(*) as count FROM books").get();
    console.log(`Database initialized successfully with ${count.count} existing books`);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
function getAllBooks() {
  const stmt = db.prepare("SELECT * FROM books ORDER BY updated_at DESC");
  return stmt.all();
}
function getBookById(id) {
  const stmt = db.prepare("SELECT * FROM books WHERE id = ?");
  return stmt.get(id);
}
function createBook(data) {
  const stmt = db.prepare(`
    INSERT INTO books (name) VALUES (?)
  `);
  const result = stmt.run(data.name);
  return getBookById(result.lastInsertRowid);
}
function updateBook(id, data) {
  const stmt = db.prepare(`
    UPDATE books SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  stmt.run(data.name, id);
  return getBookById(id);
}
function deleteBook(id) {
  const stmt = db.prepare("DELETE FROM books WHERE id = ?");
  stmt.run(id);
}
function closeDatabase() {
  db.close();
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, "../dist-electron/preload.js")
    },
    icon: path.join(__dirname, "../public/logo.ico")
  });
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.on("closed", () => {
    win = null;
  });
}
app.whenReady().then(() => {
  initDatabase();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
ipcMain.handle("window-minimize", () => {
  win?.minimize();
});
ipcMain.handle("window-maximize", () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.handle("window-close", () => {
  win?.close();
});
ipcMain.handle("get-books", () => {
  return getAllBooks();
});
ipcMain.handle("create-book", (event, data) => {
  return createBook(data);
});
ipcMain.handle("update-book", (event, id, data) => {
  return updateBook(id, data);
});
ipcMain.handle("delete-book", (event, id) => {
  deleteBook(id);
  return { success: true };
});
app.on("before-quit", () => {
  closeDatabase();
});
