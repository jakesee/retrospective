import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import * as BodyParser from 'body-parser';
import * as uuid from 'uuid';
import * as A from './app/models/application.contract';
import * as S from './app/models/server.contract';
import * as _ from 'lodash';


interface INetworkServer {
    broadcast(roomId:string, response:S.Response);
    handleRequest(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void):void;
}
type NetworkServerMixin<T extends INetworkServer = INetworkServer> = new (...args:any[]) => T;
class NetworkServer implements INetworkServer {
    private _express:express.Application;
    private _io:Socket.Server;
    private _http;
    PORT = process.env.PORT || 8000;

    constructor() {    
        // basic express and socket.io initialisation
        this._express = express();
        this._http = new http.Server(this._express);
        this._io = Socket.listen(this._http);

        // express setup
        this.__setupMiddlewares();

        // socket io stuff
        this._http.listen(this.PORT, () => {
            console.log('socket app listening on', this.PORT);
        });

        this._io.on('connection', (client) => {
            console.log('connected');

            client.on('disconnect', () => {
                console.log('disconnected');
            });

            client.on('message', (msg:any, ack:(msg:any)=>void = null) => {
                this.handleRequest(client, msg, ack)
            });
        });  
    }

    public handleRequest(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
        console.log('Request not handled:', request.topic);
    }

    public broadcast(roomId:string, response:S.Response) {
        console.log('broadcast', roomId, response);
        this._io.to(roomId).emit('message', response);
    }

    private __setupMiddlewares() {
        this._express.use(express.static(__dirname + '../../../retro/'))
        this._express.use(BodyParser.json()); // support JSON encoded bodies
        this._express.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies
    }
}

