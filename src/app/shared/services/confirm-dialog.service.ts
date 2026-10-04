import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  ask(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, { data, width: 'min(430px, calc(100vw - 32px))', maxWidth: 'calc(100vw - 32px)', panelClass: 'confirm-dialog-panel', autoFocus: false }).afterClosed().pipe(filter(Boolean), map(() => true));
  }
}
