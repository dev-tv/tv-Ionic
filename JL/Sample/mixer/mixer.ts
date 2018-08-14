import {Component, ViewChild, OnDestroy} from '@angular/core';
import {NavController, NavParams, Platform, Slides, ModalController, IonicPage, MenuController} from 'ionic-angular';

import {Sources, TrackEntity} from '../../classes/models';
import {Media} from '../../classes/media';
import {StorageBean} from '../../classes/storage';
import {Helper} from '../../classes/helper';

import {environment} from '../../environments/environment';

import {MixSaveData} from '../../components/mix-save-modal/mix-save-modal';
import {Track} from "../../classes/track";

class VolumeState {
  recordVolume: number
  backtrackVolume: number
}

@IonicPage()
@Component({
  selector: 'page-mixer',
  templateUrl: 'mixer.html'
})
export class MixerPage {
  private spaceBetween: number;
  private backtracks: Media[];
  private records: Media[];

  private playerBacktrack: Media;
  private playerTrack: Track;
  private playerRecord: Media;

  private currentBacktrack: Media;
  private currentRecord: Media;
  private volumeBarValue: number = 0;
  private volumeBarLeft: number = 50;
  private volumeBarRight: number = 50;
  private delay: number = 0;

  private isPlay: boolean = false;
  private backtrackName: string = '';
  private recordName: string = '';



  private currentIndexRecord: any;
  private currentIndexTrack: any;

  private recordSlidesIndexs: any = 1;
  private backtrackSlidesIndexs: any = 1;



  @ViewChild('recordSlides') recordSlides: Slides;
  @ViewChild('backtrackSlides') backtrackSlides: Slides;

  constructor(public storage: StorageBean, public navCtrl: NavController,public menuCtrl:MenuController,
              public navParams: NavParams, platform: Platform, public modalCtrl: ModalController) {
    this.spaceBetween = Helper.getMixerInterpolate(platform);
    this.storage.getSourcesForMixer().then(this.onSourcesReceived.bind(this));
  }

  toggleMenu() {
    this.menuCtrl.open();
  }

  isPaused:boolean=false;
  pauseCurrentMedia(){

    if (this.storage.getCurrentBacktrackMedia()){
      this.playerBacktrack=this.storage.getCurrentBacktrackMedia();
      this.isPaused=true;
      this.playerBacktrack.pause();
    }
    if (this.storage.getCurrentRecordMedia()){
      this.playerRecord=this.storage.getCurrentRecordMedia();
      this.isPaused=true;
      this.playerRecord.pause();
    }

    if (this.storage.getCurrentTrackMedia()){
      this.playerTrack=this.storage.getCurrentTrackMedia();
      this.isPaused=true;
      this.playerTrack.pause();
    }

  }

  onSourcesReceived(sources: Sources) {
    //console.log('MixerPage : onSourcesReceived : sources ************* ',sources);

    let recordEntity=sources.Records;
    let recordEntityArr:any[]=[];
    for (let i = 0 ; i < recordEntity.length;i++){
      if(recordEntity[i].Id !=='meditation-mix-1-record'){
        recordEntityArr.push(recordEntity[i]);
      }
    }
    sources.Records=[];
    sources.Records=recordEntityArr;

    this.backtracks = sources.Backtracks.map((value) => Media.create(value));
    this.records = sources.Records.map((value) => Media.create(value));

    if (this.backtracks) {
      if (this.backtrackSlidesIndexs != 1) {
        this.backtrackName = this.backtracks[0].Name;
      } else {
        this.backtrackName = "Select background melody";
      }
    }

    if (this.records) {
      if (this.recordSlidesIndexs != 1) {
        this.recordName = this.records[0].Name;
      } else {
        this.recordName = "Select a session";
      }
    }


  }

  onVolumeBarChanged() {
    let value = (100 - Math.abs(this.volumeBarValue)) / 2;
    this.volumeBarLeft = this.volumeBarValue <= 0 ? value : 50;
    this.volumeBarRight = this.volumeBarValue > 0 ? value : 50;

    let volume = this.getCurrentVolumeState();
    //console.log("record:'" + volume.recordVolume + "', backtrack:'" + volume.backtrackVolume + "'");
    if (this.currentRecord) {
      this.currentRecord.setVolume(volume.recordVolume);
    }
    if (this.currentBacktrack) {
      this.currentBacktrack.setVolume(volume.backtrackVolume);
    }
  }

