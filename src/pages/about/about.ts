import {Component, NgZone} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {HttpClient} from "@angular/common/http";
import {AppConfig} from "../../app/app.config";
import {InAppBrowser} from "@ionic-native/in-app-browser";
import {Storage} from "@ionic/storage";


/**
 * Generated class for the AboutPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {
  BDUSS_URL = "http://118.89.141.135/debug/pcs_config.json";
  bduss: string = "";

  constructor(public navCtrl: NavController
    , public navParams: NavParams
    , private http: HttpClient
    , private browser: InAppBrowser
    , public storage: Storage) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AboutPage');
    this.bduss = AppConfig.BDUSS;
  }

  getBDUSS() {
    this.http.get(this.BDUSS_URL).toPromise().then((res: { baidu_user_list: { bduss: string }[] }) => {
      console.log(JSON.stringify(res));
      AppConfig.BDUSS = res.baidu_user_list[0].bduss;
      this.bduss = res.baidu_user_list[0].bduss;
      this.storage.set("bduss", this.bduss);
    }).catch(reason => {
      alert(JSON.stringify(reason))
    });
  }

  checkUpdate() {
    this.browser.create("https://github.com/wy16880175/r18acg/releases");
  }
}
