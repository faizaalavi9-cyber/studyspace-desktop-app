const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 900,
        minHeight: 650,
        title: "StudySpace",
        backgroundColor: "#1d1917",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});