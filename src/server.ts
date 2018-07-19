import * as express from 'express';
import * as socket from 'socket.io';
import * as http from 'http';
import { Board } from './api/board'
import * as BodyParser from 'body-parser';

class Server {
    app:express.Application;
    board:Board = new Board();
    io:socket.Server;
    clients:socket[] = Array();

    constructor() {
        this.app = express();

        // this is required so that angular knows where to find static files
        // it also defines the public root for express to find the angular index.html
        this.app.use(express.static(__dirname + '../../../retro/'))
        this.app.use(BodyParser.json()); // support JSON encoded bodies
        this.app.use(BodyParser.urlencoded({ extended: true})); // support encoded bodies

        this.config();

        // socket io stuff
        var httpServer = new http.Server(this.app);
        this.io = new socket(httpServer);
        this.io.on('connection', (socket) => {
            console.log('connected');
        });
    }

    config() {

        // set up the API stuff here
        this.app.get('/api/notes', (req, res) => {
            res.json({ title: 'xxx' });
        });

        this.app.post('/api/note/create', (req, res) => {
            var where = req.body.where;
            var who = req.body.who;
            var result = this.board.createNote(where, who);
            if(result.success === true) {
                this.io.emit('ADD', result.data);
            }
        });
        
        // this will run our angular 6 app
        this.app.get('*', (req, res) => {
            res.sendFile('index.html');
        });
    }

    start() {
        // start listening
        this.app.listen(8000, () => {
            console.log('listening on 8000');
        });
    }
}


var server = new Server();
server.start();