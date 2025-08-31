import { ExtensionSettings, GestureContext } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { sendMessage, onMessage } from '../shared/messaging';
import { GestureCapture } from './gesture-capture';
import { ExclusionMatcher } from './exclusion-matcher';

class ContentScript {
  private gestureCapture: GestureCapture | null = null;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private exclusionMatcher: ExclusionMatcher;
  
  constructor() {
    this.exclusionMatcher = new ExclusionMatcher(DEFAULT_SETTINGS.exclusions);
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      
      // Check if current URL is excluded
      if (this.exclusionMatcher.isExcluded(window.location.href)) {
        console.log('QuickGestures: Site excluded, gestures disabled');
        return;
      }
      
      this.setupGestureCapture();
      this.setupMessageHandlers();
    } catch (error) {
      console.error('ContentScript initialization failed:', error);
    }
  }
  
  private async loadSettings(): Promise<void> {
    try {
      const response = await sendMessage({
        type: 'settings_request',
        payload: {}
      });
      
      if (response?.success && response.data) {
        this.settings = response.data;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  private setupGestureCapture(): void {
    if (this.gestureCapture) {
      this.gestureCapture.destroy();
    }
    
    this.gestureCapture = new GestureCapture(
      this.settings,
      this.handleGestureRecognized.bind(this)
    );
  }
  
  private setupMessageHandlers(): void {
    onMessage(async (message) => {
      switch (message.type) {
        case 'settings_update':
          await this.handleSettingsUpdate(message.payload.settings);
          break;
      }
    });
  }
  
  private async handleGestureRecognized(
    context: string,
    gesture: string,
    linkHref?: string,
    selectedText?: string
  ): Promise<void> {
    try {
      const response = await sendMessage({
        type: 'gesture_recognized',
        payload: {
          context: context as GestureContext,
          gesture,
          tabId: 0,
          linkHref,
          selectedText,
          timestamp: Date.now()
        }
      });
      
      if (!response?.success) {
        console.warn('Gesture execution failed:', response?.error);
      }
    } catch (error) {
      console.error('Failed to send gesture message:', error);
    }
  }
  
  private async handleSettingsUpdate(settings: ExtensionSettings): Promise<void> {
    this.settings = settings;
    this.exclusionMatcher.updatePatterns(settings.exclusions);
    
    // Check if current URL is now excluded
    if (this.exclusionMatcher.isExcluded(window.location.href)) {
      if (this.gestureCapture) {
        this.gestureCapture.destroy();
        this.gestureCapture = null;
      }
      console.log('QuickGestures: Site excluded, gestures disabled');
      return;
    }
    
    if (this.gestureCapture) {
      this.gestureCapture.updateSettings(settings);
    } else {
      this.setupGestureCapture();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentScript());
} else {
  new ContentScript();
}