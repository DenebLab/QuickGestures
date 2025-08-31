import { ExtensionSettings, GestureContext, ActionType, GestureMapping } from '../shared/types';
import { DEFAULT_SETTINGS, ACTION_LABELS } from '../shared/constants';
import { sendMessage } from '../shared/messaging';
import { convertGestureToArrows } from '../shared/utils';

class OptionsPage {
  private settings: ExtensionSettings = DEFAULT_SETTINGS;
  private currentContext: GestureContext = 'page';
  
  constructor() {
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    this.renderUI();
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
  
  private async saveSettings(): Promise<void> {
    try {
      await sendMessage({
        type: 'settings_update',
        payload: { settings: this.settings }
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  private setupEventListeners(): void {
    this.setupNavigationHandlers();
    this.setupSettingsHandlers();
    this.setupMappingHandlers();
    this.setupUtilityHandlers();
    this.setupModalHandlers();
  }
  
  private setupNavigationHandlers(): void {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const section = target.dataset.section;
        if (section) {
          this.switchSection(section);
        }
      });
    });
    
    document.querySelectorAll('.context-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const context = target.dataset.context as GestureContext;
        if (context) {
          this.switchContext(context);
        }
      });
    });
  }
  
  private setupSettingsHandlers(): void {
    this.setupExclusionHandlers();
    
    const globalEnabled = document.getElementById('globalEnabled') as HTMLInputElement;
    globalEnabled.addEventListener('change', async () => {
      this.settings.globalEnabled = globalEnabled.checked;
      await this.saveSettings();
    });
    
    const lineColor = document.getElementById('lineColor') as HTMLInputElement;
    lineColor.addEventListener('change', async () => {
      this.settings.style.lineColor = lineColor.value;
      await this.saveSettings();
    });
    
    const lineWidth = document.getElementById('lineWidth') as HTMLInputElement;
    const lineWidthValue = document.getElementById('lineWidthValue') as HTMLSpanElement;
    lineWidth.addEventListener('input', () => {
      lineWidthValue.textContent = lineWidth.value + 'px';
    });
    lineWidth.addEventListener('change', async () => {
      this.settings.style.lineWidth = parseInt(lineWidth.value);
      await this.saveSettings();
    });
    
    const highContrast = document.getElementById('highContrast') as HTMLInputElement;
    highContrast.addEventListener('change', async () => {
      this.settings.style.highContrast = highContrast.checked;
      await this.saveSettings();
    });
    
    const showContextChip = document.getElementById('showContextChip') as HTMLInputElement;
    showContextChip.addEventListener('change', async () => {
      this.settings.style.showContextChip = showContextChip.checked;
      await this.saveSettings();
    });
    
    const showGestureName = document.getElementById('showGestureName') as HTMLInputElement;
    showGestureName.addEventListener('change', async () => {
      this.settings.style.showGestureName = showGestureName.checked;
      await this.saveSettings();
    });
    
    const pageEnabled = document.getElementById('pageEnabled') as HTMLInputElement;
    pageEnabled.addEventListener('change', async () => {
      this.settings.activation.pageEnabled = pageEnabled.checked;
      await this.saveSettings();
    });
    
    const pageThreshold = document.getElementById('pageThreshold') as HTMLInputElement;
    const pageThresholdValue = document.getElementById('pageThresholdValue') as HTMLSpanElement;
    pageThreshold.addEventListener('input', () => {
      pageThresholdValue.textContent = pageThreshold.value + 'px';
    });
    pageThreshold.addEventListener('change', async () => {
      this.settings.activation.pageThresholdPx = parseInt(pageThreshold.value);
      await this.saveSettings();
    });
    
    const linkEnabled = document.getElementById('linkEnabled') as HTMLInputElement;
    linkEnabled.addEventListener('change', async () => {
      this.settings.activation.linkEnabled = linkEnabled.checked;
      await this.saveSettings();
    });
    
    const linkModifier = document.getElementById('linkModifier') as HTMLSelectElement;
    linkModifier.addEventListener('change', async () => {
      this.settings.activation.linkModifier = linkModifier.value as any;
      await this.saveSettings();
    });
    
    const selectionEnabled = document.getElementById('selectionEnabled') as HTMLInputElement;
    selectionEnabled.addEventListener('change', async () => {
      this.settings.activation.selectionEnabled = selectionEnabled.checked;
      await this.saveSettings();
    });
    
    const selectionModifier = document.getElementById('selectionModifier') as HTMLSelectElement;
    selectionModifier.addEventListener('change', async () => {
      this.settings.activation.selectionModifier = selectionModifier.value as any;
      await this.saveSettings();
    });
    
    const searchProvider = document.getElementById('searchProvider') as HTMLSelectElement;
    searchProvider.addEventListener('change', async () => {
      this.settings.search.provider = searchProvider.value as any;
      this.toggleCustomUrlGroup();
      await this.saveSettings();
    });
    
    const customSearchUrl = document.getElementById('customSearchUrl') as HTMLInputElement;
    customSearchUrl.addEventListener('change', async () => {
      this.settings.search.customUrl = customSearchUrl.value;
      await this.saveSettings();
    });
  }
  
  private setupMappingHandlers(): void {
    const addMappingBtn = document.getElementById('add-mapping-btn');
    addMappingBtn?.addEventListener('click', () => {
      this.showAddMappingModal();
    });
  }
  
  private setupUtilityHandlers(): void {
    const resetBtn = document.getElementById('reset-settings');
    resetBtn?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        this.settings = { ...DEFAULT_SETTINGS };
        await this.saveSettings();
        this.renderUI();
      }
    });
    
    const exportBtn = document.getElementById('export-settings');
    exportBtn?.addEventListener('click', () => {
      this.exportSettings();
    });
    
    const importBtn = document.getElementById('import-settings');
    const importFile = document.getElementById('import-file') as HTMLInputElement;
    
    importBtn?.addEventListener('click', () => {
      importFile.click();
    });
    
    importFile.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.importSettings(file);
      }
    });
  }
  
  private setupModalHandlers(): void {
    const modal = document.getElementById('add-mapping-modal');
    const closeBtn = modal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-mapping');
    const saveBtn = document.getElementById('save-mapping');
    
    closeBtn?.addEventListener('click', () => {
      this.hideAddMappingModal();
    });
    
    cancelBtn?.addEventListener('click', () => {
      this.hideAddMappingModal();
    });
    
    saveBtn?.addEventListener('click', () => {
      this.saveNewMapping();
    });
    
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideAddMappingModal();
      }
    });
  }
  
  private renderUI(): void {
    this.renderGlobalSettings();
    this.renderStyleSettings();
    this.renderContextSettings();
    this.renderSearchSettings();
    this.renderExclusions();
    this.renderMappings();
    this.populateActionOptions();
  }
  
  private renderGlobalSettings(): void {
    const globalEnabled = document.getElementById('globalEnabled') as HTMLInputElement;
    globalEnabled.checked = this.settings.globalEnabled;
  }
  
  private renderStyleSettings(): void {
    const lineColor = document.getElementById('lineColor') as HTMLInputElement;
    lineColor.value = this.settings.style.lineColor;
    
    const lineWidth = document.getElementById('lineWidth') as HTMLInputElement;
    const lineWidthValue = document.getElementById('lineWidthValue') as HTMLSpanElement;
    lineWidth.value = this.settings.style.lineWidth.toString();
    lineWidthValue.textContent = this.settings.style.lineWidth + 'px';
    
    const highContrast = document.getElementById('highContrast') as HTMLInputElement;
    highContrast.checked = this.settings.style.highContrast;
    
    const showContextChip = document.getElementById('showContextChip') as HTMLInputElement;
    showContextChip.checked = this.settings.style.showContextChip;
    
    const showGestureName = document.getElementById('showGestureName') as HTMLInputElement;
    showGestureName.checked = this.settings.style.showGestureName;
  }
  
  private renderContextSettings(): void {
    const pageEnabled = document.getElementById('pageEnabled') as HTMLInputElement;
    pageEnabled.checked = this.settings.activation.pageEnabled;
    
    const pageThreshold = document.getElementById('pageThreshold') as HTMLInputElement;
    const pageThresholdValue = document.getElementById('pageThresholdValue') as HTMLSpanElement;
    pageThreshold.value = this.settings.activation.pageThresholdPx.toString();
    pageThresholdValue.textContent = this.settings.activation.pageThresholdPx + 'px';
    
    const linkEnabled = document.getElementById('linkEnabled') as HTMLInputElement;
    linkEnabled.checked = this.settings.activation.linkEnabled;
    
    const linkModifier = document.getElementById('linkModifier') as HTMLSelectElement;
    linkModifier.value = this.settings.activation.linkModifier;
    
    const selectionEnabled = document.getElementById('selectionEnabled') as HTMLInputElement;
    selectionEnabled.checked = this.settings.activation.selectionEnabled;
    
    const selectionModifier = document.getElementById('selectionModifier') as HTMLSelectElement;
    selectionModifier.value = this.settings.activation.selectionModifier;
  }
  
  private renderSearchSettings(): void {
    const searchProvider = document.getElementById('searchProvider') as HTMLSelectElement;
    searchProvider.value = this.settings.search.provider;
    
    const customSearchUrl = document.getElementById('customSearchUrl') as HTMLInputElement;
    customSearchUrl.value = this.settings.search.customUrl || '';
    
    this.toggleCustomUrlGroup();
  }
  
  private renderMappings(): void {
    const container = document.getElementById('mappings-container');
    if (!container) return;
    
    const mappings = this.settings.mappings[this.currentContext];
    
    const table = document.createElement('table');
    table.className = 'mappings-table';
    
    table.innerHTML = `
      <thead>
        <tr>
          <th>Gesture</th>
          <th>Action</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        ${mappings.map((mapping, index) => `
          <tr>
            <td class="gesture-cell">${convertGestureToArrows(mapping.gesture)}</td>
            <td>${ACTION_LABELS[mapping.action]}</td>
            <td>
              <button class="delete-btn" data-index="${index}">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
    
    table.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index!);
        this.deleteMapping(index);
      });
    });
  }
  
  private populateActionOptions(): void {
    const actionSelect = document.getElementById('new-action') as HTMLSelectElement;
    if (!actionSelect) return;
    
    actionSelect.innerHTML = '';
    
    Object.entries(ACTION_LABELS).forEach(([action, label]) => {
      const option = document.createElement('option');
      option.value = action;
      option.textContent = label;
      actionSelect.appendChild(option);
    });
  }
  
  private switchSection(section: string): void {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.remove('active');
    });
    
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    document.getElementById(`${section}-section`)?.classList.add('active');
  }
  
  private switchContext(context: GestureContext): void {
    this.currentContext = context;
    
    document.querySelectorAll('.context-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-context="${context}"]`)?.classList.add('active');
    
    this.renderMappings();
  }
  
  private toggleCustomUrlGroup(): void {
    const customUrlGroup = document.getElementById('customUrlGroup');
    const searchProvider = document.getElementById('searchProvider') as HTMLSelectElement;
    
    if (searchProvider.value === 'custom') {
      customUrlGroup?.classList.add('show');
    } else {
      customUrlGroup?.classList.remove('show');
    }
  }
  
  private showAddMappingModal(): void {
    const modal = document.getElementById('add-mapping-modal');
    modal!.style.display = 'block';
  }
  
  private hideAddMappingModal(): void {
    const modal = document.getElementById('add-mapping-modal');
    modal!.style.display = 'none';
    
    const gestureInput = document.getElementById('new-gesture') as HTMLInputElement;
    const actionSelect = document.getElementById('new-action') as HTMLSelectElement;
    gestureInput.value = '';
    actionSelect.selectedIndex = 0;
  }
  
  private async saveNewMapping(): Promise<void> {
    const gestureInput = document.getElementById('new-gesture') as HTMLInputElement;
    const actionSelect = document.getElementById('new-action') as HTMLSelectElement;
    
    const gesture = gestureInput.value.trim().toUpperCase();
    const action = actionSelect.value as ActionType;
    
    if (!gesture || !action) {
      alert('Please enter a gesture and select an action.');
      return;
    }
    
    if (!/^[LRUD]+$/.test(gesture)) {
      alert('Gesture must only contain L, R, U, D characters.');
      return;
    }
    
    if (this.settings.mappings[this.currentContext].some(m => m.gesture === gesture)) {
      alert('This gesture is already mapped. Please delete the existing mapping first.');
      return;
    }
    
    const newMapping: GestureMapping = { gesture, action };
    this.settings.mappings[this.currentContext].push(newMapping);
    
    await this.saveSettings();
    this.renderMappings();
    this.hideAddMappingModal();
  }
  
  private async deleteMapping(index: number): Promise<void> {
    if (confirm('Are you sure you want to delete this mapping?')) {
      this.settings.mappings[this.currentContext].splice(index, 1);
      await this.saveSettings();
      this.renderMappings();
    }
  }
  
  private exportSettings(): void {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'quickgestures-settings.json';
    link.click();
  }
  
  private async importSettings(file: File): Promise<void> {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      
      if (this.validateSettings(imported)) {
        this.settings = imported;
        await this.saveSettings();
        this.renderUI();
        alert('Settings imported successfully!');
      } else {
        alert('Invalid settings file format.');
      }
    } catch (error) {
      alert('Failed to import settings. Please check the file format.');
    }
  }
  
  private validateSettings(settings: any): settings is ExtensionSettings {
    return settings && 
           typeof settings.globalEnabled === 'boolean' &&
           settings.style &&
           settings.activation &&
           settings.mappings &&
           settings.search;
  }
  
  private setupExclusionHandlers(): void {
    const addButton = document.getElementById('addExclusion');
    const input = document.getElementById('exclusionPattern') as HTMLInputElement;
    
    addButton?.addEventListener('click', () => {
      this.addExclusion();
    });
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addExclusion();
      }
    });
  }
  
  private renderExclusions(): void {
    const list = document.getElementById('exclusionsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    this.settings.exclusions.forEach((pattern, index) => {
      const item = document.createElement('li');
      item.className = 'exclusion-item';
      item.innerHTML = `
        <span class="exclusion-pattern">${pattern}</span>
        <button class="exclusion-remove" data-index="${index}">Remove</button>
      `;
      list.appendChild(item);
    });
    
    // Add event listeners to remove buttons
    list.querySelectorAll('.exclusion-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).dataset.index!);
        this.removeExclusion(index);
      });
    });
  }
  
  private async addExclusion(): Promise<void> {
    const input = document.getElementById('exclusionPattern') as HTMLInputElement;
    const pattern = input.value.trim();
    
    if (!pattern) {
      alert('Please enter an exclusion pattern.');
      return;
    }
    
    if (this.settings.exclusions.includes(pattern)) {
      alert('This exclusion pattern already exists.');
      return;
    }
    
    this.settings.exclusions.push(pattern);
    input.value = '';
    
    await this.saveSettings();
    this.renderExclusions();
  }
  
  private async removeExclusion(index: number): Promise<void> {
    if (confirm('Are you sure you want to remove this exclusion?')) {
      this.settings.exclusions.splice(index, 1);
      await this.saveSettings();
      this.renderExclusions();
    }
  }
  
}

new OptionsPage();