interface ILobbyManager {
    getRoomByParticipantId(id:string):A.Room
}
type LobbyManagerMixin<T extends ILobbyManager = ILobbyManager> = new (...args:any[]) => T;
function LobbyManager<TBase extends NetworkServerMixin>(Base:TBase) {
    return class extends Base implements ILobbyManager {
        private __rooms:{[key:string]:A.Room} = {};

        private _emitResponse(room:A.Room, response:S.Response, ack:(response:S.Response)=>void = null):void {
            if(ack) ack(response);

            if(response.result == true && room != null) {
                // send event to everyone in the same room as the client who triggered the event
                this.broadcast(room.roomId, response);
            }
        }

        public handleRequest(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            if(request.topic == S.Topic.Join) {
                this._processJoinRoom(client, request, ack);
            } else if(request.topic == S.Topic.Host) {
                this._processHostRoom(client, request, ack);
            } else if(request.topic == S.Topic.List) {
                this._processGetRooms(client, request, ack);            
            } else if(request.topic == S.Topic.Leave) {
                this._processLeaveRoom(client, request, ack);
            } else if(request.topic == S.Topic.HostChange) {
                this._processHostChange(client, request, ack);
            } else {
                super.handleRequest(client, request, ack);
            }
        }

        private _processHostChange(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var param:S.HostChangeRequestParam = request.param as S.HostChangeRequestParam;
            var room:A.Room = this.getRoom(param.roomId);
            var newHost = this.getParticipant(param.newHostId);
            this._registerNewHost(room, newHost);

            var response:S.Response = new S.Response(request);
            response.success(new S.HostResponseParam(newHost, room));
            this._emitResponse(room, response, ack);
        }

        private _processHostRoom(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var param:S.HostRequestParam = request.param as S.HostRequestParam;
            var clientId = uuid();
            var roomId = uuid();
            client.join(roomId);

            var response:S.Response = new S.Response(request);
            if(this.canCreateRoom(request)) {
                var room = this.createRoom(clientId, roomId, request);
                var host = this.createHost(clientId, room, request);
                this._registerNewRoomAndHost(room, host);
                response.success(new S.HostResponseParam(host, room));
            } else {
                response.fail();
            }
            this._emitResponse(room, response, ack);
        }

        private _processJoinRoom(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var response:S.Response = new S.Response(request);
            var param:S.JoinRequestParam = request.param as S.JoinRequestParam;
            var room = this.getRoomByName(param.roomName);
            if(this.canJoin(request)) {
                client.join(room.roomId);
                var clientId = uuid(); 
                var newParticipant:A.Participant = this.createGuest(clientId, room, request);
                this._registerGuest(room, newParticipant);
                response.success(new S.JoinResponseParam(newParticipant, room));
            } else {
                response.fail();
            }
            this._emitResponse(room, response, ack);
        }

        private _processGetRooms(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            let response:S.Response = new S.Response(request);
            response.success(new S.ListResponseParam(this.getRoomIds()));
            
            this._emitResponse(null, response, ack);
        }

        private _processLeaveRoom(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            // let response:object = { result: false } // will never happen
            // unregister client from room,
            // for simplicity, intentionally not checking whether client is in the room in the first place
            var response = new S.Response(request);
            var param:S.LeaveRequestParam = request.param as S.LeaveRequestParam;
            var room = this.getRoomByParticipantId(param.leaver);
            var leavingParticipant = this.getParticipant(param.leaver);
            if(room) {
                client.leave(room.roomId);
                var newHost = this._removeParticipant(param);
                if(newHost) {
                    this._processHostRoom(client, new S.Request(request.requester, S.Topic.HostChange, new S.HostChangeRequestParam(room.roomId, newHost.id)));
                }
                response.success(new S.LeaveResponseParam(leavingParticipant, room.roomId));
            } else {
                response.fail();
            }

            this._emitResponse(this.getRoomByParticipantId(param.leaver), response, ack);
        }

        private _registerNewRoomAndHost(room:A.Room, host:A.Participant):void {
            room.hostId = host.id;
            room.participants.push(host);
            this.__rooms[room.roomId] = room;
        }
        private _registerNewHost(room:A.Room, host:A.Participant):void {
            room.hostId = host.id;
        }
        private _registerGuest(room:A.Room, guest:A.Participant):void {
            room.participants.push(guest);
        }

        public canCreateRoom(request:S.Request) {
            var param:S.HostRequestParam = request.param as S.HostRequestParam;
            var names = _.map(this.__rooms, (room) => { return room.name });
            if(names.indexOf(param.roomName) >= 0) return false;
            return true;
        }

        public canJoin(request:S.Request) {
            var param:S.JoinRequestParam = request.param as S.JoinRequestParam;
            var room = this.getRoomByName(param.roomName);
            return !!room;
        }

        public createRoom(clientId:string, roomId:string, request:S.Request):A.Room {
            var param:S.HostRequestParam = request.param as S.HostRequestParam;
            return new A.Room(roomId, param.roomName, clientId, param.rule);
        }

        public createHost(clientId:string, room:A.Room, request:S.Request):A.Participant {
            var param:S.HostRequestParam = request.param as S.HostRequestParam;
            var newParticipant:A.Participant = new A.Participant(clientId, param.nickname, param.color, room.rule);
            return newParticipant;
        }

        public createGuest(clientId:string, room:A.Room, request:S.Request):A.Participant {
            var param:S.JoinRequestParam = request.param as S.JoinRequestParam;
            var newParticipant:A.Participant = new A.Participant(clientId, param.nickname, param.color, room.rule);
            return newParticipant;
        }

        // Remove the participant and 
        // returns ParticipantContent if need a new host, otherwise return null
        protected _removeParticipant(param:S.LeaveRequestParam):A.Participant {
            var leaver = this.getParticipant(param.leaver);
            var room = this.getRoomByParticipantId(param.leaver);        
            _.remove(room.participants, (p) => { return p.id == param.leaver; });

            if(room.hostId == param.leaver && room.participants.length > 0) {
                var newHost = room.participants[0];
                room.hostId = newHost.id;
                return newHost as A.Participant;
            } else {
                return null;
            }
        }

        public getRoom(roomId:string):A.Room {
            if(this.__rooms.hasOwnProperty(roomId)) {
                return this.__rooms[roomId];
            } else {
                return null;
            }
        }
        public getRoomByParticipantId(participantId:string):A.Room {
            for(var roomId in this.__rooms) {
                _.find(this.__rooms[roomId].participants, (participant:A.Participant) => {
                    if(participant.id == participantId) {
                        return this.__rooms[roomId];
                    }
                });
            }
            return null;
        }
        public getRoomIds():string[] {
            return _.keys(this.__rooms);
        }
        public getRoomNames():string[] {
            return _.map(this.__rooms, (room) => {
                return room.name;
            });
        }
        public getRoomByName(name:string):A.Room {
            return _.find(this.__rooms, (room) => {
                return room.name == name;
            })
        }
        public getParticipant(participantId:string):A.Participant {
            for(var roomId in this.__rooms) {
                _.find(this.__rooms[roomId].participants, (participant) => {
                    if(participant.id == participantId) {
                        return participant;
                    }
                });
            }
            return null;
        }
    }
}


