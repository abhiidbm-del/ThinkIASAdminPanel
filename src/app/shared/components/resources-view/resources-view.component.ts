import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SyllabusItem, BreadcrumbItem } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AdminService } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-resources-view',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './resources-view.component.html',
  styleUrls: ['./resources-view.component.css']
})
export class ResourcesViewComponent implements OnInit {
  
  syllabusType: string = '';
  currentData: any = {};
  breadcrumbs: BreadcrumbItem[] = [];
  currentPath: string[] = [];
  isLoading: boolean = false;
  private originalApiData: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.syllabusType = params['type'];
      this.currentPath = [this.syllabusType];
      this.loadData();
      this.updateBreadcrumbs();
    });
  }

  loadData() {
    this.isLoading = true;

    if (this.currentPath.length === 1) {
      // Root level - fetch from API for both prelims and mains
      this.adminService.getSyllabus(this.syllabusType).subscribe({
        next: (apiData) => {
          this.originalApiData = apiData;
          this.currentData = this.transformApiData(apiData, this.syllabusType);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error loading ${this.syllabusType} syllabus data:`, error);
          // Fallback to static data if API fails
          this.currentData = this.syllabusData[this.syllabusType] || {};
          this.isLoading = false;
        }
      });
    } else {
      // Nested level - navigate through the path to get current data
      let data = this.originalApiData;
      
      // For mains optional subjects, we need special handling
      if (this.syllabusType === 'mains' && this.currentPath[1] === 'Optional') {
        data = this.getMainsOptionalData(this.currentPath);
      } else {
        // Normal navigation for other paths
        for (let i = 1; i < this.currentPath.length; i++) {
          if (data && data[this.currentPath[i]]) {
            data = data[this.currentPath[i]];
          } else {
            data = {};
            break;
          }
        }
      }
      
      this.currentData = data;
      this.isLoading = false;
    }
  }

  // Special method to handle mains optional subjects navigation
  private getMainsOptionalData(path: string[]): any {
    if (path.length === 2) {
      // Level 2: Show all optional subjects
      const result: any = {};
      if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
        this.originalApiData.optionalSubjects.forEach((subject: any) => {
          if (subject.subjectName) {
            result[subject.subjectName] = {
              _isFolder: true,
              _documents: subject.documents || []
            };
          }
        });
      }
      return result;
    } else if (path.length === 3) {
      // Level 3: Show documents for a specific subject
      const subjectName = path[2];
      const result: any = {};
      
      if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
        const subject = this.originalApiData.optionalSubjects.find((s: any) => 
          s.subjectName.toLowerCase() === subjectName.toLowerCase()
        );
        
        if (subject && subject.documents) {
          subject.documents.forEach((doc: any, index: number) => {
            result[index] = {
              fileLink: doc.fileLink,
              fileName: doc.fileName,
              description: doc.description
            };
          });
        }
      }
      return result;
    }
    
    return {};
  }

  // Transform API data to match the expected structure for the viewer
  private transformApiData(apiData: any, syllabusType: string): any {
    if (!apiData) return {};

    if (syllabusType === 'prelims') {
      // For prelims, just return the data as is
      return apiData;
    } else if (syllabusType === 'mains') {
      // For mains, transform the structure
      return this.transformMainsData(apiData);
    }
    return apiData;
  }

  // Transform mains API data from new structure to old expected structure
  private transformMainsData(apiData: any): any {
    if (!apiData) return {};
    
    const transformedData: any = {};
    
    // Copy direct fields (gs1, gs2, gs3, gs4, essay)
    ['gs1', 'gs2', 'gs3', 'gs4', 'essay'].forEach(field => {
      if (apiData[field]) {
        transformedData[field] = apiData[field];
      }
    });

    // Add Optional folder if optionalSubjects exist
    if (apiData.optionalSubjects && Array.isArray(apiData.optionalSubjects) && apiData.optionalSubjects.length > 0) {
      transformedData['Optional'] = {
        _isFolder: true,
        _description: 'Optional Subjects',
        _itemCount: apiData.optionalSubjects.length
      };
    }

    return transformedData;
  }

  updateBreadcrumbs() {
    this.breadcrumbs = this.currentPath.map((path, index) => {
      const fullPath = this.currentPath.slice(0, index + 1);
      return {
        name: this.formatName(path),
        path: fullPath.join('/')
      };
    });
  }

  formatName(name: string): string {
    // Handle special case for 'gs1', 'gs2', etc.
    if (name.match(/^gs[1-4]$/i)) {
      return name.toUpperCase();
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  isFolder(item: any): boolean {
    // Check if it's a folder by looking for _isFolder flag or absence of fileLink
    return (item && typeof item === 'object' && (item._isFolder || !item.fileLink));
  }

  navigateToFolder(key: string) {
    this.currentPath.push(key);
    this.loadData();
    this.updateBreadcrumbs();
  }

  navigateBreadcrumb(index: number) {
    this.currentPath = this.currentPath.slice(0, index + 1);
    this.loadData();
    this.updateBreadcrumbs();
  }

  openFile(fileLink: string) {
    if (fileLink) {
      window.open(fileLink, '_blank');
    }
  }

  goBack() {
    if (this.currentPath.length > 1) {
      this.currentPath.pop();
      this.loadData();
      this.updateBreadcrumbs();
    } else {
      this.router.navigate(['/']);
    }
  }

  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    
    // Filter out internal properties that start with underscore
    return Object.keys(obj).filter(key => !key.startsWith('_'));
  }

  formatItemName(name: string): string {
    // Handle numeric keys (for document indices)
    if (!isNaN(Number(name))) {
      return `Document ${Number(name) + 1}`;
    }
    
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  countItems(obj: any, key?: string): number {
    if (!obj) return 0;

    // Handle special cases for mains optional subjects
    if (this.syllabusType === 'mains') {
      // For Optional folder at root level
      if (key === 'Optional' && obj._itemCount) {
        return obj._itemCount;
      }
      
      // For optional subject folders (they have _documents array)
      if (obj._documents && Array.isArray(obj._documents)) {
        return obj._documents.length;
      }
      
      // For current path being Optional folder (showing subjects)
      if (this.currentPath.length === 2 && this.currentPath[1] === 'Optional') {
        if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
          return this.originalApiData.optionalSubjects.length;
        }
      }
      
      // For specific subject folder (showing documents)
      if (this.currentPath.length === 3 && this.currentPath[1] === 'Optional') {
        const subjectName = this.currentPath[2];
        if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
          const subject = this.originalApiData.optionalSubjects.find((s: any) => 
            s.subjectName.toLowerCase() === subjectName.toLowerCase()
          );
          return subject && subject.documents ? subject.documents.length : 0;
        }
      }
    }

    // Default counting logic - count only non-internal keys
    const keys = Object.keys(obj).filter(k => !k.startsWith('_'));
    
    // If it's a file object (has fileLink), count as 1 item
    if (obj.fileLink) {
      return 1;
    }
    
    return keys.length;
  }

  // Static data as fallback only (commented out as per your original code)
  private syllabusData: { [key: string]: any } = {};
}