import { Component, inject } from '@angular/core';
import { LanguageService } from './language.service';
@Component({selector: 'app-language-toggle', standalone: true,
template: `<div role="group" aria-label="Language / भाषा"><button type="button" [attr.aria-pressed]="!language.hindi" (click)="language.set('en')">English</button><button type="button" [attr.aria-pressed]="language.hindi" (click)="language.set('hi')">हिंदी</button></div>`,
styles: [`div{display:flex;gap:4px}button{padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;cursor:pointer;background:white;color:#1e293b}button[aria-pressed=true]{background:#243b80;color:white}`]})
export class LanguageToggleComponent { readonly language = inject(LanguageService); }
