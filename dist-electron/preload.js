const { contextBridge: e, ipcRenderer: i } = require("electron"), n = {
  minimize: () => i.invoke("window-minimize"),
  maximize: () => i.invoke("window-maximize"),
  close: () => i.invoke("window-close")
};
e.exposeInMainWorld("electronAPI", n);
