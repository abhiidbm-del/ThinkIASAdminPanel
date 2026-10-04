import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectoryExplorerComponent } from './directory-explorer.component';

describe('DirectoryExplorerComponent', () => {
  let component: DirectoryExplorerComponent;
  let fixture: ComponentFixture<DirectoryExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryExplorerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectoryExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
