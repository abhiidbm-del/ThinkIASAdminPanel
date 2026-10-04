import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Testimonial, TestimonialPayload } from '../../../core/models/testimonial.model';
import { TestimonialService } from '../../../shared/services/testimonial.service';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [TranslatePipe, CommonModule, FormsModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent implements OnInit {
  testimonials: Testimonial[] = [];
  loading = false;
  saving = false;
  showForm = false;
  editingId: string | null = null;
  error = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  form: TestimonialPayload = this.emptyForm();

  constructor(private testimonialService: TestimonialService) {}

  ngOnInit(): void {
    this.loadTestimonials();
  }

  private emptyForm(): TestimonialPayload {
    return { rating: 5, description: '', name: '', subtitle: '', image: null };
  }

  loadTestimonials(): void {
    this.loading = true;
    this.error = '';
    this.testimonialService.getAll().subscribe({
      next: response => {
        this.testimonials = response.data || [];
        this.loading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Testimonials could not be loaded.';
        this.loading = false;
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.selectedImage = null;
    this.imagePreview = null;
    this.error = '';
    this.showForm = true;
  }

  openEdit(item: Testimonial): void {
    this.editingId = item._id;
    this.form = { nameHindi: item.nameHindi, descriptionHindi: item.descriptionHindi, subtitleHindi: item.subtitleHindi, rating: item.rating, description: item.description, name: item.name, subtitle: item.subtitle, image: item.image || null };
    this.selectedImage = null;
    this.imagePreview = item.image || null;
    this.error = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.saving = false;
    this.editingId = null;
    this.selectedImage = null;
    this.imagePreview = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error = 'Please select an image file.';
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image size must be 5 MB or smaller.';
      input.value = '';
      return;
    }

    this.error = '';
    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.form.image = null;
  }

  save(): void {
    const payload: TestimonialPayload = {
      ...this.form,
      rating: Number(this.form.rating),
      name: this.form.name.trim(),
      subtitle: this.form.subtitle.trim(),
      description: this.form.description.trim(),
      image: this.form.image?.trim() || null
    };
    if (!payload.name || !payload.subtitle || !payload.description || payload.rating < 1 || payload.rating > 5) {
      this.error = 'Name, subtitle, description and a rating from 1 to 5 are required.';
      return;
    }
    this.saving = true;
    this.error = '';
    const request = this.editingId
      ? this.testimonialService.update(this.editingId, payload, this.selectedImage)
      : this.testimonialService.create(payload, this.selectedImage);
    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadTestimonials();
      },
      error: error => {
        this.error = error?.error?.message || 'Testimonial could not be saved.';
        this.saving = false;
      }
    });
  }

  remove(item: Testimonial): void {
    if (!confirm(`Delete testimonial from ${item.name}?`)) return;
    this.testimonialService.delete(item._id).subscribe({
      next: () => this.loadTestimonials(),
      error: error => this.error = error?.error?.message || 'Testimonial could not be deleted.'
    });
  }

  stars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, index) => index + 1);
  }

  isStarFilled(star: number, rating: number | string): boolean {
    const normalizedRating = Number(rating);
    return Number.isFinite(normalizedRating) && star <= normalizedRating;
  }
}