function AppManager<TBase extends LobbyManagerMixin & NetworkServerMixin>(Base:TBase) {
    return class extends Base {
        public handleRequest(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            // application events forward to everyone in the specified room for now
            if(request.topic == S.Topic.AddNote) {
                this._processAddNote(client, request, ack);
            } else if(request.topic == S.Topic.DeleteNote) {
                this._processDeleteNote(client, request, ack);
            } else if(request.topic == S.Topic.UpdateNote) {
                this._processUpdateNote(client, request, ack);
            } else if(request.topic == S.Topic.UpvoteNote) {
                this._processUpvote(client, request, ack);
            } else if(request.topic == S.Topic.DownvoteNote) {
                this._processDownvote(client, request, ack);
            } else {
                super.handleRequest(client, request, ack);
            }
        }
    
        private _processAddNote(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var room = this.getRoomByParticipantId(request.requester);
            var param:S.AddNoteRequestParam = request.param as S.AddNoteRequestParam;
            var note = new A.Note(uuid(), param.owner, param.colId);
            room.notes.push(note);
    
            var response = new S.Response(request);
            response.success(note);
            this._emitResponse(room, response, ack);
        }
    
        private _processDeleteNote(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var room = this.getRoomByParticipantId(request.requester);
            var param:S.DeleteNoteRequestParam = request.param as S.DeleteNoteRequestParam;
            _.remove(room.notes, (n) => { return n.id == param.noteId; });
            
            var response = new S.Response(request);
            response.success(new S.DeleteNoteResponseParam(param.owner, param.noteId));
            this._emitResponse(room, response, ack);
        }
    
        private _processUpdateNote(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var room = this.getRoomByParticipantId(request.requester);
            var param:S.UpdateNoteRequestParam = request.param as S.UpdateNoteRequestParam;
            _.forEach(room.notes, (n) => {
                if(n.id == param.noteId) {
                    n.body = param.body;
                    n.title = param.title;
                    return false;
                }
            });
    
            var response = new S.Response(request);
            response.success(new S.UpdateNoteResponseParam(param.noteId, param.title, param.body));
            this._emitResponse(room, response, ack);
        }
    
        private _processUpvote(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var room = this.getRoomByParticipantId(request.requester);
            var param:S.VoteRequestParam = request.param as S.VoteRequestParam;
            var response = new S.Response(request);
    
            var found:A.Note = _.find(room.notes, (n) => { return n.id == param.noteId; });
            if(found && found.voters.indexOf(param.voter) < 0) {
                found.voters.push(param.voter);
                response.success(new S.VoteResponseParam(param.noteId, param.voter));
            } else {
                response.fail();
            }
            this._emitResponse(room, response, ack);
        }
    
        private _processDownvote(client:Socket.Socket, request:S.Request, ack:(response:S.Response)=>void = null):void {
            var room = this.getRoomByParticipantId(request.requester);
            var param:S.VoteRequestParam = request.param as S.VoteRequestParam;
            
            var response = new S.Response(request);
            var found:A.Note = _.find(room.notes, (n) => { return n.id == param.noteId; });
    
            // downvote only if user has voted
            let nStart = found.voters.length;
            _.remove(found.voters, (voter) => { return voter == param.voter; });
    
            if (nStart != found.voters.length) {
                response.success(new S.VoteResponseParam(param.noteId, param.voter));
            } else {
                response.fail();
            }
            this._emitResponse(room, response, ack);
        }
    
        private _emitResponse(room:A.Room, response:S.Response, ack:(response:S.Response)=>void = null):void {
            if(ack) ack(response);
    
            if(response.result == true && room != null) {
                // send event to everyone in the same room as the client who triggered the event
                this.broadcast(room.roomId, response);
            }
        }
    }
}

const AppServer = AppManager(LobbyManager(NetworkServer));
var app = new AppServer();

