import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CreateTrailPage } from './create-trail';

@NgModule({
  declarations: [
    CreateTrailPage,
  ],
  imports: [
    IonicPageModule.forChild(CreateTrailPage),
  ],
})
export class CreateTrailPageModule {}
