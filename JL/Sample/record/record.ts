import {Component, ViewChild} from '@angular/core';
import {IonicPage, MenuController, ModalController, Platform} from 'ionic-angular';
import {Observable, Subscription} from 'rxjs/Rx';

import {environment} from '../../environments/environment';

import {MediaStatusEnum, Sources} from '../../classes/models';
import {Record} from '../../classes/record';
import {StorageBean} from '../../classes/storage';

import {TrackVisualizatorComponent} from '../../components/track-visualizator/track-visualizator';
import {RecordSaveData} from '../../components/record-save-modal/record-save-modal';
import {Track} from "../../classes/track";
import {Media} from "../../classes/media";

@IonicPage()
@Component({
  selector: 'page-record',
  templateUrl: 'record.html'
})
export class RecordPage {
  @ViewChild('trackVisualizator') trackVisualizator: TrackVisualizatorComponent;
  states: any = {
    none: "none",
    recordingStarted: "recordingStarted",
    recordingStoped: "recordingStoped",
    paused: "paused",
    playing: "playing",
  };
  state: string = this.states.none;
  public position: number = 0;

  sources: Sources = new Sources();

  private updateStateTimer = Observable.timer(environment.record.updateAmplitudeInterval, environment.record.updateAmplitudeInterval)
  private updateStateTimerSubscription: Subscription;

  private playerBacktrack: Media;
  private playerTrack: Track;
  private playerRecord: Media;
  private isRecordPresent: boolean = false;


  constructor(public record: Record, public storage: StorageBean, public menuCtrl: MenuController,
              public modalCtrl: ModalController, public platform: Platform) {
    this.platform.ready().then(this.load.bind(this));

    this.record.mediaStateEvent.Observer.subscribe(((state: MediaStatusEnum) => {
      //console.log('mediaStateEvent.Observer called in constructor state ',state);
      if (state == MediaStatusEnum.Running || state == MediaStatusEnum.Starting) {
        this.position = 0;
      }
    }).bind(this));
  }

  toggleMenu() {
    this.menuCtrl.open();
  }

  load() {
    Promise.all([
      this.storage.getSources(),
    ]).then(this.onDataReceived.bind(this))
  }

  private onDataReceived(data: [Sources]) {
    //console.log("RecordPage :: onDataReceived:data : ", data);
    this.sources = data[0];
  }

  resetGraph() {
    this.position = 0;
  }

  isPaused: boolean = false;

  pauseCurrentMedia() {

    /*console.log('current BackTrack media is : :  >>>>>>  ',this.storage.getCurrentBacktrackMedia());
    console.log('current Record media is : :  >>>>>>  ',this.storage.getCurrentRecordMedia());
    console.log('current Track media is : :  >>>>>>  ',this.storage.getCurrentTrackMedia());*/
    if (this.storage.getCurrentBacktrackMedia()) {
      this.playerBacktrack = this.storage.getCurrentBacktrackMedia();
      this.isPaused = true;
      this.playerBacktrack.pause();
    }
    if (this.storage.getCurrentRecordMedia()) {
      this.playerRecord = this.storage.getCurrentRecordMedia();
      this.isPaused = true;
      this.playerRecord.pause();
    }

    if (this.storage.getCurrentTrackMedia()) {
      this.playerTrack = this.storage.getCurrentTrackMedia();
      this.isPaused = true;
      this.playerTrack.pause();
    }

  }


  startRecord() {

    this.pauseCurrentMedia();
    this.storage.setRecordPresent(true);
    this.isRecordPresent = true;

    this.trackVisualizator.clear();
    this.record.startRecord();
    this.updateStateTimerSubscription = this.updateStateTimer.subscribe(this.updateAmplitude.bind(this));
    this.state = this.states.recordingStarted;
  }

  stopRecord() {
    //this.storage.setRecordPresent(false);
    this.record.stopRecord();
    this.updateStateTimerSubscription.unsubscribe();
    this.state = this.states.recordingStoped;
    //console.log(' stopRecord callleddddddddddddd');
  }

  play() {
    //console.log(' play callleddddddddddddd');
    this.storage.setRecordPresent(true);
    this.isRecordPresent = true;

    this.position = 0;
    this.record.play();
    this.updateStateTimerSubscription = this.updateStateTimer.subscribe(this.changePosition.bind(this));
    this.state = this.states.playing;
  }

