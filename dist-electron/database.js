import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
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
export {
  closeDatabase,
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  initDatabase,
  updateBook
};
