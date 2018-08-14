/**
 * Created by amit on 22/06/17.
 */
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {MixerPage} from "./mixer";
import {BurgerComponentModule} from "../../components/burger.module";
import {MixSaveModalComponentModule} from "../../components/mix-save-modal/mix-save-modal.module";
import {MixSavedModalComponentModule} from "../../components/mix-saved-modal/mix-saved-modal.module";

@NgModule({
  declarations: [
    MixerPage,
  ],
  imports: [
    IonicPageModule.forChild(MixerPage),
    BurgerComponentModule,
    MixSaveModalComponentModule,
    MixSavedModalComponentModule
  ],
  exports: [
    MixerPage
  ]
})
export class MixerPageModule {}
