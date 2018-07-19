import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import * as uuid from 'uuid/v1';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-start-stop-continue-board',
  templateUrl: './start-stop-continue-board.component.html',
  styleUrls: ['./start-stop-continue-board.component.css']
})
export class StartStopContinueBoardComponent implements OnInit {
  
  CONST = {
    START: 'start',
    STOP: 'stop',
    CONTINUE: 'continue'
  }

  who:string;
  notes:{
    start:Note[]
    stop:Note[],
    continue:Note[]
  }

  socket:any;

  constructor(private dataService:DataService) {
    this.who = uuid();
    this.notes = {
      start: Array(),
      stop: Array(),
      continue: Array(),
    };

    this.setupSocket();
  }

  ngOnInit() {
    this.notes['start'].push(new Note(uuid(), uuid(), 'start', 'why you so like start', Array()));
    this.notes['stop'].push(new Note(uuid(), uuid(), 'stop', 'why you so like stop', Array()));
    this.notes['continue'].push(new Note(uuid(), uuid(), 'continue', 'why you so like continue', Array()));
  }


  setupSocket() {
    this.socket = io();

    this.socket.on('ADD', (data) => {
      var note = new Note(data.id, data.who, data.title, data.body, data.votes);
      this.notes[data.where].push();
    });
  }


  createNote(where:string) {
    this.dataService.addNote(where, this.who).subscribe(res => {
      let result = JSON.parse(res);
      let note = result.info;
    });
  }

  editBody(note:Note) {
    note.isBodyEdit = true;
  }

  commitBody(note:Note, value:string) {
    note.isBodyEdit = false;
    note.body = value;
  }

  editTitle(note:Note) {
    note.isTitleEdit = true;
  }

  commitTitle(note:Note, value:string) {
    note.isTitleEdit = false;
    note.title = value;
  }
}

class Note {

  public isTitleEdit:boolean = false;
  public isBodyEdit:boolean = false;

  constructor(
    public id:string,
    public who:string,
    public title:string,
    public body:string,
    public votes:string[]) {}

  upVote(userid) {
    this.votes.push(userid);
  }

  downVote(userid) {
    for(let i = 0; i < this.votes.length; i++) {
      if(this.votes[i] === userid) {
        this.votes.splice(i, 1);
      }
    }
  }
}