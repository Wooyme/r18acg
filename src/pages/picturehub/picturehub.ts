import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController,Events } from 'ionic-angular';

import { LoadingController,AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import {HttpClient} from "@angular/common/http";

/**
 * Generated class for the PicturehubPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

class ComicUnit{
  title:string;
  epsCount:number;
  categories:string;
  id:string;
  pagesCount:number;
  author:string;
}

@IonicPage()
@Component({
  selector: 'page-picturehub',
  templateUrl: 'picturehub.html',
})
export class PicturehubPage {
  static BUILTIN_CATEGORIES = ["單行本","同人","SM","CG","純愛","后宮","姐姐"];
  static COMIC_FORMAT = (page)=>`http://118.89.141.135/api_comics.php?action=select&offset=${page*20}&limit=20`;
  static EPS_FORMAT = (comic,page)=>`http://112.74.198.120/api/comics/${comic}/eps/${page}.json`;
  static LIST_FORMAT = (eps,page)=>`http://112.74.198.120/api/eps/${eps}/pages/${page}.list`;
  comicUnits:ComicUnit[]=[];
  tailPage:number=1;
  headPage:number;
  category:string = "";
  constructor(public navCtrl: NavController
              ,public navParams: NavParams
              ,public http: HttpClient
              ,public loadingCtrl: LoadingController
              ,public alertCtrl:AlertController
              ,public modalCtrl:ModalController
              ,public storage:Storage
              ,public events:Events) {
  }
  ionViewDidLoad() {
    let loader=this.loadingCtrl.create({
      content: "Please wait...",
      duration:10000
    });
    loader.present();
    this.http.get("http://my-baidu.com/login/VTdFZNU0pCNHNFSXNrSVFHdkRHbHRLZ3BURExhZEUwUTBzNmdEdWtLcXhpZ0pjQVFBQUFBJCQAAAAAAAAAAAEAAACKJVGztrmw~DIwMTU3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALH92lux~dpbcV").toPromise()
      .then(res=>{
        console.log("BaiduLogin:"+JSON.stringify(res));
      }).catch(reason => {console.log(JSON.stringify(reason))});
    this.storage.get("lastPicturePage").then(val=>{
      if(val!=null)
        this.tailPage = val;
      this.headPage = this.tailPage;
      return this.http.get(PicturehubPage.COMIC_FORMAT(this.tailPage)).toPromise();
    }).then((res:any)=>{
      (<ComicUnit[]> res.data).forEach(value=>{
        this.comicUnits.push(value);
      });
      loader.dismissAll();
    });
    this.events.subscribe('category',(category)=>{
      let loader=this.loadingCtrl.create({
        content: "Please wait...",
        duration:10000
      });
      loader.present();
      this.comicUnits = [];
      this.category = category;
      this.headPage = this.tailPage = 1;
      if(category!="") {
        this.http.post(PicturehubPage.COMIC_FORMAT(this.tailPage), JSON.stringify({'categories': this.category})).subscribe((res: any) => {
          (<ComicUnit[]> res.data).forEach(value => {
            this.comicUnits.push(value);
          });
          loader.dismissAll();
        })
      }else{
        this.http.get(PicturehubPage.COMIC_FORMAT(this.tailPage)).subscribe((res:any)=>{
          (<ComicUnit[]> res.data).forEach(value=>{
            this.comicUnits.push(value);
          });
          loader.dismissAll();
        });
      }
    })
  }

  doNextPage(infiniteScroll){
    this.tailPage++;
    if(this.category=="") {
      this.storage.set("lastPicturePage", this.tailPage);
      this.http.get(PicturehubPage.COMIC_FORMAT(this.tailPage)).subscribe((res: any) => {
        (<ComicUnit[]> res.data).forEach(value => {
          this.comicUnits.push(value);
        });
        infiniteScroll.complete();
      });
    }else{
      this.http.post(PicturehubPage.COMIC_FORMAT(this.tailPage),JSON.stringify({'categories':this.category})).subscribe((res:any)=>{
        if(res.data.length == 0 || res.data == undefined){
          infiniteScroll.complete();
          infiniteScroll.enable(false);
        }else {
          (<ComicUnit[]> res.data).forEach(value => {
            this.comicUnits.push(value);
          });
          infiniteScroll.complete();
        }
      })
    }
  }

  doRefresh(refresher){
    if(this.headPage>1 && this.category==""){
      this.headPage--;
      this.http.get(PicturehubPage.COMIC_FORMAT(this.headPage)).subscribe((res:any)=>{
        (<ComicUnit[]> res.data).forEach(value=>{
          this.comicUnits.unshift(value);
        });
        refresher.complete();
      });
    }else{
      refresher.complete();
    }
  }

  openEps(id:string){
    let modal=this.modalCtrl.create(EpsModal,{id:id});
    modal.present();
  }

}
type Item = {title:string,_id:string,order:number};
@Component({
  template:`
      <ion-header>
        <ion-toolbar>
          <ion-title>
            选集
          </ion-title>
          <ion-buttons end>
            <button ion-button (click)="next()" [disabled]="!hasNext">
              下一页
            </button>
            <button ion-button (click)="dismiss()">
              <ion-icon name="md-close"></ion-icon>
            </button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <button ion-item *ngFor="let item of items" (click)="showPics(item)">
            {{ item.title }}
          </button>
        </ion-list>
      </ion-content>
  `
})
export class EpsModal{
  items:Item[]=[];
  page:number;
  hasNext:boolean = false;
  id:string;
  constructor(public params:NavParams,public viewCtrl:ViewController,public http:HttpClient,public modalCtrl:ModalController){
    this.id=this.params.get("id");
    this.http.get(PicturehubPage.EPS_FORMAT(this.id,1)).subscribe((res:any)=>{
      (<any[]> res.docs).forEach(value => {
        this.items.push(value);
      });
      if(res.pages>res.page){
        this.hasNext = true;
      }
    });
  }

  next(){
    this.http.get(PicturehubPage.EPS_FORMAT(this.id,this.page+1)).subscribe((res:any)=>{
      (<any[]> res.docs).forEach(value => {
        this.items.push(value);
      });
      if(res.pages>res.page){
        this.hasNext = true;
      }
    });
  }

  dismiss(){
    this.viewCtrl.dismiss();
  }
  showPics(item:Item){
    let modal=this.modalCtrl.create(PictureModal,{title:item.title,id:item._id});
    modal.present();
  }
}


@Component({
  template:`
    <ion-header>
      <ion-toolbar>
        <ion-title>
          {{title}}
        </ion-title>
        <ion-buttons start>
          <button ion-button (click)="dismiss()">
            <ion-icon name="md-close"></ion-icon>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h4 *ngIf="!loaded">{{loadingText}}</h4>
      <ion-list>
        <img ion-item *ngFor="let pic of pictures" [src]="pic">
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="doNextPage($event)">
        <ion-infinite-scroll-content loadingSpinner="bubbles" [loadingText]="infiniteText"></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `
})
export class PictureModal{
  static HEAD_FORMAT = (part)=>`http://112.74.198.120/api/heads/${part}.head.json`;
  static IMAGE_FORMAT = (offset,end,locate) =>`http://my-hub.com/data/${offset}/${end}/${locate}`;
  static LOCATE_FORMAT = (uri)=>`http://my-baidu.com/locate/v2/${uri}`;
  static heads:{}= {};
  title:string;
  id:string;
  page = 1;
  loaded:boolean = false;
  loadingText = "等待图片加载...";
  infiniteText = "加载下一页...";
  url:string;
  pictures:string[]=[];

  constructor(public params:NavParams,public viewCtrl:ViewController,public http:HttpClient){
    this.id = this.params.get("id");
    this.title = this.params.get("title");
    this.loadData(this.id,this.page,(result)=>{
      if(result.isOK){
        this.loaded = true;
      }else{
        this.loadingText = `加载失败\n${JSON.stringify(result)}`;
      }
    })
  }

  loadData(id,page,next:(result)=>void){
    let parts = [];
    let filteredParts = [];
    let raw:string[]=[];
    this.http.get(PicturehubPage.LIST_FORMAT(id,page),{responseType: 'text'}).toPromise().then((res:any)=>{
      res.split("\n").forEach(value=>{
        let part = value.split("/")[0];
        if(part.length==0)
          return;
        if(parts.indexOf(part)<0){
          parts.push(part)
        }
        raw.push(value);
      });
      filteredParts = parts.filter(value=>PictureModal.heads[value]==undefined);
      return Promise.all(filteredParts.map(value=>this.http.get(PictureModal.HEAD_FORMAT(value)).toPromise()));
    }).then((res:{size:number,file:string}[][])=>{
      res.forEach((value,index)=>{
        let offset = 0;
        let info = {};
        ////////////////////////计算打包文件头长度/////////////////////////////////////
        let headLen = 4;
        value.forEach(val=>{
          headLen+=8+val.file.length;
        });
        ////////////////////////通过包头长度、每个文件大小，计算当前文件offset和end位置/////////////////////////////////////
        value.forEach(val=>{
          info[val.file.split("/")[2]] = {offset:offset+headLen,end:offset+val.size+headLen};
          offset+=val.size;
        });
        PictureModal.heads[filteredParts[index]] = info;
      });
      return Promise.all(parts.map(value => this.http.get(PictureModal.LOCATE_FORMAT(value)).toPromise()))
    }).then((res:{url:string}[])=>{
      raw.forEach(value=>{
        let part = value.split("/")[0];
        let file = value.split("/")[1];
        let index = parts.indexOf(part);
        let info =<{offset:number,end:number}> PictureModal.heads[part][file];
        let locate = res[index].url;
        let url = PictureModal.IMAGE_FORMAT(info.offset,info.end,locate);
        this.pictures.push(url);
      });
      next({isOK:true});
    }).catch(reason=>{next(reason)});
  }

  doNextPage(infiniteScroll){
    this.loadData(this.id,this.page+1,result => {
      if(result.isOK == false || result.isOK == undefined){
        this.infiniteText = "到底了";
        infiniteScroll.enable(false);
      }else{
        infiniteScroll.complete();
        this.page++;
      }
    });
  }
  dismiss(){
    this.viewCtrl.dismiss();
  }
}



