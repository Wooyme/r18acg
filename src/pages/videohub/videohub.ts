import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { StreamingMedia, StreamingVideoOptions } from '@ionic-native/streaming-media';
import { HttpClient } from "@angular/common/http";

import { LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
import {AppConfig} from "../../app/app.config";

/**
 * Generated class for the VideohubPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-videohub',
  templateUrl: 'videohub.html',
})
export class VideohubPage {
  videos:Video[]=[];
  page=1;
  tag="";
  search="";
  options: StreamingVideoOptions = {
    errorCallback: (e) => { alert('Error streaming') },
    orientation: 'landscape'
  };
  constructor(public navCtrl: NavController
              ,public navParams: NavParams
              ,private streamingMedia: StreamingMedia
              ,private http:HttpClient
              ,private loadingCtrl:LoadingController
              ,private storage:Storage
              ,private alertCtrl: AlertController
              ,private event:Events) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad VideohubPage');
    let loader=this.loadingCtrl.create({
      content: "Please wait...",
      duration:60000
    });
    loader.present();
    this.storage.get("lastVideoSearch").then(val=>{
      if(val != null)
        this.search=val;
      this.storage.get("lastVideoTag").then(val => {
        if(val != null)
          this.tag=val;
        this.storage.get("lastVideoPage").then(val=>{
          if(val != null)
            this.page=val;
          let url="http://"+AppConfig.serverIp+":8080/getVideoUrls";
          if(this.search.length>0){
            url+="/search?search="+this.search+"&page="+this.page.toString();
          }else if(this.tag.length>0){
            url+="?c="+this.tag+"&page="+this.page.toString();
          }else{
            url+="?page="+this.page.toString();
          }
          this.http.get(url).subscribe((res: Response) => {
            loader.dismissAll();
            this.videos=(<Video[]><any> res);
            try {
              if (this.videos.length < 1) {
                alert("视频库获取失败");
              }
            }catch(e) {
              alert("视频库获取失败");
            }
          });
        })
      })
    });
  }
  doInfinite(infiniteScroll){
    this.page++;
    let url="http://"+AppConfig.serverIp+":8080/getVideoUrls";
    if(this.search.length>0){
      url+="/search?search="+this.search+"&page="+this.page.toString();
    }else if(this.tag.length>0){
      url+="?c="+this.tag+"&page="+this.page.toString();
    }else{
      url+="?page="+this.page.toString();
    }
    this.http.get(url).subscribe((res: Response) => {
      (<Video[]><any> res).forEach((value,index,array)=>{
        this.videos.push(value)
      });
      infiniteScroll.complete();
    });
    this.storage.set("lastVideoPage",this.page);
  }

  prePlayVideo(videoInfoUrl:string){
    let loader=this.loadingCtrl.create({
      content: "正在获取视频链接...",
      duration:10000
    });
    loader.present();
    this.http.get(videoInfoUrl).subscribe((res: Response) => {
      loader.dismissAll();
      let videoInfos=(<VideoInfo[]><any> res);
      try {
        this.showVideoQualitySelect(videoInfos);
      }catch(e) {
        alert("获取失败，请重试...");
      }
    });
  }

  showVideoQualitySelect(infos:VideoInfo[]){
    let alert = this.alertCtrl.create();
    alert.setTitle('画质选择');
    infos.forEach((info)=>{
      let label:string;
      switch (info.quality){
        case "720":
          label="高清";
          break;
        case "480":
          label="标清";
          break;
        case "240":
          label="流畅";
          break;
      }
      alert.addInput({
        type: 'checkbox',
        label: label,
        value: info.quality,
      })
    });
    alert.addButton({
      text:'Cancel',
      handler:data=>{}
    });
    alert.addButton({
      text: 'Okay',
      handler: data => {
          this.streamingMedia.playVideo(infos.filter((value)=>{return value.quality==data[0]})[0].url,this.options);
      }
    });
    alert.present();
  }

  download(avatarUrl:string,url:string,title:string){
    this.http.get(url).subscribe((res: Response) => {
      let infos=(<VideoInfo[]><any> res);
      let alert = this.alertCtrl.create();
      alert.setTitle('画质选择');
      infos.forEach((info)=>{
        let label:string;
        switch (info.quality){
          case "720":
            label="高清";
            break;
          case "480":
            label="标清";
            break;
          case "240":
            label="流畅";
            break;
        }
        alert.addInput({
          type: 'checkbox',
          label: label,
          value: info.quality,
        })
      });
      alert.addButton({
        text:'Cancel',
        handler:data=>{}
      });
      alert.addButton({
        text: 'Okay',
        handler: data => {
          //TODO;
        }
      });
      alert.present();
    });
  }
  selectPage(){
    let prompt=this.alertCtrl.create({
      title:"页面选择",
      inputs:[
        {
          name:"page",
          placeholder:this.page.toString()
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
            let loader=this.loadingCtrl.create({
              content: "Please wait...",
            });
            loader.present();
            let url="http://"+AppConfig.serverIp+":8080/getVideoUrls";
            if(this.search.length>0){
              url+="/search?search="+this.search+"&page="+this.page.toString();
            }else if(this.tag.length>0){
              url+="?c="+this.tag+"&page="+this.page.toString();
            }else{
              url+="?page="+this.page.toString();
            }
            this.http.get(url).subscribe((res: Response) => {
              loader.dismissAll();
              this.videos=(<Video[]><any> res);
            });
            this.storage.set("lastVideoPage",this.page);
          }
        }
      ]
    });
    prompt.present();
  }
  selectTag(){
    let prompt=this.alertCtrl.create({
      title:"视频类型",
      inputs:[
        {
          type: 'radio',
          label: '蕾丝',
          value: '27'
        },
        {
          type: 'radio',
          label: '熟女',
          value: '28'
        },
        {
          type: 'radio',
          label: '日本',
          value: '111'
        },
        {
          type: 'radio',
          label: '中出',
          value: '15'
        },
        {
          type: 'radio',
          label: '多P',
          value: '65'
        },
        {
          type: 'radio',
          label: '动画',
          value: '86'
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
            let loader=this.loadingCtrl.create({
              content: "Please wait...",
              duration:60000
            });
            loader.present();
            this.page=1;
            this.search="";
            this.tag=data;
            this.http.get("http://"+AppConfig.serverIp+":8080/getVideoUrls?c="+data+"&page=0").subscribe((res: Response) => {
              loader.dismissAll();
              this.videos=(<Video[]><any> res);
            });
            this.storage.set("lastVideoTag",this.tag);
            this.storage.set("lastVideoSearch",this.search);
          }
        }
      ]
    });
    prompt.present();
  }
  searchVideo(){
    let prompt=this.alertCtrl.create({
      inputs:[
        {
          name:"search",
          placeholder:"搜索..."
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
            let loader=this.loadingCtrl.create({
              content: "Please wait...",
              duration:60000
            });
            loader.present();
            this.page=1;
            this.search=data.search;
            this.http.get("http://"+AppConfig.serverIp+":8080/getVideoUrls/search?search="+encodeURIComponent(data.search)+"&page=0").subscribe((res: Response) => {
              loader.dismissAll();
              this.videos=(<Video[]><any> res);
            });
            this.storage.set("lastVideoSearch",this.search);
          }
        }
      ]
    });
    prompt.present();
  }
}

class Video{
  url:string;
  preload:string;
  title:string;
}

class VideoInfo{
  quality:string;
  url:string;
}
