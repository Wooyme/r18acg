import {Component, NgZone} from '@angular/core';
import {
  Events,
  IonicPage,
  LoadingController,
  ModalController,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import {Storage} from '@ionic/storage';

import {HttpClient} from "@angular/common/http";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {AppConfig} from "../../app/app.config";

/**
 * Generated class for the PicturehubPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

class ComicUnit {
  title: string;
  epsCount: number;
  categories: string;
  id: string;
  pagesCount: number;
  author: string;
  thumb_path: string | SafeUrl;

}

@IonicPage()
@Component({
  selector: 'page-picturehub',
  templateUrl: 'picturehub.html',
})
export class PicturehubPage {
  static BUILTIN_CATEGORIES = ["單行本", "同人", "SM", "CG", "純愛", "后宮", "姐姐"];
  static COMIC_FORMAT = (page) => `http://118.89.141.135/api_comics.php?action=select&offset=${page * 20}&limit=5`;
  static EPS_FORMAT = (comic, page) => `http://118.89.141.135/comics/${comic}/eps/${page}.json`;
  static LIST_FORMAT = (eps, page) => `http://118.89.141.135/comics/eps/${eps}/pages/${page}.list`;
  // static LOCATE_FORMAT = (uri) => `http://my-baidu.com/locate/v2/${uri}`;
  // static IMAGE_FORMAT = (offset, end, locate) => `http://my-hub.com/data/${offset}/${end}/${locate}`;
  static HEAD_FORMAT = (part) => `http://118.89.141.135/comics/heads/${part}.head.json`;
  static LOCATE_FORMAT_DEBUG = (uri) => `http://118.89.141.135/debug/baidu.php?id=${uri}`;
  comicUnits: ComicUnit[] = [];
  tailPage: number = 1;
  headPage: number;
  category: string = "";
  thumbHeads: {} = {};

  constructor(public navCtrl: NavController
    , public navParams: NavParams
    , public http: HttpClient
    , public loadingCtrl: LoadingController
    , public modalCtrl: ModalController
    , public storage: Storage
    , public events: Events
    , private sanitizer: DomSanitizer) {
  }

  ionViewDidLoad() {
    let loader = this.loadingCtrl.create({
      content: "Please wait...",
      duration: 10000
    });
    loader.present();
    this.http.get(PicturehubPage.HEAD_FORMAT("thumb")).toPromise()
      .then((res: { size: number, file: string }[]) => {
        let offset = 0;
        let info = {};
        ////////////////////////计算打包文件头长度/////////////////////////////////////
        let headLen = 4;
        res.forEach(val => {
          headLen += 8 + val.file.length;
        });
        ////////////////////////通过包头长度、每个文件大小，计算当前文件offset和end位置/////////////////////////////////////
        res.forEach(val => {
          info[val.file.split("/")[1]] = {offset: offset + headLen, end: offset + val.size + headLen};
          offset += val.size;
        });
        this.thumbHeads = info;
        return this.storage.get("lastPicturePage");
      }).then(val => {
      if (val != null)
        this.tailPage = val;
      this.headPage = this.tailPage;
      return this.loadPage(this.tailPage, "")
    }).then((res: ComicUnit[]) => {
      res.forEach(value => {
        this.comicUnits.push(value);
      });
      loader.dismissAll();
    }).catch((err) => {
      console.log(JSON.stringify(err))
    });
    this.events.subscribe('category', (category) => {
      let loader = this.loadingCtrl.create({
        content: "Please wait...",
        duration: 10000
      });
      loader.present();
      this.comicUnits = [];
      this.category = category;
      this.headPage = this.tailPage = 1;
      this.loadPage(this.tailPage, this.category).then((res: ComicUnit[]) => {
        res.forEach(value => {
          this.comicUnits.push(value);
        });
        loader.dismissAll();
      });
    })
  }

  doNextPage(infiniteScroll) {
    this.tailPage++;
    if (this.category == "")
      this.storage.set("lastPicturePage", this.tailPage);
    this.loadPage(this.tailPage, this.category).then((res: ComicUnit[]) => {
      if (res.length == 0) {
        infiniteScroll.complete();
        infiniteScroll.enable(false);
      } else {
        res.forEach(value => {
          this.comicUnits.push(value);
        });
        infiniteScroll.complete();
      }
    })
  }

  doRefresh(refresher) {
    //如果category不为空，则认为没有上一页。
    if (this.headPage > 1 && this.category == "") {
      this.headPage--;
      this.storage.set("lastPicturePage", this.headPage);
      this.loadPage(this.headPage, this.category).then((res: ComicUnit[]) => {
        res.forEach(value => {
          this.comicUnits.unshift(value);
        });
        refresher.complete();
      });
    } else {
      refresher.complete();
    }
  }

  loadPage(page, category): Promise<any> {
    let promise;
    if (category == "") {
      promise = this.http.get(PicturehubPage.COMIC_FORMAT(page)).toPromise()
    } else {
      promise = this.http.post(PicturehubPage.COMIC_FORMAT(page), JSON.stringify({'categories': category})).toPromise()
    }
    let comics: ComicUnit[] = [];
    return Promise.all([promise
      , this.http.get(PicturehubPage.LOCATE_FORMAT_DEBUG("thumb.pack")).toPromise()])
      .then((res: any[]) => {
        if (res[0].data.length == 0 || res[0].data == undefined) {
          return new Promise((resolve) => {
            resolve([])
          });
        }
        let imageRequests:Promise<any>[] = [];
        console.log(res[0].data);
        (<ComicUnit[]> res[0].data).forEach((value) => {
          let info: { offset: number, end: number } = this.thumbHeads[value.thumb_path.toString()];
          value['raw_thumb_path'] =value.thumb_path.toString();
          value.thumb_path = "assets/imgs/loading.gif";
          imageRequests.push(this.imageBlobRequest(res[1], info.offset, info.end, value));
        });
        comics = res[0].data;
        imageRequests.forEach((value:Promise<any>)=>{
          value.then((v:{blob:SafeUrl,unit:{thumb_path:string|SafeUrl}})=>{
            v.unit.thumb_path = v.blob;
          })
        });
        return new Promise(resolve => {
          resolve(comics);
        });
      }).catch(reason => console.log(reason));
  }

  imageBlobRequest(_url: string[], offset: number | string, end: number | string, unit?: any): Promise<any> {
    let url = Object.assign([],_url);
    let promise = this.http.get(url.shift(), {
      responseType: 'arraybuffer',
      headers: {'Range': `bytes=${offset}-${end}`}
    }).toPromise();
    let handle = (buf: any) => {
      let file = new Blob([buf], {type: 'image/jpeg'});
      let blob = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      return new Promise(resolve => {
        resolve({'blob': blob, 'unit': unit});
      })
    };
    let err = (reason) => {
      if (reason.status == 403 && url.length > 0) {
        promise = this.http.get(url.shift(), {
          responseType: 'arraybuffer',
          headers: {'Range': `bytes=${offset}-${end}`}
        }).toPromise();
        return promise.then(handle).catch(err);
      } else {
        return new Promise(resolve => {
          resolve({'blob': null, 'unit': unit});
        })
      }
    };
    return promise.then(handle).catch(err);
  }

  fixBroken(unit:ComicUnit){
    if(unit['give_up']!=undefined)
      return;
    let info: { offset: number, end: number } = this.thumbHeads[unit['raw_thumb_path']];
    this.http.get(PicturehubPage.LOCATE_FORMAT_DEBUG("thumb.pack")).toPromise().then((value:string[]) => {
      return this.imageBlobRequest(value,info.offset,info.end,null);
    }).then((value:{blob:SafeUrl})=>{
      if(value.blob!=null)
        unit.thumb_path = value.blob;
      else
        unit['give_up']=1;
    })
  }

  openEps(id: string) {
    let modal = this.modalCtrl.create(EpsModal, {id: id});
    modal.present();
  }

}

type Item = { title: string, _id: string, order: number };

@Component({
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          选集
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <button ion-item *ngFor="let item of items" (click)="showPics(item)">
          {{ item.title }}
        </button>
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="next($event)">
        <ion-infinite-scroll-content loadingSpinner="bubbles"
                                     loadingText="加载更多..."></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `
})
export class EpsModal {
  items: Item[] = [];
  page: number;
  hasNext: boolean = false;
  id: string;

  constructor(public params: NavParams, public viewCtrl: ViewController, public http: HttpClient, public modalCtrl: ModalController) {
    this.id = this.params.get("id");
    this.http.get(PicturehubPage.EPS_FORMAT(this.id, 1)).subscribe((res: any) => {
      (<any[]> res.docs).forEach(value => {
        this.items.push(value);
      });
      this.hasNext = res.pages > res.page;
    });
  }

  next(infiniteScroll) {
    if (this.hasNext == false) {
      infiniteScroll.complete();
      infiniteScroll.enable(false);
    } else {
      this.http.get(PicturehubPage.EPS_FORMAT(this.id, this.page + 1)).subscribe((res: any) => {
        (<any[]> res.docs).forEach(value => {
          this.items.push(value);
        });
        this.hasNext = res.pages > res.page;
        infiniteScroll.complete();
      });
    }
  }

  showPics(item: Item) {
    let modal = this.modalCtrl.create(PictureModal, {title: item.title, id: item._id});
    modal.present();
  }
}


@Component({
  selector: 'modal-picturehub',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          {{title}}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <h4 *ngIf="!loaded">{{loadingText}}</h4>
      <ion-list>
        <img ion-item *ngFor="let pic of pictures" [src]="pic.url" (onerror)="fixBroken(pic)">
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="doNextPage($event)">
        <ion-infinite-scroll-content loadingSpinner="bubbles"
                                     [loadingText]="infiniteText"></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `
})
export class PictureModal {
  static heads: {} = {};
  title: string;
  id: string;
  page = 1;
  loaded: boolean = false;
  loadingText = "等待图片加载...";
  infiniteText = "加载下一页...";
  url: string;
  pictures: {url:string|SafeUrl,part:string|number,file:string}[] = [];
  locatePromises:Promise<any[]> = null;

  constructor(public params: NavParams, public viewCtrl: ViewController, public http: HttpClient, private sanitizer: DomSanitizer) {
    this.id = this.params.get("id");
    this.title = this.params.get("title");
    this.loadData(this.id, this.page, (result) => {
      if (result.isOK) {
        this.loaded = true;
      } else {
        this.loadingText = `加载失败\n${JSON.stringify(result)}`;
      }
    })
  }

  loadData(id, page, next: (result) => void) {
    let parts = [];
    let filteredParts = [];
    let raw: {url:string,part:string|number,file:string}[] = [];
    this.http.get(PicturehubPage.LIST_FORMAT(id, page), {responseType: 'text'}).toPromise().then((res: any) => {
      res.split("\n").forEach((value:string) => {
        let part = value.split("/")[0];
        let file = value.split("/")[1];
        if (part.length == 0)
          return;
        if (parts.indexOf(part) < 0) {
          parts.push(part)
        }
        raw.push({url:"assets/imgs/loading.gif",part:part,file:file});
      });
      filteredParts = parts.filter(value => PictureModal.heads[value] == undefined);
      return Promise.all(filteredParts.map(value => this.http.get(PicturehubPage.HEAD_FORMAT(value)).toPromise()));
    }).then((res: { size: number, file: string }[][]) => {
      res.forEach((value, index) => {
        let offset = 0;
        let info = {};
        ////////////////////////计算打包文件头长度/////////////////////////////////////
        let headLen = 4;
        value.forEach(val => {
          headLen += 8 + val.file.length;
        });
        ////////////////////////通过包头长度、每个文件大小，计算当前文件offset和end位置/////////////////////////////////////
        value.forEach(val => {
          info[val.file.split("/")[2]] = {offset: offset + headLen, end: offset + val.size + headLen};
          offset += val.size;
        });
        PictureModal.heads[filteredParts[index]] = info;
      });
      this.locatePromises = Promise.all(parts.map(value => this.http.get(PicturehubPage.LOCATE_FORMAT_DEBUG(value)).toPromise()));
      return this.locatePromises
    }).then((res: string[][]) => {
      let count = 0;
      let forEach = (response:{blob:SafeUrl,unit:{index:number,pic:{url:SafeUrl|string},urls:string[][]}})=>{
        if(response!=null){
          response.unit.pic.url = response.blob;
        }
        if(raw.length==0)
          return;
        let pic = raw.shift();
        let index = parts.indexOf(pic.part);
        let info = <{ offset: number, end: number }> PictureModal.heads[pic.part][pic.file];
        if(response==null){
          this.imageBlobRequest(res[index],info.offset,info.end,{index:0,pic:pic,urls:res}).then(forEach);
          return;
        }
        // response.unit.index+=1;
        response.unit.pic = pic;
        this.imageBlobRequest(response.unit.urls[index],info.offset,info.end,response.unit).then(forEach);
      };
      raw.forEach((value) => {
        this.pictures.push(value);
      });
      forEach(null);
      next({isOK: true});
    }).catch(reason => {
      next(reason)
    });
  }

  doNextPage(infiniteScroll) {
    this.loadData(this.id, this.page + 1, result => {
      if (result.isOK == false || result.isOK == undefined) {
        this.infiniteText = "到底了";
        infiniteScroll.enable(false);
      } else {
        infiniteScroll.complete();
        this.page++;
      }
    });
  }

  imageBlobRequest(url: string[], offset: number | string, end: number | string, unit: any): Promise<any> {
    let copyOfUrl = Object.assign([],url);
    let promise = this.http.get(copyOfUrl.shift(), {
      responseType: 'arraybuffer',
      headers: {'Range': `bytes=${offset}-${end}`,'Custom-Cookie':`BDUSS=${AppConfig.BDUSS}`}
    }).toPromise();
    let handle = (buf: any) => {
      let file = new Blob([buf], {type: 'image/jpeg'});
      let blob = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
      return new Promise(resolve => {
        resolve({'blob': blob, 'unit': unit});
      });
    };
    let err = (reason) => {
      if (reason.status == 403 && copyOfUrl.length > 0) {
        console.log("Retry!");
        promise = this.http.get(copyOfUrl.shift(), {
          responseType: 'arraybuffer',
          headers: {'Range': `bytes=${offset}-${end}`}
        }).toPromise();
        return promise.then(handle).catch(err);
      } else {
        return new Promise(resolve => {
          resolve({'blob': null, 'unit': unit});
        })
      }
    };
    return promise.then(handle).catch(err);
  }

  fixBroken(pic:{url:string|SafeUrl,part:number|string,file:string}){
    if(pic['give_up']!==undefined)
      return;
    console.log("Fix broken image: "+pic.file);
    let info = <{ offset: number, end: number }> PictureModal.heads[pic.part][pic.file];
    this.http.get(PicturehubPage.LOCATE_FORMAT_DEBUG(pic.part)).toPromise().then((value:string[]) => {
      return this.imageBlobRequest(value,info.offset,info.end,pic);
    }).then((value:{blob:SafeUrl,unit:{url:SafeUrl}}) => {
      if(value.blob==null)
        value.unit['give_up']=1;
      else
        value.unit.url = value.blob;
    })
  }
}
