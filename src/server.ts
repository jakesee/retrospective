import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import { Board } from './api/board'
import * as BodyParser from 'body-parser';

class ApiServer {
    private _express:express.Application;
    private _io:Socket.Server;
    private _http;
    PORT = process.env.PORT || 8000;
    private _hosts:any = {};

    board:Board = new Board();

    constructor() {
        // basic express and socket.io initialisation
        this._express = express();
        this._http = new http.Server(this._express);
        this._io = Socket.listen(this._http);

        // express setup
        this._setupMiddlewares();
        this._setupRoutes();

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
                this._onApplicationEvent(client, msg, ack);
            });

            client.on('server', (msg:any, ack:(msg:any)=>void = null) => {
                console.log('server');
                this._onServerEvent(client, msg, ack);
            });
        });  
    }

    private _setupMiddlewares() {
        this._express.use(express.static(__dirname + '../../../retro/'))
        this._express.use(BodyParser.json()); // support JSON encoded bodies
        this._express.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies
    }

    private _setupRoutes() {
        // set up the API stuff here
        this._express.get('/api/notes', (req, res) => {
            res.json({ title: 'xxx' });
        });

        this._express.post('/api/note/create', (req, res) => {
            var where = req.body.where;
            var who = req.body.who;
            var result = this.board.createNote(where, who);
            if(result.success === true) {
                this._io.emit('ADD', result.data);
            }
        });
    }

    private _onApplicationEvent(client:Socket.Socket, msg:any, ack:(msg:any)=>void = null):void {
        // application events forward to everyone in the specified room for now
        msg.response = null;
        if(msg.type == 'add') {
            msg.response = this._respondAdd(client, msg);
        } else if(msg.type == 'edit.start') {
            msg.response = this._respondStart(client, msg);
        } else if(msg.type == 'edit.end') {
            msg.response = this._respondEdit(client, msg);
        } else if(msg.type == 'upvote') {
            msg.response = this._respondUpvote(client, msg);
        } else if(msg.type == 'downvote') {
            msg.response = this._respondDownvote(client, msg);
        }

        if(ack) ack(msg);

        this._io.to(msg.room).emit('application', msg);
    }

    private _respondAdd(client:Socket.Socket, msg:any) {
        var response = {
            id: uuid(),
            vote: 0,
            timestamp: + new Date(),
            rank: 
        }
    }

    private _onServerEvent(client:Socket.Socket, msg:any, ack:(msg:any)=>void = null):void {
        msg.response = null;
        if(msg.type == 'join') {
            console.log('server.event.join');
            msg.response = this._respondJoinRoom(client, msg);
        } else if(msg.type == 'host') {
            console.log('server.event.host');
            msg.response = this._respondHostRoom(client, msg);
        } else if(msg.type == 'room') {
            console.log('server.event.room');
            msg.response = this._respondGetRooms(client, msg);            
        } else if(msg.type == 'leave') {
            console.log('server.event.leave');
            msg.response = this._respondLeaveRoom(client, msg);
        }

        if(ack) ack(msg);

        client.emit('server', msg);
    }

    private _getAllRooms() {
        var userRooms = [];
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

    private _clone(o) {
        return JSON.parse(JSON.stringify(o));
    }

    private _respondHostRoom(client:Socket.Socket, msg:any) {
        var response:object = { result: false };
        if(msg.request.room != '' && this._getAllRooms().indexOf(msg.request.room) < 0) {
            // register host
            client.join(msg.request.room);
            var hostId = uuid();
            this._hosts[msg.request.room] = hostId;
            // prepare response
            response = {
                result : true,
                id : hostId,
                hostId : hostId,
            }
        }
        return response;
    }

    private _respondJoinRoom(client:Socket.Socket, msg:any) {
        var response:object = { result: false };
        if(msg.request.room != '' && this._getAllRooms().indexOf(msg.request.room) >= 0) {
            // register client
            client.join(msg.request.room);
            var clientId = uuid();
            // prepare response
            response = {
                result: true,
                id: clientId,
                hostId: this._hosts[msg.request.room],
            }
        }
        return response;
    }

    private _respondGetRooms(client:Socket.Socket, msg:any) {
        let response = {
            result: true,
            rooms: this._getAllRooms()
        }
        return response;
    }

    private _respondLeaveRoom(client:Socket.Socket, msg:any) {
        // let response:object = { result: false } // will never happen
        // unregister client from room,
        // for simplicity, intentionally not checking whether client is in the room in the first place
        client.leave(msg.request.room);
        let response = { result: true }
    }
}

var apiServer = new ApiServer();