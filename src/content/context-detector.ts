import { GestureContext, ModifierKey } from '../shared/types';
import { isEditableElement, getActiveElement } from '../shared/utils';

export class ContextDetector {
  detectContext(
    element: Element | null,
    button: number,
    modifierPressed: boolean,
    requiredModifier: ModifierKey,
    preExistingSelection?: string,
    mouseEvent?: MouseEvent
  ): { context: GestureContext | null; linkElement?: HTMLAnchorElement; selectedText?: string } {
    
    if (button === 2) {
      return { context: 'page' };
    }
    
    if (button === 0) {
      if (!this.shouldActivateOnLeftClick(modifierPressed, requiredModifier)) {
        return { context: null };
      }
      
      // Use pre-existing selection if provided, otherwise get current selection
      const selectedText = preExistingSelection || this.getSelectedText();
      if (selectedText && this.isClickDirectlyOnSelectedText(element, selectedText, mouseEvent)) {
        return { 
          context: 'selection', 
          selectedText 
        };
      }
      
      const linkElement = this.findLinkElement(element);
      if (linkElement) {
        // Check if modifier requirement is satisfied
        const shouldActivateLink = requiredModifier === 'none' || modifierPressed;
        
        if (shouldActivateLink) {
          return { 
            context: 'link', 
            linkElement 
          };
        }
      }
      
      return { context: null };
    }
    
    return { context: null };
  }
  
  private shouldActivateOnLeftClick(modifierPressed: boolean, requiredModifier: ModifierKey): boolean {
    if (requiredModifier === 'none') return true;
    
    return modifierPressed;
  }
  
  private findLinkElement(element: Element | null): HTMLAnchorElement | null {
    let current = element;
    let depth = 0;
    const maxDepth = 5;
    
    while (current && depth < maxDepth) {
      if (current.tagName === 'A' && (current as HTMLAnchorElement).href) {
        return current as HTMLAnchorElement;
      }
      current = current.parentElement;
      depth++;
    }
    
    return null;
  }
  
  private getSelectedText(): string {
    const selection = window.getSelection();
    if (!selection) return '';
    
    const text = selection.toString().trim();
    
    if (text.length === 0) return '';
    if (text.length > 500) return text.substring(0, 500);
    
    return text;
  }
  
  shouldPreventDefault(
    context: GestureContext | null,
    element: Element | null,
    distanceMoved: number,
    thresholdPx: number
  ): boolean {
    if (!context) return false;
    
    if (context === 'page') {
      return distanceMoved >= thresholdPx;
    }
    
    if (context === 'link' || context === 'selection') {
      if (distanceMoved < thresholdPx) {
        return false;
      }
      
      const activeElement = getActiveElement();
      if (isEditableElement(activeElement)) {
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  isModifierPressed(event: MouseEvent, requiredModifier: ModifierKey): boolean {
    switch (requiredModifier) {
      case 'alt':
        return event.altKey;
      case 'ctrl':
        return event.ctrlKey;
      case 'shift':
        return event.shiftKey;
      case 'none':
        return false;
      default:
        return false;
    }
  }
  
  shouldIgnoreElement(element: Element | null): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const ignoredTags = ['video', 'audio', 'object', 'embed', 'iframe'];
    
    if (ignoredTags.includes(tagName)) return true;
    
    if (isEditableElement(element)) return true;
    
    if (element.closest('[draggable="true"]')) return true;
    
    return false;
  }
  
  private isClickDirectlyOnSelectedText(element: Element | null, selectedText: string, mouseEvent?: MouseEvent): boolean {
    if (!element || !selectedText) {
      return false;
    }
    
    try {
      // Get the text content of the clicked element and its immediate children
      const elementText = element.textContent || '';
      
      // Check if the clicked element contains the selected text
      if (elementText.includes(selectedText.trim())) {
        // Use mouse coordinates to check if click is actually on the selected text
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && mouseEvent) {
          const range = selection.getRangeAt(0);
          const rangeRect = range.getBoundingClientRect();
          
          const mouseX = mouseEvent.clientX;
          const mouseY = mouseEvent.clientY;
          
          // Check if mouse click is within or very close to the selection bounds
          const isWithinX = mouseX >= (rangeRect.left - 10) && mouseX <= (rangeRect.right + 10);
          const isWithinY = mouseY >= (rangeRect.top - 10) && mouseY <= (rangeRect.bottom + 10);
          
          if (isWithinX && isWithinY) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}