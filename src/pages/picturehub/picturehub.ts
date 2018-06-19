import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController,Events } from 'ionic-angular';
import { HttpClient } from "@angular/common/http";

import { LoadingController,Loading,AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { DownloadItem } from '../download-manager/download-manager';

import { AppConfig } from '../../app/app.config';

/**
 * Generated class for the PicturehubPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-picturehub',
  templateUrl: 'picturehub.html',
})
export class PicturehubPage {
  pictures:Picture[]=[];
  page:number=1;
  tag:string="";
  constructor(public navCtrl: NavController
              ,public navParams: NavParams
              ,public http: HttpClient
              ,public loadingCtrl: LoadingController
              ,public alertCtrl:AlertController
              ,public modalCtrl:ModalController
              ,public storage:Storage
              ,public event:Events) {

  }

  ionViewDidLoad() {
    let loader=this.loadingCtrl.create({
      content: "Please wait...",
      duration:10000
    });
    loader.present();
    this.storage.get("lastPicturePage").then((val)=>{
      if(val != null)
        this.page=val;
      this.storage.get("lastPictureTag").then(val=>{
        if(val != null)
          this.tag=val;
        this.http.get("http://"+AppConfig.serverIp+":8080/getPictureUrls?page="+this.page.toString()+"&tags="+encodeURIComponent(this.tag)).subscribe((res: Response) => {
          loader.dismissAll();
          this.pictures=(<Picture[]><any> res);
        });
      });
    })
  }
  doInfinite(infiniteScroll){
    this.page++;
    let url="http://"+AppConfig.serverIp+":8080/getPictureUrls?page="+this.page.toString();
    if(this.tag.length>0)
      url+="&tags="+encodeURIComponent(this.tag);
    this.http.get(url).subscribe((res: Response) => {
      (<Picture[]><any> res).forEach((value,index,array)=>{
        this.pictures.push(value)
      });
      infiniteScroll.complete();
    });
    this.storage.set("lastPicturePage",this.page);
  }
  openPicture(url:String){
    let modal=this.modalCtrl.create(PictureModal,{url:url});
    modal.present();
  }

  download(avatarUrl:string,url:string){
    this.event.publish("download:addOne",new DownloadItem(avatarUrl,url,RegExp("/([^/]+?\\.(jpg|png))").exec(url)[1]
      .replace("Konachan.com%20-","")
      .replace(/%20/g,"")));
  }
  openPrompt(){
    let prompt=this.alertCtrl.create({
      title:"页面选择",
      inputs:[
        {
          name:"page",
          placeholder:this.page.toString()
        },{
          name:"tag",
          placeholder:this.tag.length==0 ? "标签...": this.tag
        }
      ],
      buttons:[
        {
          text:"Cancel",
          handler:data=>{}
        },
        {
          text:"Okay",
          handler:data=>{
            this.page=data.page;
            this.storage.set("lastPicturePage",this.page);
            if(data.tag!="标签..."){
              this.tag=data.tag;
              this.storage.set("lastPictureTag",this.tag);
            }
            let loader=this.loadingCtrl.create({
              content: "Please wait...",
            });
            loader.present();

            this.http.get("http://"+AppConfig.serverIp+":8080/getPictureUrls?page="+this.page.toString()+"&tags="+encodeURIComponent(this.tag)).subscribe((res: Response) => {
              loader.dismissAll();
              this.pictures=(<Picture[]><any> res);
            });
          }
        }
      ]
    });
    prompt.present();
  }
}
class Picture{
  url:String;
  preload:String;
}
@Component({
  template:`
      <ion-header>
        <ion-toolbar>
          <ion-title>
            查看原图
          </ion-title>
          <ion-buttons start>
            <button ion-button (click)="dismiss()">
              <ion-icon name="md-close"></ion-icon>
            </button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <br/><br/><br/>
        <img-loader [src]='url' (load)="imageLoaded()" useImg></img-loader>
      </ion-content>`
})
export class PictureModal{
  url:string;
  loading:Loading;
  constructor(public params:NavParams,public viewCtrl:ViewController){
    this.url=this.params.get("url");
  }
  dismiss(){
    this.viewCtrl.dismiss();
    this.loading.dismissAll();
  }
  imageLoaded(){
    this.loading.dismissAll();
  }
}

