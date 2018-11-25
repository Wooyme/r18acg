import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {EpsModal, PicturehubPage, PictureModal} from './picturehub';

@NgModule({
  declarations: [
    PicturehubPage,
    EpsModal,
    PictureModal,
  ],
  imports: [
    IonicPageModule.forChild(PicturehubPage),
  ],
})
export class PicturehubPageModule {}
