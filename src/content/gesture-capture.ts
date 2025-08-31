import { Point, GestureState, ExtensionSettings, ActionType } from '../shared/types';
import { distance, convertGestureToArrows } from '../shared/utils';
import { ACTION_LABELS } from '../shared/constants';
import { ContextDetector } from './context-detector';
import { GestureOverlay } from './overlay';
import { GestureRecognizer } from './gesture-recognition';
import { DragTextEffect } from './drag-text-effect';
import { GestureNameDisplay } from './gesture-name-display';

export class GestureCapture {
  private state: GestureState;
  private settings: ExtensionSettings;
  private contextDetector: ContextDetector;
  private overlay: GestureOverlay;
  private recognizer: GestureRecognizer;
  private originalCursor: string = '';
  private overlayStarted: boolean = false;
  private recentSuccessfulGesture: boolean = false;
  private gestureCompletedTimestamp: number = 0;
  private dragTextEffect: DragTextEffect;
  private gestureNameDisplay: GestureNameDisplay;
  private lastRecognitionTime: number = 0;
  private onGestureRecognized: (
    context: string,
    gesture: string,
    linkHref?: string,
    selectedText?: string
  ) => void;
  
  constructor(
    settings: ExtensionSettings,
    onGestureRecognized: (
      context: string,
      gesture: string,
      linkHref?: string,
      selectedText?: string
    ) => void
  ) {
    this.settings = settings;
    this.onGestureRecognized = onGestureRecognized;
    this.contextDetector = new ContextDetector();
    this.overlay = new GestureOverlay(settings.style);
    this.recognizer = new GestureRecognizer(settings.recognition);
    this.dragTextEffect = new DragTextEffect();
    this.gestureNameDisplay = new GestureNameDisplay();
    
    this.state = {
      isCapturing: false,
      context: null,
      startPoint: null,
      currentPath: [],
      linkElement: null,
      selectedText: '',
      modifierPressed: false
    };
    
    this.overlayStarted = false;
    this.recentSuccessfulGesture = false;
    this.gestureCompletedTimestamp = 0;
    this.setupEventListeners();
  }
  
  updateSettings(settings: ExtensionSettings): void {
    this.settings = settings;
    this.overlay.updateSettings(settings.style);
    this.recognizer.updateSettings(settings.recognition);
  }
  
