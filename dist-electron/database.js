import r from "better-sqlite3";
import E from "path";
import { app as i } from "electron";
const n = E.join(i.getPath("userData"), "aiwriter.db"), o = new r(n);
function p() {
  try {
    console.log("Initializing database at:", n), o.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const t = o.prepare("SELECT COUNT(*) as count FROM books").get();
    console.log(`Database initialized successfully with ${t.count} existing books`);
  } catch (t) {
    throw console.error("Failed to initialize database:", t), t;
  }
}
function R() {
  return o.prepare("SELECT * FROM books ORDER BY updated_at DESC").all();
}
function s(t) {
  return o.prepare("SELECT * FROM books WHERE id = ?").get(t);
}
function d(t) {
  const a = o.prepare(`
    INSERT INTO books (name) VALUES (?)
  `).run(t.name);
  return s(a.lastInsertRowid);
}
function m(t, e) {
  return o.prepare(`
    UPDATE books SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(e.name, t), s(t);
}
function l(t) {
  o.prepare("DELETE FROM books WHERE id = ?").run(t);
}
function b() {
  o.close();
}
export {
  b as closeDatabase,
  d as createBook,
  l as deleteBook,
  R as getAllBooks,
  s as getBookById,
  p as initDatabase,
  m as updateBook
};
