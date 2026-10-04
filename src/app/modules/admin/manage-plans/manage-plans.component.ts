import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminPlan, PlanAdminService } from '../../../shared/services/plan-admin.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-manage-plans',
  standalone: true,
  imports: [TranslatePipe, CommonModule, FormsModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './manage-plans.component.html',
  styleUrls: ['./manage-plans.component.css']
})
export class ManagePlansComponent implements OnInit {
  @ViewChild('editorTemplate') private editorTemplate!: TemplateRef<unknown>;
  private editorDialog?: MatDialogRef<unknown>;

  plans: AdminPlan[] = [];
  editing: AdminPlan | null = null;
  featuresText = '';
  featuresHindiText = '';
  loading = false;
  saving = false;
  deletingPlanId: string | null = null;
  message = '';
  error = '';

  constructor(
    private service: PlanAdminService,
    private dialog: MatDialog,
    private confirmDialog: ConfirmDialogService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = '';
    this.service.getAll().subscribe({
      next: response => { this.plans = response.data; this.loading = false; },
      error: error => { this.error = error?.error?.message || 'Plans could not be loaded.'; this.loading = false; }
    });
  }

  includesPrelims = true; includesMains = false;
  creating = false;
  add(): void {
    this.includesPrelims = true; this.includesMains = false; this.message = '';
    this.creating = true; this.error = ''; this.featuresText = ''; this.featuresHindiText = '';
    this.editing = {id: '', accessType: 'pre', name: '', subtitle: '', badge: '', baseAmount: 0, totalAmount: 0, duration: '', features: [], displayOrder: this.plans.length + 1, isActive: true};
    this.openEditor();
  }
  edit(plan: AdminPlan): void {
    this.creating = false;
    this.editing = { ...plan, accessType: plan.accessType || (plan.id as 'pre' | 'mains' | 'combo'), features: [...plan.features] };
    this.includesPrelims = this.editing.accessType !== 'mains';
    this.includesMains = this.editing.accessType !== 'pre';
    this.featuresText = plan.features.join('\n');
    this.featuresHindiText = (plan.featuresHindi || []).join('\n');
    this.message = ''; this.error = '';
    this.openEditor();
  }

  cancel(): void { this.editorDialog?.close(); }

  private openEditor(): void {
    this.editorDialog = this.dialog.open(this.editorTemplate, {
      width: '920px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      panelClass: 'manage-plan-dialog-panel',
      autoFocus: false
    });
    this.editorDialog.afterClosed().subscribe(() => {
      this.editing = null;
      this.editorDialog = undefined;
    });
  }

  deletePlan(plan: AdminPlan): void {
    if (this.deletingPlanId) return;
    this.confirmDialog.ask({
      title: 'Delete this plan?',
      message: `Delete "${plan.name}"? Plans with programs or batches cannot be deleted.`,
      confirmText: 'Delete plan',
      icon: 'delete_outline'
    }).subscribe(() => {
      this.deletingPlanId = plan.id;
      this.error = '';
      this.message = '';
      this.service.delete(plan.id).subscribe({
        next: () => {
          this.deletingPlanId = null;
          this.snackBar.open(`Plan "${plan.name}" deleted successfully.`, 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.load();
        },
        error: error => {
          this.deletingPlanId = null;
          this.error = error?.error?.message || 'Plan could not be deleted.';
          if (error?.status === 409) {
            this.confirmDialog.ask({
              title: 'Plan still has programs',
              message: this.error,
              confirmText: 'Got it',
              icon: 'warning'
            }).subscribe();
          } else {
            this.snackBar.open(this.error, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        }
      });
    });
  }

  save(): void {
    if (!this.editing || this.saving) return;
    if (!this.includesPrelims && !this.includesMains) { this.error = 'Choose at least one included course.'; return; }
    this.editing.accessType = this.includesPrelims && this.includesMains ? 'combo' : this.includesPrelims ? 'pre' : 'mains';
    this.editing.features = this.featuresText.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    this.editing.featuresHindi = this.featuresHindiText.split(/\r?\n/).map(value => value.trim());
    this.editing.baseAmount = Number(this.editing.baseAmount);
    this.editing.totalAmount = Number(this.editing.totalAmount);
    this.editing.displayOrder = Number(this.editing.displayOrder);
    if (!this.editing.name.trim() || !Number.isFinite(this.editing.totalAmount) || this.editing.totalAmount < 0) { this.error = 'Plan name and a valid price are required.'; return; }
    this.saving = true; this.error = '';
    (this.creating ? this.service.create(this.editing) : this.service.update(this.editing)).subscribe({
      next: () => {
        const successMessage = this.creating ? 'Plan created successfully.' : 'Plan updated successfully.';
        this.saving = false;
        this.editing = null;
        this.editorDialog?.close();
        this.message = '';
        this.snackBar.open(successMessage, 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.load();
      },
      error: error => { this.error = error?.error?.message || 'Plan could not be updated.'; this.saving = false; }
    });
  }
}
