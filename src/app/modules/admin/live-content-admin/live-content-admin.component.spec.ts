import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveContentAdminComponent } from './live-content-admin.component';

describe('LiveContentAdminComponent', () => {
  let component: LiveContentAdminComponent;
  let fixture: ComponentFixture<LiveContentAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveContentAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveContentAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
