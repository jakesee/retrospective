import * as express from 'express';
import * as http from 'http';
import * as socketIO from 'socket.io';

class SimpleSocketServer {
    private _express:any;
    private _http:any;
    private _io:any;

    constructor() {
        // start listening
        this._express = express();
        this._http = new http.Server(this._express);
        this._io = socketIO(this._http);

        this._express.listen(3001, () => {
            console.log('Listening on *:3001');        
        });

        this._io.on('connection', (client) => {
            console.log('connected');
            client.on('disconnect', () => {
                console.log('disconnected');
            })
        });  
        this._io.on('ping', (client) => {
            client.emit('hello', Date.now);
        });
    }
}

var socketServer = new SimpleSocketServer();