import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import { Board } from './api/board'
import * as BodyParser from 'body-parser';

class ApiServer {
    apiApp:express.Application;
    board:Board = new Board();
    PORT = process.env.PORT || 8000;

    constructor(private socketServer:Socket = null) {
        // set up the API server app, this should host in default port 80
        this.apiApp = express();
        // this is required so that angular knows where to find static files
        // it also defines the public root for express to find the angular index.html
        console.log(__dirname);
        this.apiApp.use(express.static(__dirname + '../../../retro/'))
        this.apiApp.use(BodyParser.json()); // support JSON encoded bodies
        this.apiApp.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies

        // set up the API stuff here
        this.apiApp.get('/api/notes', (req, res) => {
            res.json({ title: 'xxx' });
        });

        this.apiApp.post('/api/note/create', (req, res) => {
            var where = req.body.where;
            var who = req.body.who;
            var result = this.board.createNote(where, who);
            if(result.success === true && socketServer != null) {
                this.socketServer.emit('ADD', result.data);
            }
        });
        
        // this will run our angular 6 app
        // this.apiApp.get('*', (req, res) => {
        //     res.sendFile('socket.html');
        // });

        this.apiApp.listen(this.PORT, () => {
            console.log('api app listening on', this.PORT);
        })
    }
}

class SocketServer {
    private _express:express.Application;
    private _io:Socket;

    constructor() {
        // start listening
        this._express = express();

        // socket io stuff
        var httpServer = new http.Server(this._express);
        this._io = new Socket(httpServer);
        httpServer.listen(3000, () => {
            console.log('socket app listening on', 3000);
        });
        this._io.on('connection', (client) => {
            console.log('connected');
            client.emit('ping-reply', 'you are connected again');

            client.on('disconnect', () => {
                console.log('disconnected');
            });

            client.on('new-message', (data) => {
                console.log('new-message');
                client.emit('ping-reply', Date.now());
            });
        });  
        
    }
}

var socketServer = new SocketServer();
var apiServer = new ApiServer(socketServer);