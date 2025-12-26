const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const path = require('path');
// In production, .env is in resources/.env (extraResources)
const envPath = app.isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

// Set Production Env for Server to serve static files
process.env.NODE_ENV = 'production';
// Set Production Env for Server to serve static files
process.env.NODE_ENV = 'production';
// process.env.PORT = '3001'; // Default is 3001 (HTTPS) / 3002 (HTTP)
// process.env.CLIENT_URL = 'http://localhost:3002';

// Start the Backend Server (It runs in this same process)
try {
    const { dialog } = require('electron');
    require('./server/index.js');
} catch (err) {
    console.error('Failed to start internal server:', err);
    require('electron').dialog.showErrorBox('Server Error', err.message);
}

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Stream Widget Hub",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'client/public/favicon.ico')
    });

    // DEBUG: Open DevTools to see errors (disabled for production)
    // mainWindow.webContents.openDevTools();

    // Load the Dashboard URL Served by the local server
    // The HTTP port is PORT + 1 usually.
    // If env.PORT is undefined, server uses 3001 -> HTTP 3002
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    const DASHBOARD_URL = `http://localhost:${port + 1}/`;

    // Load URL with retry
    const loadWindow = () => {
        mainWindow.loadURL(DASHBOARD_URL).catch(() => {
            console.log('Waiting for server...');
            setTimeout(loadWindow, 1000);
        });
    };
    loadWindow();

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    // Need a tray icon. For now, skip or use empty? 
    // const iconPath = path.join(__dirname, 'client/public/logo192.png');
    // tray = new Tray(iconPath);
    // const contextMenu = Menu.buildFromTemplate([
    //     { label: 'Open Dashboard', click: () => mainWindow.show() },
    //     { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
    // ]);
    // tray.setToolTip('Stream Widget Hub');
    // tray.setContextMenu(contextMenu);

    // Check if Tray causes issues on Linux without icon
}

app.whenReady().then(() => {
    createWindow();
    // createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
