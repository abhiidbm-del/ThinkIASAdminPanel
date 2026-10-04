import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { AdminBatchesComponent } from '../admin-batches/admin-batches.component';

export interface Program {
  _id?: string;
  programName: string;
  programNameHindi?: string; descriptionHindi?: string; durationHindi?: string; featuresHindi?: string[];
  programCategory: string;
  year: string;
  price: number;
  displayImage: string;
  discountedPrice?: number;
  description?: string;
  features?: string[];
  startDate?: Date | string;
  endDate?: Date | string;
  duration?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-manage-programs',
  standalone: true,
  imports: [TranslatePipe, CommonModule, FormsModule, AdminBatchesComponent],
  templateUrl: './manage-programs.component.html',
  styleUrls: ['./manage-programs.component.css']
})
export class ManageProgramsComponent implements OnInit {
  programs: Program[] = [];
  categories: string[] = ['Mentorship Course', 'Optional Mentorship Course', 'Test Series', 'Optional Test Series', 'Essay', 'Prelims Program', 'Mains Program', 'Interview Program'];

  startDateInput: string = '';
  endDateInput: string = '';

  activeTab: string = 'all';

  // Form model
  currentProgram: Program = {
    programName: '',
    programCategory: 'Mentorship Course',
    year: '',
    price: 0,
    displayImage: '',
    description: '',
    features: [],
    duration: '',
    isActive: true,
    order: 0
  };
  
  isEditing = false;
  editingId: string | null = null;
  showForm = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Image preview
  imagePreviewUrl: string | null = null;
  
  // Features input
  featuresInput: string = '';
  featuresHindiInput = '';
  