  onRecordChanged() {

    this.delay=0;

      if (this.records) {
        this.currentIndexRecord = (this.recordSlides.getActiveIndex() - 1) % this.records.length;

        this.recordSlidesIndexs = this.recordSlides.getActiveIndex();
        let numOfSlides = this.recordSlides.length();
        if (this.recordSlidesIndexs == numOfSlides - 1) {
          this.recordSlidesIndexs = 1;
        }

        //console.log('recordSlidesIndexs is  ---------- ' + this.recordSlidesIndexs);

        let record;
        if (this.recordSlidesIndexs == 0) {
          record = this.records[this.records.length-1];
        }else if (this.recordSlidesIndexs == 1) {
          record = this.records[0];
        }else {
          record = this.records[this.recordSlidesIndexs-2];
          if(record){

          }else {
            record = this.records[0];
          }
        }


        if (this.currentRecord) {
          this.currentRecord.stop();
        }

        this.currentRecord = record;
        if (this.isPlay) {
          if (this.recordSlidesIndexs == 1) {
            ////CHECK if music is playing then pause music
            if (this.isPlay){
              this.pause();
            }
          } else {
            if(record){

              this.currentBacktrack.pause();
              let self =this;
              setTimeout(function () {
                Promise.all([
                  self.currentBacktrack.play(),
                  self.currentRecord.play()
                ]).then((() => {
                  // console.log('record is playing !!!@@@@');
                  self.isPlay = true;
                }).bind(self));
              },300);


              /*record.play().then(() => {
                console.log('record is playing !!!');
                let volume = this.getCurrentVolumeState();
                //record.setVolume(volume.recordVolume);
              });*/
            }

          }
        }

        ////check whether the slide index is default slide, if it is default then set the default title and pause the player
        if (this.recordSlidesIndexs == 1) {
          this.recordName = "Select a session";
        } else {
          if (record)
            this.recordName = record.Name;
        }
      }
  }



  onBacktrackChanged() {

    this.delay=0;
      if (this.backtracks) {
        this.currentIndexTrack = (this.backtrackSlides.getActiveIndex() - 1) % this.backtracks.length;
        /*let currentIndexs = this.backtrackSlides.getActiveIndex();
         console.log('Current index is', currentIndexs);*/
        this.backtrackSlidesIndexs = this.backtrackSlides.getActiveIndex();
        let numOfSlides = this.backtrackSlides.length();
        if (this.backtrackSlidesIndexs == numOfSlides - 1) {
          this.backtrackSlidesIndexs = 1;
        }

        //console.log('backtrackSlidesIndexs is  ---------- ' + this.backtrackSlidesIndexs);
        let backtrack:any;
        if (this.backtrackSlidesIndexs == 0) {
          backtrack = this.backtracks[this.backtracks.length-1];
        } else if (this.backtrackSlidesIndexs == 1) {
          backtrack = this.backtracks[0];
        }else {
          backtrack = this.backtracks[this.backtrackSlidesIndexs-2];
          if(backtrack){
          }else {
            backtrack = this.backtracks[0];
          }
        }

        if (this.currentBacktrack) {
          this.currentBacktrack.stop();
        }

        this.currentBacktrack = backtrack;

        if (this.isPlay) {
          if (this.backtrackSlidesIndexs == 1) {
            ////CHECK if music is playing then pause music
            if (this.isPlay){
              this.pause();
            }
          } else {
            if(backtrack){
              this.currentRecord.pause();
              let self =this;
              setTimeout(function () {
                Promise.all([
                  self.currentRecord.play(),
                  self.currentBacktrack.play()
                ]).then((() => {
                  //console.log('backtrack is playing !!!@@@@');
                  self.isPlay = true;
                }).bind(self));
              },300);


              /* backtrack.play().then(() => {
                console.log('backtrack is playing !!!');
                let volume = this.getCurrentVolumeState();
                //backtrack.setVolume(volume.backtrackVolume);
              });*/
            }

          }

        }
        //console.log('backtrackSlidesIndexs is  ---------- ' + this.backtrackSlidesIndexs);

        if (this.backtrackSlidesIndexs == 1) {
          this.backtrackName = "Select background melody";
        } else {
          if(backtrack)
            this.backtrackName = backtrack.Name;
        }
      }

  }


