import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';


import { PicturehubPage,PictureModal,EpsModal } from "../pages/picturehub/picturehub";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';
import { FileTransfer,FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { Diagnostic } from '@ionic-native/diagnostic';
import {HTTP} from "@ionic-native/http";
import { IonicImageLoader } from 'ionic-image-loader';
import {PicturehubPageModule} from "../pages/picturehub/picturehub.module";
import {AboutPageModule} from "../pages/about/about.module";
import {AboutPage} from "../pages/about/about";
import {InAppBrowser} from "@ionic-native/in-app-browser";
import {HanimePage, VideoModal} from "../pages/hanime/hanime";
import {HanimePageModule} from "../pages/hanime/hanime.module";


@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      preloadModules: true
    }),
    HttpClientModule,
    IonicStorageModule.forRoot(),
    IonicImageLoader.forRoot(),
    PicturehubPageModule,
    AboutPageModule,
    HanimePageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    PicturehubPage,
    EpsModal,
    PictureModal,
    AboutPage,
    HanimePage,
    VideoModal
  ],
  providers: [
    StatusBar,
    SplashScreen,
    FileTransfer,
    FileTransferObject,
    File,
    Diagnostic,
    HTTP,
    InAppBrowser,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
