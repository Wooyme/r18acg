import { Component } from '@angular/core';
import {Events, Platform} from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import {PicturehubPage} from "../pages/picturehub/picturehub";
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = PicturehubPage;//;MainPage;
  searchInput:string;
  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,private events:Events) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  doAction(topic,data){
    this.events.publish(topic,data);
  }

}
