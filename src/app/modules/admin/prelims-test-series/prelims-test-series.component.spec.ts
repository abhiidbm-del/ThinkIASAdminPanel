import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrelimsTestSeriesComponent } from './prelims-test-series.component';

describe('PrelimsTestSeriesComponent', () => {
  let component: PrelimsTestSeriesComponent;
  let fixture: ComponentFixture<PrelimsTestSeriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrelimsTestSeriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrelimsTestSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