  // Toggle for inactive view
  showInactivePrograms = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPrograms();
  }

  // Fetch all programs
  fetchPrograms(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/programs`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.programs = response.data;
        } else if (Array.isArray(response)) {
          this.programs = response;
        } else {
          this.programs = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching programs:', error);
        this.errorMessage = 'Failed to load programs. Please check if the backend server is running.';
        this.isLoading = false;
        this.programs = [];
      }
    });
  }

  // Load demo data for testing
  loadDemoData(): void {
    this.programs = [
      {
        _id: '1',
        programName: 'Public Administration Mentorship Program',
        programCategory: 'Mentorship Course',
        year: '2027',
        price: 17999,
        discountedPrice: 26999,
        displayImage: 'https://via.placeholder.com/300x200/4F46E5/ffffff?text=PUBLIC+ADMIN',
        description: 'Complete mentorship program for UPSC CSE 2027',
        features: ['Weekly mentorship sessions', 'Personalized study plan', 'Doubt clearing sessions'],
        duration: '12 months',
        isActive: true
      },
      {
        _id: '2',
        programName: 'Psychology Optional Mentorship Program',
        programCategory: 'Mentorship Course',
        year: '2027',
        price: 17999,
        discountedPrice: 26999,
        displayImage: 'https://via.placeholder.com/300x200/EC4899/ffffff?text=PSYCHOLOGY',
        description: 'Comprehensive psychology optional mentorship',
        features: ['Expert faculty', 'Test series included', 'Answer writing practice'],
        duration: '12 months',
        isActive: false
      },
      {
        _id: '3',
        programName: 'UPSC Navigator Personalized Mentorship',
        programCategory: 'Mentorship Course',
        year: '2026/27',
        price: 20999,
        discountedPrice: 31499,
        displayImage: 'https://via.placeholder.com/300x200/06B6D4/ffffff?text=NAVIGATOR',
        description: 'Personalized guidance for UPSC preparation',
        features: ['1-on-1 mentoring', 'Customized schedule', 'Performance tracking'],
        duration: '18 months',
        isActive: true
      }
    ];
  }

  // Get programs by category (active only by default)
  getProgramsByCategory(category: string, includeInactive: boolean = false): Program[] {
    if (includeInactive) {
      return this.programs.filter(program => program.programCategory === category);
    } else {
      return this.programs.filter(program => 
        program.programCategory === category && program.isActive !== false
      );
    }
  }

  // Get inactive programs for a category
  getInactiveProgramsByCategory(category: string): Program[] {
    return this.programs.filter(program => 
      program.programCategory === category && !program.isActive
    );
  }

  // Get all programs for a category
  getAllProgramsByCategory(category: string): Program[] {
    return this.programs.filter(program => program.programCategory === category);
  }

  // Get active programs count
  getActiveCountByCategory(category: string): number {
    return this.programs.filter(program => 
      program.programCategory === category && program.isActive !== false
    ).length;
  }

  // Get inactive programs count
  getInactiveCountByCategory(category: string): number {
    return this.programs.filter(program => 
      program.programCategory === category && !program.isActive
    ).length;
  }

  // Toggle inactive view
  toggleInactiveView(): void {
    this.showInactivePrograms = !this.showInactivePrograms;
  }

  // Open form for adding new program
  openAddForm(): void {
    this.resetForm();
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.featuresInput = '';
    this.featuresHindiInput = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Open form for editing program
  editProgram(program: Program): void {
    this.currentProgram = { ...program };
    this.featuresHindiInput = (program.featuresHindi || []).join('\n');
    this.isEditing = true;
    this.editingId = program._id || null;
    this.showForm = true;
    this.imagePreviewUrl = program.displayImage;
    this.featuresInput = program.features ? program.features.join(', ') : '';
    
    if (program.startDate) {
      const date = new Date(program.startDate);
      this.startDateInput = date.toISOString().split('T')[0];
      this.currentProgram.startDate = this.startDateInput;
    }
    if (program.endDate) {
      const date = new Date(program.endDate);
      this.endDateInput = date.toISOString().split('T')[0];
      this.currentProgram.endDate = this.endDateInput;
    }
    
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Save program
  saveProgram(): void {
    if (!this.currentProgram.programName.trim()) {
      this.errorMessage = 'Program name is required';
      return;
    }
    if (!this.currentProgram.year.trim()) {
      this.errorMessage = 'Year is required';
      return;
    }
    if (!Number.isFinite(Number(this.currentProgram.price)) || this.currentProgram.price < 0) {
      this.errorMessage = 'Valid price is required';
      return;
    }
    if (!this.currentProgram.displayImage.trim()) {
      this.errorMessage = 'Display image URL is required';
      return;
    }
    if (!this.startDateInput || !this.endDateInput) {
      this.errorMessage = 'Start date and end date are required';
      return;
    }
    
    const startDate = new Date(this.startDateInput);
    const endDate = new Date(this.endDateInput);
    
    if (startDate >= endDate) {
      this.errorMessage = 'End date must be after start date';
      return;
    }
    
    this.currentProgram.startDate = this.startDateInput;
    this.currentProgram.endDate = this.endDateInput;

    this.currentProgram.featuresHindi = this.featuresHindiInput.split(/\r?\n/).map(value => value.trim());
    if (this.featuresInput.trim()) {
      this.currentProgram.features = this.featuresInput.split(',').map(f => f.trim()).filter(f => f);
    } else {
      this.currentProgram.features = [];
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditing && this.editingId) {
      this.http.put<any>(`${environment.apiUrl}/programs/${this.editingId}`, this.currentProgram).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Program updated successfully!';
          this.fetchPrograms();
          this.closeForm();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error updating program:', error);
            this.errorMessage = this.getProgramErrorMessage(error);
          this.isLoading = false;
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/programs`, this.currentProgram).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Program created successfully!';
          this.fetchPrograms();
          this.closeForm();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error creating program:', error);
            this.errorMessage = this.getProgramErrorMessage(error);
          this.isLoading = false;
        }
      });
    }
  }

  private getProgramErrorMessage(error: any): string {
    if (error?.status === 401 || /no token|authorization denied/i.test(error?.error?.message || '')) {
      return 'Your admin session has expired. Please log in again and retry.';
    }
    return error?.error?.errors?.join(' ') || error?.error?.message || 'Unable to save program. Please try again.';
  }

  // Delete program
  deleteProgram(id: string): void {
    if (confirm('Are you sure you want to delete this program?')) {
      this.isLoading = true;
      this.http.delete<any>(`${environment.apiUrl}/programs/${id}`).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Program deleted successfully!';
          this.fetchPrograms();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting program:', error);
          this.errorMessage = error.error?.message || 'Unable to delete program.';
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        }
      });
    }
  }

  // Toggle program active status
  toggleProgramStatus(program: Program): void {
    const updatedStatus = !program.isActive;
    this.http.put<any>(`${environment.apiUrl}/programs/${program._id}`, { ...program, isActive: updatedStatus }).subscribe({
      next: (response) => {
        program.isActive = updatedStatus;
        this.successMessage = `Program ${updatedStatus ? 'activated' : 'deactivated'} successfully!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling program status:', error);
        this.errorMessage = 'Failed to update program status';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Reactivate program
  reactivateProgram(program: Program): void {
    this.toggleProgramStatus(program);
  }

  // Reset form
  resetForm(): void {
    this.currentProgram = {
      programName: '',
      programCategory: 'Mentorship Course',
      year: '',
      price: 0,
      displayImage: '',
      description: '',
      features: [],
      startDate: '',
      endDate: '',
      duration: '',
      isActive: true,
      order: 0
    };
    this.imagePreviewUrl = null;
    this.featuresInput = '';
    this.featuresHindiInput = '';
    this.startDateInput = '';
    this.endDateInput = '';
  }

  // Close form
  closeForm(): void {
    this.showForm = false;
    this.resetForm();
    this.isEditing = false;
    this.editingId = null;
    this.errorMessage = '';
  }

  // Preview image
  previewImage(): void {
    if (this.currentProgram.displayImage) {
      this.imagePreviewUrl = this.currentProgram.displayImage;
    } else {
      this.imagePreviewUrl = null;
    }
  }

  // Handle image error
  handleImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x200/CCCCCC/666666?text=No+Image';
  }

  // Calculate duration preview
  calculateDurationPreview(): string {
    if (!this.startDateInput || !this.endDateInput) return '';
    
    const start = new Date(this.startDateInput);
    const end = new Date(this.endDateInput);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      if (remainingMonths > 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
      }
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      const remainingDays = diffDays % 30;
      if (remainingDays > 0) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  getProgramsByCategoryForTab(category: string): Program[] {
    switch (this.activeTab) {
      case 'active':
        return this.programs.filter(program => 
          program.programCategory === category && program.isActive === true
        );
      case 'inactive':
        return this.programs.filter(program => 
          program.programCategory === category && program.isActive === false
        );
      default:
        return this.programs.filter(program => 
          program.programCategory === category
        );
    }
  }

  // Get count for tab and category
  getCountForTab(category: string, tab: string): number {
    switch (tab) {
      case 'active':
        return this.programs.filter(p => p.programCategory === category && p.isActive === true).length;
      case 'inactive':
        return this.programs.filter(p => p.programCategory === category && p.isActive === false).length;
      default:
        return this.programs.filter(p => p.programCategory === category).length;
    }
  }

  // Get total counts for tabs
  getTotalCountForTab(tab: string): number {
    switch (tab) {
      case 'active':
        return this.programs.filter(p => p.isActive === true).length;
      case 'inactive':
        return this.programs.filter(p => p.isActive === false).length;
      default:
        return this.programs.length;
    }
  }

  // Set active tab
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Add this method to format date range
formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

}