export class DragTextEffect {
  private ghostElement: HTMLElement | null = null;
  private isActive: boolean = false;

  constructor() {
    this.createGhostElement();
  }

  private createGhostElement(): void {
    this.ghostElement = document.createElement('div');
    this.ghostElement.className = 'quick-gestures-ghost-text';
    this.ghostElement.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      z-index: 999999;
      pointer-events: none;
      background: rgba(30, 144, 255, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: opacity 0.1s ease;
    `;
    
    document.body.appendChild(this.ghostElement);
  }

  startDrag(selectedText: string, mouseX: number, mouseY: number): void {
    if (!this.ghostElement) return;
    
    this.isActive = true;
    
    // Truncate long text
    const displayText = selectedText.length > 30 
      ? selectedText.substring(0, 30) + '...' 
      : selectedText;
    
    this.ghostElement.textContent = displayText;
    this.updatePosition(mouseX, mouseY);
    
    // Show with fade in
    this.ghostElement.style.opacity = '1';
  }

  updatePosition(mouseX: number, mouseY: number): void {
    if (!this.ghostElement || !this.isActive) return;
    
    // Offset from cursor to avoid blocking it - closer to cursor
    const offsetX = 10;
    const offsetY = -15;
    
    let x = mouseX + offsetX;
    let y = mouseY + offsetY;
    
    // Keep ghost text on screen
    const rect = this.ghostElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust if going off right edge
    if (x + rect.width > viewportWidth - 10) {
      x = mouseX - rect.width - 5;
    }
    
    // Adjust if going off top edge  
    if (y < 10) {
      y = mouseY + 20;
    }
    
    // Adjust if going off bottom edge
    if (y + rect.height > viewportHeight - 10) {
      y = mouseY - rect.height - 5;
    }
    
    this.ghostElement.style.left = `${x}px`;
    this.ghostElement.style.top = `${y}px`;
  }

  endDrag(): void {
    if (!this.ghostElement || !this.isActive) return;
    
    this.isActive = false;
    
    // Fade out
    this.ghostElement.style.opacity = '0';
    
    // Move off screen after fade
    setTimeout(() => {
      if (this.ghostElement) {
        this.ghostElement.style.top = '-1000px';
        this.ghostElement.style.left = '-1000px';
      }
    }, 100);
  }

  destroy(): void {
    if (this.ghostElement) {
      document.body.removeChild(this.ghostElement);
      this.ghostElement = null;
    }
    this.isActive = false;
  }

  isCurrentlyActive(): boolean {
    return this.isActive;
  }
}