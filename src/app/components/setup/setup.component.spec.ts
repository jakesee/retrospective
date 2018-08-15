import { async, ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { SetupComponent } from './setup.component';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { Observable, of } from '../../../../node_modules/rxjs';
import * as S from '../../models/server.contract';
import { DebugElement } from '../../../../node_modules/@angular/core';
import { By } from '../../../../node_modules/@types/selenium-webdriver';

describe('SetupComponent', () => {
  let component: SetupComponent;
  let fixture: ComponentFixture<SetupComponent>;

  let ws = {
    getMessages: ():Observable<S.Response> => {
      return of(new S.Response(new S.Request(null, S.Topic.Host, new S.Param())));
    }
  } 
  
  let router = {
    navigateByUrl: (url:string) => { return url; }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetupComponent ],
      providers: [
        { provide: WebsocketService, useValue: ws }, 
        { provide: Router, useValue: router }, 
      ]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(SetupComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load join room dialog by default', () => {
    var html:HTMLElement = fixture.nativeElement;
    expect(html.textContent).toContain('Join Room');
  });

  it('should have host and join toggle buttons', async(() => {
    var html:HTMLElement = fixture.nativeElement;
    var anchor:HTMLAnchorElement = html.querySelector('#btnHost');
    expect(anchor.innerHTML).toBe('Host');
    expect(component.isHostVisible).toBeFalsy();
    anchor.click();
    expect(component.isHostVisible).toBeTruthy();
    fixture.whenRenderingDone().then(() => {
      expect(fixture.nativeElement.textContent).toContain('Create Room');
    });
  }));
});
