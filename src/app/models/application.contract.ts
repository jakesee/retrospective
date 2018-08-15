import * as uuid from 'uuid/v1';
import * as _ from 'lodash';
import * as S from './server.contract';

export class Participant {
    public votes:number; // number of votes available
    constructor(public id:string, public nickname:string, public color:string, rule:Rule) {
        this.votes = rule.votes;
    }
}

export class Note {
    owner:string;
    colId:string;
    id:string;
    title:string;
    body:string;
    voters:string[];
    timestamp:number;

    constructor(id:string, owner:string, colId:string) {
        this.id = id;
        this.colId = colId;
        this.owner = owner;
        this.voters = Array();
        this.title = 'What is this about?';
        this.body = 'What do you say...?';
        this.timestamp = +new Date();
    }
}

export class Column {
    title:string;
    timestamp:number;
    constructor(public id:string) {
        this.timestamp = +new Date();
    }
}

export class Rule {
    votes:number = 6;
}
export class Room {
    public participants:Participant[];
    public columns:Column[];
    public notes:Note[];

    constructor(public roomId:string, public name:string, public hostId:string, public rule:Rule) {
        this.columns = [new Column(uuid())];
        this.notes = [];
        this.participants = [];
    }
}