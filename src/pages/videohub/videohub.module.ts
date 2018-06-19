import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VideohubPage } from './videohub';

@NgModule({
  declarations: [
    VideohubPage,
  ],
  imports: [
    IonicPageModule.forChild(VideohubPage),
  ],
})
export class VideohubPageModule {}
