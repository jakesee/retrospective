import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  name:string;
  age:number;
  email:string;
  address:Address;
  hobbies:string[];
  hello:any;
  posts:Post[];
  canEdit:boolean = true;

  constructor(private dataService:DataService) {
    console.log('constructor');
  }

  ngOnInit() {
    console.log('ngOnInit')

    this.name = 'John Doe';
    this.age = 30;
    this.email = 'john.doe@gmail.com';
    this.address = {
      street: '50 main street',
      city: 'boston',
      state: 'MA'
    }
    this.hobbies = ['write code', 'watch movies', 'listen to music'];
    this.hello = 'what is up dude!?';
    this.dataService.getPosts().subscribe(posts => {
      // console.log(posts);
      this.posts = posts;
    });
  }

  onClick() {
    console.log("hello clicked");

    this.name = 'Jake See'
    this.hobbies.push('Swimming');
  }

  toggleEdit() {
    this.canEdit = !this.canEdit;
  }

  addHobby(hobby) {
    console.log(hobby);
    this.hobbies.unshift(hobby);
    return false;
  }

  deleteHobby(hobby) {
    console.log('delete', hobby);
    for(let i = 0; i < this.hobbies.length; i++) {
      if(this.hobbies[i] == hobby) {
        this.hobbies.splice(i, 1);
      }
    }
  } 
}

interface Address {
  street:string,
  city:string,
  state:string
}

interface Post {
  userId:number,
  id:number,
  title:string,
  body:string
}