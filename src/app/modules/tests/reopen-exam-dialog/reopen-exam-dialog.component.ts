import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

interface ReopenExamDialogData {
  testTitle?: string;
}

function toLocalPickerValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

@Component({
  selector: 'app-reopen-exam-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <section class="reopen-dialog">
      <header class="dialog-header">
        <div class="header-icon"><mat-icon>lock_open</mat-icon></div>
        <div class="header-copy">
          <span class="eyebrow">EXAM ACCESS</span>
          <h2 mat-dialog-title>Reopen exam</h2>
          <p *ngIf="data.testTitle">{{ data.testTitle }}</p>
        </div>
        <button mat-icon-button type="button" mat-dialog-close aria-label="Close dialog" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-dialog-content>
        <p class="dialog-description">Choose the student and the date/time until which they can access this exam.</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Student email</mat-label>
          <input matInput type="email" [(ngModel)]="email" name="studentEmail" required email autocomplete="email" placeholder="student@example.com">
          <mat-icon matPrefix>mail</mat-icon>
          <mat-error *ngIf="!email.trim()">Student email is required</mat-error>
          <mat-error *ngIf="email.trim() && !isValidEmail()">Enter a valid email address</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width date-time-field">
          <mat-label>Reopen until</mat-label>
          <input #untilInput matInput type="datetime-local" [(ngModel)]="until" name="reopenUntil" [min]="minimumDateTime" required>
          <button mat-icon-button matSuffix type="button" aria-label="Choose date and time" (click)="openDateTimePicker()">
            <mat-icon>calendar_month</mat-icon>
          </button>
          <mat-hint>Select both a date and a time</mat-hint>
          <mat-error *ngIf="!until || !isFutureDateTime()">Choose a future date and time</mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="button" class="confirm-button" (click)="confirm()" [disabled]="!canConfirm()">
          <mat-icon>lock_open</mat-icon>Reopen exam
        </button>
      </mat-dialog-actions>
    </section>
  `,
  styles: [`
    :host{display:block;color:#183344}
    .reopen-dialog{min-width:0;background:#fff}
    .dialog-header{display:flex;align-items:flex-start;gap:14px;padding:22px 24px 16px;border-bottom:1px solid #e6edef;background:linear-gradient(115deg,#f5fafb,#fff)}
    .header-icon{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border-radius:10px;background:#e3f1f3;color:#27728a}
    .header-copy{min-width:0;flex:1}
    .eyebrow{color:#27728a;font-size:10px;font-weight:800}
    h2[mat-dialog-title]{margin:3px 0 0;color:#183c50;font-size:20px;font-weight:700}
    .header-copy p{margin:5px 0 0;color:#6c7d85;font-size:12px;overflow-wrap:anywhere}
    .close-button{margin:-6px -8px 0 0;color:#70828b}
    mat-dialog-content{display:grid;gap:10px;padding:18px 24px 8px!important}
    .dialog-description{margin:0 0 4px;color:#5f7078;font-size:13px;line-height:1.5}
    .full-width{width:100%}
    .date-time-field input::-webkit-calendar-picker-indicator{cursor:pointer;opacity:.72}
    mat-dialog-actions{gap:8px;padding:12px 24px 20px!important}
    .confirm-button{min-height:40px;border-radius:6px;background:#1d6b70;color:#fff}
    .confirm-button mat-icon{margin-right:5px}
    @media(max-width:480px){.dialog-header{padding:18px 18px 14px}.header-icon{width:38px;height:38px;flex-basis:38px}mat-dialog-content{padding:16px 18px 8px!important}mat-dialog-actions{padding:10px 18px 18px!important}}
  `]
})
export class ReopenExamDialogComponent {
  readonly data = inject<ReopenExamDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ReopenExamDialogComponent>);
  @ViewChild('untilInput') untilInput?: ElementRef<HTMLInputElement>;

  email = '';
  readonly minimumDateTime = toLocalPickerValue(new Date());
  until = toLocalPickerValue(new Date(Date.now() + 2 * 60 * 60 * 1000));

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  isFutureDateTime(): boolean {
    return !!this.until && new Date(this.until).getTime() > Date.now();
  }

  canConfirm(): boolean {
    return this.isValidEmail() && this.isFutureDateTime();
  }

  openDateTimePicker(): void {
    const input = this.untilInput?.nativeElement as (HTMLInputElement & { showPicker?: () => void }) | undefined;
    if (!input) return;
    if (input.showPicker) input.showPicker();
    else input.focus();
  }

  confirm(): void {
    if (!this.canConfirm()) return;
    this.dialogRef.close({ email: this.email.trim(), until: new Date(this.until).toISOString() });
  }
}