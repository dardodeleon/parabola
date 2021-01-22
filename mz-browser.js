(App || {}).browser = {
    getTabs: () => browser.tabs,
    getMenu: () => browser.menus,
    getStorage: () => browser.storage.local
};
