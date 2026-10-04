import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeResourceAdminComponent } from './free-resource-admin.component';

describe('FreeResourceAdminComponent', () => {
  let component: FreeResourceAdminComponent;
  let fixture: ComponentFixture<FreeResourceAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeResourceAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeResourceAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
