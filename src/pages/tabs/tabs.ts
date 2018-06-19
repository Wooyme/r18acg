import { Component,NgZone } from '@angular/core';
import { Events } from 'ionic-angular';
import { DownloadManagerPage,DownloadManager } from "../download-manager/download-manager";
import {MainPage} from "../main/main";
import { FileTransfer} from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Storage } from '@ionic/storage';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  public tabRoots:Tab[];
  constructor(public event:Events,public file:File,public fileTransfer:FileTransfer,public _zone:NgZone,private diagnostic:Diagnostic,private storage:Storage) {
    this.tabRoots=[
      {
        root:MainPage,
        title:'主页',
        icon:'document',
        badge:0

      },
      {
        root:DownloadManagerPage,
        title:'下载管理',
        icon:'ios-cloud-download',
        badge:0
      }
    ];
    this.diagnostic.requestExternalStorageAuthorization();
    this.diagnostic.requestContactsAuthorization();
    DownloadManager.instance=new DownloadManager(event,fileTransfer,file,_zone,storage);
    event.subscribe("download:addOne",(item)=>{
      this.tabRoots[1].badge+=1;
    });
    event.subscribe("download:remove",index=>{
      this.tabRoots[1].badge-=1;
    })
  }
}

class Tab{
  root:any;
  title:string;
  icon:string;
  badge:number;
}
