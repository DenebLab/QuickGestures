import { Point, StyleSettings } from '../shared/types';

export class GestureOverlay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: StyleSettings;
  private path: Point[] = [];
  private isVisible = false;
  
  constructor(settings: StyleSettings) {
    this.settings = settings;
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }
  
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.id = 'quickgestures-overlay';
    canvas.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      pointer-events: none !important;
      background: transparent !important;
      user-select: none !important;
    `;
    return canvas;
  }
  
  private setupCanvas(): void {
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = document.documentElement.getBoundingClientRect();
      
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      
      this.ctx.scale(dpr, dpr);
      this.redraw();
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
  }
  
  show(): void {
    if (!this.isVisible) {
      document.body.appendChild(this.canvas);
      this.isVisible = true;
    }
  }
  
  hide(): void {
    if (this.isVisible) {
      document.body.removeChild(this.canvas);
      this.isVisible = false;
      this.path = [];
    }
  }
  
  updateSettings(settings: StyleSettings): void {
    this.settings = settings;
    this.redraw();
  }
  
  startPath(point: Point): void {
    this.path = [point];
    this.show();
    this.redraw();
  }
  
  addPoint(point: Point): void {
    if (this.path.length === 0) return;
    
    this.path.push(point);
    this.redraw();
  }
  
  endPath(): void {
    if (this.settings.highContrast) {
      this.fadeOut();
    } else {
      setTimeout(() => this.hide(), 200);
    }
  }
  
  private redraw(): void {
    if (!this.isVisible || this.path.length < 2) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = this.settings.lineColor;
    this.ctx.lineWidth = this.settings.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (this.settings.highContrast) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].x, this.path[0].y);
    
    for (let i = 1; i < this.path.length; i++) {
      this.ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    
    this.ctx.stroke();
    
    if (this.settings.highContrast) {
      this.ctx.shadowColor = 'transparent';
    }
  }
  
  private fadeOut(): void {
    let opacity = 1;
    const fadeStep = 0.05;
    const fadeInterval = 16;
    
    const fade = () => {
      opacity -= fadeStep;
      this.canvas.style.opacity = opacity.toString();
      
      if (opacity <= 0) {
        this.hide();
        this.canvas.style.opacity = '1';
      } else {
        setTimeout(fade, fadeInterval);
      }
    };
    
    fade();
  }
  
  showContextChip(context: string, point: Point): void {
    if (!this.settings.showContextChip || !this.isVisible) return;
    
    const chipWidth = 80;
    const chipHeight = 24;
    const offsetX = 10;
    const offsetY = -30;
    
    let x = point.x + offsetX;
    let y = point.y + offsetY;
    
    if (x + chipWidth > window.innerWidth) {
      x = point.x - chipWidth - offsetX;
    }
    if (y < chipHeight) {
      y = point.y + chipHeight + Math.abs(offsetY);
    }
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(x, y - chipHeight, chipWidth, chipHeight);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px system-ui, -apple-system, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(context, x + chipWidth / 2, y - 8);
    this.ctx.textAlign = 'left';
  }
}