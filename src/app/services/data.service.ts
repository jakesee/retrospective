import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { map } from 'rxjs/operators';
import * as uuid from 'uuid/v1';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private _data;

  constructor() { 
    console.log('Data service connected', uuid());
  }

  public updateDate() {
    this._data = Date.now();
  }



  // getPosts() {
  //   return this.http.get('https://jsonplaceholder.typicode.com/posts').pipe(map(res => res.json()));
  // }

  // addNote(where:string, who:string) {
  //   return this.http.post('/api/note/create', { who: who, where: where }).pipe(map(res => res.json()));
  // }

  // // delete note
  // deleteNote(where:string, who:string, id:string) {
  //   return this.http.post('/api/note/delete', { where: where, who: who, id: id }).pipe(map(res => res.json()));
  // }

  // editNote(where:string, who:string, id:string, title:string, body:string) {
  //   return this.http.post('/api/note/edit', { where: where, who: who, id: id, title: title, body: body }).pipe(map(res => res.json()));
  // }

  // // vote or unvote is already voted
  // // returns the updated note
  // vote(where:string, who:string, id:string) {
  //   return this.http.post('/api/note/vote/', { where: where, who: who, id: id }).pipe(map(res => res.json()));
  // }
}
