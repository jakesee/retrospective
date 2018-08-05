import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import * as BodyParser from 'body-parser';
import * as uuid from 'uuid';
import * as A from './app/models/application.contract';
import * as S from './app/models/server.contract';
import * as _ from 'lodash';

class NetworkServer<R extends S.RoomContext, P extends S.ParticipantContext, R1 extends S.Request, R2 extends S.Response> extends S.RoomManager<R, P> {
    private _express:express.Application;
    private _io:Socket.Server;
    private _http;
    PORT = process.env.PORT || 8000;

    constructor(protected _app:S.IAppRequestHandler<R, P, R1, R2>, protected _factory:S.IFactory<R, P>) {
        super(_factory);
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

    private _onApplicationRequest(client:Socket.Socket, request:R1, ack:(response:any)=>void = null):void {
        var response:R2 = this._app.onApplicationRequest(request, this);
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
        } else if(request.topic == S.ServerTopic.HostChange) {
            this._processHostChange(client, request, ack);
        }
    }

    private _clone<T>(o:T):T {
        return JSON.parse(JSON.stringify(o));
    }

    private _emitServerResponse(room:R, response:S.ServerResponse, ack:(response:S.ServerResponse)=>void = null):void {
        if(ack) ack(response);

        if(response.result == true && room != null) {
            // send event to everyone in the same room as the client who triggered the event
            this._io.to(room.roomId).emit('server', response);
        }
    }

    private _emitApplicationResponse(request:R1, response:R2, ack:(response:R2)=>void = null):void {
        if(ack) ack(response);
        // send event to everyone in the same room as the client who triggered the event
        if (response.result == true) {
            this._io.to(this.getRoomByParticipantId(request.requester).roomId).emit('application', response);
        }
    }

    private _processHostChange(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        var param:S.HostChangeRequestParam = request.param as S.HostChangeRequestParam;
        var room:R = this.getRoom(param.roomId);
        var newHost = this.getParticipant(param.newHostId);
        this._registerNewHost(room, newHost);

        var response:S.ServerResponse = new S.ServerResponse(request);
        response.succeed(new S.HostResponseParam(newHost, room));
        this._emitServerResponse(room, response, ack);
    }

    private _processHostRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        var param:S.HostRequestParam = request.param as S.HostRequestParam;
        var clientId = uuid();
        var roomId = uuid();
        client.join(roomId);

        var response:S.ServerResponse = new S.ServerResponse(request);
        if(this._factory.canCreateRoom(request)) {
            var room = this._factory.createRoom(clientId, roomId, request);
            var host = this._factory.createHost(clientId, room, request);
            this._registerNewRoomAndHost(room, host);
            response.succeed(new S.HostResponseParam(host, room));
        } else {
            response.fail();
        }

        this._emitServerResponse(room, response, ack);
    }

    private _processJoinRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        var response:S.ServerResponse = new S.ServerResponse(request);
        var param:S.JoinRequestParam = request.param as S.JoinRequestParam;
        var room = this.getRoom(param.roomId);
        if(this._factory.canJoin(request)) {
            client.join(param.roomId);
            var clientId = uuid(); 
            var room = this.getRoom(param.roomId);
            var newParticipant:P = this._factory.createGuest(clientId, room, request);
            this._registerGuest(room, newParticipant);
            response.succeed(new S.JoinResponseParam(newParticipant, room));
        } else {
            response.fail();
        }

        this._emitServerResponse(this.getRoom(param.roomId), response, ack);
    }

    private _processGetRooms(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        let response:S.ServerResponse = new S.ServerResponse(request);
        response.succeed(new S.ListResponseParam(this.getRoomIds()));
        
        this._emitServerResponse(null, response, ack);
    }

    private _processLeaveRoom(client:Socket.Socket, request:S.ServerRequest, ack:(response:S.ServerResponse)=>void = null):void {
        // let response:object = { result: false } // will never happen
        // unregister client from room,
        // for simplicity, intentionally not checking whether client is in the room in the first place
        var response = new S.ServerResponse(request);
        var param:S.LeaveRequestParam = request.param as S.LeaveRequestParam;
        var room = this.getRoomByParticipantId(param.leaver);
        var leavingParticipant = this.getParticipant(param.leaver);
        if(room) {
            client.leave(room.roomId);
            var newHost = this._removeParticipant(param);
            if(newHost) {
                this._processHostRoom(client, new S.ServerRequest(request.requester, S.ServerTopic.HostChange, new S.HostChangeRequestParam(room.roomId, newHost.id)));
            }
            response.succeed(new S.LeaveResponseParam(leavingParticipant, room.roomId));
        } else {
            response.fail();
        }

        this._emitServerResponse(this.getRoomByParticipantId(param.leaver), response, ack);
    }
}

var app = new A.AppContext();
var server = new NetworkServer(app, app);