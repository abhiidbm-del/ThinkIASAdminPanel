import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AppConfig } from '../../../core/models/app-config.model';
import { AppConfigService } from '../../../shared/services/app-config.service';

@Component({
  selector: 'app-app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './app-settings.component.html',
  styleUrl: './app-settings.component.css'
})
export class AppSettingsComponent implements OnInit {
  config = this.emptyConfig();
  loading = false;
  saving = false;
  error = '';
  success = '';

  constructor(private appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.appConfigService.get().subscribe({
      next: response => {
        this.config = { ...this.emptyConfig(), ...response.data, banners: [...(response.data.banners || [])] };
        this.loading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'App settings could not be loaded.';
        this.loading = false;
      }
    });
  }

  addBanner(): void {
    if (this.config.banners.length < 20) this.config.banners.push('');
  }

  removeBanner(index: number): void {
    this.config.banners.splice(index, 1);
  }

  save(): void {
    const payload: AppConfig = {
      ...this.config,
      version: this.config.version.trim(),
      phone: this.config.phone.trim(),
      email: this.config.email.trim(),
      whatsapp: this.config.whatsapp.trim(),
      androidUrl: this.config.androidUrl.trim(),
      iosUrl: this.config.iosUrl.trim(),
      shareUrl: this.config.shareUrl.trim(),
      banners: this.config.banners.map(banner => banner.trim()).filter(Boolean)
    };

    const urls = [payload.androidUrl, payload.iosUrl, payload.shareUrl, ...payload.banners].filter(Boolean);
    if (!payload.version) {
      this.error = 'App version is required.';
      return;
    }
    if (urls.some(url => !this.isHttpUrl(url))) {
      this.error = 'Please use a valid http or https URL for store, share, and banner links.';
      return;
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      this.error = 'Please enter a valid support email address.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';
    this.appConfigService.update(payload).subscribe({
      next: response => {
        this.config = { ...response.data, banners: [...response.data.banners] };
        this.success = response.message || 'App settings updated successfully.';
        this.saving = false;
      },
      error: error => {
        this.error = error?.error?.message || 'App settings could not be saved.';
        this.saving = false;
      }
    });
  }

  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private emptyConfig(): AppConfig {
    return {
      version: '1.0.1',
      phone: '',
      email: '',
      whatsapp: '',
      androidUrl: '',
      iosUrl: '',
      shareUrl: '',
      banners: []
    };
  }
}
