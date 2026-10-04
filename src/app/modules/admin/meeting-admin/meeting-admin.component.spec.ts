import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingAdminComponent } from './meeting-admin.component';

describe('MeetingAdminComponent', () => {
  let component: MeetingAdminComponent;
  let fixture: ComponentFixture<MeetingAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
