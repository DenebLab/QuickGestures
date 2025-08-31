export class ExclusionMatcher {
  private patterns: RegExp[] = [];
  
  constructor(exclusions: string[]) {
    this.updatePatterns(exclusions);
  }
  
  updatePatterns(exclusions: string[]): void {
    this.patterns = exclusions
      .filter(pattern => pattern.trim() !== '')
      .map(pattern => this.wildcardToRegex(pattern));
  }
  
  isExcluded(url: string): boolean {
    return this.patterns.some(pattern => pattern.test(url));
  }
  
  private wildcardToRegex(pattern: string): RegExp {
    // Escape special regex characters except * and ?
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert wildcards to regex
    escaped = escaped
      .replace(/\*/g, '.*')  // * matches any characters
      .replace(/\?/g, '.');  // ? matches single character
    
    // Anchor pattern to match full URL
    return new RegExp(`^${escaped}$`, 'i');
  }
  
  static validatePattern(pattern: string): boolean {
    try {
      const matcher = new ExclusionMatcher([pattern]);
      return true;
    } catch (error) {
      return false;
    }
  }
}