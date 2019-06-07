const {app, BrowserWindow} = require('electron')

createWindow = () => {
    let win = new BrowserWindow({
        width: 600,
        height: 800,
        minHeight: 800,
        minWidth: 600,
        webPreferences:{
            nodeIntegration: true
        },
        icon: "app/img/icon.png"
    })

    win.loadFile("app/index.html");

    // Debug //
    //win.webContents.openDevTools();
    win.setMenuBarVisibility(false);

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // On macOS it's common for applications and their menu bar to stay active until the user quits explicitly. //
    if (process.platform !== 'darwin'){
        app.quit();
    }
})

app.on('activate', () => {

    // On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open. //
    if (win === null){
        createWindow();
    }
})