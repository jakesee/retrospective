import * as uuid from 'uuid/v1';

export class Board {
    
    start:Note[] = Array();
    stop:Note[] = Array();
    continue:Note[] = Array();

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
}

class Note {
    title:string;
    body:string;
    id:string; //uuid
    who:string; // uuid
    votes:string[]; // uuids

    constructor(who:string) {
        this.id = uuid();
        this.who = who;
        this.votes = Array();

        this.title = 'What is this about?';
        this.body = 'What do you say...?';
    }
}