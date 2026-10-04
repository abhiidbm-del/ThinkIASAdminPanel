import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'truncate',
  standalone: true
})
export class TruncatePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, limit: number = 100, trail: string = '...'): SafeHtml {
    if (!value) return '';
    
    // Remove HTML tags for truncation
    const plainText = value.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= limit) {
      return this.sanitizer.bypassSecurityTrustHtml(value);
    }
    
    // Truncate and add trail
    const truncated = plainText.substring(0, limit) + trail;
    return this.sanitizer.bypassSecurityTrustHtml(truncated);
  }
}