  timeoutBacktrackId : any;
  timeoutRecordId : any;
  play() {
    //console.log('PLAY >> ',this.currentBacktrack,this.currentRecord);
    this.pauseCurrentMedia();
    if (this.currentBacktrack && this.currentRecord) {
      //console.log('currentRecord track delay $$$ ',this.currentRecord.Source.TrackDelay,' currentBacktrack ::::track delay :::::  ',this.currentBacktrack.Source.TrackDelay,' this.isPlay >>>>> ',this.isPlay);
      this.isPlay = true;
      this.timeoutBacktrackId=setTimeout(() => {
        Promise.all([
          this.currentBacktrack.play()
        ]).then((() => {
          this.isPlay = true;
        }).bind(this));
      }, this.currentBacktrack.Source.TrackDelay * 1000);

      this.timeoutRecordId=setTimeout(() => {
        Promise.all([
          this.currentRecord.play()
        ]).then((() => {
          this.isPlay = true;
        }).bind(this));
      }, this.currentRecord.Source.TrackDelay * 1000);
    }
  }

  pause() {
    //console.log('pause called >>> this.timeoutBacktrackId >> ',this.timeoutBacktrackId);
    if(this.timeoutBacktrackId){
      clearTimeout(this.timeoutBacktrackId);
    }
    if(this.timeoutRecordId){
      clearTimeout(this.timeoutRecordId);
    }
    this.isPlay = false;
    //console.log('PAUSE >> ',this.currentBacktrack,this.currentRecord);
    if(this.currentRecord && this.currentBacktrack){
      this.currentBacktrack.Source.TrackDelay=0;
      this.currentRecord.Source.TrackDelay=0;

      Promise.all([
        this.currentBacktrack.pause(),
        this.currentRecord.pause()
      ])
    }
  }

  save() {
    //console.log('this.backtrackSlidesIndexs -- ',this.backtrackSlidesIndexs,' this.recordSlidesIndexs ---- ',this.recordSlidesIndexs);
     if((this.backtrackSlidesIndexs!=1 && this.recordSlidesIndexs==1)) {

      //save the backtrack only
       let modal = this.modalCtrl.create('MixSaveModalComponent',{trackTime : this.currentBacktrack.Source.TrackTime},{
         enterAnimation: 'modal-scale-up-enter',
         leaveAnimation: 'modal-scale-up-leave'
       });
       modal.onDidDismiss(this.onSaveBacktrackModalDismiss.bind(this));
       modal.present();

    }else if((this.backtrackSlidesIndexs==1 && this.recordSlidesIndexs!=1)) {

       if(this.currentRecord){
         //save the record only
         let modal = this.modalCtrl.create('MixSaveModalComponent',{trackTime : this.currentRecord.Source.TrackTime},{
           enterAnimation: 'modal-scale-up-enter',
           leaveAnimation: 'modal-scale-up-leave'
         });
         modal.onDidDismiss(this.onSaveRecordModalDismiss.bind(this));
         modal.present();
       }


    }else if (!((this.backtrackSlidesIndexs!=1 && this.recordSlidesIndexs!=1))){
       this.modalCtrl.create('MixNoElementSelectedModalPage',{},{
         enterAnimation: 'modal-scale-up-enter',
         leaveAnimation: 'modal-scale-up-leave'
       }).present();
     }else {

      if(this.currentRecord){
        //save mix
        let modal = this.modalCtrl.create('MixSaveModalComponent',{trackTime : this.currentRecord.Source.TrackTime},{
          enterAnimation: 'modal-scale-up-enter',
          leaveAnimation: 'modal-scale-up-leave'
        });
        modal.onDidDismiss(this.onSaveModalDismiss.bind(this));
        modal.present()
      }

    }

  }



