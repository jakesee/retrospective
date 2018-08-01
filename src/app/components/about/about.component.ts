import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor(private _ds:DataService) { }

  ngOnInit() {
  }

  public update() {
    this._ds.updateDate();
  }

  public getDataService() {
    return this._ds;
  }

}
