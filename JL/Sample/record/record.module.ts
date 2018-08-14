/**
 * Created by amit on 22/06/17.
 */
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {RecordPage} from "./record";
import {BurgerComponentModule} from "../../components/burger.module";
import {TrackVisualizatorComponentModule} from "../../components/track-visualizator/track-visualizator.module";
import {TrackTimePipeModule} from "../../pipes/track-time.pipe.module";
import {RecordSaveModalComponentModule} from "../../components/record-save-modal/record-save-modal.module";
import {RecordSavedModalComponentModule} from "../../components/record-saved-modal/record-saved-modal.module";

@NgModule({
  declarations: [
    RecordPage
  ],
  imports: [
    IonicPageModule.forChild(RecordPage),
    BurgerComponentModule,
    TrackVisualizatorComponentModule,
    TrackTimePipeModule,
    RecordSaveModalComponentModule,
    RecordSavedModalComponentModule
  ],
  exports: [
    RecordPage
  ]
})
export class RecordPageModule {}
