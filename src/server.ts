import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import * as BodyParser from 'body-parser';
import * as uuid from 'uuid';
import * as A from './app/models/application.contract';
import * as S from './app/models/server.contract';
import * as _ from 'lodash';




class ApiServer {
    private _express:express.Application;
    private _io:Socket.Server;
    private _http;
    PORT = process.env.PORT || 8000;
    private _rooms:{[key:string]:S.Room} = {};

    private _board:A.Board = new A.Board();

    constructor() {
        // basic express and socket.io initialisation
        this._express = express();
        this._http = new http.Server(this._express);
        this._io = Socket.listen(this._http);

        // express setup
        this._setupMiddlewares();

        // socket io stuff
        this._http.listen(this.PORT, () => {
            console.log('socket app listening on', this.PORT);
        });

        this._io.on('connection', (client) => {
            console.log('connected');

            client.on('disconnect', () => {
                console.log('disconnected');
            });

            client.on('application', (msg:any, ack:(msg:any)=>void = null) => {
                console.log('application');
                this._onApplicationRequest(client, msg, ack);
            });

            client.on('server', (msg:any, ack:(msg:any)=>void = null) => {
                console.log('server');
                this._onServerRequest(client, msg, ack);
            });

            this._registerConnection(client);
        });  
    }

    private _setupMiddlewares() {
        this._express.use(express.static(__dirname + '../../../retro/'))
        this._express.use(BodyParser.json()); // support JSON encoded bodies
        this._express.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies
    }

    private _registerConnection(client:Socket.Socket) {
        var response = new S.ServerResponse(new S.ServerRequest(null, S.ServerTopic.Connect, null));
        response.succeed(new S.ConnectResponse(uuid()));
        client.emit('server', response);
    }

    private _onApplicationRequest(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        // application events forward to everyone in the specified room for now
        var response:A.ApplicationResponse = null;
        if(request.topic == A.Topic.AddNote) {
            this._processAddNote(client, request, ack);
        } else if(request.topic == A.Topic.DeleteNote) {
            this._processDeleteNote(client, request);
        } else if(request.topic == A.Topic.UpdateNote) {
            this._processUpdateNote(client, request);
        } else if(request.topic == A.Topic.UpvoteNote) {
            this._processUpvote(client, request);
        } else if(request.topic == A.Topic.DownvoteNote) {
            this._processDownvote(client, request);
        }
    }

    private _processAddNote(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        var param:A.AddNoteRequestParam = request.param as A.AddNoteRequestParam;
        var note:A.Note = A.BoardManager.addNote(this._board, param);
        var response = new A.ApplicationResponse(request);
        response.success(note);
        this._emitApplicationResponse(request, response, ack);
    }

    private _processDeleteNote(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        var param:A.DeleteNoteRequestParam = request.param as A.DeleteNoteRequestParam;
        A.BoardManager.deleteNote(this._board, param);
        var response = new A.ApplicationResponse(request);
        response.success(new A.DeleteNoteResponseParam(param.owner, param.noteId));
        this._emitApplicationResponse(request, response, ack);
    }

    private _processUpdateNote(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        var param:A.UpdateNoteRequestParam = request.param as A.UpdateNoteRequestParam;
        A.BoardManager.updateNote(this._board, param);
        var response = new A.ApplicationResponse(request);
        response.success(new A.UpdateNoteResponseParam(param.noteId, param.title, param.body));
        this._emitApplicationResponse(request, response, ack);
    }

    private _processUpvote(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        var param:A.VoteRequestParam = request.param as A.VoteRequestParam;
        var response = new A.ApplicationResponse(request);
        if(A.BoardManager.upvote(this._board, param) != null) {
            response.success(new A.VoteResponseParam(param.noteId, param.voter));
        } else {
            response.fail();
        }
        this._emitApplicationResponse(request, response, ack);
    }

    private _processDownvote(client:Socket.Socket, request:A.ApplicationRequest, ack:(response:any)=>void = null):void {
        var param:A.VoteRequestParam = request.param as A.VoteRequestParam;
        var response = new A.ApplicationResponse(request);
        if(A.BoardManager.upvote(this._board, param) != null) {
            response.success(new A.VoteResponseParam(param.noteId, param.voter));
        } else {
            response.fail();
        }
        this._emitApplicationResponse(request, response, ack);
    }

