import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMentorshipComponent } from './admin-mentorship.component';

describe('AdminMentorshipComponent', () => {
  let component: AdminMentorshipComponent;
  let fixture: ComponentFixture<AdminMentorshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMentorshipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMentorshipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
