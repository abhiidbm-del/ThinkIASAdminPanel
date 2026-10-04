import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LiveContentService } from '../../../shared/services/live-content.service';

@Component({
  selector: 'app-live-content-admin',
  imports: [FormsModule, CommonModule],
  templateUrl: './live-content-admin.component.html',
  styleUrls: ['./live-content-admin.component.css']
})
export class LiveContentAdminComponent implements OnInit {
  
  allVideos: any[] = [];
  youtubeUrl = '';
  isSubmitting = false;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  
  // YouTube URL patterns for validation
  private youtubePatterns = [
    /^(https?\:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^(https?\:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^(https?\:\/\/)?(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];

  constructor(private liveContentService: LiveContentService) {}

  ngOnInit() {
    this.loadAllVideos();
  }

  // Extract video ID from YouTube URL
  extractVideoId(url: string): string | null {
    for (const pattern of this.youtubePatterns) {
      const match = url.match(pattern);
      if (match && match[3]) {
        return match[3];
      }
    }
    return null;
  }

  // Validate YouTube URL
  validateYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  // Check if form is valid
  isFormValid(): boolean {
    return this.youtubeUrl.trim().length > 0 && this.validateYouTubeUrl(this.youtubeUrl);
  }

  // Shorten URL for display
  getShortUrl(url: string): string {
    if (url.length > 40) {
      return url.substring(0, 40) + '...';
    }
    return url;
  }

  // Load all videos
  loadAllVideos() {
    this.isLoading = true;
    this.liveContentService.getAllLiveContent().subscribe({
      next: (response) => {
        this.allVideos = response.data || [];
        this.allVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.errorMessage = 'Failed to load videos. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Create new video
  createVideo() {
    if (!this.isFormValid() || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.liveContentService.createLiveContent(this.youtubeUrl.trim()).subscribe({
      next: (response) => {
        this.successMessage = 'Video added successfully!';
        this.youtubeUrl = '';
        this.loadAllVideos();
        this.isSubmitting = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating video:', error);
        this.errorMessage = error.error?.message || 'Failed to add video. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  // Toggle video status
  toggleVideoStatus(id: string, currentStatus: boolean) {
    this.liveContentService.toggleLiveContentStatus(id).subscribe({
      next: () => {
        this.loadAllVideos();
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        this.errorMessage = 'Failed to update video status. Please try again.';
      }
    });
  }

  // Delete video
  deleteVideo(id: string) {
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      this.liveContentService.deleteLiveContent(id).subscribe({
        next: () => {
          this.successMessage = 'Video deleted successfully!';
          this.loadAllVideos();
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error deleting video:', error);
          this.errorMessage = 'Failed to delete video. Please try again.';
        }
      });
    }
  }

  // Format date
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }
}