import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Meeting, CreateMeetingRequest, UpdateMeetingRequest, MeetingService } from '../../../shared/services/meeting.service';

@Component({
  selector: 'app-meeting-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-admin.component.html',
  styleUrls: ['./meeting-admin.component.css']
})
export class MeetingAdminComponent implements OnInit {
  // Data
  upcomingMeetings: Meeting[] = [];
  completedMeetings: Meeting[] = [];
  
  // UI State
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showVideoLinkModal = false;
  showEditHistoryModal = false;
  showDeleteHistoryModal = false;
  
  // Form Data
  newMeeting: CreateMeetingRequest = {
    title: '',
    description: '',
    meetingDate: '',
    duration: undefined,
    meetingLink: '',
    audience: 'pre'
  };
  audience: 'pre' | 'mains' = 'pre';

  editMeeting: UpdateMeetingRequest = {};
  editHistoryMeeting: UpdateMeetingRequest = {};
  videoLink: string = '';
  
  selectedMeeting: Meeting | null = null;
  
  // Messages
  successMessage = '';
  errorMessage = '';
  
  constructor(private meetingService: MeetingService, private route: ActivatedRoute) {}
  
  ngOnInit() {
    this.audience = this.route.snapshot.data['audience'] === 'mains' ? 'mains' : 'pre';
    this.newMeeting.audience = this.audience;
    this.loadMeetings();
  }
  
  // Load meetings
  loadMeetings() {
    this.loading = true;
    this.clearMessages();
    
    this.meetingService.getAdminMeetings(this.audience).subscribe({
      next: (response) => {
        this.upcomingMeetings = response.upcomingMeetings;
        this.completedMeetings = response.completedMeetings;
        this.loading = false;
      },
      error: (error) => {
        this.showError('Failed to load meetings', error);
        this.loading = false;
      }
    });
  }
  
  // Create meeting
  createMeeting() {
    if (!this.validateMeeting(this.newMeeting)) {
      return;
    }
    
    this.meetingService.createMeeting(this.newMeeting).subscribe({
      next: (response) => {
        this.showCreateModal = false;
        this.resetNewMeetingForm();
        this.successMessage = 'Meeting created successfully';
        this.loadMeetings();
      },
      error: (error) => {
        this.showError('Failed to create meeting', error);
      }
    });
  }
  
  // Update meeting for upcoming meetings
  updateMeeting() {
    if (!this.selectedMeeting) return;
    
    if (this.showEditModal) {
      // For editing upcoming meeting details
      if (!this.validateMeeting(this.editMeeting as any, true)) {
        return;
      }
      
      this.meetingService.updateMeeting(this.selectedMeeting._id, this.editMeeting).subscribe({
        next: (response) => {
          this.showEditModal = false;
          this.editMeeting = {};
          this.selectedMeeting = null;
          this.successMessage = 'Meeting updated successfully';
          this.loadMeetings();
        },
        error: (error) => {
          this.showError('Failed to update meeting', error);
        }
      });
    }
  }
  
  // Update video link for completed meetings
  updateVideoLink() {
    if (!this.selectedMeeting || !this.videoLink.trim()) {
      this.errorMessage = 'Video link is required';
      return;
    }
    
    const updateData: UpdateMeetingRequest = {
      videoLink: this.videoLink.trim()
    };
    
    this.meetingService.updateMeeting(this.selectedMeeting._id, updateData).subscribe({
      next: (response) => {
        this.showVideoLinkModal = false;
        this.videoLink = '';
        this.selectedMeeting = null;
        this.successMessage = 'Video link updated successfully';
        this.loadMeetings();
      },
      error: (error) => {
        this.showError('Failed to update video link', error);
      }
    });
  }
  
  // Update completed meeting (history)
  updateCompletedMeeting() {
    if (!this.selectedMeeting) return;
    
    if (!this.editHistoryMeeting.title?.trim()) {
      this.errorMessage = 'Title is required';
      return;
    }
    
    this.meetingService.updateMeeting(this.selectedMeeting._id, this.editHistoryMeeting).subscribe({
      next: (response) => {
        this.showEditHistoryModal = false;
        this.editHistoryMeeting = {};
        this.selectedMeeting = null;
        this.successMessage = 'Meeting updated successfully';
        this.loadMeetings();
      },
      error: (error) => {
        this.showError('Failed to update meeting', error);
      }
    });
  }
  
