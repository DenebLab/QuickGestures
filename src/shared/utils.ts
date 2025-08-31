export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const angle = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

export const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

export const snapToDirection = (angle: number, snapAngle: number = 45): string => {
  const normalized = normalizeAngle(angle);
  
  if (normalized >= 315 || normalized < 45) return 'R';
  if (normalized >= 45 && normalized < 135) return 'D';
  if (normalized >= 135 && normalized < 225) return 'L';
  if (normalized >= 225 && normalized < 315) return 'U';
  
  return 'R';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const createSearchUrl = (query: string, template: string): string => {
  return template.replace('%s', encodeURIComponent(query));
};

export const getActiveElement = (): Element | null => {
  let active = document.activeElement;
  
  while (active && active.shadowRoot && active.shadowRoot.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  
  return active;
};

export const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;
  
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  
  return element.hasAttribute('contenteditable') && 
    element.getAttribute('contenteditable') !== 'false';
};

export const convertGestureToArrows = (gesture: string): string => {
  return gesture
    .replace(/L/g, '⬅')
    .replace(/R/g, '➡')
    .replace(/U/g, '⬆')
    .replace(/D/g, '⬇');
};