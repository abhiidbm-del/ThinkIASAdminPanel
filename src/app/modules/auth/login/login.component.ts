import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../shared/services/auth.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIcon
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  loading = signal(false);
  hidePassword = true;
  currentTime = new Date();

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.user?.role !== 'admin') {
            this.authService.logout();
            this.snackBar.open('Admin access is required', 'Close', { duration: 3000 });
            return;
          }
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open(error.error?.message || 'Login failed', 'Close', { duration: 3000 });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }

  getEmailError(): string {
  const emailControl = this.loginForm.get('email');
  if (emailControl?.hasError('required')) {
    return 'Email is required';
  }
  if (emailControl?.hasError('email')) {
    return 'Please enter a valid email';
  }
  return '';
}

getPasswordError(): string {
  const passwordControl = this.loginForm.get('password');
  if (passwordControl?.hasError('required')) {
    return 'Password is required';
  }
  if (passwordControl?.hasError('minlength')) {
    return 'Password must be at least 6 characters';
  }
  return '';
}

openPublicSite() {
  window.open('https://thinkcivilias.com', '_blank', 'noopener');
}


}
