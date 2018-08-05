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
  private _room:string;
  private _isHost:boolean = false;
  public me:A.Participant = null;
  public participants:A.Participant[] = [];

  constructor() {
    this._socket = io();
    this.getServerMessages().subscribe((response:S.ServerResponse)=> {
      this._onServerResponse(response);
    });
    if(!this._socket.status) console.log('constructor', 'error connecting to socket');
  }

  public getRooms(callback:(response:S.ServerResponse)=>void = null) {
    this._socket.emit('server', {
      type: 'room', request: null
    }, (msg) => {
      if(callback) callback(msg);
    });
  }

  public hostRoom(room:string, nickname:string, callback:(response:S.ServerResponse)=>void = null) {
    if(this.isHost()) {
      console.log('App socket is already hosting room:', this._room);
    } else {
      this._resetSessionInfo();
      var request = new S.ServerRequest(null, S.ServerTopic.Host, new A.HostRequestParam(room, nickname, "black", new A.Participant(null, null, null)));
      this._socket.emit('server', request, (response:S.ServerResponse) => {
        if(response.result == true) {
          console.log('host ok', response.param);
          var param:S.HostResponseParam = response.param as S.HostResponseParam;
          this.me = param.participant as A.Participant;
          this.participants.push(this.me);
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
    this.me = null;
    this._room = null;
  }

  public joinRoom(room:string, nickname:string, callback:(response:S.ServerResponse)=>void = null) {
    var request = new S.ServerRequest(null, S.ServerTopic.Join, new A.JoinRequestParam(room, nickname, "black"));

    this._socket.emit('server', request, (response:S.ServerResponse) => {
      console.log('join ok', response.param);
      if(response.result) {
        var param:S.JoinResponseParam = response.param as S.JoinResponseParam;
        this.me = param.participant as A.Participant;
        this.participants = param.room.participants as A.Participant[];
      }
      if(callback) callback(response);
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

  private _onServerResponse(response:S.ServerResponse) {
    if(!response.result) return;
    if(response.topic == S.ServerTopic.Join) {
      var param:S.JoinResponseParam = response.param as S.JoinResponseParam;
      if(param.participant.id != this.me.id) {
        this.participants.push(param.participant as A.Participant);
      }
    }
  }
}
