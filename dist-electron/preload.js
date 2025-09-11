const { contextBridge: n, ipcRenderer: e } = require("electron"), k = {
  // 窗口控制
  minimize: () => e.invoke("window-minimize"),
  maximize: () => e.invoke("window-maximize"),
  close: () => e.invoke("window-close"),
  // 书籍相关API
  getBooks: () => e.invoke("get-books"),
  createBook: (o) => e.invoke("create-book", o),
  updateBook: (o, i) => e.invoke("update-book", o, i),
  deleteBook: (o) => e.invoke("delete-book", o)
};
n.exposeInMainWorld("electronAPI", k);
