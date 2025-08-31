import { Message, GestureRecognizedMessage, SettingsRequestMessage } from '../shared/types';
import { onMessage } from '../shared/messaging';
import { ActionRouter } from './action-router';
import { TabManager } from './tab-manager';
import { StorageManager } from './storage';

class BackgroundService {
  private actionRouter: ActionRouter;
  private storageManager: StorageManager;
  private tabManager: TabManager;
  
  constructor() {
    this.storageManager = new StorageManager();
    this.tabManager = new TabManager();
    this.actionRouter = new ActionRouter(this.tabManager, this.storageManager);
    
    this.initialize();
  }
  
  private initialize(): void {
    this.setupMessageHandlers();
    
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });
    
    chrome.action.onClicked.addListener(() => {
      chrome.runtime.openOptionsPage();
    });
  }
  
  private setupMessageHandlers(): void {
    onMessage(async (message: Message, sender) => {
      switch (message.type) {
        case 'gesture_recognized':
          return await this.handleGestureRecognized(message, sender);
          
        case 'settings_request':
          return await this.handleSettingsRequest(message);
          
        case 'settings_update':
          return await this.handleSettingsUpdate(message.payload.settings);
          
        default:
          console.warn('Unknown message type:', (message as any).type);
      }
    });
  }
  
  private async handleGestureRecognized(
    message: GestureRecognizedMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<any> {
    const { context, gesture, linkHref, selectedText } = message.payload;
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      throw new Error('Invalid tab ID');
    }
    
    return await this.actionRouter.executeAction(
      context,
      gesture,
      tabId,
      linkHref,
      selectedText
    );
  }
  
  private async handleSettingsRequest(message: SettingsRequestMessage): Promise<any> {
    return await this.storageManager.getSettings();
  }
  
  private async handleSettingsUpdate(settings: any): Promise<any> {
    await this.storageManager.setSettings(settings);
    
    // Send settings update to all tabs with content scripts
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'settings_update',
            payload: { settings }
          });
        } catch (error) {
          // Content script not injected in this tab, ignore
        }
      }
    }
    
    return { success: true };
  }
  
  
  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    if (details.reason === 'install') {
      await this.storageManager.getSettings();
      chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      await this.storageManager.getSettings();
    }
  }
}

new BackgroundService();