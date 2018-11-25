import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, NavController, NavParams, ViewController} from 'ionic-angular';
import {HttpClient} from "@angular/common/http";
import {videojs} from 'video.js'
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";

/**
 * Generated class for the HanimePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

class VideoUnit {
  name: string;
  size: string;
  page: number | string;
  offset: number;
  end: number;
}

@IonicPage()
@Component({
  selector: 'page-hanime',
  templateUrl: 'hanime.html',
})
export class HanimePage {
  static LOCATE_FORMAT = (uri) => `http://118.89.141.135/debug/baidu_video.php?id=${uri}`;
  static HEAD_FORMAT = (page) => `http://118.89.141.135/animes/heads/${page}.head.json`;
  info = {};
  url: string | SafeUrl = null;
  page: number = 1;
  videoUnits: VideoUnit[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private http: HttpClient,public modalCtrl: ModalController) {
    this.loadPage(this.page).then((res:VideoUnit[])=>{
      res.forEach(value => {
        this.videoUnits.push(value);
      });
    });
  }

  loadPage(page:number):Promise<any>{
    return this.http.get(HanimePage.HEAD_FORMAT(page)).toPromise().then((res: any) => {
      console.log("Get Head:" + JSON.stringify(res));
      let offset = 0;
      let info = {};
      ////////////////////////计算打包文件头长度/////////////////////////////////////
      let headLen = 4;
      res.forEach(val => {
        headLen += 8 + val.file.length;
      });
      ////////////////////////通过包头长度、每个文件大小，计算当前文件offset和end位置/////////////////////////////////////
      let videoUnitsIn = [];
      res.forEach(val => {
        let name = val.file.split("/")[1];
        info[name] = {offset: offset + headLen, end: offset + val.size + headLen};
        videoUnitsIn.push({
          name: name,
          size: val.size,
          page: page,
          offset: offset + headLen,
          end: offset + val.size + headLen
        });
        offset += val.size;
      });
      this.info = info;
      return new Promise((resolve, reject)=>{
        resolve(videoUnitsIn)
      })
    })
  }
  openVideo(unit:VideoUnit){
    let modal = this.modalCtrl.create(VideoModal, {video:unit});
    alert(JSON.stringify(unit));
    modal.present();
  }
  doNextPage(infiniteScroll) {
    this.page++;
    this.loadPage(this.page).then((res:VideoUnit[])=>{
      if(res.length==0){
        infiniteScroll.complete();
        infiniteScroll.enable(false);
      }else {
        res.forEach(value => {
          this.videoUnits.push(value);
        });
        infiniteScroll.complete();
      }
    })
  }
}

@Component({
  template: `
    <ion-header>{{video.name}}</ion-header>
    <ion-content>
      <p>视频功能处于测试阶段</p>
      <p *ngIf="blob==null"> 视频加载中..... </p>
      <video *ngIf="blob!=null" id="videoPlayer" controls #myVideo>
        <source [src]="blob" type="video/mp4" />
      </video>
    </ion-content>
  `
})
export class VideoModal {
  @ViewChild('myVideo') myVideo;
  blob:SafeUrl = null;
  video:VideoUnit;
  constructor(public params: NavParams, public viewCtrl: ViewController, public http: HttpClient, private sanitizer: DomSanitizer) {
    this.video = this.params.get("video");
    this.http.get(HanimePage.LOCATE_FORMAT(this.video.page)).toPromise().then((res:string[])=>{
      // this.blob = this.setupVideo(res[0]);
      this.sampleStupidLoad(res[0]);
    })
  }

  sampleStupidLoad(resUrl:string){
    this.http.get(resUrl,{responseType:'arraybuffer',headers:{'Range':`bytes=${this.video.offset}-${this.video.end}`}}).toPromise().then((value)=>{
      let file = new Blob([value], {type: 'video/mp4'});
      this.blob = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
    })
  }

  setupVideo(resUrl:string){
    let mediaSource = new MediaSource();
    let blob = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(mediaSource));
    let called = false;
    mediaSource.addEventListener('sourceopen',()=>{
      if(!called) called=true;
      else return;
      console.log("Called");
      let sourceBuffer = mediaSource.addSourceBuffer("video/mp4; codecs=\"avc1.4d401e,mp4a.40.5\"");
      let promises:Promise<any>[] = [];
      let stepLength = 10*1024*1024;
      for (let i = this.video.offset; i < this.video.end; i+=stepLength) {
        let end = i+stepLength<this.video.end?i+stepLength:this.video.end;
        promises.push(this.http.get(resUrl,{responseType:'arraybuffer',headers:{'Range':`bytes=${i}-${end}`}}).toPromise())
      }
      let mediaArray = [];
      sourceBuffer.addEventListener('updateend',()=>{
        if(mediaArray.length>0)
          sourceBuffer.appendBuffer(mediaArray.shift());
      });
      let lambda = (value:any)=>{
        if(value!==null){
          if(!sourceBuffer.updating && mediaArray.length==0)
            sourceBuffer.appendBuffer(new Uint8Array(value));
          else
            mediaArray.push(value);
        }
        if(promises.length>0)
          promises.shift().then(lambda);
      };
      lambda(null);
      this.myVideo.nativeElement.play();
    });
    return blob;
  }
}
