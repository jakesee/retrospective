import * as express from 'express';
import * as Socket from 'socket.io';
import * as http from 'http';
import { Board } from './api/board'
import * as BodyParser from 'body-parser';

class ApiServer {
    private _express:express.Application;
    private _io:Socket;
    private _http;
    PORT = process.env.PORT || 8000;

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

            client.on('new-message', (data) => {
                console.log('new-message');
                client.emit('ping-reply', data, Date.now());
            });
        });  
    }

    _setupMiddlewares() {
        this._express.use(express.static(__dirname + '../../../retro/'))
        this._express.use(BodyParser.json()); // support JSON encoded bodies
        this._express.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies
    }

    _setupRoutes() {
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
}

var apiServer = new ApiServer();