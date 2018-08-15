import * as _ from 'lodash';
import { Participant, Room, Rule } from './application.contract';

export enum Topic {
    Connect,
    Host,
    Join,
    Leave,
    List,
    HostChange,
    AddColumn,
    DeleteColumn,
    updateColumn,
    AddNote,
    DeleteNote,
    UpdateNote,
    UpvoteNote,
    DownvoteNote
}

export class Param {}

export class Request {
    constructor(public requester:string, public topic:Topic, public param:Param) {}
}

export class Response  {
    requester:string;
    topic:Topic;
    result:boolean = false;
    param:Param = null;
    constructor(request:Request) {
        this.requester = request.requester;
        this.topic = request.topic;
    }
    public success(param:Param) {
        this.param = param;
        this.result = true;
    }
    public fail() {
        this.param = null;
        this.result = false;
    }
}

export class ConnectResponse extends Param {
    constructor(public clientId) { super(); }
}

export class HostRequestParam extends Param {
    constructor(public roomName:string, public nickname, public color:string, public rule:Rule) {
        super();
    }
}
export class HostChangeRequestParam extends Param {
    constructor(public roomId:string, public newHostId:string) { super(); }
}
export class HostResponseParam extends Param {
    constructor(public participant:Participant, public room:Room) { super(); }
}

export class JoinRequestParam extends Param {
    constructor(public roomName:string, public nickname:string, public color:string) { super() }
}
export class JoinResponseParam extends Param {
    constructor(public participant:Participant, public room:Room) { super(); }
}

export class ListRequestParam extends Param {
    constructor() { super(); }
}

export class ListResponseParam extends Param {
    constructor(public rooms:string[]) { super(); }
}

export class LeaveRequestParam extends Param {
    constructor(public leaver:string) { super(); }
}

export class LeaveResponseParam extends Param {
    constructor(public leaver:Participant, public roomId:string) { super(); }
}

export class AddColumnRequestParam extends Param {
    
}

export class AddColumnResponseParam extends Param {
    constructor(public colId:string) { super(); }
}

export class DeleteColumnRequestParam extends Param {
    constructor(public colId:string) { super(); }
}

export class DeleteColumnResponseParam extends DeleteColumnRequestParam {

}

export class UpdateColumnRequestParam extends Param {
    constructor(public colId:string, public title:string) { super(); }
}

export class UpdateColumnResponseParam extends UpdateColumnRequestParam {

}

export class VoteRequestParam extends Param {
    constructor(public noteId:string, public voter:string) { super(); }
}

export class VoteResponseParam extends Param {
    constructor(public noteId:string, public voter:string) { super(); }
}

export class AddNoteRequestParam extends Param {
    constructor(public owner:string, public colId:string) { super(); }
}

export class AddNoteResponseParam extends Param {
    constructor(public owner:string, public colId:string, public noteId:string, public timestamp:number) { super(); }
}

export class UpdateNoteRequestParam extends Param {
    constructor(public noteId:string, public title:string, public body:string) { super(); }
}

export class UpdateNoteResponseParam extends UpdateNoteRequestParam {

}

export class DeleteNoteRequestParam extends Param {
    constructor(public owner:string, public noteId:string) { super(); }
}

export class DeleteNoteResponseParam extends Param {
    constructor(public owner:string, public noteId:string) { super(); }
}