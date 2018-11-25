import { Component } from '@angular/core';
import {Events, Platform} from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import {PicturehubPage} from "../pages/picturehub/picturehub";
import {AboutPage} from "../pages/about/about";
import {HanimePage} from "../pages/hanime/hanime";
import {Storage} from "@ionic/storage";
import {AppConfig} from "./app.config";
import {HttpClient} from "@angular/common/http";
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = PicturehubPage;
  aboutPage:any = AboutPage;
  animePage:any = HanimePage;
  searchInput:string;
  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,private events:Events,private storage:Storage,private http:HttpClient) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      this.storage.get("bduss").then(bduss=>{
        AppConfig.BDUSS = "S1BaldOSVhCRTFUT0dXMjEwNkN0fjFodmtwTnhrVnVVU1gxTXkyV1NvRHVHeDljQVFBQUFBJCQAAAAAAAAAAAEAAADrH1bpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO6O91vujvdbV";
        this.http.get("http://set-cookie.my/",{headers:{'Custom-Cookie':`BDUSS=${AppConfig.BDUSS}`}}).toPromise().then(()=>console.log("set cookie")).catch(reason => console.log("Set Cookie"));
      })
    });
  }

  doAction(topic,data){
    this.events.publish(topic,data);
  }

}
