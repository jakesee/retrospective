import * as uuid from 'uuid/v1';
import * as _ from 'lodash';
import * as crypto from 'crypto';

export class Board {
    
    public start:Note[] = Array();
    public stop:Note[] = Array();
    public continue:Note[] = Array();

    constructor() {
        
    }

    export() {
        // return everything in a table csv format maybe
        console.log('TODO:', 'return everything in a table csv format maybe');
    }

    createJSONResponse(success:boolean, data:any) {
        return { success: success, data: data };
    }

    createNote(where, who) {
        let note = new Note(who);
        if(where === 'start') this.start.push(note);
        else if(where === 'stop') this.stop.push(note);
        else if(where === 'continue') this.stop.push(note);

        var data:any = note;
        data.where = where;
        return this.createJSONResponse(true, data);
    }

    deleteNote(id) {
        var o = { id: id, where: null }
        for(let i = 0; i < this.start.length; i++) {
            if(this.start[i].id === id) this.start.splice(i, 1);
            o.where = 'start';
        }
        for(let i = 0; i < this.stop.length; i++) {
            if(this.stop[i].id === id) this.stop.splice(i, 1);
            o.where = 'stop';
        }
        for(let i = 0; i < this.continue.length; i++) {
            if(this.continue[i].id === id) this.continue.splice(i, 1);
            o.where = 'continue';
        }

        return JSON.stringify(o);
    }

    updateNote(where, note:Note) {

    }

    public hash() {
        var all = _.concat(this.start, this.stop, this.continue);
        var hash = crypto.createHash('sha256');
        for(var i = 0; i < all.length; i++) {
            hash.update(all[i].id + all[i].owner + all[i].votes + all[i].timestamp);
        }
        return hash.digest('hex');
    }

    public sort() {
        
      
    }
}

class Column {

    public notes:Note[] = Array();

    constructor() {
     
    }

    public addNote(owner:string) {
        this.notes.push(new Note(owner));
    }

    public updateNote(id:string, data:any) {
        for(var i = 0; i < this.notes.length; i++) {
            if(this.notes[i].id === id) {
                this.notes[i].title = data.title;
                this.notes[i].body = data.body;
            }
        }
    }

    public deleteNote(id:string) {
        _.remove(this.notes, (o) => {
            return o.id == id;
        });
    }

    public sort() {
        _.sortBy(this.notes, ['votes', 'timestamp']);
    }
}

class Note {
    title:string;
    body:string;
    id:string; //uuid
    owner:string; // uuid
    votes:string[]; // owner uuids
    timestamp:number;

    constructor(owner:string) {
        this.id = uuid();
        this.owner = owner;
        this.votes = Array();

        this.title = 'What is this about?';
        this.body = 'What do you say...?';
        this.timestamp = +new Date();
    }
}