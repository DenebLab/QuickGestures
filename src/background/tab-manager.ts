export class TabManager {
  private async canExecuteScript(tabId: number): Promise<boolean> {
    try {
      const tab = await chrome.tabs.get(tabId);
      return !(!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'));
    } catch {
      return false;
    }
  }

  async goBack(tabId: number): Promise<void> {
    if (!(await this.canExecuteScript(tabId))) {
      throw new Error('Cannot execute script on restricted page');
    }
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.history.back()
    });
  }
  
  async goForward(tabId: number): Promise<void> {
    if (!(await this.canExecuteScript(tabId))) {
      throw new Error('Cannot execute script on restricted page');
    }
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.history.forward()
    });
  }
  
  async reload(tabId: number): Promise<void> {
    await chrome.tabs.reload(tabId);
  }
  
  async scrollToTop(tabId: number): Promise<void> {
    if (!(await this.canExecuteScript(tabId))) {
      throw new Error('Cannot execute script on restricted page');
    }
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    });
  }
  
  async scrollToBottom(tabId: number): Promise<void> {
    if (!(await this.canExecuteScript(tabId))) {
      throw new Error('Cannot execute script on restricted page');
    }
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    });
  }
  
  async createTab(url?: string, active = true): Promise<chrome.tabs.Tab> {
    return await chrome.tabs.create({ url, active });
  }
  
  async closeTab(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
  }
  
  async duplicateTab(tabId: number): Promise<chrome.tabs.Tab> {
    return await chrome.tabs.duplicate(tabId);
  }
  
  async reopenTab(): Promise<chrome.tabs.Tab | null> {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 1 });
    const session = sessions[0];
    
    if (session?.tab) {
      return await chrome.sessions.restore(session.sessionId);
    }
    
    return null;
  }
  
  async closeTabsToRight(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    
    const targetIndex = tab.index;
    const tabsToClose = tabs.filter(t => t.index > targetIndex && t.id !== undefined);
    
    if (tabsToClose.length > 0) {
      const tabIds = tabsToClose.map(t => t.id!);
      await chrome.tabs.remove(tabIds);
    }
  }
  
  async switchToAdjacentTab(tabId: number, direction: 'left' | 'right'): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    
    tabs.sort((a, b) => a.index - b.index);
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'left' 
      ? (currentIndex - 1 + tabs.length) % tabs.length
      : (currentIndex + 1) % tabs.length;
      
    const targetTab = tabs[targetIndex];
    if (targetTab?.id) {
      await chrome.tabs.update(targetTab.id, { active: true });
    }
  }
  
  async createWindow(url?: string): Promise<chrome.windows.Window> {
    return await chrome.windows.create({ url });
  }
  
  async closeWindow(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId) {
      await chrome.windows.remove(tab.windowId);
    }
  }
  
  async minimizeWindow(tabId: number): Promise<void> {
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { state: 'minimized' });
    }
  }
  
  async openUrl(url: string, target: 'background' | 'foreground' | 'window'): Promise<void> {
    switch (target) {
      case 'background':
        await this.createTab(url, false);
        break;
      case 'foreground':
        await this.createTab(url, true);
        break;
      case 'window':
        await this.createWindow(url);
        break;
    }
  }
  
  async copyToClipboard(text: string, tabId: number): Promise<void> {
    if (!(await this.canExecuteScript(tabId))) {
      throw new Error('Cannot execute script on restricted page');
    }
    
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy).catch(console.error);
      },
      args: [text]
    });
  }
}