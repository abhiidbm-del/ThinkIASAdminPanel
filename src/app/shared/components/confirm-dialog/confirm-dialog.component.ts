import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `<div class="confirm-dialog"><button class="close-button" mat-dialog-close aria-label="Close">&times;</button><div class="dialog-icon"><mat-icon>{{ data.icon || 'delete_outline' }}</mat-icon></div><span class="dialog-eyebrow">CONFIRM ACTION</span><h2 mat-dialog-title>{{ data.title }}</h2><p mat-dialog-content>{{ data.message }}</p><div mat-dialog-actions align="end"><button class="cancel-button" mat-dialog-close>Cancel</button><button class="confirm-button" [mat-dialog-close]="true">{{ data.confirmText || 'Delete' }}</button></div></div>`,
  styles: [`:host{display:block}.confirm-dialog{position:relative;padding:28px 28px 22px;text-align:center}.close-button{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:50%;background:#f1f5f9;color:#64748b;font-size:22px;line-height:1;cursor:pointer}.dialog-icon{display:grid;width:58px;height:58px;place-items:center;margin:0 auto 14px;border-radius:50%;background:#fff1f2;color:#e11d48}.dialog-icon mat-icon{font-size:29px;width:29px;height:29px}.dialog-eyebrow{color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.14em}.confirm-dialog h2{margin:7px 0 8px;color:#172033;font-size:21px}.confirm-dialog p{max-width:360px;margin:0 auto;color:#64748b;line-height:1.5}.confirm-dialog [mat-dialog-actions]{gap:10px;margin:22px 0 0;padding:0}.cancel-button,.confirm-button{border:0;border-radius:8px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer}.cancel-button{background:#f1f5f9;color:#475569}.confirm-button{background:#e11d48;color:#fff}.confirm-button:hover{background:#be123c}`]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData, private dialogRef: MatDialogRef<ConfirmDialogComponent>) {}
}