  onSaveModalDismiss(data: MixSaveData) {
    //console.log("onSaveModalDismiss ############# ", data);

    if (data.shouldBeSaved) {
      this.onSave(data);
    }
  }

  onSave(data: MixSaveData) {
    let volume = this.getCurrentVolumeState();

    //this.currentRecord.Source.TrackTime=data.trackLength;
    //console.log('onSave : this.currentRecord.Source ******** ',this.currentRecord.Source);
    //console.log('onSave : this.currentRecord.Source.TrackTime **** ',this.currentRecord.Source.Id);
    let track: TrackEntity = {
      Id: data.id,
      Name: data.name,
      ImageUrl: data.imageUrl,
      Artist: environment.track.trackArtist,
      Created: Date.now(),
      Description: '',
      BacktrackVolume: volume.backtrackVolume,
      RecordVolume: volume.recordVolume,
      /*BacktrackVolume: this.currentBacktrack.Source.Volume,
      RecordVolume: this.currentRecord.Source.Volume,*/
      /*TrackTime: this.currentRecord.Source.TrackTime,*/
      TrackTime: data.trackLength,
      TrackType: 0,
      RecordId: this.currentRecord.Source.Id,
      BacktrackId: this.currentBacktrack.Source.Id,
      TrackRepeat: data.numOfRepeat,
      TrackLength: data.trackLength,
      TrackDelay: 0
    };

    console.log("track", track);

    this.storage.addTrack(track).then((() => {
      this.modalCtrl.create('MixSavedModalComponent',{},{
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      }).present()
    }).bind(this));
  }

  //save the backtrack only in mixes
  onSaveBacktrackModalDismiss(data: MixSaveData) {
    //console.log("onSaveModalDismiss", data);
    if (data.shouldBeSaved) {
      this.onSaveBacktrack(data);
    }
  }

  onSaveBacktrack(data: MixSaveData) {
    let volume = this.getCurrentVolumeState();

    let track: TrackEntity = {
      Id: data.id,
      Name: data.name,
      ImageUrl: data.imageUrl,
      Artist: environment.track.trackArtist,
      Created: Date.now(),
      Description: '',
      BacktrackVolume: volume.backtrackVolume,
      /*BacktrackVolume: this.currentBacktrack.Source.Volume,*/
      RecordVolume: volume.backtrackVolume,
      /*TrackTime: this.currentBacktrack.Source.TrackTime,*/
      TrackTime: data.trackLength,
      TrackType: 2,
      RecordId: this.currentBacktrack.Source.Id,
      BacktrackId: this.currentBacktrack.Source.Id,
      TrackRepeat: data.numOfRepeat,
      TrackLength: data.trackLength,
      TrackDelay: 0
    };

    //console.log("Backtrack", track);

    this.storage.addTrack(track).then((() => {
      this.modalCtrl.create('MixSavedModalComponent',{},{
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      }).present()
    }).bind(this));
  }

  //save the record only in mixes
  onSaveRecordModalDismiss(data: MixSaveData) {
    //console.log("onSaveRecordModalDismiss", data);
    if (data.shouldBeSaved) {
      this.onSaveRecord(data);
    }
  }

  onSaveRecord(data: MixSaveData) {
    let volume = this.getCurrentVolumeState();

    let track: TrackEntity = {
      Id: data.id,
      Name: data.name,
      ImageUrl: data.imageUrl,
      Artist: environment.track.trackArtist,
      Created: Date.now(),
      Description: '',
      BacktrackVolume: volume.recordVolume,
      RecordVolume: volume.recordVolume,
      /*RecordVolume: this.currentRecord.Source.Volume,*/
      /*TrackTime: this.currentRecord.Source.TrackTime,*/
      TrackTime: data.trackLength,
      TrackType: 1,
      RecordId: this.currentRecord.Source.Id,
      BacktrackId: this.currentRecord.Source.Id,
      TrackRepeat: data.numOfRepeat,
      TrackLength: data.trackLength,
      TrackDelay: 0
    };
    //console.log("Mixer : Saved Recordtrack ", track);
    this.storage.addTrack(track).then((() => {
      this.modalCtrl.create('MixSavedModalComponent',{},{
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      }).present()
    }).bind(this));
  }

