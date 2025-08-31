import { GestureContext, ActionType, ExtensionSettings } from '../shared/types';
import { SEARCH_ENGINES } from '../shared/constants';
import { createSearchUrl } from '../shared/utils';
import { TabManager } from './tab-manager';
import { StorageManager } from './storage';

export class ActionRouter {
  private tabManager: TabManager;
  private storageManager: StorageManager;
  
  constructor(tabManager: TabManager, storageManager: StorageManager) {
    this.tabManager = tabManager;
    this.storageManager = storageManager;
  }
  
  async executeAction(
    context: GestureContext,
    gesture: string,
    tabId: number,
    linkHref?: string,
    selectedText?: string
  ): Promise<{ success: boolean; action?: ActionType; error?: string }> {
    try {
      const settings = await this.storageManager.getSettings();
      
      if (!settings.globalEnabled) {
        return { success: false, error: 'Extension disabled' };
      }
      
      const mapping = settings.mappings[context]?.find(m => m.gesture === gesture);
      if (!mapping) {
        return { success: false, error: `No mapping found for gesture "${gesture}" in ${context} context` };
      }
      
      const action = mapping.action;
      await this.performAction(action, tabId, linkHref, selectedText, settings);
      
      return { success: true, action };
    } catch (error) {
      console.error('Action execution failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  private async performAction(
    action: ActionType,
    tabId: number,
    linkHref?: string,
    selectedText?: string,
    settings?: ExtensionSettings
  ): Promise<void> {
    switch (action) {
      case 'go_back':
        await this.tabManager.goBack(tabId);
        break;
        
      case 'go_forward':
        await this.tabManager.goForward(tabId);
        break;
        
      case 'reload':
        await this.tabManager.reload(tabId);
        break;
        
      case 'scroll_top':
        await this.tabManager.scrollToTop(tabId);
        break;
        
      case 'scroll_bottom':
        await this.tabManager.scrollToBottom(tabId);
        break;
        
      case 'new_tab':
        await this.tabManager.createTab();
        break;
        
      case 'close_tab':
        await this.tabManager.closeTab(tabId);
        break;
        
      case 'reopen_tab':
        await this.tabManager.reopenTab();
        break;
        
      case 'duplicate_tab':
        await this.tabManager.duplicateTab(tabId);
        break;
        
      case 'close_tabs_right':
        await this.tabManager.closeTabsToRight(tabId);
        break;
        
      case 'switch_tab_left':
        await this.tabManager.switchToAdjacentTab(tabId, 'left');
        break;
        
      case 'switch_tab_right':
        await this.tabManager.switchToAdjacentTab(tabId, 'right');
        break;
        
      case 'new_window':
        await this.tabManager.createWindow();
        break;
        
      case 'close_window':
        await this.tabManager.closeWindow(tabId);
        break;
        
      case 'minimize_window':
        await this.tabManager.minimizeWindow(tabId);
        break;
        
      case 'open_link_background':
        if (!linkHref) throw new Error('Link URL required');
        await this.tabManager.openUrl(linkHref, 'background');
        break;
        
      case 'open_link_foreground':
        if (!linkHref) throw new Error('Link URL required');
        await this.tabManager.openUrl(linkHref, 'foreground');
        break;
        
      case 'open_link_window':
        if (!linkHref) throw new Error('Link URL required');
        await this.tabManager.openUrl(linkHref, 'window');
        break;
        
      case 'copy_link':
        if (!linkHref) throw new Error('Link URL required');
        await this.tabManager.copyToClipboard(linkHref, tabId);
        break;
        
      case 'search_text_new':
        if (!selectedText) throw new Error('Selected text required');
        await this.searchText(selectedText, 'background', settings);
        break;
        
      case 'search_text_current':
        if (!selectedText) throw new Error('Selected text required');
        await this.searchText(selectedText, 'foreground', settings);
        break;
        
      case 'copy_text':
        if (!selectedText) throw new Error('Selected text required');
        await this.tabManager.copyToClipboard(selectedText, tabId);
        break;
        
      case 'no_action':
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async searchText(
    text: string,
    target: 'background' | 'foreground',
    settings?: ExtensionSettings
  ): Promise<void> {
    if (!settings) {
      settings = await this.storageManager.getSettings();
    }
    
    let searchUrl: string;
    
    if (settings.search.provider === 'custom' && settings.search.customUrl) {
      searchUrl = createSearchUrl(text, settings.search.customUrl);
    } else {
      const template = SEARCH_ENGINES[settings.search.provider];
      searchUrl = createSearchUrl(text, template);
    }
    
    await this.tabManager.openUrl(searchUrl, target);
  }
}