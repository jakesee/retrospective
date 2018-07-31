import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { Message } from '../models/Message';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private _socket;
  private _id:number;
  private _room:string;
  private _isHost:boolean = false;

  constructor() {
    this._socket = io();
    if(!this._socket.status) console.log('constructor', 'error connecting to socket');
  }

  public getRooms(callback:(msg:any)=>void = null) {
    this._socket.emit('server', {
      type: 'room', request: null
    }, (msg) => {
      if(callback) callback(msg);
    });
  }

  public hostRoom(room:string, callback:(msg:any)=>void = null) {

    if(this.isHost()) {
      console.log('App socket is already hosting room:', this._room);
    } else {
      this._resetSessionInfo();
      this._socket.emit('server', {
        type: 'host',
        request: {
          room: room
        }
      }, (msg:any) => {
        // record the registration info if successful
        if(msg.response.result) {
          this._isHost = true;
          this._id = msg.response.id;
          this._room = msg.response.room;
        }
        // then inform component callback
        if(callback) callback(msg);
      });
    } 
  }

  public isHost() {
    return this._isHost;
  }

  private _resetSessionInfo() {
    this._isHost = false;
    this._id = null;
    this._room = null;
  }

  public joinRoom(room:string, callback:(msg:any)=>void = null) {
    this._socket.emit('server', {
      type: 'join',
      request: {
        room: room
      }
    }, (msg) => {
      // record the registration info if successful
      if(msg.response.result) {
        this._isHost = false;
        this._id = msg.response.id;
        this._room = msg.response.room;
      }
      // then inform component callback
      if(callback) callback(msg);
    });
  }

  public leaveRoom(callback:(msg:any)=>void = null) {
    this._socket.emit('server', {
      type: 'leave',
      request: {
        room: this._room
      }
    }, (msg) => {
      if(callback) callback(msg);
    })
  }

  public getApplicationMessages():Observable<Message> {
    return new Observable<Message>(observer => {
      this._socket.on('application', (data:Message) => observer.next(data));
    });
  }

  public getServerMessages():Observable<Message> {
    return new Observable<Message>(observer => {
      this._socket.on('server', (data:Message) => observer.next(data));
    });
  }

  public sendMessage(message:any) {
    this._socket.emit('application', message);
  }
}
