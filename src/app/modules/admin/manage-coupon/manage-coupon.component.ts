// src/app/modules/admin/manage-coupon/manage-coupon.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

interface Coupon {
  _id?: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isOneTimePerUser: boolean;
  applicablePlans: string[];
  perUserLimit: number;
  maxUses?: number | null;
  validUntil: string;
  isActive: boolean;
  usedCount?: number;
  minPurchaseAmount?: number;
}

@Component({
  selector: 'app-manage-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, MatProgressSpinner],
  templateUrl: './manage-coupon.component.html',
  styleUrls: ['./manage-coupon.component.css']
})
export class ManageCouponComponent implements OnInit {
  coupons: Coupon[] = [];
  plans: {id:string;name:string}[]=[];
  loading = false;
  showCreateForm = false;
  editingCoupon: Coupon | null = null;

  copiedCode: string | null = null;
  copyTimeout: any;
  
  // Form for new coupon
  newCoupon: Coupon = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    isOneTimePerUser: false,
    applicablePlans: [],
    perUserLimit: 1,
    maxUses: null,
    validUntil: '',
    isActive: true,
    minPurchaseAmount: 0
  };

  // For quick one-time coupon generation
  quickCoupon = {
    days: 30,
    plan: '',
    discountValue: 50
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCoupons();
    this.http.get<any>(environment.apiUrl+'/plans/admin/all').subscribe({next:r=>this.plans=r.data||[],error:()=>this.plans=[]});
  }

  loadCoupons(): void {
    this.loading = true;
    this.http.get<{ coupons: Coupon[] }>(`${environment.apiUrl}/coupons/admin/all`)
      .subscribe({
        next: (res) => {
          this.coupons = res.coupons || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading coupons:', err);
          this.loading = false;
          alert('Failed to load coupons');
        }
      });
  }

  generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateQuickCoupon(): void {
    if (!this.quickCoupon.days) {
      alert('Please enter validity days');
      return;
    }

    if (!this.quickCoupon.discountValue) {
      alert('Please enter discount percentage');
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + this.quickCoupon.days);

    const couponData = {
      code: '', // Leave empty for auto-generation
      description: this.quickCoupon.discountValue === 100 
        ? 'Free access coupon - One time use per user'
        : `${this.quickCoupon.discountValue}% off coupon - One time use per user`,
      discountType: 'percentage',
      discountValue: this.quickCoupon.discountValue,
      isOneTimePerUser: true, // Always one-time for quick generate
      applicablePlans: this.quickCoupon.plan ? [this.quickCoupon.plan] : [],
      perUserLimit: 1, // Will be forced by backend
      maxUses: null,
      validUntil: validUntil.toISOString().split('T')[0],
      isActive: true,
      minPurchaseAmount: 0
    };

    this.http.post(`${environment.apiUrl}/coupons/create`, couponData)
      .subscribe({
        next: (res: any) => {
          alert(`Coupon generated successfully! Code: ${res.coupon.code}`);
          this.loadCoupons();
    this.http.get<any>(environment.apiUrl+'/plans/admin/all').subscribe({next:r=>this.plans=r.data||[],error:()=>this.plans=[]});
          // Reset form
          this.quickCoupon = {
            days: 30,
            plan: '',
            discountValue: 50
          };
        },
        error: (err) => {
          console.error('Error generating coupon:', err);
          alert(err.error?.message || 'Failed to generate coupon');
        }
      });
  }

  createCoupon(): void {
    if (!this.newCoupon.validUntil) {
      alert('Validity date is required');
      return;
    }

    // Validate discount value
    if (this.newCoupon.discountType === 'percentage' && this.newCoupon.discountValue > 100) {
      alert('Percentage discount cannot exceed 100%');
      return;
    }

    const couponData = {
      ...this.newCoupon,
      code: this.newCoupon.code ? this.newCoupon.code.toUpperCase() : '', // Empty code will trigger auto-generation
      isOneTimePerUser: this.newCoupon.isOneTimePerUser || false
    };

    this.http.post(`${environment.apiUrl}/coupons/create`, couponData)
      .subscribe({
        next: (res: any) => {
          alert(`Coupon created successfully! Code: ${res.coupon.code}`);
          this.resetForm();
          this.loadCoupons();
    this.http.get<any>(environment.apiUrl+'/plans/admin/all').subscribe({next:r=>this.plans=r.data||[],error:()=>this.plans=[]});
          this.showCreateForm = false;
        },
        error: (err) => {
          console.error('Error creating coupon:', err);
          alert(err.error?.message || 'Failed to create coupon');
        }
      });
  }

  updateCoupon(): void {
    if (!this.editingCoupon?._id) {
      alert('No coupon selected for editing');
      return;
    }

    this.http.put(`${environment.apiUrl}/coupons/${this.editingCoupon._id}`, this.editingCoupon)
      .subscribe({
        next: () => {
          alert('Coupon updated successfully');
          this.editingCoupon = null;
          this.loadCoupons();
    this.http.get<any>(environment.apiUrl+'/plans/admin/all').subscribe({next:r=>this.plans=r.data||[],error:()=>this.plans=[]});
        },
        error: (err) => {
          console.error('Error updating coupon:', err);
          alert(err.error?.message || 'Failed to update coupon');
        }
      });
  }

  deleteCoupon(id: string): void {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this coupon?')) {
      this.http.delete(`${environment.apiUrl}/coupons/${id}`)
        .subscribe({
          next: () => {
            alert('Coupon deleted successfully');
            this.loadCoupons();
    this.http.get<any>(environment.apiUrl+'/plans/admin/all').subscribe({next:r=>this.plans=r.data||[],error:()=>this.plans=[]});
          },
          error: (err) => {
            console.error('Error deleting coupon:', err);
            alert(err.error?.message || 'Failed to delete coupon');
          }
        });
    }
  }

  toggleStatus(coupon: Coupon): void {
    if (!coupon._id) return;
    
    this.http.put(`${environment.apiUrl}/coupons/${coupon._id}`, { isActive: !coupon.isActive })
      .subscribe({
        next: () => {
          coupon.isActive = !coupon.isActive;
          alert(`Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`);
        },
        error: (err) => {
          console.error('Error toggling status:', err);
          alert(err.error?.message || 'Failed to update status');
        }
      });
  }

  editCoupon(coupon: Coupon): void {
    this.editingCoupon = { 
      ...coupon,
      validUntil: this.formatDate(coupon.validUntil)
    };
    this.showCreateForm = false;
  }

  cancelEdit(): void {
    this.editingCoupon = null;
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newCoupon = {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      isOneTimePerUser: false,
      applicablePlans: [],
      perUserLimit: 1,
      maxUses: null,
      validUntil: '',
      isActive: true,
      minPurchaseAmount: 0
    };
  }

  showCreateFormToggle(): void {
    this.showCreateForm = true;
    this.editingCoupon = null;
    this.resetForm();
  }

  onPlanCheckboxChange(plan: string, event: any, isEditing: boolean): void {
    const target = isEditing ? this.editingCoupon : this.newCoupon;
    if (!target) return;

    if (event.target.checked) {
      if (!target.applicablePlans.includes(plan)) {
        target.applicablePlans.push(plan);
      }
    } else {
      target.applicablePlans = target.applicablePlans.filter((p: string) => p !== plan);
    }
  }

  getPlanName(planId: string): string {
    const plans: { [key: string]: string } = {
      'pre': 'Prelims',
      'mains': 'Mains',
      'combo': 'Combo'
    };
    return this.plans.find(plan=>plan.id===planId)?.name || plans[planId] || planId;
  }

  isExpired(date: string): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getDiscountDisplay(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% OFF`;
    }
    return `₹${coupon.discountValue} OFF`;
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

    copyToClipboard(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      
      // Clear previous timeout
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
      
      // Reset after 2 seconds
      this.copyTimeout = setTimeout(() => {
        this.copiedCode = null;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      this.copiedCode = code;
      setTimeout(() => {
        this.copiedCode = null;
      }, 2000);
    });
  }
}