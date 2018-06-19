import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PicturehubPage } from "../picturehub/picturehub";
import { VideohubPage } from "../videohub/videohub";
/**
 * Generated class for the MainPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-main',
  templateUrl: 'main.html',
})
export class MainPage {
  items:Object[];
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.items=[
      {
        id:0,
        img:'assets/imgs/t1.jpg',
        title:'R18 音声',
        value:'耳搔，舔耳'
      },
      {
        id:1,
        img:'assets/imgs/t2.jpg',
        title:'R18 图集',
        value:'同人本，H单图'
      },
      {
        id:2,
        img:'assets/imgs/t3.jpg',
        title:'R18 动画',
        value:'3D动画，同人动画，里番'
      }
    ];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MainPage');
  }

  public test(id:Number){
    switch (id){
      case 0:
        break;
      case 1:
        this.navCtrl.push(PicturehubPage);
        break;
      case 2:
        this.navCtrl.push(VideohubPage);
        break;
    }
  }

}
