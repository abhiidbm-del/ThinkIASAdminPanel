import { Component, OnInit } from '@angular/core';
import { Announcement, CreateAnnouncementDto } from '../../../core/models/announcement.model';
import { AnnouncementService } from '../../../shared/services/announcement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-announcement-master',
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement-master.component.html',
  styleUrls: ['./announcement-master.component.css']
})
export class AnnouncementMasterComponent implements OnInit {
  announcements: Announcement[] = [];
  loading: boolean = false;
  currentLanguage: 'en' | 'hi' = 'en';
  
  // For creating/editing
  showForm: boolean = false;
  formTitle: string = '';
  formTitleHindi: string = '';
  formDescription: string = '';
  formDescriptionHindi: string = '';
  isEditing: boolean = false;
  editingId: string = '';

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit() {
    // Load language preference from localStorage
    const savedLang = localStorage.getItem('announcement_lang') as 'en' | 'hi';
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    this.loadAnnouncements();
  }

  switchLanguage(lang: 'en' | 'hi') {
    this.currentLanguage = lang;
    localStorage.setItem('announcement_lang', lang);
  }

  loadAnnouncements() {
    this.loading = true;
    this.announcementService.getAnnouncements().subscribe({
      next: (res) => {
        if (res.success) {
          this.announcements = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getDisplayText(englishText: string, hindiText?: string): string {
    if (this.currentLanguage === 'hi' && hindiText && hindiText.trim()) {
      return hindiText;
    }
    return englishText;
  }

  openCreateForm() {
    this.showForm = true;
    this.isEditing = false;
    this.formTitle = '';
    this.formTitleHindi = '';
    this.formDescription = '';
    this.formDescriptionHindi = '';
  }

  openEditForm(announcement: Announcement) {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = announcement._id;
    this.formTitle = announcement.title;
    this.formTitleHindi = announcement.titleHindi || '';
    this.formDescription = announcement.shortDescription;
    this.formDescriptionHindi = announcement.shortDescriptionHindi || '';
  }

  closeForm() {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = '';
  }

  saveAnnouncement() {
    if (!this.formTitle.trim()) {
      return;
    }

    const data: CreateAnnouncementDto = {
      title: this.formTitle.trim(),
      shortDescription: this.formDescription.trim()
    };

    // Add Hindi fields if provided
    if (this.formTitleHindi.trim()) {
      data.titleHindi = this.formTitleHindi.trim();
    }
    if (this.formDescriptionHindi.trim()) {
      data.shortDescriptionHindi = this.formDescriptionHindi.trim();
    }

    if (this.isEditing) {
      this.announcementService.updateAnnouncement(this.editingId, data).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadAnnouncements();
            this.closeForm();
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
    } else {
      this.announcementService.createAnnouncement(data).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadAnnouncements();
            this.closeForm();
          }
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }

  deleteAnnouncement(id: string) {
    const message = this.currentLanguage === 'en' 
      ? 'Are you sure you want to delete this announcement?'
      : 'क्या आप वाकई इस घोषणा को हटाना चाहते हैं?';
    
    if (!confirm(message)) return;

    this.announcementService.deleteAnnouncement(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements();
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  toggleActive(id: string) {
    this.announcementService.toggleStatus(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.loadAnnouncements();
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString(
      this.currentLanguage === 'en' ? 'en-US' : 'hi-IN', 
      options
    );
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString(
      this.currentLanguage === 'en' ? 'en-US' : 'hi-IN', 
      { hour: '2-digit', minute: '2-digit' }
    );
  }

  
}