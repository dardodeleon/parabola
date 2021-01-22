(App || {}).browser = {
    getTabs: () => chrome.tabs,
    getMenu: () => chrome.contextMenus,
    getStorage: () => chrome.storage.sync
};
