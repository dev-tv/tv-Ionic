import {Component, ViewChild, NgZone} from '@angular/core';
import {IonicPage, NavController, NavParams, Slides, ModalController, AlertController, Platform} from 'ionic-angular';
import {Marker, ILatLng} from "@ionic-native/google-maps";
import {WebServicesProvider} from "../../providers/web-services/web-services";
import {Storage} from "@ionic/storage";
import {Facebook, FacebookLoginResponse} from "@ionic-native/facebook";
import {Instagram} from "ng2-cordova-oauth/core";
import {OauthCordova} from 'ng2-cordova-oauth/platform/cordova';
import {Toast} from "@ionic-native/toast";
import {ToastController} from "ionic-angular/index";
import {AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {Constant} from "../../providers/Constant";
import {FileTransfer, FileTransferObject} from "@ionic-native/file-transfer";
import {File} from "@ionic-native/file";
import {FilePath} from "@ionic-native/file-path";
import {ImagePicker} from "@ionic-native/image-picker";
import {Diagnostic} from "@ionic-native/diagnostic";


declare var google;

@IonicPage()
@Component({
    selector: 'page-create-trail',
    templateUrl: 'create-trail.html',
})
export class CreateTrailPage {

    @ViewChild(Slides) slides: Slides;

    @ViewChild('mySlides') slidesForImage: Slides;
    accessToken: any;
    fbToken: any;

    mainTrail: any = {};
    slideIndex: number = 1;
    map: any;
    markers = [];
    selectedPosts = [];
    dataFromFB: CheckListModal[] = [];

    imagesFromGallery = [];
    imageFromGallerySize: number;

    uploadedImagesArray = [];

    autocompleteItemsSource;
    autocompleteItemsDestination;
    markerSource: Marker;
    markerDestination: Marker;
    markerDayLatLng: Marker[] = [];

    sourceLocation: ILatLng;
    destinationLocation: ILatLng;
    dayLatLngLocation: ILatLng;

    placesService: any;
    service = new google.maps.places.AutocompleteService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    isEnabled: boolean = false;

    isImagePickedFromGallery: boolean = false;

    constructor(public navCtrl: NavController, public alertCtrl: AlertController,
                public navParams: NavParams, public webservice: WebServicesProvider, public constant: Constant,
                public storage: Storage, public modalCtrl: ModalController, public zone: NgZone, public facebook: Facebook,
                private toast: Toast, private toastCtrl: ToastController, public platform: Platform,public loader: Constant,
                private imagePicker: ImagePicker, private transfer: FileTransfer, private file: File, private filePath: FilePath, private diagnostic: Diagnostic
                ) {
    }

    ngOnInit() {

        this.storage.get('accessToken').then(token => {
            this.accessToken = token;
        });

        this.storage.get('fbToken').then(token => {
            this.fbToken = token;
        });

        this.initializeDefaultValues();

        /*this.imagePicker.requestReadPermission().then(resp => {
            console.log("this.imagePicker.requestReadPermission() : " + JSON.stringify(resp));

            if (resp == 'OK') {
                this.imagePicker.hasReadPermission().then(status => {
                    console.log("this.imagePicker.hasReadPermission() : " + JSON.stringify(status));
                });
            }
        });*/

        //media permission read and write
        this.diagnostic.requestExternalStorageAuthorization().then(succ => {
            console.log('this.diagnostic.requestExternalStorageAuthorization() succ' + JSON.stringify(succ));

            let resp = JSON.stringify(succ);
            let body = JSON.parse(resp);

            console.log('this.diagnostic.requestRuntimePermissions() resp' + resp);
            if (body.READ_EXTERNAL_STORAGE === 'DENIED') {
                //this.navCtrl.setRoot('TabsPage', {tab: 2,openSheet: true});
            }
        }).catch(err => {
            console.log('this.diagnostic.requestLocationAuthorization() err' + JSON.stringify(err));
        });

        this.diagnostic.isExternalStorageAuthorized().then(succ => {
            console.log('this.diagnostic.isExternalStorageAuthorized() succ' + JSON.stringify(succ));

        }).catch(err => {
            console.log('this.diagnostic.isExternalStorageAuthorized() err' + JSON.stringify(err));
        });

        this.diagnostic.getExternalStorageAuthorizationStatus()
            .then((state) => {
                console.log('this.diagnostic.getExternalStorageAuthorizationStatus() state' + JSON.stringify(state));
                if (state == this.diagnostic.locationMode.LOCATION_OFF) {
                    // do something for location off
                    console.log('this.diagnostic.getExternalStorageAuthorizationStatus() state in if ' + JSON.stringify(state));

                } else {
                    // do something else for location enable
                    console.log('this.diagnostic.getExternalStorageAuthorizationStatus() state in else ' + JSON.stringify(state));
                }
            }).catch(e =>
            console.log('error getExternalStorageAuthorizationStatus' + e));
        /*end*/



    }

    initializeDefaultValues() {
        this.mainTrail.days = '1';
        this.mainTrail.privacy = '3';
        this.mainTrail.duration = '1';
        this.mainTrail.comments = '1';
        this.mainTrail.copyTrail = '1';
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad CreateTrailPage');
        this.initMap(0, 0);
    }

    gotoSearch() {
        this.navCtrl.push('SearchPage');
    }

    addItemOnDay(val: number) {
        //console.log('Add array on index : ' + (val - 1));
        console.log('mainTrail.days : ', this.mainTrail.days);
        if (this.mainTrail.days != '')
            this.presentAddDayItemModal((val - 1))
    }

    editItemOnDay(row, slideIndex, itemIndex) {
        this.presentAddDayItemModalUpdate(row, slideIndex, itemIndex);
    }

    presentAddDayItemModalUpdate(row, slideIndex, itemIndex) {
        let addDayItemModal = this.modalCtrl.create('AddDayItemPage', {data: row, index: slideIndex - 1});
        addDayItemModal.onDidDismiss(data => {
            if (data.isAdd) {
                this.updateDataToDayItem(data, slideIndex, itemIndex);
            }
        });
        addDayItemModal.present();
    }


    deleteTrail(dayIndex, itemIndex) {
        this.presentConfirmDelete(dayIndex, itemIndex);
    }

    presentConfirmDelete(dayIndex, itemIndex) {
        const alert = this.alertCtrl.create({
            title: 'Confirm delete',
            message: 'Are you sure, you want to delete this trail ?',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: 'Yes',
                    handler: () => {

                        this.initMap(0, 0);

                        this.markerSource.setPosition(this.sourceLocation);
                        this.markerDestination.setPosition(this.destinationLocation);
                        //this.clearMarkers();

                        /*console.log('itemIndex >>> ',itemIndex);
                        console.log('dayIndex >>> ',dayIndex);
                        console.log('this.mainTrail.day >>> ',this.mainTrail.day);
                        console.log('this.mainTrail.day itineraryDataStorageArray >>> ',this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex]);
                        console.log('lat >> ',this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].lat);
                        console.log('lng >> ',this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].lng);
                        console.log('this.markers length >>> ',this.markers.length);*/

                        for (let marker of this.markers) {
                            //console.log('position is >>> ',marker.lat,' - ',marker.lng);
                            var position = new google.maps.LatLng(marker.lat, marker.lng);

                            if ((this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].lat == marker.lat) && (this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].lng == marker.lng)) {
                                //marker are same >> remove marker here
                                //console.log('marker are same >> remove marker here');
                                if (itemIndex !== -1) {
                                    this.markers.splice(itemIndex, 1);
                                }
                            } else {
                                var mMarker = new google.maps.Marker({position: position});
                                mMarker.setMap(this.map);
                            }

                        }
                        //console.log('after deletion markers length is >>> ',this.markers.length);
                        this.mainTrail.day[dayIndex].itineraryDataStorageArray = this.mainTrail.day[dayIndex].itineraryDataStorageArray.filter(item => item !== this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex]);
                    }
                }
            ]
        });
        alert.present();
    }

    openDetailInAccordian(dayIndex, itemIndex) {
        //console.log('gotoPlaceDetailPage :: openAccordian >> ', this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].openAccordian);
        if (this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].openAccordian) {
            this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].openAccordian = false;
        } else {
            this.mainTrail.day[dayIndex].itineraryDataStorageArray[itemIndex].openAccordian = true;
        }
    }

    gotoPlaceDetailPage(locationId) {
        // console.log('gotoPlaceDetailPage :: locationId :: ', locationId);
        this.navCtrl.push('AddPlacePage', {id: locationId, edit: true});
    }


    onChangeNoOfDays(val) {
        console.log('onChangeNoOfDays : ' + val);

        let temp = [];
        if (val != '' && val > 14) {
            console.log('value greater than 14')
            temp.push({})
            this.mainTrail.day = temp;
            this.mainTrail.days = '';

            this.showPopUp('Alert', 'Max no of days added are 14');
        } else if (val != '' && val <= 0) {
            temp.push({});
            this.mainTrail.day = temp;
            this.mainTrail.days = '';

            this.showPopUp('Alert', 'Number of days cannot be less than 1');
        }
        else {
            for (let i = 0; i < val; i++) {
                temp.push({
                    itineraryDataStorageArray: [],
                    numberOfDays: i + 1
                })
            }
            this.mainTrail.day = temp;
            this.slideIndex = 1;
            console.log('in IF case')
        }
        console.log('mainTrail.day', JSON.stringify(this.mainTrail.day));


    }


    slideChanged() {
        //console.log('slideChanged ::: this.slides.getActiveIndex() ----- ', this.slides.getActiveIndex());
        if ((this.slides.getActiveIndex() + 1) > this.mainTrail.day.length) {
            // do nothing
        } else {
            this.slideIndex = this.slides.getActiveIndex() + 1;
        }
    }


    goToNextSlide() {
        this.slides.slideTo(this.slides.getActiveIndex() + 1, 500);
    }

    goToPrevSlide() {
        this.slides.slideTo(this.slides.getActiveIndex() - 1, 500);
    }

    submit() {
        if (!this.validateSubmit()) {
            // this.webservice.showToastMsg("Please filled above fields");
            // this.presentToast("Please filled above fields",2000);
            // this.isEnabled= false;
            return;
        }

        let date = new Date(this.mainTrail.startdate); // some mock date
        this.mainTrail.startdate = date.getTime();
        this.mainTrail.status = 1;

        this.imageFromGallerySize = this.imagesFromGallery.length;
        if (this.imagesFromGallery != null && this.isImagePickedFromGallery) {
            this.loader.showLoader();
            for (let i = 0; i < this.imageFromGallerySize; i++) {

                let data = this.imagesFromGallery[i];
                this.uploadImage(data, this.accessToken);
                console.log(">>>>>>>>>>>>>>>>>>>>> Save loop called to upload image");
            }

        } else {
            this.callWsSubmitOfTrail();
        }

    }

    callWsSubmitOfTrail() {
        //console.log("Submit Request " + JSON.stringify(this.mainTrail));


        /*if (this.dataFromFB != null) {
            if (this.dataFromFB.length > 0) {
                for (let data of this.dataFromFB) {

                    if (data.isChecked) {
                        this.selectedPosts.push(data.url);
                    }

                }

                if (this.selectedPosts != null) {
                    if (this.selectedPosts.length > 0) {
                        //console.log("Selected List : " + this.selectedPosts.length);
                        this.mainTrail.gallary_imgs = this.selectedPosts;
                    }
                }
            }
        }*/


        if (this.uploadedImagesArray != null) {
            if (this.uploadedImagesArray.length > 0) {
                for (let data of this.uploadedImagesArray) {
                    this.selectedPosts.push(data);

                }

                if (this.selectedPosts != null) {
                    if (this.selectedPosts.length > 0) {
                        console.log("Selected List : " + this.selectedPosts.length);
                        this.mainTrail.gallary_imgs = this.selectedPosts;
                    }
                }
            }
        }
        console.log("this.mainTrail request : " + JSON.stringify(this.mainTrail));

        this.webservice.createUpdateTrails(this.mainTrail, this.accessToken).then(succ => {
            //this.showToastMsg("Trail updated successfully");
            // this.navCtrl.setRoot('TabsPage', {tab: 2, page: 'mytrail'});

            let resp: any = succ;
            let body = JSON.parse(resp._body);
            this.presentToast(body.message, 3000);

        }).catch(err => {
            //  this.constant.hideLoader();

            let err1: any = err;
            let error = JSON.parse(JSON.stringify(err1));
            console.log('error with status', error.status);

            if (error.status == 419) {
                console.log("401 called :Session Expired");
                this.navCtrl.setRoot('LoginPage');
                this.storage.clear();
                this.webservice.showToast('Session expire, please re-login.');

            }
        });
    }

    save() {
        //uncomment below part
        if (!this.validateSubmit()) {
            // this.isEnabled= false;
            return;
        }

        let date = new Date(this.mainTrail.startdate); // some mock date
        this.mainTrail.startdate = date.getTime();
        console.log(JSON.stringify(this.mainTrail));
        this.mainTrail.status = 2;

        this.imageFromGallerySize = this.imagesFromGallery.length;
        if (this.imagesFromGallery != null && this.isImagePickedFromGallery) {
            for (let i = 0; i < this.imageFromGallerySize; i++) {
                let data = this.imagesFromGallery[i];
                this.uploadImage(data, this.accessToken);
                console.log(">>>>>>>>>>>>>>>>>>>>> Save loop called to upload image");

            }

        } else {
            console.log("this.callWsSaveOfTrail(); called : ");
            this.callWsSaveOfTrail();
        }

    }

    uploadImage(lastImage, token) {

        // Destination URL
        //var url = this.apiUrl + this.fileUploadToServer;

        var url = this.webservice.callImportFromGallery();

        // File for Upload
        // var targetPath = this.pathForImage(lastImage);
        var targetPath = lastImage;

        // File name only
        var filename = lastImage;

        var options = {
            fileKey: "image",
            fileName: filename,
            chunkedMode: false,
            // mimeType: "multipart/form-data",
            mimeType: "image/jpg",
            params: {'image': filename},
            headers: {'Authorization': token}

        };

        const fileTransfer: FileTransferObject = this.transfer.create();
        // Use the FileTransfer to upload the image
        fileTransfer.upload(targetPath, url, options).then(data => {
            let resp = JSON.parse(data.response);

            if (resp.status == 200) {
                this.uploadedImagesArray.push(resp.imageUrl);
                console.log("Uploaded image in resp this.uploadedImagesArray : " + JSON.stringify(this.uploadedImagesArray));

                this.imageFromGallerySize = this.imageFromGallerySize - 1;
                console.log("imageFromGallerySize : " + this.imageFromGallerySize);

                if (this.imageFromGallerySize == 0) {
                    this.loader.hideLoader();
                    if (this.mainTrail.status == 2) {
                        this.callWsSaveOfTrail();
                    } else if (this.mainTrail.status == 1) {
                        this.callWsSubmitOfTrail();
                    }
                }

            }
        }, err => {
            this.loader.hideLoader();
            console.log('Error while uploading file.', JSON.stringify(err));
            this.uploadedImagesArray.push(err.source);
            //console.log("Uploaded image in err : " + err.source);

        });
    }


    callWsSaveOfTrail() {
        /* if (this.dataFromFB != null) {
             if (this.dataFromFB.length > 0) {
                 for (let data of this.dataFromFB) {

                     if (data.isChecked) {
                         this.selectedPosts.push(data.url);
                     }

                 }

                 if (this.selectedPosts != null) {
                     if (this.selectedPosts.length > 0) {
                         console.log("Selected List : " + this.selectedPosts.length);
                         this.mainTrail.gallary_imgs = this.selectedPosts;
                     }
                 }
             }
         }*/

        if (this.uploadedImagesArray != null) {
            if (this.uploadedImagesArray.length > 0) {
                for (let data of this.uploadedImagesArray) {
                    this.selectedPosts.push(data);

                }

                if (this.selectedPosts != null) {
                    if (this.selectedPosts.length > 0) {
                        console.log("Selected List : " + this.selectedPosts.length);
                        this.mainTrail.gallary_imgs = this.selectedPosts;
                    }
                }
            }

        }

        console.log("this.mainTrail request : " + JSON.stringify(this.mainTrail));
        //console.log('save ::: calling params :: ', this.mainTrail);
        this.webservice.createUpdateTrails(this.mainTrail, this.accessToken).then(succ => {
            //   this.showToastMsg("Trail updated successfully");
            //  this.navCtrl.setRoot('TabsPage', {tab: 2, page: 'mytrail'});

            let resp: any = succ;
            let body = JSON.parse(resp._body);
            this.presentToast(body.message, 3000);

        }).catch(err => {
            //  this.constant.hideLoader();

            let err1: any = err;
            let error = JSON.parse(JSON.stringify(err1));
            console.log('error with status', error.status);

            if (error.status == 419) {
                console.log("401 called :Session Expired");
                this.navCtrl.setRoot('LoginPage');
                this.storage.clear();
                this.webservice.showToast('Session expire, please re-login.');

            }
        });
    }

    showToastMsg(msg: string) {
        this.toast.show(msg, 'short', 'bottom').subscribe(toast => {
        });
    }


    public presentToast(msg, duration): Promise<any> {

        let toast = this.toastCtrl.create({
            message: msg,
            // duration: duration,
            duration: 500,
            position: 'bottom',
            dismissOnPageChange: true

        });

        toast.onDidDismiss(() => {
            // Do something
            this.navCtrl.setRoot('TabsPage', {tab: 2, page: 'mytrail'});
        });

        return toast.present();
    }


    presentAddDayItemModal(index: number) {
        let addDayItemModal = this.modalCtrl.create('AddDayItemPage', {index: index});
        addDayItemModal.onDidDismiss(data => {
            if (data.isAdd) {
                this.addDataToDayItem(data, index);
            }
        });
        addDayItemModal.present();
    }

    /*
        presentSetCriteriaModal() {

            this.constant.showLoader();

            this.webservice.getProfileSettingMaster(this.accessToken)
                .then(responce => {
                    this.constant.hideLoader();
                    let setCriteriaModal = this.modalCtrl.create('SetCriteriaPage', {
                        resp: responce.data,
                        setting: this.mainTrail.settings,
                        isEditable: true
                    });
                    setCriteriaModal.onDidDismiss(data => {
                        console.log('presentSetCriteriaModal', JSON.stringify(data));
                        this.mainTrail.settings = data;
                    });
                    setCriteriaModal.present();
                }).catch(err => {
                this.constant.hideLoader();
            });
        }*/
    presentSetCriteriaModal() {

        //   this.constant.showLoader();

        this.webservice.getProfileSettingMaster(this.accessToken)
            .then(responce => {
                //this.constant.hideLoader();
                let setCriteriaModal = this.modalCtrl.create('SetCriteriaPage', {
                    resp: responce.data,
                    searchPreferences: this.mainTrail.searchPreferences,
                    isEditable: true
                });
                setCriteriaModal.onDidDismiss(data => {
                    console.log('presentSetCriteriaModal', JSON.stringify(data));
                    this.mainTrail.searchPreferences = data;
                    console.log('this.mainTrail.searchPreferences', JSON.stringify(this.mainTrail.searchPreferences));
                });
                setCriteriaModal.present();
            }).catch(err => {
            //  this.constant.hideLoader();
            let err1: any = err;
            let error = JSON.parse(JSON.stringify(err1));
            console.log('error with status', error.status);

            if (error.status == 419) {
                console.log("401 called :Session Expired");
                this.navCtrl.setRoot('LoginPage');
                this.storage.clear();
                this.webservice.showToast('Session expire, please re-login.');

            }
        });
    }

    updateDataToDayItem(data: any, slideIndex, itemIndex) {
        console.log("updateDataToDayItem Called");
        this.mainTrail.day[slideIndex - 1].itineraryDataStorageArray[itemIndex] = data;
    }


    addDataToDayItem(data: any, index) {
        let temp = [];
        if (!this.mainTrail.day || this.mainTrail.length == 0) {
            let tempObj = [];
            tempObj.push({
                itineraryDataStorageArray: [],
                numberOfDays: 1
            });
            this.mainTrail.day = tempObj;
        }
        temp = this.mainTrail.day[data.indx].itineraryDataStorageArray;
        if (temp.length < 6) {
            temp.push({
                id: data.id,
                time: data.time,
                location: data.location,
                location_text: data.location_text,
                activity: data.activity,
                vehicle: data.vehicle,
                lat: data.lat,
                lng: data.lng,
            });

            for (let i = 0; i < temp.length; i++) {
                let lat = temp[i].lat;
                let lng = temp[i].lng;
                this.dayLatLngLocation = {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                };

                this.markerDayLatLng[i] = new google.maps.Marker({
                    map: this.map,
                    position: this.dayLatLngLocation
                });


                console.log('set marker at index >>> ', i);

                this.markers.push(this.dayLatLngLocation);
                /*this.bounds = new google.maps.LatLngBounds();
                this.map.fitBounds(this.bounds);*/
                //this.map.panToBounds(this.bounds);
            }
        }
        else {
            this.showPopUp('Alert', 'Max 6 activities are added in a day');
        }
    }

    updateSearchSource() {
        if (this.mainTrail.source == '') {
            this.autocompleteItemsSource = [];
            return;
        }

        this.mainTrail.source_lat = '';
        this.mainTrail.source_lng = '';
        this.mainTrail.source_place_id = '';

        let me = this;
        this.service.getPlacePredictions({input: this.mainTrail.source}, function (predictions, status) {
            me.autocompleteItemsSource = [];
            me.zone.run(function () {
                if (predictions) {
                    predictions.forEach(function (prediction) {
                        me.autocompleteItemsSource.push(prediction);
                    });
                }
            });
        });
    }

    updateSearchDestination() {
        if (this.mainTrail.destination == '') {
            this.autocompleteItemsDestination = [];
            return;
        }

        this.mainTrail.destination_lat = '';
        this.mainTrail.destination_lng = '';
        this.mainTrail.destination_place_id = '';

        let me = this;
        this.service.getPlacePredictions({input: this.mainTrail.destination}, function (predictions, status) {
            me.autocompleteItemsDestination = [];
            me.zone.run(function () {
                if (predictions) {
                    predictions.forEach(function (prediction) {
                        me.autocompleteItemsDestination.push(prediction);
                    });
                }
            });
        });
    }

    chooseItemSource(sourceData: any) {
        this.mainTrail.source_lat = '';
        this.mainTrail.source_lng = '';
        this.mainTrail.source_place_id = '';
        this.mainTrail.source = sourceData.description;
        this.autocompleteItemsSource = [];
        this.getPlaceDetail(sourceData.place_id, true);
    }

    chooseItemDestination(destinationdata: any) {
        this.mainTrail.destination_lat = '';
        this.mainTrail.destination_lng = '';
        this.mainTrail.destination_place_id = '';
        this.mainTrail.destination = destinationdata.description;
        this.autocompleteItemsDestination = [];
        this.getPlaceDetail(destinationdata.place_id, false);
    }

    private getPlaceDetail(place_id: string, isSource: boolean): void {
        let self = this;
        let request = {
            placeId: place_id
        };
        this.placesService = new google.maps.places.PlacesService(this.map);
        this.placesService.getDetails(request, callback);

        function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {

                if (isSource) {
                    self.mainTrail.source_lat = place.geometry.location.lat();
                    self.mainTrail.source_lng = place.geometry.location.lng();
                    self.mainTrail.source_place_id = place_id;
                    self.addMapMarker(place, true);
                } else {
                    self.mainTrail.destination_lat = place.geometry.location.lat();
                    self.mainTrail.destination_lng = place.geometry.location.lng();
                    self.mainTrail.destination_place_id = place_id;
                    self.addMapMarker(place, false);
                }

                // set place in map
                self.map.setCenter(place.geometry.location);
            } else {
                console.log('page > getPlaceDetail > status > ', status);
            }
        }
    }

    private addMapMarker(place: any, onSource: boolean): void {
        let placeLoc = place.geometry.location;
        let posi: ILatLng = placeLoc;

        if (onSource) {
            this.sourceLocation = posi;
            this.map.fitBounds(this.bounds);
            this.markerSource.setPosition(posi);
        } else {
            this.destinationLocation = posi;
            this.map.fitBounds(this.bounds);
            this.markerDestination.setPosition(posi);
        }


        //this.drawPath();
    }

    private drawPath() {
        let self = this;

        //Initialize the Direction Service
        let service = new google.maps.DirectionsService;
        this.directionsDisplay.setMap(this.map);
        this.directionsDisplay.setDirections(null);

        //Set the Path Stroke Color
        let poly = new google.maps.Polyline({map: this.map, strokeColor: '#4986E7'});

        let lat_lng = [];
        lat_lng.push(this.sourceLocation);
        lat_lng.push(this.destinationLocation);

        //Loop and Draw Path Route between the Points on MAP
        for (let i = 0; i < lat_lng.length; i++) {
            if ((i + 1) < lat_lng.length) {
                let src = lat_lng[i];
                let des = lat_lng[i + 1];
                service.route({
                    origin: src,
                    destination: des,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                }, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        self.directionsDisplay.setDirections(result);
                    } else {
                        console.log('google.maps.DirectionsStatus. NOOOORR OK', status)
                    }
                });
            }
        }
    }

    bounds: any;

    private initMap(lat, lng) {
        this.bounds = new google.maps.LatLngBounds();
        var point = {lat: lat, lng: lng};
        let divMap = (<HTMLInputElement>document.getElementById('mmap'));
        this.map = new google.maps.Map(divMap, {
            center: point,
            zoom: 20,
            disableDefaultUI: true,
            draggable: true,
            zoomControl: true
        });
        this.bounds.extend(new google.maps.LatLng(lat, lng));

        this.map.fitBounds(this.bounds); //# auto - zoom
        //this.bounds.extend(this.map);

        this.markerSource = new google.maps.Marker({
            map: this.map,
            //position: point
        });
        this.markerDestination = new google.maps.Marker({
            map: this.map,
            position: point
        });

        this.markerDayLatLng = new google.maps.Marker({
            map: this.map,
            //position: point
        });
        //this.sourceLocation = point;
        //this.destinationLocation = point;
        // this.markers.push(marker);
    }

    showPopUp(title: string, msg: string) {
        const alert = this.alertCtrl.create({
            title: title,
            subTitle: msg,
            buttons: ['Ok']
        });
        alert.present();
    }

    validateSubmit(): boolean {

        if (!this.mainTrail.title || (this.mainTrail.title && this.mainTrail.title.trim() == '')) {
            this.showPopUp('Alert', 'Please enter title');
            return false;
        }
        if (!this.mainTrail.destination || (this.mainTrail.destination && this.mainTrail.destination.trim() == '')) {
            this.showPopUp('Alert', 'Please enter destination');
            return false;
        }
        /*if(!this.mainTrail.destination && (this.mainTrail.destination && this.mainTrail.destination.trim() === '')) {
         this.webservice.showToastMsg('Please enter destination');
         return false;
         }*/
        if (!this.mainTrail.source || (this.mainTrail.source && this.mainTrail.source.trim() == '')) {
            this.showPopUp('Alert', 'Please enter source');
            return false;
        }
        if (!this.mainTrail.days || (this.mainTrail.days && this.mainTrail.days.trim() == '')) {
            this.showPopUp('Alert', 'Please enter days');
            return false;
        }
        if (!this.mainTrail.startdate || (this.mainTrail.startdate === '')) {
            this.showPopUp('Alert', 'Please enter start journey date');
            return false;
        }

        /*  if (!this.mainTrail.startdate || (this.mainTrail.startdate && this.mainTrail.startdate.trim() == '')) {
            this.showPopUp('Alert', 'Please enter start journey date');
            return false;
        }*/
        if (!this.mainTrail.description || (this.mainTrail.description && this.mainTrail.description.trim() == '')) {
            this.showPopUp('Alert', 'Please enter description');
            return false;
        }

        if (this.mainTrail.duration == 0) {
            if (!this.mainTrail.visibleDays || (this.mainTrail.visibleDays && this.mainTrail.visibleDays == '')) {
                this.showPopUp('Alert', 'Please enter visible days for trail');
                return false;
            }
        }

        if (this.mainTrail.link1 && this.mainTrail.link1.trim().length > 0) {
            if (!this.checkLinkValidation(this.mainTrail.link1.trim(), 'link1')) {
                return false;
            }
        }

        if (this.mainTrail.link2 && this.mainTrail.link2.trim().length > 0) {
            if (!this.checkLinkValidation(this.mainTrail.link2.trim(), 'link2')) {
                return false;
            }
        }

        if (this.mainTrail.link3 && this.mainTrail.link3.trim().length > 0) {
            if (!this.checkLinkValidation(this.mainTrail.link3.trim(), 'link3')) {
                return false;
            }
        }


        if (this.mainTrail.link4 && this.mainTrail.link4.trim().length > 0) {

            if (!this.checkLinkValidation(this.mainTrail.link4.trim(), 'link4')) {
                return false;
            }
        }

        return true;
    }

    checkLinkValidation(inputLink, msg) {
        let urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
        let re = new RegExp(urlRegex);
        let input = inputLink;
        let isValid = re.test(input);
        if (!isValid) {
            this.showPopUp('Alert', 'Please enter valid ' + msg + '.');
            return false;
        }
        return true;
    }

    Callfbapi() {
        let user = {'accessToken': this.fbToken};
        console.log('Callfbapi :this.accessToken : ', this.accessToken);
        console.log('Callfbapi :user : ', JSON.stringify(user));

        this.webservice.importfromfacebook(this.accessToken, user).then(result => {

            let resp: any = result;
            console.log('Callfbapi : Response from server : ', JSON.stringify(JSON.parse(resp._body)));

            // We iterate the array in the code
            for (let data of JSON.parse(resp['_body']).data) {

                if (this.dataFromFB == null) {
                    this.dataFromFB = [];
                }
                this.dataFromFB.push(new CheckListModal(data, false));
            }


            console.log('Callfbapi : size of dataFromFB : ', this.dataFromFB.length);

            if (this.dataFromFB.length == 0) {

                this.toastCtrl.create({
                    message: 'No image found in facebook',
                    duration: 2000,
                    position: 'bottom',
                    dismissOnPageChange: true

                }).present();
            }

        }).catch(err => {
            //  this.constant.hideLoader();

            let err1: any = err;
            let error = JSON.parse(JSON.stringify(err1));
            console.log('error with status', error.status);

            if (error.status == 419) {
                console.log("401 called :Session Expired");
                this.navCtrl.setRoot('LoginPage');
                this.storage.clear();
                this.webservice.showToast('Session expire, please re-login.');

            }
        });

    }

    private instagramProvider: Instagram = new Instagram({
        clientId: "48ab9fb980bc48a3b64684337e14a63d",      // Register you client id from https://www.instagram.com/developer/
        appScope: ['basic', 'public_content'],
        redirectUri: 'http://localhost:5015',  // Let is be localhost for Mobile Apps
        responseType: 'token' // Use token only
    });

    private oauth: OauthCordova = new OauthCordova();
    instaToken: any;

    Callinstaapi() {
        console.log("Callinstaapi ");

        this.storage.get('INSTATOKEN').then(token => {
            this.instaToken = token;

            if (this.instaToken) {
                this.getInstagramPosts(this.instaToken);
            } else {
                this.oauth.logInVia(this.instagramProvider).then((success) => {

                    console.log("Success Response : " + JSON.stringify(success));

                    let token: any = success;
                    this.instaToken = token;

                    this.storage.set('INSTATOKEN', token);
                    this.getInstagramPosts(token.access_token);

                }, (error) => {
                    console.log("Error Response : " + error);
                });
            }

        });

    }

    getInstagramPosts(success) {
        let user = {'accessToken': success.access_token};

        this.webservice.importfrominstagram(this.accessToken, user).then(result => {

            let resp: any = result;
            console.log('Callfbapi : Response from server : ', JSON.stringify(JSON.parse(resp._body)));
            // We iterate the array in the code
            for (let data of JSON.parse(resp['_body']).userStandardMediaOnly) {

                if (this.dataFromFB == null) {
                    this.dataFromFB = [];
                }
                this.dataFromFB.push(new CheckListModal(data, false));
            }


            console.log('Callfbapi : size of dataFromINSTA : ', this.dataFromFB.length);
        }).catch(err => {
            //  this.constant.hideLoader();

            let err1: any = err;
            let error = JSON.parse(JSON.stringify(err1));
            console.log('error with status', error.status);

            if (error.status == 419) {
                console.log("401 called :Session Expired");
                this.navCtrl.setRoot('LoginPage');
                this.storage.clear();
                this.webservice.showToast('Session expire, please re-login.');

            }
        });

    }

    sliderItemClick(data, i) {
        console.log('sliderItemClick Called with pos : ' + i);
        console.log('sliderItemClick Called this.dataFromFB[i].isChecked : ' + this.dataFromFB[i].isChecked);

        if (this.dataFromFB[i].isChecked) {
            this.dataFromFB[i].isChecked = false;
        } else {
            this.dataFromFB[i].isChecked = true;
        }

    }


    /*Import from gallery*/
    importFromGallery() {

        // array of permissions
        this.diagnostic.requestRuntimePermissions([
            this.diagnostic.permission.READ_EXTERNAL_STORAGE, this.diagnostic.permission.WRITE_EXTERNAL_STORAGE]).then(succ => {
            //console.log('this.diagnostic.requestRuntimePermissions() succ' + JSON.stringify(succ));
            let resp = JSON.stringify(succ);
            let body = JSON.parse(resp);

            console.log('this.diagnostic.requestRuntimePermissions() importFromGallery resp' + resp);

            if (body.READ_EXTERNAL_STORAGE === 'DENIED_ALWAYS' && body.WRITE_EXTERNAL_STORAGE === 'DENIED_ALWAYS') {
                //this.navCtrl.pop();
                this.showPopUp('Alert', 'You need to give storage permission ,go to setting and allow storage permission first.');
            }

            if (body.READ_EXTERNAL_STORAGE === 'GRANTED' && body.WRITE_EXTERNAL_STORAGE === 'GRANTED') {
                if (this.imagesFromGallery && this.imagesFromGallery.length < 10) {
                    this.imagePicker.getPictures({
                        maximumImagesCount: 10 - this.imagesFromGallery.length,
                        width: 100,
                        height: 100,
                        quality: 100
                    }).then(results => {
                        console.log("Image from gallery : " + JSON.stringify(results));


                        if (results.length > 0) {
                            this.isImagePickedFromGallery = true;

                            for (let i = 0; i < results.length; i++) {
                                console.log("Image from gallery file : " + JSON.stringify(results[i]));
                                this.imagesFromGallery.push(results[i]);
                            }
                        }


                    });

                } else {
                    this.showPopUp('Alert', 'You are allowed to upload maximum 10 images per trail. Please remove at least an image to add new.');
                }
            }


        }).catch(err => {
            console.log('this.diagnostic.requestRuntimePermissions() importFromGallery err' + JSON.stringify(err));
        });
        /*end*/



    }

    removeItemOnClick(data, i) {
        //console.log("removeItemOnClick data : " + data);
        let confirm = this.alertCtrl.create({
            message: 'Are you sure, you want to delete this picture ?',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                },
                {
                    text: 'OK',
                    handler: () => {
                        this.imagesFromGallery.splice(i, 1);

                    }
                }
            ]
        });
        confirm.present();

    }

    slideChangedForGallery() {
        let currentIndex = this.slidesForImage.getActiveIndex();
        console.log('Current index is', currentIndex);

        if ((this.slidesForImage.getActiveIndex() + 1) > this.imagesFromGallery.length) {
            // do nothing
            console.log('if called slideChangedForGallery ');
        } else {
           // this.slides.slideTo(this.slides.getActiveIndex() - 1, 500);
            console.log('else called slideChangedForGallery ');
        }
    }

    /*end*/

    /***
     * Code to share on Facebook*/
    img_url_google: any;

    shareOnFacebook() {

        this.img_url_google = "http://maps.googleapis.com/maps/api/streetview?size=400x200&location=" +
            "" + this.mainTrail.source_lat + "," + this.mainTrail.source_lng + "" +
            "&key=" +
            "AIzaSyCANwWGF7aEZiZbtT0vV3v27gRx_ufIoHs";

        console.log('shareOnFacebook Called img_url_google ', this.img_url_google);

        this.facebook.showDialog({
            method: 'share',
            href: 'http://52.26.118.138/#/app/trails-save/' + this.mainTrail._id,
            caption: this.mainTrail.title,
            title: this.mainTrail.title,
            description: this.mainTrail.description,
            picture: this.img_url_google
        })

    }

    /***End code to share on Facebook*/

}


export class CheckListModal {

    constructor(public url: string, public isChecked: boolean) {

    }
}

