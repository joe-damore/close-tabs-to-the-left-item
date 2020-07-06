// 'Close Tabs to the Left' context menu item unique ID.
const MENU_ITEM_ID = "close_left";

/**
 * Enables or disables the "Close Tabs to the Left" menu item according to selected tab.
 *
 * @param {object} selectedTab - Tab from which context menu was opened.
 */
const updateItemStatus = async function updateItemStatus(selectedTab) {
  // Get all tabs to the left of 'selectedTab' that are not pinned.
  const allOtherTabs = (await browser.tabs.query({currentWindow: true}))
    .filter((tab) => {
      return (tab.id !== selectedTab.id);
    })
    .filter((tab) => {
      return !tab.pinned;
    })
    .filter((tab) => {
      return tab.index < selectedTab.index;
    });

  /*
   * If the length of `allOtherTabs` is greater than 0, then there is at least
   * one other closable tab present, and therefore this menu item should be
   * enabled.
   */
  const enabled = (() => {
    if (allOtherTabs.length > 0) {
      return true;
    }
    return false;
  })();

  // Update context menu.
  browser.contextMenus.update(MENU_ITEM_ID, {
    enabled,
  });

  browser.contextMenus.refresh();
}

/**
 * Closes all tabs in `all` that are to the left of the `selected` tab.
 *
 * @param {Object} selectedTab - Tab from which context menu was opened.
 * @param {Object[]} allTabs - All tabs in current window.
 */
const closeTabs = function closeTabs(selectedTab, allTabs) {
  const removedTabIDs = allTabs
    .filter((tab) => {
      return tab.index < selectedTab.index;
    })
    .filter((tab) => {
      return !tab.pinned;
    })
    .map((tab) => {
      return tab.id;
    });

  browser.tabs.remove(removedTabIDs);
}

const item = browser.contextMenus.create({
  id: MENU_ITEM_ID,
  title: browser.i18n.getMessage("menuItemTitle"),
  contexts: ["tab"],
}, () => {
  if (browser.runtime.lastError) {
    console.error(browser.runtime.lastError);
  }
});

// Recalculate "Close Tabs to the Left" item status when context menu is shown.
browser.contextMenus.onShown.addListener(async (info, tab) => {
  updateItemStatus(tab);
});

/**
 * Calls "closeTabs" if the MENU_ITEM_ID context menu item is clicked.
 *
 * @param {Object} info - Clicked menu item info.
 * @param {Object} tab - Tab that was clicked.
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_ITEM_ID) {
    const allTabs = await browser.tabs.query({currentWindow: true});
    closeTabs(tab, allTabs);
  }
});
