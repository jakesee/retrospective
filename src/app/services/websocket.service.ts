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
  public me:A.Participant = null;
  public room:A.Room;

  constructor() {
    this.room = new A.Room("N/A", "Unnamed", "N/A", new A.Rule());
    this.me = new A.Participant('N/A', 'Anonymous', 'black', new A.Rule());

    this._socket = io();
    this._socket.on('connect', (msg) => {
      console.log('connected');
      this.getMessages().subscribe((response:S.Response)=> {
        this._onResponse(response);
      });
    });
    if(!this._socket.status) console.log('constructor', 'error connecting to socket');
  }

  public getRooms(callback:(response:S.Response)=>void = null) {
    this._socket.emit('message', {
      type: 'room', request: null
    }, (msg) => {
      if(callback) callback(msg);
    });
  }

  public isHost() {
    return this.room.hostId == this.me.id;
  }

  public hostRoom(room:string, nickname:string, callback:(response:S.Response)=>void = null) {
    var rule = new A.Rule(); rule.votes = 6;
    var request = new S.Request(null, S.Topic.Host, new S.HostRequestParam(room, nickname, "black", rule));
    this._socket.emit('message', request, (response:S.Response) => {
      if(callback) callback(response);
    });
  }

  public joinRoom(room:string, nickname:string, callback:(response:S.Response)=>void = null) {
    var request = new S.Request(null, S.Topic.Join, new S.JoinRequestParam(room, nickname, "black"));
    this._socket.emit('message', request, (response:S.Response) => {
      if(callback) callback(response);
    });
  }

  public leaveRoom(callback:(response:S.Response)=>void = null) {
    // TODO: leave room
  }

  public getMessages():Observable<S.Response> {
    return new Observable<S.Response>(observer => {
      this._socket.on('message', (data:S.Response) => observer.next(data));
    });
  }

  public sendMessage(message:any) {
    this._socket.emit('message', message);
  }

  private _onResponse(response:S.Response) {
    console.log('webservice got response:', response);
    if(!response.result) return;

    if(response.topic == S.Topic.Host) {
        var param:S.HostResponseParam = response.param as S.HostResponseParam;
        console.log('host response:', param);
        this.me = param.participant;
        this.room = param.room;
    } else if(response.topic == S.Topic.Join) {
      var param:S.JoinResponseParam = response.param as S.JoinResponseParam;
      if(param.participant.id == this.me.id) {
        console.log('join: entered room', param.room.name);
        this.me = param.participant;
        this.room = param.room;
      } else {
        console.log('join: new guest', param.participant.nickname);
        this.room.participants.push(param.participant as A.Participant);
      }
    }
  }
}
