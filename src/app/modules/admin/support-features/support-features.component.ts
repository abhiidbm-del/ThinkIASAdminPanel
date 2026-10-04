import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportFeature, SupportFeaturePayload } from '../../../core/models/support-feature.model';
import { SupportFeatureService } from '../../../shared/services/support-feature.service';

@Component({
  selector: 'app-support-features', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './support-features.component.html', styleUrls: ['./support-features.component.css']
})
export class SupportFeaturesComponent implements OnInit {
  features: SupportFeature[] = [];
  form = this.emptyForm();
  pointsText = '';
  pointsHindiText = '';
  editingId: string | null = null;
  showForm = false;
  loading = false;
  saving = false;
  error = '';

  constructor(private service: SupportFeatureService) {}
  ngOnInit(): void { this.load(); }

  private emptyForm(): SupportFeaturePayload {
    return { title: '', titleHindi: '', description: '', descriptionHindi: '', points: [], pointsHindi: [], footer: '', footerHindi: '', icon: 'bi-file-earmark-text', displayOrder: 1, isActive: true };
  }

  load(): void {
    this.loading = true; this.error = '';
    this.service.getAll().subscribe({
      next: response => { this.features = response.data || []; this.loading = false; },
      error: error => { this.error = error?.error?.message || 'Support features could not be loaded.'; this.loading = false; }
    });
  }

  openCreate(): void {
    this.editingId = null; this.form = this.emptyForm();
    this.form.displayOrder = this.features.length + 1;
    this.pointsText = ''; this.pointsHindiText = ''; this.error = ''; this.showForm = true;
  }

  openEdit(item: SupportFeature): void {
    this.editingId = item._id; this.form = { ...item, points: [...item.points], pointsHindi: [...item.pointsHindi] };
    this.pointsText = item.points.join('\n'); this.pointsHindiText = item.pointsHindi.join('\n'); this.error = ''; this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.saving = false; this.editingId = null; }

  save(): void {
    const payload: SupportFeaturePayload = {
      ...this.form,
      title: this.form.title.trim(), titleHindi: this.form.titleHindi.trim(),
      description: this.form.description.trim(), descriptionHindi: this.form.descriptionHindi.trim(),
      footer: this.form.footer.trim(), footerHindi: this.form.footerHindi.trim(), icon: this.form.icon.trim(),
      displayOrder: Number(this.form.displayOrder),
      points: this.lines(this.pointsText), pointsHindi: this.lines(this.pointsHindiText)
    };
    if (!payload.title || !payload.description || payload.displayOrder < 0) { this.error = 'English title, description and a valid display order are required.'; return; }
    this.saving = true; this.error = '';
    const request = this.editingId ? this.service.update(this.editingId, payload) : this.service.create(payload);
    request.subscribe({ next: () => { this.closeForm(); this.load(); }, error: error => { this.error = error?.error?.message || 'Support feature could not be saved.'; this.saving = false; } });
  }

  remove(item: SupportFeature): void {
    if (!confirm(`Delete “${item.title}”?`)) return;
    this.service.delete(item._id).subscribe({ next: () => this.load(), error: error => this.error = error?.error?.message || 'Support feature could not be deleted.' });
  }

  private lines(value: string): string[] { return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }
}
