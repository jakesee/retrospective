import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import * as A from '../models/application.contract';
import * as S from '../models/server.contract';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private _socket;
  private _id:string;
  private _room:string;
  private _isHost:boolean = false;
  private _nickname:string = 'Anonymous';

  constructor() {
    this._socket = io();
    if(!this._socket.status) console.log('constructor', 'error connecting to socket');
  }

  public getRooms(callback:(response:S.ServerResponse)=>void = null) {
    this._socket.emit('server', {
      type: 'room', request: null
    }, (msg) => {
      if(callback) callback(msg);
    });
  }

  public hostRoom(room:string, callback:(response:S.ServerResponse)=>void = null) {
    if(this.isHost()) {
      console.log('App socket is already hosting room:', this._room);
    } else {
      this._resetSessionInfo();
      var request = new S.ServerRequest(this._id, S.ServerTopic.Host, new S.HostRequest(this._id, room));
      this._socket.emit('server', request, (response:S.ServerResponse) => {
        if(response.result == true) {
          console.log('host ok', response.param);
          var param:S.HostResponse = response.param as S.HostResponse;
          this._id = param.hoster;
          this._room = param.room;
        }
        // handover to UI component
        if(callback) callback(response);
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

  public joinRoom(room:string, callback:(response:S.ServerResponse)=>void = null) {
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

  public leaveRoom(callback:(response:S.ServerResponse)=>void = null) {
    this._socket.emit('server', {
      type: 'leave',
      request: {
        room: this._room
      }
    }, (msg) => {
      if(callback) callback(msg);
    })
  }

  public getApplicationMessages():Observable<A.ApplicationResponse> {
    return new Observable<A.ApplicationResponse>(observer => {
      this._socket.on('application', (data:A.ApplicationResponse) => observer.next(data));
    });
  }

  public getServerMessages():Observable<S.ServerResponse> {
    return new Observable<S.ServerResponse>(observer => {
      this._socket.on('server', (data:S.ServerResponse) => observer.next(data));
    });
  }

  public sendMessage(message:any) {
    this._socket.emit('application', message);
  }
}
