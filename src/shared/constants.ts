import { ExtensionSettings, ContextMappings, ActionType } from './types';

export const DEFAULT_STYLE = {
  lineColor: '#1E90FF',
  lineWidth: 4,
  highContrast: false,
  showContextChip: true,
  showGestureName: false
};

export const DEFAULT_ACTIVATION = {
  pageEnabled: true,
  pageThresholdPx: 16,
  linkEnabled: true,
  linkModifier: 'none' as const,  // No modifier required for link gestures
  selectionEnabled: true,
  selectionModifier: 'none' as const  // No modifier required for selection gestures
};

export const DEFAULT_RECOGNITION = {
  angleSnapDeg: 45,
  minSegmentLengthPx: 20,
  maxIdleMs: 150
};

export const DEFAULT_SEARCH = {
  provider: 'google' as const,
  customUrl: undefined
};

export const DEFAULT_EXCLUSIONS = [
  '*.test.com/*'
];

export const DEFAULT_PAGE_MAPPINGS = [
  { gesture: 'L', action: 'go_back' as ActionType },
  { gesture: 'R', action: 'go_forward' as ActionType },
  { gesture: 'U', action: 'scroll_top' as ActionType },
  { gesture: 'D', action: 'scroll_bottom' as ActionType },
  { gesture: 'LR', action: 'new_tab' as ActionType },
  { gesture: 'RL', action: 'close_tabs_right' as ActionType },
  { gesture: 'DU', action: 'reopen_tab' as ActionType },
  { gesture: 'DR', action: 'close_tab' as ActionType },
  { gesture: 'UL', action: 'switch_tab_left' as ActionType },
  { gesture: 'UR', action: 'switch_tab_right' as ActionType }
];

export const DEFAULT_LINK_MAPPINGS = [
  { gesture: 'R', action: 'open_link_background' as ActionType },
  { gesture: 'L', action: 'open_link_foreground' as ActionType },
  { gesture: 'U', action: 'open_link_window' as ActionType }
];

export const DEFAULT_SELECTION_MAPPINGS = [
  { gesture: 'R', action: 'search_text_new' as ActionType },
  { gesture: 'L', action: 'search_text_current' as ActionType }
];

export const DEFAULT_MAPPINGS: ContextMappings = {
  page: DEFAULT_PAGE_MAPPINGS,
  link: DEFAULT_LINK_MAPPINGS,
  selection: DEFAULT_SELECTION_MAPPINGS
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  style: DEFAULT_STYLE,
  activation: DEFAULT_ACTIVATION,
  recognition: DEFAULT_RECOGNITION,
  mappings: DEFAULT_MAPPINGS,
  search: DEFAULT_SEARCH,
  exclusions: DEFAULT_EXCLUSIONS,
  globalEnabled: true,
  version: 1
};

export const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=%s',
  bing: 'https://www.bing.com/search?q=%s',
  duckduckgo: 'https://duckduckgo.com/?q=%s'
};

export const GESTURE_DIRECTIONS = {
  LEFT: 'L',
  RIGHT: 'R', 
  UP: 'U',
  DOWN: 'D'
} as const;

export const ACTION_LABELS: Record<ActionType, string> = {
  go_back: 'Go Back',
  go_forward: 'Go Forward', 
  reload: 'Reload Page',
  scroll_top: 'Scroll to Top',
  scroll_bottom: 'Scroll to Bottom',
  new_tab: 'New Tab',
  close_tab: 'Close Tab',
  reopen_tab: 'Reopen Tab',
  duplicate_tab: 'Duplicate Tab',
  close_tabs_right: 'Close Tabs to Right',
  switch_tab_left: 'Switch Tab Left',
  switch_tab_right: 'Switch Tab Right',
  new_window: 'New Window',
  close_window: 'Close Window',
  minimize_window: 'Minimize Window',
  open_link_background: 'Open Link in Background Tab',
  open_link_foreground: 'Open Link in Foreground Tab',
  open_link_window: 'Open Link in New Window',
  copy_link: 'Copy Link URL',
  search_text_new: 'Search Text in New Tab',
  search_text_current: 'Search Text in Current Tab',
  copy_text: 'Copy Selected Text',
  no_action: 'No Action'
};

export const STORAGE_KEYS = {
  SETTINGS: 'quickgestures_settings',
  VERSION: 'quickgestures_version'
} as const;

export const MIN_GESTURE_DISTANCE = 10;
export const MAX_GESTURE_SEGMENTS = 8;