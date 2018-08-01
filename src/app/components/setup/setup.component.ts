import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {

  public availableRooms:[string];

  constructor(private _ws:WebsocketService, private _router:Router) {
    
  }

  ngOnInit() {
    this._ws.getApplicationMessages().subscribe((msg) => {
      this._onApplicationMessages(msg);
    });
  }

  private _onApplicationMessages(msg:any) {
    console.log('_onApplicationMessages', msg);
  }

  public join(room:string, nickname:string) {
    this._ws.joinRoom(room, (msg) => {
      if(msg.response.result) {
        this._router.navigateByUrl('/start-stop-continue-board');
      }
    });
  }

  public host(room:string, nickname:string) {
    this._ws.hostRoom(room, (msg) => {
      if(msg.response.result) {
        this._router.navigateByUrl('/start-stop-continue-board');
      }
    });
  }
}
