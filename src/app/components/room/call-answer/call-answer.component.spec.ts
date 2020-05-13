import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallAnswerComponent } from './call-answer.component';

describe('CallAnswerComponent', () => {
  let component: CallAnswerComponent;
  let fixture: ComponentFixture<CallAnswerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallAnswerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
