import { FileTransfer,FileTransferObject} from '@ionic-native/file-transfer';
import { File,Entry } from '@ionic-native/file';

export class Downloader{
  private isPaused=false;
  private start:number=0;
  private loaded:number=0;
  private total:number=0;
  private fileTransferObj:FileTransferObject;
  private source:string;
  private target:string;
  private successHandler:()=>any;
  private errorHandler:(error)=>any;
  private onProgress:(loaded:number,total:number)=>any;

  constructor(private fileTransfer:FileTransfer,private file:File){
    this.fileTransferObj=fileTransfer.create();
  }
  download(url:string,filePath:string,successHandler:()=>any,errorHandler:(error)=>any,onProgress:(loaded:number,total:number)=>any) {
    this.source=url;
    this.target=filePath;
    this.successHandler=successHandler;
    this.errorHandler=errorHandler;
    this.onProgress=onProgress;
    this.file.resolveLocalFilesystemUrl(filePath).then((entry:Entry)=>{
      entry.getMetadata(metadata => {
        this.start=metadata.size;
      })
    });
    this.fileTransferObj.onProgress((event) => {
      this.loaded=event.loaded+this.start;
      this.total=event.total;
      if(this.isPaused){
        this.fileTransferObj.abort();
        this.start=this.loaded;
        return;
      }
      onProgress(this.loaded,this.total);
    });
    this.fileTransferObj.download(url, filePath).then((entry:Entry) => {
      if(!this.isPaused){
        this.successHandler();
      }
    },error=>{
      if(!this.isPaused)
        errorHandler(error);
    });
  }

  pause(){
    this.isPaused=true;
  }
  resume(){
    if(this.isPaused) {
      this.fileTransferObj.download(this.source, this.target, true, {
        headers: {
          "Range": 'bytes=' + this.loaded + '-'
        }
      }).then((entry) => {
        if (!this.isPaused) {
          this.successHandler()
        }
      }, error=>{
        if(!this.isPaused)
          this.errorHandler(error);
      });
      this.isPaused=false;
    }
  }
  stop(){
    this.isPaused=true;
    this.fileTransferObj.abort();
    this.file.resolveLocalFilesystemUrl(this.target).then(entry=>{
      entry.remove(()=>{});
    })
  }
}
