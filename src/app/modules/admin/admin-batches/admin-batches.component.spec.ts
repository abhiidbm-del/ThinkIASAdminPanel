import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBatchesComponent } from './admin-batches.component';

describe('AdminBatchesComponent', () => {
  let component: AdminBatchesComponent;
  let fixture: ComponentFixture<AdminBatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
