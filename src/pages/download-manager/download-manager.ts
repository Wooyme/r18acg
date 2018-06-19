import { Component,NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, Events,ActionSheetController } from 'ionic-angular';
import { FileTransfer} from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import {Downloader} from "./Downloader";
import { Storage } from '@ionic/storage';
/**
 * Generated class for the DownloadManagerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  name: 'download-manager',
  priority: 'high'
})
@Component({
  selector: 'page-download-manager',
  templateUrl: 'download-manager.html',
})
export class DownloadManagerPage {
  downloadTasks:DownloadItem[]=[];
  constructor(public navCtrl: NavController, public navParams: NavParams,public event:Events,public actionSheetCtrl:ActionSheetController) {

  }
  ionViewDidEnter(){
    this.downloadTasks=DownloadManager.instance.downloadTasks;
  }
  showActionSheet(index:number){
    let actionSheet=this.actionSheetCtrl.create({
      title:"操作",
      buttons:[
        {
          text:"暂停",
          handler:()=>{
            this.event.publish("download:pause",index);
          }
        },
        {
          text:"继续",
          handler:()=>{
            this.event.publish("download:resume",index);
          }
        },
        {
          text:"取消",
          handler:()=>{
            this.event.publish("download:remove",index);
            this.downloadTasks.splice(index,1);
          }
        }
      ]
    });
    actionSheet.present();
  }
}

export class DownloadItem{
  avatarUrl:string;
  fileUrl:string;
  fileName:string;
  loadedSize:number=-1;
  totalSize:number=-1;
  status:string="正在连接...";
  constructor(avatarUrl:string,fileUrl:string,fileName:string){
    this.avatarUrl=avatarUrl;
    this.fileName=fileName;
    this.fileUrl=fileUrl;
  }
}


export class DownloadManager{

  public static instance:DownloadManager;
  public downloadTasks:DownloadItem[]=[];
  private downloaders:Downloader[]=[];
  constructor(public event:Events,public fileTransfer:FileTransfer,public file:File,public _zone:NgZone,private storage:Storage){
    if(DownloadManager.instance){
      throw new Error("Don't new this class");
    }
    DownloadManager.instance=this;
    event.subscribe("download:addOne",(item:DownloadItem)=>{
      this.createDownloadTask(item);
    });
    event.subscribe("download:pause",(index:number)=>{
      this.pauseDownloadTask(index);
    });
    event.subscribe("download:resume",(index:number)=>{
      this.resumeDownloadTask(index);
    });
    event.subscribe("download:remove",(index:number)=>{
      this.removeDownloadTask(index);
    });
    storage.get("lastDownloadTasks").then((tasks)=>{
      (<DownloadItem[]><any>tasks).forEach(task=>{
        event.publish("download:addOne",task);
      })
    });
  }
  private removeDownloadTask(index:number){
    this.downloaders[index].stop();
    this.downloaders.splice(index,1);
    this.downloadTasks.splice(index,1);
  }
  private pauseDownloadTask(index:number){
    this.downloaders[index].pause();
  }
  private resumeDownloadTask(index:number){
    this.downloaders[index].resume();
  }
  private createDownloadTask(item:DownloadItem){
    var task=this.downloadTasks[this.downloadTasks.push(item)-1];
    // let ftObj=this.fileTransfer.create();
    // ftObj.onProgress((event)=>{
    //   this._zone.run(()=>{
    //     task.loadedSize = Math.round(event.loaded/1000);
    //     task.totalSize = Math.round(event.total/1000);
    //     task.status= task.loadedSize.toString()+"/"+task.totalSize.toString()+"KB";
    //   });
    // });
    try {
      // ftObj.download(item.fileUrl, this.file.externalRootDirectory + item.fileName).then((entry) => {
      //   task.status="下载完成";
      // }, (error) => {
      //   alert(error);
      // })
      let downloader=new Downloader(this.fileTransfer,this.file);
      downloader.download(item.fileUrl,this.file.externalRootDirectory + item.fileName,()=>{
        task.status="下载完成";
      },error => {
        alert(error);
      },(loaded, total) =>{
        this._zone.run(()=>{
          task.loadedSize = Math.round(loaded/1000);
          task.totalSize = Math.round(total/1000);
          task.status= task.loadedSize.toString()+"/"+task.totalSize.toString()+"KB";
          this.storage.set("lastDownloadTasks",this.downloadTasks)
        });
      });
      this.downloaders.push(downloader);
    }catch (e){
      alert(e);
    }
  }
}
