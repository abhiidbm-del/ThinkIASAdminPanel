import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// src/app/modules/dashboard/payment-dialog/payment-dialog.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TestService } from '../../../shared/services/test.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../shared/services/auth.service';

export interface PaymentDialogData {
  selectedPlan: 'pre' | 'mains' | 'combo';
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.css'
})
export class PaymentDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private testService = inject(TestService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  

  paymentForm: FormGroup;
  selectedPlan = signal<'pre' | 'mains' | 'combo'>(this.data.selectedPlan);
  processing = signal(false);

  planPrices = {
    pre: 499,
    mains: 699,
    combo: 999
  };

  constructor() {
    this.paymentForm = this.fb.group({
      plan: [this.data.selectedPlan, Validators.required],
      bank: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  onPlanChange(plan: 'pre' | 'mains' | 'combo') {
    this.selectedPlan.set(plan);
  }

  getPlanName(plan: string): string {
    const planNames: { [key: string]: string } = {
      pre: 'PRE Foundation',
      mains: 'MAINS Mastery',
      combo: 'COMBO Complete'
    };
    return planNames[plan] || 'Unknown Plan';
  }

  getPlanAmount(plan: string): number {
    return this.planPrices[plan as keyof typeof this.planPrices] || 0;
  }

  calculateGST(): number {
    const baseAmount = this.getPlanAmount(this.selectedPlan());
    return Math.round(baseAmount * 0.18);
  }

  calculateTotal(): number {
    const baseAmount = this.getPlanAmount(this.selectedPlan());
    const gst = this.calculateGST();
    return baseAmount + gst;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onPayNow(): void {
    if (this.paymentForm.valid) {
      this.processing.set(true);

      const paymentData = {
        plan: this.selectedPlan(),
        bank: this.paymentForm.value.bank,
        amount: this.calculateTotal(),
        baseAmount: this.getPlanAmount(this.selectedPlan()),
        gst: this.calculateGST(),
        timestamp: new Date().toISOString()
      };

      // Simulate API call to process payment
      this.testService.processPayment(paymentData).subscribe({
        next: (response) => {
          this.processing.set(false);
          this.snackBar.open('Payment successful! Welcome to ThinkCivil Premium. Login again and start exploring!!', 'Close', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
          
          this.dialogRef.close(true);
          this.logout();
          // Redirect to success page or dashboard
          // this.router.navigate(['/payment-success'], {
          //   queryParams: { 
          //     plan: this.selectedPlan(),
          //     amount: this.calculateTotal(),
          //     transactionId: response.transactionId || 'TXN' + Date.now()
          //   }
          // });
        },
        error: (error) => {
          this.processing.set(false);
          console.error('Payment error:', error);
          this.snackBar.open('Payment failed. Please try again.', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
    }
  }

  logout() {
        this.authService.logout();

  }
}