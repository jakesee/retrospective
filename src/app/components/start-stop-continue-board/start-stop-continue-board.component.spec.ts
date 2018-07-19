import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartStopContinueBoardComponent } from './start-stop-continue-board.component';

describe('StartStopContinueBoardComponent', () => {
  let component: StartStopContinueBoardComponent;
  let fixture: ComponentFixture<StartStopContinueBoardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartStopContinueBoardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartStopContinueBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
