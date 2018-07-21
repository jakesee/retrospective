import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  public _socket:any;
  public messages:string[] = Array();

  constructor() {

  }

  ngOnInit() {
    this._socket = io();
    this._socket.on('ping-reply', (message) => {
      this.messages.push(message);
    });
  }

  ping() {
    this._socket.emit('new-message', 'hello world xx');
    console.log('ping');
  }

}
