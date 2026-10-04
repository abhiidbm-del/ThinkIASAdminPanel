import { LanguageToggleComponent } from './shared/i18n/language-toggle.component';
import { TranslatePipe } from './shared/i18n/translate.pipe';
import { Component, inject, signal, computed, ViewChild, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './shared/services/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MenuItem } from './core/models/user.model';

// Define user interface locally
interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LanguageToggleComponent, TranslatePipe, 
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ThinkCivil IAS';
  authService = inject(AuthService);
  router = inject(Router);
  breakpointObserver = inject(BreakpointObserver);
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('profileContainer') profileContainer!: ElementRef;
  
  currentRoute = signal('');
  isMobile = signal(false);
  sidenavOpen = signal(true);
  showProfileDropdown = signal(false);
  private expandedMenus = signal<Set<string>>(new Set(['Website Page Manage']));
  
  private breakpointSubscription!: Subscription;

  constructor() {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.url);
      // Close sidenav on mobile after navigation
      if (this.isMobile()) {
        this.closeSidenav();
      }
      // Close profile dropdown on route change
      // this.closeProfileDropdown();
    });
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.refreshUser().subscribe({ error: error => console.error('Unable to refresh navigation:', error) });
    }
    // Watch for screen size changes
    this.breakpointSubscription = this.breakpointObserver
      .observe([
        Breakpoints.Handset,
        Breakpoints.TabletPortrait,
        '(max-width: 768px)'
      ])
      .subscribe(result => {
        const isMobileNow = result.matches;
        this.isMobile.set(isMobileNow);
        
        // Adjust sidenav state based on screen size
        if (isMobileNow) {
          this.closeSidenav();
        } else {
          this.sidenavOpen.set(true);
          if (this.sidenav) {
            this.sidenav.open();
          }
        }
        
        // Close profile dropdown on screen size change
        // this.closeProfileDropdown();
      });
  }

  ngOnDestroy() {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent): void {
  //   // Close dropdown if clicked outside
  //   if (this.showProfileDropdown() && 
  //       this.profileContainer && 
  //       !this.profileContainer.nativeElement.contains(event.target)) {
  //     // this.closeProfileDropdown();
  //   }
  // }

  // Get user data directly from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  // Get user initials for avatar
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user?.fullName) return 'U';
    
    const names = user.fullName.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  }

  // Toggle profile dropdown
  toggleProfileDropdown(): void {
    this.showProfileDropdown.update(value => !value);
  }

  // Close profile dropdown
  // closeProfileDropdown(): void {
  //   this.showProfileDropdown.set(false);
  // }

  // Get sidenav mode based on screen size
  getSidenavMode(): 'over' | 'side' {
    return this.isMobile() ? 'over' : 'side';
  }

  // Check if sidenav should be open
  isSidenavOpen(): boolean {
    return this.sidenavOpen();
  }

  // Handle sidenav toggle
  onSidenavToggle(isOpen: boolean) {
    this.sidenavOpen.set(isOpen);
  }

  // Close sidenav
  closeSidenav() {
    this.sidenavOpen.set(false);
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  // Open sidenav
  openSidenav() {
    this.sidenavOpen.set(true);
    if (this.sidenav) {
      this.sidenav.open();
    }
  }

  // Toggle sidenav
  toggleSidenav() {
    if (this.isMobile()) {
      if (this.sidenavOpen()) {
        this.closeSidenav();
      } else {
        this.openSidenav();
      }
    } else {
      this.sidenavOpen.set(!this.sidenavOpen());
      if (this.sidenav) {
        this.sidenav.toggle();
      }
    }
  }

  // Close sidenav on mobile when clicking a link
  closeSidenavOnMobile() {
    if (this.isMobile()) {
      this.closeSidenav();
    }
  }

  toggleMenu(menuName: string): void {
    this.expandedMenus.update(menus => {
      const updatedMenus = new Set(menus);
      updatedMenus.has(menuName) ? updatedMenus.delete(menuName) : updatedMenus.add(menuName);
      return updatedMenus;
    });
  }

  isMenuExpanded(menuName: string): boolean {
    return this.expandedMenus().has(menuName);
  }

  // Computed property for route name
  currentRouteName = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/take-test')) return 'Test Session';
    return 'Fullscreen Mode';
  });

  showAdminPageBanner(): boolean {
    const route = this.currentRoute();
    return !!route && !route.includes('/login') && !route.includes('/take-test');
  }

  adminPageTitle(): string {
    const route = this.currentRoute().split('?')[0].split('/')[1] || 'dashboard';
    const titles: Record<string, string> = {
      dashboard: 'Admin Dashboard',
      notifications: 'Student Notifications',
      careers: 'Careers',
      'syllabus-master': 'Syllabus Master',
      'tag-master': 'Tag Management',
      'questions-master': 'Question Bank',
      'directory-master': 'Directory Master',
      'program-faqs': 'Program FAQs',
      'announcement-master': 'Announcement Management',
      testimonials: 'Testimonials',
      'support-features': 'Plan Benefits',
      'free-resource-admin': 'Free Resources',
      'simple-news-admin': 'News Management',
      'live-content-admin': 'Live Content',
      'students-list': 'Student Directory',
      'student-profile': 'Student Profile',
      'exam-monitoring': 'Exam Monitoring',
      'support-tickets': 'Support Tickets',
      'meeting-admin': 'Prelims Mentorship',
      'mains-meeting-admin': 'Mains Mentorship',
      'admin-mentorship': 'Mentorship Programs',
      'manage-plans': 'Manage Plans',
      'manage-program': 'Manage Programs',
      'manage-coupon': 'Coupon Management',
      'manage-tests': 'Test Management',
      'prelims-tests': 'Prelims Tests',
      'live-test': 'Live Tests',
      'demo-test-admin': 'Demo Tests',
      'prelims-test-series': 'Prelims Test Series',
      'mains-test-series': 'Mains Test Series',
      'answer-writing': 'Daily Answer Writing',
      quizzes: 'Quiz Management',
      'prelims-results': 'Prelims Results',
      'admin-results': 'Results Management',
      'study-module': 'Study Modules'
    };
    return titles[route] || 'Admin Workspace';
  }

  adminPageSubtitle(): string {
    const subtitles: Record<string, string> = {
      dashboard: 'A clear view of your learning platform operations.',
      notifications: 'Create and deliver timely updates to students.',
      careers: 'Create and manage opportunities for the ThinkCivil IAS team.',
      'tag-master': 'Create, edit, and manage tags with category hierarchy',
      'syllabus-master': 'Manage syllabus, topic explanations, and learning resources.',
      'students-list': 'Search, review, and manage your student community.',
      'program-faqs': 'Keep program questions and answers accurate and useful.',
      'announcement-master': 'Publish important updates across the student experience.',
      'manage-plans': 'Configure plans, pricing, and access for your programs.'
    };
    const route = this.currentRoute().split('?')[0].split('/')[1] || 'dashboard';
    return subtitles[route] || 'Manage your ThinkCivil IAS platform from one workspace.';
  }

  getMenuIcon(item: MenuItem): string {
    const value = `${item.name || ''} ${item.path || ''}`.toLowerCase();
    const iconMap: Array<[string[], string]> = [
      [['dashboard'], 'dashboard'],
      [['notification', 'announcement'], 'campaign'],
      [['career', 'job'], 'work'],
      [['student profile', 'students/'], 'person'],
      [['student', 'user'], 'groups'],
      [['syllabus'], 'menu_book'],
      [['directory'], 'folder_shared'],
      [['question'], 'quiz'],
      [['tag'], 'sell'],
      [['faq'], 'help_center'],
      [['testimonial'], 'format_quote'],
      [['support'], 'support_agent'],
      [['free resource', 'resource'], 'library_books'],
      [['simple news', 'news'], 'newspaper'],
      [['live content'], 'live_tv'],
      [['exam monitoring', 'monitoring'], 'monitor_heart'],
      [['meeting'], 'event'],
      [['mentorship'], 'diversity_3'],
      [['plan'], 'payments'],
      [['coupon'], 'local_offer'],
      [['program'], 'school'],
      [['answer writing'], 'edit_note'],
      [['test series'], 'fact_check'],
      [['live test', 'live-test'], 'timer'],
      [['demo test', 'demo-test'], 'science'],
      [['test'], 'assignment'],
      [['quiz'], 'psychology'],
      [['result'], 'analytics'],
      [['study module'], 'auto_stories']
    ];
    const match = iconMap.find(([keywords]) => keywords.some(keyword => value.includes(keyword)));
    return match?.[1] || item.icon || 'apps';
  }

  // Show header only for specific fullscreen routes
  showFullscreenHeader(): boolean {
    const route = this.currentRoute();
    return route.includes('/take-test');
  }

  logout() {
    // this.closeProfileDropdown();
    this.authService.logout();
    // Exit fullscreen if active
    
  }
}
