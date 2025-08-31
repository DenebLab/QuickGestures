import { Point, RecognitionSettings } from '../shared/types';
import { distance, angle, snapToDirection } from '../shared/utils';
import { MIN_GESTURE_DISTANCE, MAX_GESTURE_SEGMENTS } from '../shared/constants';

export class GestureRecognizer {
  private settings: RecognitionSettings;
  
  constructor(settings: RecognitionSettings) {
    this.settings = settings;
  }
  
  updateSettings(settings: RecognitionSettings): void {
    this.settings = settings;
  }
  
  recognizeGesture(path: Point[]): string {
    if (path.length < 2) return '';
    
    const normalizedPath = this.normalizePath(path);
    if (normalizedPath.length < 2) return '';
    
    const directions = this.extractDirections(normalizedPath);
    return this.collapseDirections(directions);
  }
  
  private normalizePath(path: Point[]): Point[] {
    const normalized: Point[] = [];
    let lastPoint = path[0];
    normalized.push(lastPoint);
    
    for (let i = 1; i < path.length; i++) {
      const currentPoint = path[i];
      const dist = distance(lastPoint, currentPoint);
      
      if (dist >= this.settings.minSegmentLengthPx) {
        normalized.push(currentPoint);
        lastPoint = currentPoint;
      }
    }
    
    return this.removeDuplicatePoints(normalized);
  }
  
  private removeDuplicatePoints(path: Point[]): Point[] {
    const filtered: Point[] = [];
    let lastPoint: Point | null = null;
    
    for (const point of path) {
      if (!lastPoint || distance(lastPoint, point) >= MIN_GESTURE_DISTANCE) {
        filtered.push(point);
        lastPoint = point;
      }
    }
    
    return filtered;
  }
  
  private extractDirections(path: Point[]): string[] {
    const directions: string[] = [];
    
    for (let i = 1; i < path.length; i++) {
      const prevPoint = path[i - 1];
      const currentPoint = path[i];
      
      const segmentAngle = angle(prevPoint, currentPoint);
      const direction = snapToDirection(segmentAngle, this.settings.angleSnapDeg);
      
      directions.push(direction);
    }
    
    return directions;
  }
  
  private collapseDirections(directions: string[]): string {
    if (directions.length === 0) return '';
    
    const collapsed: string[] = [];
    let lastDirection = directions[0];
    collapsed.push(lastDirection);
    
    for (let i = 1; i < directions.length; i++) {
      const currentDirection = directions[i];
      
      if (currentDirection !== lastDirection) {
        collapsed.push(currentDirection);
        lastDirection = currentDirection;
      }
    }
    
    if (collapsed.length > MAX_GESTURE_SEGMENTS) {
      return collapsed.slice(0, MAX_GESTURE_SEGMENTS).join('');
    }
    
    return collapsed.join('');
  }
  
  isValidGesture(gesture: string): boolean {
    return gesture.length > 0 && gesture.length <= MAX_GESTURE_SEGMENTS;
  }
}