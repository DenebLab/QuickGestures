import { ExtensionSettings } from '../shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../shared/constants';

export class StorageManager {
  async getSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
      const stored = result[STORAGE_KEYS.SETTINGS];
      
      if (!stored) {
        await this.setSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      
      return this.migrateSettings(stored);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  async setSettings(settings: ExtensionSettings): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
  
  async updateSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...partial };
    await this.setSettings(updated);
    return updated;
  }
  
  private migrateSettings(settings: any): ExtensionSettings {
    if (settings.version === DEFAULT_SETTINGS.version) {
      return settings as ExtensionSettings;
    }
    
    const migrated: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      version: DEFAULT_SETTINGS.version
    };
    
    this.setSettings(migrated).catch(console.error);
    return migrated;
  }
  
  async resetToDefaults(): Promise<ExtensionSettings> {
    await this.setSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}