    private _onServerRequest(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        if(request.topic == S.ServerTopic.Join) {
            this._processJoinRoom(client, request, ack);
        } else if(request.topic == S.ServerTopic.Host) {
            this._processHostRoom(client, request, ack);
        } else if(request.topic == S.ServerTopic.List) {
            this._processGetRooms(client, request, ack);            
        } else if(request.topic == S.ServerTopic.Leave) {
            this._processLeaveRoom(client, request, ack);
        }
    }

    private _getAllRooms():string[] {
        var userRooms:string[] = [];
        var socketRooms = this._io.sockets.adapter.rooms;
        if(socketRooms) {
            for(var room in socketRooms) {
                if(!socketRooms[room].sockets.hasOwnProperty(room)) {
                    userRooms.push(room);
                }
            }
        }
        return userRooms;
    }

    private _roomOf(clientId:string):string {
        for(var room in this._rooms) {
            if(this._rooms.hasOwnProperty(room)) 
            {
                if(_.findIndex(this._rooms[room].participants, (p) => {
                    return p.id == clientId;
                }) >= 0) {
                    return room;
                }
            }
        }

        throw new Error(clientId + ' clientId not registered properly in this._rooms');
    }

    private _clone(o) {
        return JSON.parse(JSON.stringify(o));
    }

    private _emitServerResponse(room:string, response:S.ServerResponse, ack:(response:S.ServerResponse)=>void = null):void {
        if(ack) ack(response);

        if(response.result == true && room != null) {
            // send event to everyone in the same room as the client who triggered the event
            this._io.to(room).emit('server', response);
        }
    }

    private _emitApplicationResponse(request:A.ApplicationRequest, response:A.ApplicationResponse, ack:(response:A.ApplicationResponse)=>void = null):void {
        if(ack) ack(response);
        // send event to everyone in the same room as the client who triggered the event
        if (response.result == true) {
            this._io.to(this._roomOf(request.requester)).emit('application', response);
        }
    }

    private _processHostRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        var response:S.ServerResponse = new S.ServerResponse(request);
        var param:S.HostRequestParam = request.param as S.HostRequestParam;
        if(param.room != '' && this._getAllRooms().indexOf(param.room) < 0) {
            // register host
            client.join(param.room);
            var clientId = uuid();
            if(!this._rooms.hasOwnProperty(param.room))
                this._rooms[param.room] = new S.Room();
            this._rooms[param.room].host = param.participant.id = clientId;
            this._rooms[param.room].participants.push(param.participant);
            // prepare response
            response.succeed(new S.HostResponseParam(clientId, param.participant, param.room));
        } else {
            response.fail();
        }
        
        if(!request.requester) request.requester = clientId;
        this._emitServerResponse(this._roomOf(clientId), response, ack);
    }

    private _processJoinRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        var response:S.ServerResponse = new S.ServerResponse(request);
        var param:S.JoinRequestParam = request.param as S.JoinRequestParam;
        if(param.room != '' && this._getAllRooms().indexOf(param.room) >= 0) {
            // register client
            client.join(param.room);
            var clientId = uuid();
            // prepare response
            response.succeed(new S.JoinResponseParam(request.requester, param.room));
        } else {
            response.fail();
        }
        
        if(!request.requester) request.requester = clientId;
        this._emitServerResponse(this._roomOf(clientId), response, ack);
    }

    private _processGetRooms(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        let response:S.ServerResponse = new S.ServerResponse(request);
        response.succeed(new S.ListResponseParam(this._getAllRooms()));
        
        this._emitServerResponse(null, response, ack);
    }

    private _processLeaveRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        // let response:object = { result: false } // will never happen
        // unregister client from room,
        // for simplicity, intentionally not checking whether client is in the room in the first place
        var response = new S.ServerResponse(request);
        var param:S.LeaveRequestParam = request.param as S.LeaveRequestParam;
        var room = this._roomOf(param.leaver);
        if(room) {
            client.leave(room);
            _.remove(this._rooms[room].participants, (participant) => {
                return participant.id == param.leaver;
            });

            // make the first participant 
            if(this._rooms[room].host == param.leaver) {
                var newHost = _.first(this._rooms[room].participants);
                if(newHost) {
                    this._rooms[room].host = newHost.id;
                    this._processHostRoom(client, new S.ServerRequest(request.requester, S.ServerTopic.Host, new S.HostRequestParam(newHost.id, newHost, room)));
                }
            }
            response.succeed(new S.LeaveResponseParam(param.leaver, room));
        } else {
            response.fail();
        }

        this._emitServerResponse(this._roomOf(param.leaver), response, ack);
    }
}

var apiServer = new ApiServer();