  private setupEventListeners(): void {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), true);
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this), true);
    document.addEventListener('dragstart', this.handleDragStart.bind(this), true);
  }
  
  private handleMouseDown(event: MouseEvent): void {
    if (!this.settings.globalEnabled) return;
    
    const element = event.target as Element;
    if (this.contextDetector.shouldIgnoreElement(element)) return;
    
    const button = event.button;
    if (button !== 0 && button !== 2) return;
    
    
    // Capture selection BEFORE any other processing to prevent race condition
    const preExistingSelection = this.getSelectedText();
    
    let requiredModifier = 'none';
    if (button === 0) {
      // Check for pre-existing selection first
      if (preExistingSelection) {
        if (!this.settings.activation.selectionEnabled) return;
        requiredModifier = this.settings.activation.selectionModifier;
      } else {
        if (!this.settings.activation.linkEnabled) return;
        requiredModifier = this.settings.activation.linkModifier;
      }
    } else if (button === 2) {
      if (!this.settings.activation.pageEnabled) return;
    }
    
    const modifierPressed = this.contextDetector.isModifierPressed(event, requiredModifier as any);
    
    // Pass pre-existing selection to context detector to avoid race condition
    const detection = this.contextDetector.detectContext(
      element, 
      button, 
      modifierPressed, 
      requiredModifier as any,
      preExistingSelection,  // Pass captured selection
      event  // Pass mouse event for coordinate validation
    );
    
    if (!detection.context) return;
    
    // For selection context, prevent default immediately to avoid unwanted behavior
    if (detection.context === 'selection') {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Clear any recent gesture completion flag when starting new gesture
    this.recentSuccessfulGesture = false;
    
    this.state.isCapturing = true;
    this.state.context = detection.context;
    this.state.linkElement = detection.linkElement || null;
    this.state.selectedText = detection.selectedText || preExistingSelection || '';
    this.state.modifierPressed = modifierPressed;
    this.state.startPoint = this.createPoint(event);
    this.state.currentPath = [this.state.startPoint];
    
    // For selection and link contexts, delay showing overlay until drag threshold is reached
    if (detection.context !== 'selection' && detection.context !== 'link') {
      this.overlay.startPath(this.state.startPoint);
      
      if (this.settings.style.showContextChip) {
        this.overlay.showContextChip(detection.context, this.state.startPoint);
      }
    }
    
    // Change cursor based on context
    this.setGestureCursor(detection.context);
    
    // Start drag text effect for selection context (link context will start after threshold)
    if (detection.context === 'selection' && this.state.selectedText) {
      this.dragTextEffect.startDrag(this.state.selectedText, event.clientX, event.clientY);
    }
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.state.isCapturing || !this.state.startPoint) return;
    
    const currentPoint = this.createPoint(event);
    const distanceMoved = distance(this.state.startPoint, currentPoint);
    
    // For selection and link contexts, start overlay only after threshold is reached
    if (this.state.context === 'selection') {
      event.preventDefault();
      event.stopPropagation();
      
      if (!this.overlayStarted && distanceMoved >= 16) {
        this.overlay.startPath(this.state.startPoint);
        if (this.settings.style.showContextChip) {
          this.overlay.showContextChip(this.state.context, this.state.startPoint);
        }
        this.overlayStarted = true;
      }
    } else if (this.state.context === 'link') {
      // Only prevent default after threshold is reached to allow normal link clicks
      if (distanceMoved >= 16) {
        event.preventDefault();
        event.stopPropagation();
        
        if (!this.overlayStarted) {
          this.overlay.startPath(this.state.startPoint);
          if (this.settings.style.showContextChip) {
            this.overlay.showContextChip(this.state.context, this.state.startPoint);
          }
          // Start drag text effect for link context after threshold
          if (this.state.linkElement) {
            const linkText = this.state.linkElement.textContent || this.state.linkElement.href;
            this.dragTextEffect.startDrag(linkText, event.clientX, event.clientY);
          }
          this.overlayStarted = true;
        }
      }
    } else if (this.contextDetector.shouldPreventDefault(
      this.state.context,
      event.target as Element,
      distanceMoved,
      this.getThreshold()
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.state.currentPath.push(currentPoint);
    
    // Only add point to overlay if it has been started
    if (this.overlayStarted || (this.state.context !== 'selection' && this.state.context !== 'link')) {
      this.overlay.addPoint(currentPoint);
    }
    
    // Update drag text effect position for selection and link contexts (only if active)
    if ((this.state.context === 'selection' || (this.state.context === 'link' && this.overlayStarted))) {
      this.dragTextEffect.updatePosition(event.clientX, event.clientY);
    }
    
    // Show gesture name during drawing if enabled and sufficient path length
    if (this.settings.style.showGestureName && this.state.currentPath.length >= 3) {
      const now = Date.now();
      // Throttle recognition to every 100ms to avoid performance issues
      if (now - this.lastRecognitionTime >= 100) {
        const gesture = this.recognizer.recognizeGesture(this.state.currentPath);
        if (gesture && this.state.context) {
          // Find the action name for this gesture in current context
          const mapping = this.settings.mappings[this.state.context].find(m => m.gesture === gesture);
          const actionName = mapping ? this.getActionName(mapping.action) : convertGestureToArrows(gesture);
          this.gestureNameDisplay.show(actionName, window.innerWidth / 2, window.innerHeight / 2);
        }
        this.lastRecognitionTime = now;
      }
    }
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (!this.state.isCapturing) return;
    
    // Prevent default on mouseup for link context only if overlay was started (threshold reached)
    if (this.state.context === 'link' && this.overlayStarted) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const gesture = this.recognizer.recognizeGesture(this.state.currentPath);
    
    if (gesture && this.recognizer.isValidGesture(gesture)) {
      const linkHref = this.state.linkElement?.href;
      const selectedText = this.state.selectedText;
      
      this.onGestureRecognized(
        this.state.context!,
        gesture,
        linkHref,
        selectedText
      );
      
      // Track successful gesture to prevent context menu
      this.recentSuccessfulGesture = true;
      this.gestureCompletedTimestamp = Date.now();
    }
    
    this.resetState();
  }
  
  private handleContextMenu(event: MouseEvent): void {
    // Check if recent successful gesture occurred (within 100ms)
    if (this.recentSuccessfulGesture && (Date.now() - this.gestureCompletedTimestamp) < 100) {
      event.preventDefault();
      event.stopPropagation();
      this.recentSuccessfulGesture = false; // Clear flag after use
      return;
    }
    
    if (!this.state.isCapturing) return;
    
    if (this.state.context === 'page') {
      const distanceMoved = this.state.startPoint 
        ? distance(this.state.startPoint, this.createPoint(event))
        : 0;
        
      if (distanceMoved >= this.settings.activation.pageThresholdPx) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
  
  private handleDragStart(event: DragEvent): void {
    if (this.state.isCapturing) {
      event.preventDefault();
    }
  }
  
  private handleClick(event: MouseEvent): void {
    // Prevent click events shortly after gesture completion to avoid unwanted navigation
    if (this.recentSuccessfulGesture && (Date.now() - this.gestureCompletedTimestamp) < 100) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }
  
  private createPoint(event: MouseEvent): Point {
    return {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
  }
  
  private getThreshold(): number {
    if (this.state.context === 'page') {
      return this.settings.activation.pageThresholdPx;
    }
    return 16;
  }
  
  private getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }
  
  private resetState(): void {
    this.state = {
      isCapturing: false,
      context: null,
      startPoint: null,
      currentPath: [],
      linkElement: null,
      selectedText: '',
      modifierPressed: false
    };
    
    this.overlayStarted = false;
    this.overlay.endPath();
    this.restoreOriginalCursor();
    this.dragTextEffect.endDrag();
    this.gestureNameDisplay.hide();
  }
  
  private setGestureCursor(context: string): void {
    // Store original cursor
    this.originalCursor = document.body.style.cursor;
    
    // Set context-specific cursor
    const cursor = this.getGestureCursorForContext(context);
    document.body.style.cursor = cursor;
    document.body.style.setProperty('cursor', cursor, 'important');
  }
  
  private getGestureCursorForContext(context: string): string {
    switch (context) {
      case 'page':
        return 'grabbing';
      case 'link':
        return 'grabbing';
      case 'selection':
        return 'grabbing';
      default:
        return 'grabbing';
    }
  }
  
  private restoreOriginalCursor(): void {
    if (this.originalCursor !== undefined) {
      document.body.style.cursor = this.originalCursor;
    } else {
      document.body.style.removeProperty('cursor');
    }
    this.originalCursor = '';
  }
  
  private clearTextSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }
  
  private getActionName(action: ActionType): string {
    return ACTION_LABELS[action] || action;
  }
  
  destroy(): void {
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this), true);
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this), true);
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this), true);
    document.removeEventListener('click', this.handleClick.bind(this), true);
    document.removeEventListener('contextmenu', this.handleContextMenu.bind(this), true);
    document.removeEventListener('dragstart', this.handleDragStart.bind(this), true);
    
    this.overlay.hide();
    this.restoreOriginalCursor();
    this.dragTextEffect.destroy();
    this.gestureNameDisplay.destroy();
  }
}