  pause() {
    //this.storage.setRecordPresent(false);
    this.record.stop();
    this.updateStateTimerSubscription.unsubscribe();
    this.state = this.states.paused;
  }

  save() {
    //this.record.mediaStateEvent.Invoke.next(MediaStatusEnum.Running);
    this.pause();
    let modal = this.modalCtrl.create('RecordSaveModalComponent', {source: this.sources}, {
      enterAnimation: 'modal-scale-up-enter',
      leaveAnimation: 'modal-scale-up-leave'
    });
    modal.onDidDismiss(this.onSaveModalDismiss.bind(this));
    modal.present()
  }

  done() {
    this.stopRecord();
    setTimeout(() => {
      this.save();
    }, 500);
  }

  updateAmplitude() {
    //console.log('updateAmplitude :::: CALLED');
    this.record.getCurrentAmplitude().then(((amplitude: number) => {
      this.trackVisualizator.addValue(amplitude * 100);
    }).bind(this), this.onError.bind(this));
  }

  changePosition() {
    //console.log('updateStateTimerSubscription :  changePosition :::: position -- ',this.position);
    this.trackVisualizator.setPosition(this.position++);
  }

  clear() {
    this.record.State.CurrentTime = 0;
    this.state = this.states.none;
    this.trackVisualizator.clear();
  }

  onSaveModalDismiss(data: RecordSaveData) {

    if (data.shouldBeDeleted) {
      this.onDelete(data);
      this.storage.setRecordPresent(false);
      this.isRecordPresent = false;
    } else if (data.shouldBeSaved) {
      this.onSave(data);
      this.storage.setRecordPresent(false);
      this.isRecordPresent = false;
    }
  }

  onDelete(data: RecordSaveData) {
    this.record.release();
    this.clear();
  }

  onSave(data: RecordSaveData) {
    let record = this.record.getTrackSource(
      data.name,
      environment.record.recordArtist,
      environment.defaultImages.recordImage
    );

    //console.log("record", record);

    this.storage.addRecord(record).then((() => {
      this.record.release();
      this.clear();

      this.modalCtrl.create('RecordSavedModalComponent', {}, {
        enterAnimation: 'modal-scale-up-enter',
        leaveAnimation: 'modal-scale-up-leave'
      }).present();
    }).bind(this));
    setTimeout(() => {
      this.load();
    }, 800);

  }

  onError(error) {
    console.log(error);
  }

  ngOnDestroy() {
    //this.stopAll();

  }

  stopAll() {

    if (this.storage.getRecordPresent()) {
      this.stopRecord();
      this.storage.setRecordPresent(false);
      this.isRecordPresent = false;
    }
    if (this.state != "none") {
      try {
        //console.log('state is not null');
        this.storage.setRecordPresent(false);
        this.isRecordPresent = false;
        this.pause();

        this.record.stopRecord();
        this.updateStateTimerSubscription.unsubscribe();
        this.state = this.states.recordingStoped;

        //this.record.release();
        this.clear();
      } catch (e) {
        //console.log('ERR--', e);
      }

    }


  }

  playCurrentMedia() {
    if (this.storage.getCurrentPlayerTrackIsPlaying()) {
      if (this.storage.getCurrentBacktrackMedia()) {
        this.playerBacktrack = this.storage.getCurrentBacktrackMedia();
        this.isPaused = false;
        this.playerBacktrack.play();
      }
      if (this.storage.getCurrentRecordMedia()) {
        this.playerRecord = this.storage.getCurrentRecordMedia();
        this.isPaused = false;
        this.playerRecord.play();
      }

      if (this.storage.getCurrentTrackMedia()) {
        this.playerTrack = this.storage.getCurrentTrackMedia();
        this.isPaused = false;
        this.playerTrack.playTrack(this.playerTrack.TrackType, this.playerTrack.TrackLength);
      }
    }
  }

  ionViewDidLeave() {
    //console.log('ionViewDidLeave called !! this.isRecordPresent >> ',this.isRecordPresent);
    if (this.isPaused && !this.isRecordPresent) {
      this.playCurrentMedia();
    }
    this.stopAll();
  }
}