  getCurrentVolumeState(): VolumeState {
    let volume = Helper.round2(1 - Math.abs(this.volumeBarValue / 100));

    return {
      backtrackVolume: this.volumeBarValue >= 0 ? 1 : volume,
      recordVolume: this.volumeBarValue <= 0 ? 1 : volume,
    }
  }

  stopAll(mediaArray: Media[]) {
    return Promise.all(mediaArray.map((media) => media.stop()));
  }

  /*ngOnDestroy() {
    console.log('Mixer Page >> ngOnDestroy called !!');
  }*/

  stopAllMedia(){
    if (this.currentBacktrack) {
      this.currentBacktrack.stop();
    }
    if (this.currentRecord) {
      this.currentRecord.stop();
    }
  }


  openOptionModalBacktrack(){

    if (this.backtrackSlidesIndexs!=1){
      let modal = this.modalCtrl.create('AffirmationRecordingModalPage',{currentMedia:this.currentBacktrack,delay:this.delay},{
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      });
      modal.onDidDismiss(this.onBacktrackModalDismiss.bind(this));
      modal.present();
    }
  }

  dataBacktrack:any;
  onBacktrackModalDismiss(data){
    //console.log('onBacktrackModalDismiss : data  : ',data);
    this.dataBacktrack=data;
    if (data.delayTrack){
      this.currentBacktrack.Source.TrackDelay=data.delayTrack;
    }

    //console.log('Current Volume >>>>>>>>>>> ',this.currentBacktrack.Source.Volume);

  }

  openOptionModalRecord(){

    if (this.recordSlidesIndexs!=1){
      let modal = this.modalCtrl.create('AffirmationRecordingModalPage',{currentMedia:this.currentRecord,delay:this.delay},{
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      });
      modal.onDidDismiss(this.onRecordModalDismiss.bind(this));
      modal.present();
    }
  }


  onRecordModalDismiss(data){
    //console.log('onRecordModalDismiss : data  : ',data);

    if(data.delayRecord && this.currentRecord){
      this.currentRecord.Source.TrackDelay = data.delayRecord;
    }
  }

  playCurrentMedia(){
    /*console.log('current BackTrack media is : :  >>>>>>  ',this.storage.getCurrentBacktrackMedia());
    console.log('current Record media is : :  >>>>>>  ',this.storage.getCurrentRecordMedia());
    console.log('current Track media is : :  >>>>>>  ',this.storage.getCurrentTrackMedia());*/

    if (this.storage.getCurrentBacktrackMedia()){
      this.playerBacktrack=this.storage.getCurrentBacktrackMedia();
      this.isPaused=false;
      if (this.playerBacktrack.State.IsPlaying)
      this.playerBacktrack.play();
    }
    if (this.storage.getCurrentRecordMedia()){
      this.playerRecord=this.storage.getCurrentRecordMedia();
      this.isPaused=false;
      if (this.playerRecord.State.IsPlaying)
      this.playerRecord.play();
    }

    if (this.storage.getCurrentTrackMedia()){
      this.playerTrack=this.storage.getCurrentTrackMedia();
      this.isPaused=false;
      if (this.playerTrack.State.IsPlaying)
      this.playerTrack.playTrack(this.playerTrack.TrackType,this.playerTrack.TrackLength);
    }
  }


  ionViewDidLeave(){
    /*console.log('current BackTrack media is : :  >>>>>>  ',this.storage.getCurrentBacktrackMedia());
    console.log('current Record media is : :  >>>>>>  ',this.storage.getCurrentRecordMedia());
    console.log('current Track media is : :  >>>>>>  ',this.storage.getCurrentTrackMedia());
    console.log('Mixer Page >> ionViewDidLeave called !!  this.isPaused >>> ',this.isPaused);*/

    if(this.isPlay)
      this.stopAllMedia();
    if(this.isPaused){
      this.playCurrentMedia();
    }


  }

}
