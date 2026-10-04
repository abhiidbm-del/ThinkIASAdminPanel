import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminPlan, PlanAdminService } from '../../../shared/services/plan-admin.service';

@Component({
  selector: 'app-manage-plans',
  standalone: true,
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './manage-plans.component.html',
  styleUrls: ['./manage-plans.component.css']
})
export class ManagePlansComponent implements OnInit {
  plans: AdminPlan[] = [];
  editing: AdminPlan | null = null;
  featuresText = '';
  featuresHindiText = '';
  loading = false;
  saving = false;
  message = '';
  error = '';

  constructor(private service: PlanAdminService) {}
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
  }
  edit(plan: AdminPlan): void {
    this.creating = false;
    this.editing = { ...plan, accessType: plan.accessType || (plan.id as 'pre' | 'mains' | 'combo'), features: [...plan.features] };
    this.includesPrelims = this.editing.accessType !== 'mains';
    this.includesMains = this.editing.accessType !== 'pre';
    this.featuresText = plan.features.join('\n');
    this.featuresHindiText = (plan.featuresHindi || []).join('\n');
    this.message = ''; this.error = '';
  }

  cancel(): void { this.editing = null; }

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
      next: () => { this.saving = false; this.editing = null; this.message = this.creating ? 'New plan created successfully.' : 'Plan updated successfully.'; this.load(); },
      error: error => { this.error = error?.error?.message || 'Plan could not be updated.'; this.saving = false; }
    });
  }
}
