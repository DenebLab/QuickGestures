export type GestureContext = 'page' | 'link' | 'selection';

export type GestureString = string;

export type ActionType = 
  | 'go_back' | 'go_forward' | 'reload' | 'scroll_top' | 'scroll_bottom'
  | 'new_tab' | 'close_tab' | 'reopen_tab' | 'duplicate_tab' | 'close_tabs_right'
  | 'switch_tab_left' | 'switch_tab_right'
  | 'new_window' | 'close_window' | 'minimize_window'
  | 'open_link_background' | 'open_link_foreground' | 'open_link_window'
  | 'copy_link'
  | 'search_text_new' | 'search_text_current' | 'copy_text'
  | 'no_action';

export interface GestureMapping {
  gesture: GestureString;
  action: ActionType;
}

export interface ContextMappings {
  page: GestureMapping[];
  link: GestureMapping[];
  selection: GestureMapping[];
}

export interface StyleSettings {
  lineColor: string;
  lineWidth: number;
  highContrast: boolean;
  showContextChip: boolean;
  showGestureName: boolean;
}

export interface ActivationSettings {
  pageEnabled: boolean;
  pageThresholdPx: number;
  linkEnabled: boolean;
  linkModifier: ModifierKey;
  selectionEnabled: boolean;
  selectionModifier: ModifierKey;
}

export type ModifierKey = 'none' | 'alt' | 'ctrl' | 'shift';

export interface RecognitionSettings {
  angleSnapDeg: number;
  minSegmentLengthPx: number;
  maxIdleMs: number;
}

export interface SearchSettings {
  provider: 'google' | 'bing' | 'duckduckgo' | 'custom';
  customUrl?: string;
}

export interface ExtensionSettings {
  style: StyleSettings;
  activation: ActivationSettings;
  recognition: RecognitionSettings;
  mappings: ContextMappings;
  search: SearchSettings;
  exclusions: string[];
  globalEnabled: boolean;
  version: number;
}

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureRecognizedMessage {
  type: 'gesture_recognized';
  payload: {
    context: GestureContext;
    gesture: GestureString;
    tabId: number;
    linkHref?: string;
    selectedText?: string;
    timestamp: number;
  };
}

export interface SettingsUpdateMessage {
  type: 'settings_update';
  payload: {
    settings: ExtensionSettings;
  };
}

export interface SettingsRequestMessage {
  type: 'settings_request';
  payload: {};
}

export interface ActionResultMessage {
  type: 'action_result';
  payload: {
    success: boolean;
    action: ActionType;
    error?: string;
  };
}

export type Message = 
  | GestureRecognizedMessage
  | SettingsUpdateMessage  
  | SettingsRequestMessage
  | ActionResultMessage;

export interface GestureState {
  isCapturing: boolean;
  context: GestureContext | null;
  startPoint: Point | null;
  currentPath: Point[];
  linkElement: HTMLAnchorElement | null;
  selectedText: string;
  modifierPressed: boolean;
}