import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { TabsPage } from '../pages/tabs/tabs';

import { MainPage } from '../pages/main/main';
import { PicturehubPage,PictureModal } from "../pages/picturehub/picturehub";
import { VideohubPage } from "../pages/videohub/videohub";
import { DownloadManagerPage } from "../pages/download-manager/download-manager";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';
import { FileTransfer,FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { Diagnostic } from '@ionic-native/diagnostic';
import { StreamingMedia} from '@ionic-native/streaming-media';

import { IonicImageLoader } from 'ionic-image-loader';


@NgModule({
  declarations: [
    MyApp,
    TabsPage,
    MainPage,
    PicturehubPage,
    PictureModal,
    DownloadManagerPage,
    VideohubPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      preloadModules: true
    }),
    HttpClientModule,
    IonicStorageModule.forRoot(),
    IonicImageLoader.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    TabsPage,
    MainPage,
    PicturehubPage,
    PictureModal,
    DownloadManagerPage,
    VideohubPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    FileTransfer,
    FileTransferObject,
    File,
    Diagnostic,
    StreamingMedia,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
