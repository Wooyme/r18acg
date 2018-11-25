import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {HanimePage, VideoModal} from './hanime';

@NgModule({
  declarations: [
    HanimePage,
    VideoModal
  ],
  imports: [
    IonicPageModule.forChild(HanimePage),
  ],
})
export class HanimePageModule {}