  // Delete meeting
  deleteMeeting() {
    if (!this.selectedMeeting) return;
    
    this.meetingService.deleteMeeting(this.selectedMeeting._id).subscribe({
      next: (response) => {
        this.showDeleteModal = false;
        this.showDeleteHistoryModal = false;
        this.selectedMeeting = null;
        this.successMessage = 'Meeting deleted successfully';
        this.loadMeetings();
      },
      error: (error) => {
        this.showError('Failed to delete meeting', error);
      }
    });
  }
  
  // Validation
  private validateMeeting(meeting: any, isEdit: boolean = false): boolean {
    if (!meeting.title?.trim()) {
      this.errorMessage = 'Meeting title is required';
      return false;
    }
    
    if (!isEdit && !meeting.meetingDate) {
      this.errorMessage = 'Meeting date and time is required';
      return false;
    }
    
    if (!isEdit && meeting.meetingDate) {
      const meetingDate = new Date(meeting.meetingDate);
      const now = new Date();
      if (meetingDate <= now) {
        this.errorMessage = 'Meeting date must be in the future';
        return false;
      }
    }
    
    if (!meeting.duration || meeting.duration < 1) {
      this.errorMessage = 'Duration must be at least 1 minute';
      return false;
    }
    
    if (!meeting.meetingLink?.trim()) {
      this.errorMessage = 'Meeting link is required';
      return false;
    }
    
    return true;
  }
  
  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Check if meeting is happening now
  isMeetingNow(meeting: Meeting): boolean {
    const now = new Date();
    const meetingStart = new Date(meeting.meetingDate);
    const meetingEnd = new Date(meetingStart.getTime() + (meeting.duration * 60000));
    
    return now >= meetingStart && now <= meetingEnd;
  }
  
  // Check if meeting is upcoming
  isMeetingUpcoming(meeting: Meeting): boolean {
    const now = new Date();
    const meetingStart = new Date(meeting.meetingDate);
    return now < meetingStart;
  }
  
  // Reset form
  private resetNewMeetingForm() {
    this.newMeeting = {
      title: '',
      description: '',
      meetingDate: '',
      duration: undefined,
      meetingLink: ''
      , audience: this.audience
    };
  }
  
  openCreateModal() {
    this.resetNewMeetingForm();
    // Set default date to tomorrow, 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // Format for datetime-local input
    const formattedDate = this.formatDateForInput(tomorrow);
    this.newMeeting.meetingDate = formattedDate;
    
    this.showCreateModal = true;
    this.clearMessages();
  }
  
  openEditModal(meeting: Meeting) {
    event?.stopPropagation();
    this.selectedMeeting = meeting;
    
    const meetingDate = new Date(meeting.meetingDate);
    const formattedDate = this.formatDateForInput(meetingDate);
    
    this.editMeeting = {
      title: meeting.title,
      description: meeting.description,
      meetingDate: formattedDate,
      duration: meeting.duration,
      meetingLink: meeting.meetingLink
    };
    
    this.showEditModal = true;
    this.clearMessages();
  }
  
  openEditHistoryModal(meeting: Meeting) {
    event?.stopPropagation();
    this.selectedMeeting = meeting;
    
    this.editHistoryMeeting = {
      title: meeting.title,
      description: meeting.description,
      duration: meeting.duration, // Add duration
      videoLink: meeting.videoLink || ''
    };
    
    this.showEditHistoryModal = true;
    this.clearMessages();
  }
  
  openVideoLinkModal(meeting: Meeting) {
    event?.stopPropagation();
    this.selectedMeeting = meeting;
    this.videoLink = meeting.videoLink || '';
    this.showVideoLinkModal = true;
    this.clearMessages();
  }
  
  openDeleteModal(meeting: Meeting) {
    event?.stopPropagation();
    this.selectedMeeting = meeting;
    this.showDeleteModal = true;
    this.clearMessages();
  }
  
  openDeleteHistoryModal(meeting: Meeting) {
    event?.stopPropagation();
    this.selectedMeeting = meeting;
    this.showDeleteHistoryModal = true;
    this.clearMessages();
  }
  
  // Helper methods
  private showError(message: string, error: any) {
    this.loading = false;
    this.errorMessage = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(message, error);
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
  
  private clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  // Remove video link
  removeVideoLink() {
    if (!this.selectedMeeting) return;
    
    const updateData: UpdateMeetingRequest = {
      videoLink: ''
    };
    
    this.meetingService.updateMeeting(this.selectedMeeting._id, updateData).subscribe({
      next: (response) => {
        this.successMessage = 'Video link removed successfully';
        this.loadMeetings();
      },
      error: (error) => {
        this.showError('Failed to remove video link', error);
      }
    });
  }
}