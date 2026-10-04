import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoTestsComponent } from './demo-tests.component';

describe('DemoTestsComponent', () => {
  let component: DemoTestsComponent;
  let fixture: ComponentFixture<DemoTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoTestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemoTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
