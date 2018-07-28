import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { Message } from '../models/Message';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private _socket;
  public isHost:boolean = false;

  constructor() {
    this._socket = io();
    this._listen();
  }

  public leaveRoom(room:string) {
    this._socket.emit('LEAVE', room);
  }

  public hostRoom(room:string) {
    this._socket.emit('HOST', room);
  }

  public joinRoom(room:string) {
    this._socket.emit('JOIN', room);
  }

  public doString() {
    this.sendMessage("hello world");
  }

  public doObject() {
    this.sendMessage({ info: "hello world"});
  }

  private _listen() {
    this.getMessage().subscribe((msg) => {
      console.log(msg);
    });
  }

  public getMessage():Observable<Message> {
    return new Observable<Message>(observer => {
      this._socket.on('MSG', (data:Message) => observer.next(data));
    });
  }

  public sendMessage(message:any) {
    this._socket.emit('MSG', message);
  }

}
