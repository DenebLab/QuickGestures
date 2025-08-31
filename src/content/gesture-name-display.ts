export class GestureNameDisplay {
  private displayElement: HTMLElement | null = null;
  private currentGesture: string = '';
  private isVisible: boolean = false;

  constructor() {
    this.createDisplayElement();
  }

  private createDisplayElement(): void {
    this.displayElement = document.createElement('div');
    this.displayElement.className = 'quick-gestures-gesture-name';
    this.displayElement.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      z-index: 999998;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 24px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.15s ease;
      min-width: 30px;
      text-align: center;
      letter-spacing: 1px;
    `;
    
    document.body.appendChild(this.displayElement);
  }

  show(gesture: string, centerX: number, centerY: number): void {
    if (!this.displayElement) return;
    
    // Only update if gesture changed to reduce DOM operations
    if (this.currentGesture !== gesture) {
      this.currentGesture = gesture;
      this.displayElement.textContent = gesture || '?';
    }
    
    // Center the display on screen
    const rect = this.displayElement.getBoundingClientRect();
    const x = centerX - (rect.width / 2);
    const y = centerY - (rect.height / 2);
    
    this.displayElement.style.left = `${x}px`;
    this.displayElement.style.top = `${y}px`;
    
    // Show if not visible
    if (!this.isVisible) {
      this.displayElement.style.opacity = '1';
      this.isVisible = true;
    }
  }

  hide(): void {
    if (!this.displayElement || !this.isVisible) return;
    
    this.isVisible = false;
    this.currentGesture = '';
    this.displayElement.style.opacity = '0';
    
    // Move off screen after fade
    setTimeout(() => {
      if (this.displayElement && !this.isVisible) {
        this.displayElement.style.top = '-1000px';
        this.displayElement.style.left = '-1000px';
      }
    }, 150);
  }

  destroy(): void {
    if (this.displayElement) {
      document.body.removeChild(this.displayElement);
      this.displayElement = null;
    }
    this.isVisible = false;
    this.currentGesture = '';
  }

  isCurrentlyVisible(): boolean {
    return this.isVisible;
  }
}