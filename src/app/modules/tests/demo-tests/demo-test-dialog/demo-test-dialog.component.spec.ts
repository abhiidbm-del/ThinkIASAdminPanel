import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoTestDialogComponent } from './demo-test-dialog.component';

describe('DemoTestDialogComponent', () => {
  let component: DemoTestDialogComponent;
  let fixture: ComponentFixture<DemoTestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoTestDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoTestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
