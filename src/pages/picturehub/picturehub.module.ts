import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PicturehubPage } from './picturehub';

@NgModule({
  declarations: [
    PicturehubPage,
  ],
  imports: [
    IonicPageModule.forChild(PicturehubPage),
  ],
})
export class PicturehubPageModule {}
