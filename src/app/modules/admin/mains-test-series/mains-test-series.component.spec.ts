import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainsTestSeriesComponent } from './mains-test-series.component';

describe('MainsTestSeriesComponent', () => {
  let component: MainsTestSeriesComponent;
  let fixture: ComponentFixture<MainsTestSeriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainsTestSeriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainsTestSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
