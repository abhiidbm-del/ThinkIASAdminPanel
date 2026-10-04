import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryMasterComponent } from './directory-master.component';

describe('DirectoryMasterComponent', () => {
  let component: DirectoryMasterComponent;
  let fixture: ComponentFixture<DirectoryMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectoryMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
