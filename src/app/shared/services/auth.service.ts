import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { User, MenuItem, AuthResponse } from '../../core/models/user.model';
import { environment } from '../../../environment/environment';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  attempts?: number;
  remainingAttempts?: number;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  otp: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;  
  private router = inject(Router);
  
  // Private signals
  private currentUserSignal = signal<User | null>(null);
  private menuItemsSignal = signal<MenuItem[]>([]);
  private isOnAuthPageSignal = signal<boolean>(false);
  private otpStatusSignal = signal<{
    sent: boolean;
    verified: boolean;
    email: string;
    expiresAt?: Date;
  }>({
    sent: false,
    verified: false,
    email: ''
  });

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
    
    // Track route changes to determine if we're on auth pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.url;
      const isAuthPage =
      //  url.includes('/login') || 
      //                    url.includes('/register') || 
      //                    url.includes('/forgot-password') ||
      //                    url.includes('/reset-password') ||
                        //  url.includes('/landing-page') ||
                        //  url.includes('/homepage') ||
                         url === '/';
      this.isOnAuthPageSignal.set(isAuthPage);
    });
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const menuItems = localStorage.getItem('menuItems');

    if (token && user && menuItems) {
      this.currentUserSignal.set(JSON.parse(user));
      this.menuItemsSignal.set(JSON.parse(menuItems));
    }

    // Load OTP status if exists
    const otpStatus = localStorage.getItem('otpStatus');
    if (otpStatus) {
      this.otpStatusSignal.set(JSON.parse(otpStatus));
    }
  }

  // Modified isLoggedIn computed property
  public isLoggedIn = computed(() => {
    // Authentication must not depend on the previous route during redirects.
    return !!this.currentUserSignal();
  });

  // OTP status computed properties
  public isOTPSent = computed(() => this.otpStatusSignal().sent);
  public isOTPVerified = computed(() => this.otpStatusSignal().verified);
  public otpEmail = computed(() => this.otpStatusSignal().email);
  public otpExpiresAt = computed(() => this.otpStatusSignal().expiresAt);

  // Keep other computed properties
  public currentUser = computed(() => this.currentUserSignal());
  public menuItems = computed(() => this.withWebsitePageMenuItems(this.menuItemsSignal()));

  private normalizeMenuItemName(name: string): string {
    const normalized = name?.trim() || '';
    if (normalized === 'Tag Master') return 'Tag Management';
    if (
      normalized === 'Plan Benefits' ||
      normalized === 'Support Features' ||
      normalized === 'Support Feature'
    ) return 'Plan Benefits';
    return normalized;
  }

  private withWebsitePageMenuItems(menuItems: MenuItem[]): MenuItem[] {
    const hasWebsitePageManage = menuItems.some(item => item.name === 'Website Page Manage');
    const normalizedItems = hasWebsitePageManage
      ? menuItems.filter(item => !this.isWebsitePageItem(item.path))
      : menuItems;

    const migratedItems = this.normalizeLegacyQuestionManagementGroup(
      normalizedItems.map(item => {
        if (item.name !== 'Website Page Manage') {
          return {
            ...item,
            name: this.normalizeMenuItemName(item.name || ''),
            children: item.children?.map(child => ({
              ...child,
              name: this.normalizeMenuItemName(child.name || '')
            }))
          };
        }

        const children = (item.children || []).map(child => {
          if (this.isAnnouncementItem(child.path)) {
            return { ...child, name: 'Announcement Master', path: '/announcement-master' };
          }
          if (this.isCareersItem(child.path)) {
            return { ...child, name: 'Careers', path: '/careers' };
          }
          return child;
        });

        const websitePagePaths = children.map(child => child.path);
        if (!websitePagePaths.some(path => this.isAnnouncementItem(path))) {
          children.push({ name: 'Announcement Master', path: '/announcement-master', icon: 'campaign' });
        }
        if (!websitePagePaths.some(path => this.isCareersItem(path))) {
          children.push({ name: 'Careers', path: '/careers', icon: 'work' });
        }

        return {
          ...item,
          children
        };
      })
    );

    return migratedItems.filter(item => item.name !== 'Question Management');
  }

  private normalizeLegacyQuestionManagementGroup(menuItems: MenuItem[]): MenuItem[] {
    const legacyPaths = new Set(['/tag-master', '/questions-master', '/quizzes']);
    const legacyNames = new Set(['Tag Master', 'Tag Management', 'Question Bank', 'Quiz Management', 'Manage Quiz']);

    const hasGroupedQuestionMenu = menuItems.some(item =>
      item.name === 'Question Management' || item.name === 'Question Management'
    );

    const legacyQuestionEntries = menuItems.filter(item => {
      const matchesPath = legacyPaths.has(item.path);
      const matchesName = legacyNames.has(item.name || '');
      return matchesPath || matchesName;
    });

    if (hasGroupedQuestionMenu || legacyQuestionEntries.length === 0) {
      return menuItems;
    }

    const groupedChildren: MenuItem[] = legacyQuestionEntries.map(item => ({
      ...item,
      path: item.path || this.getLegacyQuestionPath(item.name || ''),
      children: undefined
    }));

    const filteredMenuItems = menuItems.filter(item => {
      if (!item.path) return true;
      const matchesPath = legacyPaths.has(item.path);
      const matchesName = legacyNames.has(item.name || '');
      return !(matchesPath || matchesName);
    });

    const questionGroup: MenuItem = {
      name: 'Question Management',
      path: '',
      icon: 'quiz',
      children: groupedChildren
    };

    return [questionGroup, ...filteredMenuItems];
  }

  private getLegacyQuestionPath(name: string): string {
    const normalizedName = name.toLowerCase();
    if (normalizedName.includes('tag')) return '/tag-master';
    if (normalizedName.includes('question')) return '/questions-master';
    if (normalizedName.includes('quiz')) return '/quizzes';
    return '';
  }

  private isAnnouncementItem(path: string): boolean {
    return path === '/announcement-master' || path === 'announcement-master';
  }

  private isCareersItem(path: string): boolean {
    return path === '/careers' || path === 'careers' || path === '/career' || path === 'career';
  }

  private isWebsitePageItem(path: string): boolean {
    return this.isAnnouncementItem(path) || this.isCareersItem(path);
  }

  /**
   * Send OTP to email for registration
   */
  sendOTP(email: string) {
    return this.http.post<SendOTPResponse>(`${this.apiUrl}/send-otp`, { email }).pipe(
      tap(response => {
        if (response.success) {
          const otpStatus = {
            sent: true,
            verified: false,
            email: email,
            expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined
          };
          this.otpStatusSignal.set(otpStatus);
          localStorage.setItem('otpStatus', JSON.stringify(otpStatus));
        }
      })
    );
  }

  /**
   * Verify OTP
   */
  verifyOTP(email: string, otp: string) {
    return this.http.post<VerifyOTPResponse>(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      tap(response => {
        if (response.success) {
          const currentOtpStatus = this.otpStatusSignal();
          const updatedOtpStatus = {
            ...currentOtpStatus,
            verified: true
          };
          this.otpStatusSignal.set(updatedOtpStatus);
          localStorage.setItem('otpStatus', JSON.stringify(updatedOtpStatus));
        }
      })
    );
  }

  /**
   * Resend OTP
   */
  resendOTP(email: string) {
    return this.sendOTP(email);
  }

  /**
   * Clear OTP status
   */
  clearOTPStatus() {
    this.otpStatusSignal.set({
      sent: false,
      verified: false,
      email: ''
    });
    localStorage.removeItem('otpStatus');
  }

  /**
   * Check if OTP is still valid
   */
  isOTPValid(): boolean {
    const status = this.otpStatusSignal();
    if (!status.sent || !status.expiresAt) return false;
    
    return new Date() < new Date(status.expiresAt);
  }

  /**
   * Register with OTP verification
   */
  register(userData: RegisterData) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        // Clear OTP status after successful registration
        this.clearOTPStatus();
        this.setAuthData(response);
      })
    );
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setAuthData(response);
      })
    );
  }

  setAuthData(response: AuthResponse) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('menuItems', JSON.stringify(response.menuItems));
    this.currentUserSignal.set(response.user);
    this.menuItemsSignal.set(response.menuItems);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('menuItems');
    localStorage.removeItem('otpStatus');
    localStorage.removeItem('test_language');
    this.clearAllProgress();
    this.currentUserSignal.set(null);
    this.menuItemsSignal.set([]);
    this.clearOTPStatus();
    this.router.navigate(['/login']);
  }
  
  private readonly STORAGE_KEY = 'test_progress_';

  clearAllProgress(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Check if email is verified for registration
   */
  canRegister(email: string): boolean {
    const status = this.otpStatusSignal();
    return status.sent && status.verified && status.email === email && this.isOTPValid();
  }

  /**
   * Get remaining time for OTP in seconds
   */
  getOTPRemainingTime(): number {
    const status = this.otpStatusSignal();
    if (!status.expiresAt) return 0;
    
    const now = new Date().getTime();
    const expires = new Date(status.expiresAt).getTime();
    return Math.max(0, Math.floor((expires - now) / 1000));
  }

  /**
   * Format remaining time as MM:SS
   */
  formatRemainingTime(): string {
    const seconds = this.getOTPRemainingTime();
    if (seconds <= 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  sendPasswordResetOTP(email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/forgot-password`, { email });
}

/**
 * Verify password reset OTP
 */
verifyPasswordResetOTP(email: string, otp: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/verify-reset-otp`, { email, otp });
}

/**
 * Reset password with OTP
 */
resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/reset-password`, {
    email,
    otp,
    newPassword,
    confirmPassword
  });
}

refreshUser(): Observable<{ user: User; menuItems: MenuItem[] }> {
  return this.http.get<{ user: User; menuItems: MenuItem[] }>(`${this.apiUrl}/me`).pipe(
    tap(response => {
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('menuItems', JSON.stringify(response.menuItems));
      this.currentUserSignal.set(response.user);
      this.menuItemsSignal.set(response.menuItems);
    })
  );
}
}
