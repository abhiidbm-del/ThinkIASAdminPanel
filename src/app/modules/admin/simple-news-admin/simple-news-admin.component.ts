import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { SimpleNewsService } from '../../../shared/services/simple-news.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simple-news-admin',
  imports: [FormsModule, CommonModule],
  templateUrl: './simple-news-admin.component.html',
  styleUrl: './simple-news-admin.component.css'
})
export class SimpleNewsAdminComponent implements OnInit {
  @ViewChildren('newsItem') newsItems!: QueryList<ElementRef>;
  
  allNews: any[] = [];
  newText = '';
  newTextHi = '';
  isFormValid = false;
  autoScroll = true;
  isToggling = false; // To prevent multiple toggles at once

  constructor(private newsService: SimpleNewsService) {}

  ngOnInit() {
    this.loadAllNews();
  }

  loadAllNews() {
    this.newsService.getAllNews().subscribe({
      next: (response) => {
        this.allNews = response.news as any[];
        // Sort by creation date, newest first
        this.allNews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    });
  }

  checkFormValidity() {
    // Trim whitespace and check if both fields have content
    const englishValid = this.newText.trim().length > 0;
    const hindiValid = this.newTextHi.trim().length > 0;
    this.isFormValid = englishValid && hindiValid;
  }

  createNews() {
    if (this.isFormValid) {
      this.newsService.createNews(this.newText.trim(), this.newTextHi.trim()).subscribe({
        next: () => {
          this.newText = '';
          this.newTextHi = '';
          this.isFormValid = false;
          this.loadAllNews();
          
          // Auto scroll to the newly added item
          if (this.autoScroll) {
            setTimeout(() => {
              const newsItemsArray = this.newsItems.toArray();
              if (newsItemsArray.length > 0) {
                newsItemsArray[0].nativeElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'nearest' 
                });
              }
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error creating news:', error);
          alert('Failed to create news. Please try again.');
        }
      });
    }
  }

  toggleStatus(id: string, currentStatus: boolean) {
    // Prevent multiple toggles at once
    if (this.isToggling) return;
    
    // If trying to turn OFF a currently active item, just toggle it
    if (!currentStatus) {
      this.performToggle(id);
      return;
    }
    
    // If trying to turn ON an item (and it's currently OFF), we need to turn OFF all others first
    this.isToggling = true;
    
    // Find all currently active news items except the one we're trying to activate
    const activeNews = this.allNews.filter(news => news.isActive && news._id !== id);
    
    if (activeNews.length === 0) {
      // No other active items, just toggle this one
      this.performToggle(id);
      return;
    }
    
    // First, turn OFF all currently active items
    const togglePromises = activeNews.map(news => 
      this.newsService.toggleNewsStatus(news._id).toPromise()
    );
    
    // After all others are turned OFF, turn ON the selected one
    Promise.all(togglePromises)
      .then(() => {
        return this.newsService.toggleNewsStatus(id).toPromise();
      })
      .then(() => {
        this.loadAllNews();
        this.isToggling = false;
      })
      .catch(error => {
        console.error('Error toggling statuses:', error);
        alert('Failed to update news status. Please try again.');
        this.isToggling = false;
        this.loadAllNews(); // Reload to get correct state
      });
  }

  // Helper method for simple toggle
  private performToggle(id: string) {
    this.isToggling = true;
    this.newsService.toggleNewsStatus(id).subscribe({
      next: () => {
        this.loadAllNews();
        this.isToggling = false;
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        alert('Failed to update news status. Please try again.');
        this.isToggling = false;
        this.loadAllNews(); // Reload to get correct state
      }
    });
  }

  deleteNews(id: string) {
    if (confirm('Are you sure you want to delete this news? This action cannot be undone.')) {
      this.newsService.deleteNews(id).subscribe({
        next: () => this.loadAllNews(),
        error: (error) => console.error('Error deleting news:', error)
      });
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (e) {
      return 'Invalid date';
    }
  }
}