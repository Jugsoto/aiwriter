import { app as n, BrowserWindow as l, ipcMain as o, shell as d } from "electron";
import i from "path";
import { fileURLToPath as s } from "url";
const t = i.dirname(s(import.meta.url));
let e = null;
function a() {
  e = new l({
    width: 1200,
    height: 800,
    frame: !1,
    transparent: !1,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !0,
      preload: i.join(t, "../dist-electron/preload.js")
    },
    icon: i.join(t, "../public/logo.ico")
  }), process.env.NODE_ENV === "development" ? (e.loadURL("http://localhost:5173"), e.webContents.openDevTools()) : e.loadFile(i.join(t, "../dist/index.html")), e.webContents.setWindowOpenHandler(({ url: r }) => (d.openExternal(r), { action: "deny" })), e.on("closed", () => {
    e = null;
  });
}
n.whenReady().then(a);
n.on("window-all-closed", () => {
  process.platform !== "darwin" && n.quit();
});
n.on("activate", () => {
  l.getAllWindows().length === 0 && a();
});
o.handle("get-app-version", () => n.getVersion());
o.handle("window-minimize", () => {
  e?.minimize();
});
o.handle("window-maximize", () => {
  e?.isMaximized() ? e.unmaximize() : e?.maximize();
});
o.handle("window-close", () => {
  e?.close();
});
