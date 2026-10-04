import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnswerWritingComponent } from './admin-answer-writing.component';

describe('AdminAnswerWritingComponent', () => {
  let component: AdminAnswerWritingComponent;
  let fixture: ComponentFixture<AdminAnswerWritingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnswerWritingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnswerWritingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
