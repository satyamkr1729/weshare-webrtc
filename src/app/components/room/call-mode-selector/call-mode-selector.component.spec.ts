import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallModeSelectorComponent } from './call-mode-selector.component';

describe('CallModeSelectorComponent', () => {
  let component: CallModeSelectorComponent;
  let fixture: ComponentFixture<CallModeSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallModeSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallModeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
