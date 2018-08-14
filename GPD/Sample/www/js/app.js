// GoPlanDo App
ionic.Gestures.gestures.Hold.defaults.hold_threshold = 20;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'go-plan-do' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'go-plan-do.services' is found in services.js
// 'go-plan-do.controllers' is found in controllers.js
var db = null; //initialize the app db

angular.module('go-plan-do', ['ionic',
 'ionic.native',
 'ionic.rating',
 'ion-autocomplete',
 'helper-modules',
 'angular.bind.notifier',
 'angular-svg-round-progressbar',
 'jett.ionic.filter.bar',
 'go-plan-do.projectsController',
 'go-plan-do.reportController',
 'go-plan-do.aboutController',
 'go-plan-do.workItemDetailsController',
 'go-plan-do.teamController',
 'go-plan-do.chatRoomController',
 'go-plan-do.WorkItemHireController',
 'go-plan-do.settingsController',
 'go-plan-do.services',
 'go-plan-do.repeatService',
 'go-plan-do-db-upgrade.services',
 'go-plan-do-logging.services',
 'go-plan-do-uuid.services',
 'go-plan-do-vsts-sorting.service',
 'go-plan-do-work-item-alignment.service',
 'go-plan-do.directives',
 'go-plan-do.filters',
 'ngCordova',
 'ngCordovaOauth',
 'ionic-datepicker',
 'treeControl',
 /*'templates',*/
 'googlechart',
 'ngQuill',
 'ngStorage',
 'ionic-toast',
 'as.sortable',
 'ui.bootstrap',
 'ngTagsInput',
 'firebase'
])
.run(['$ionicPlatform', '$cordovaSQLite', '$rootScope', '$cordovaNetwork', '$cordovaToast',
 'moment', 'Counts', 'Subscriptions', '$state', '$http', 'pushService', 'Projects','$q', '$cordovaBadge','VideoPopupsService', '$cordovaLocalNotification','LocalNotificationService','underscore','fireService','CurrentVSTSUser','$ionicPopup','$timeout','VSTSTeams',
 function($ionicPlatform, $cordovaSQLite, $rootScope,$cordovaNetwork, $cordovaToast,
  moment,Counts,Subscriptions,$state, $http, pushService,
  Projects,$q,$cordovaBadge,VideoPopupsService, $cordovaLocalNotification,LocalNotificationService,underscore,fireService,CurrentVSTSUser,$ionicPopup,$timeout,VSTSTeams) {

  $ionicPlatform.ready(function() {

    // keyboard hide/show listners
    window.addEventListener('native.keyboardshow', keyboardShowHandler);

    function keyboardShowHandler(e){
        if(ionic.Platform.isAndroid()){
            $rootScope.tabsHidden = 'tabs-hide';
            $rootScope.$apply();
        }
    }

    window.addEventListener('native.keyboardhide', keyboardHideHandler);

    function keyboardHideHandler(e){
        if(ionic.Platform.isAndroid()){
            $rootScope.tabsHidden = 'tabs-show';
            $rootScope.$apply();
        }
    }

    //set the current db version as null
    $rootScope.currentDBVersion = null;

    // variable for one popup at one time
    $rootScope.canShowAlert = true;

    //Added by Ashish
    // set the free trial version variable to false initially
    $rootScope.freeTrialVersionHasExpired = false;

    $rootScope.isTaskStatusChanged = false;
    //the name of the yearly subscription in all platforms
    $rootScope.subscriptionProductName = "com.aivantech.goplando.yearly_sub";
    $rootScope.subscriptionProductNameAlias = "GoPlanDo Yearly Subscription";
    //initialize the subscriptions global object/placeholder
    $rootScope.subscriptionProduct={title:"GoPlanDo",
                                    description:"GoPlanDo helps teams achieve more. "
                                     + " To manage your subscription"
                                     + " tap the button below.",
                                    price:"$35.99"};
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
    }
    if (window.StatusBar) {
        // cordova-plugin-statusbar required
        StatusBar.styleDefault();

    }
    if(window.cordova) {

        // check badge permission
        $cordovaBadge.hasPermission().then(function(yes) {
            console.log('yes', yes);
        }, function(no) {
            console.log('no', no);
        });

        // clear badge count
        $cordovaBadge.clear().then(function() {
            // You have permission, badge cleared.
            console.log('You have permission, badge cleared.');
        }, function(err) {
            // You do not have permission.
            console.log('You do not have permission.');
        });

        // App syntax
        window.alert = function (txt) {
           navigator.notification.alert(txt, function() {console.log("alert dismissed");}, "", "Close");
        }
        db = window.sqlitePlugin.openDatabase({name: 'go-plan-do.db', iosDatabaseLocation: 'default'},
         function(dB) {
            //    console.log(dB);

        }, function(err) {
            console.log('Open database ERROR: ' + JSON.stringify(err));
            alert('Open database ERROR: ' + JSON.stringify(err));
        });

        //
        $rootScope.showVideoToursCount = 0;
        //global function to confirm viewing video tours
        $rootScope.confirmVideoTours = function(){
          navigator
          .notification.confirm( 'Ask to view video tour on launch?',
            function(secondfirstButtonIndex){
                  console.log("second button index is "+ secondfirstButtonIndex);
                  if(secondfirstButtonIndex==2){

                        VideoPopupsService
                        .addVideoPopupAlert({showVideoAlertOnStart:1})
                        .then(function(res){
                               console.log(res);
                               console.log("video will be shown on launch");
                        });
                  }
                  if(secondfirstButtonIndex==1){
                      navigator
                      .notification.alert("You can view the video tour anytime by going to Settings > About > Welcome Video",
                      function() {

                        VideoPopupsService
                        .removeAllVideoPopupAlerts()
                        .then(function(res1){
                          console.log(res1);
                             VideoPopupsService
                            .addVideoPopupAlert({showVideoAlertOnStart:0})
                            .then(function(res){
                                   console.log(res);
                                   console.log("video will not be shown on launch");
                                    $rootScope.showVideoToursCount +=1;
                            });
                        });

                      }, "Got It", ['Close']);

                  }
            }
           , 'Tour Prompt', ['No','Yes']);
        };

        //global function to show video tours
        $rootScope.showVideoTours = function(){
           window.open = cordova.InAppBrowser.open;
            navigator.notification
            .confirm( 'Would you like to view the video tour?',
               function(firstButtonIndex){

                if(firstButtonIndex==2){
                  var ref = window.open("http://goplando75.mrktgpg.com/video-tours", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
                  ref.addEventListener('exit', function(event) {
                    $rootScope.confirmVideoTours();
                    $rootScope.showVideoToursCount +=1;

                  });
                }

                if(firstButtonIndex==1){

                   navigator
                   .notification.alert("You can view the video tour anytime by going to Settings > About > Welcome Video",
                    function() {
                       VideoPopupsService
                        .removeAllVideoPopupAlerts()
                        .then(function(res1){
                          console.log(res1);
                             VideoPopupsService
                            .addVideoPopupAlert({showVideoAlertOnStart:0})
                            .then(function(res){
                                   console.log(res);
                                   console.log("video will not be shown on launch");
                                    $rootScope.showVideoToursCount +=1;
                            });
                        });


                   }, "Got It", 'Close');
                }

            }
            ,'Welcome',['No', 'Yes']);
        };

    } else {
         // Ionic serve syntax or when running app in a browser
         db = window.openDatabase("go-plan-do.db", "1.0", "GoPlanDo App", -1);
    }

    if (window.cordova) {
         // listen for Online event
         $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
             $rootScope.internetDisconnected = false;
         });
         // listen for Offline event
         $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
         //    alert("Check your internet connection	");
              $cordovaToast
              .show('Internet disconnected', 'long', 'bottom')
              .then(function (success) {
               // success
               }, function (error) {
               // error
               });
              $rootScope.internetDisconnected = true;
         });
    }else{
  		    $rootScope.internetDisconnected = false;
  	}

    $rootScope.colorIndex = 0;
    $rootScope.autoBacklogQueryInitialized = false;
    $rootScope.autoTriageQueryInitialized = false;
    $rootScope.triageWorkItems = [];//in memory variable to hold the triage work items
    $rootScope.currentReportProject = null;//stores current project for the report page

      // app setting default remining hours
      Projects.getAutoQueryBacklogTime(1).then(function(res){
          if(res != undefined){
              if(!res.remainingHrs) {
                  Projects.updateRemainingHrs('8',1).then(function(res){});
              }
          }
      });

    

    function cancelActiveSubscription() {
        Subscriptions
            .allSubscriptions()
            .then(function(subs){
                console.log(JSON.stringify(subs));
                 var currentSub =  subs[0];
                if(currentSub.userSubscribed == 1){
                    currentSub.userSubscribed = 0;
                    Subscriptions
                        .updateSubscription(currentSub,currentSub)
                        .then(function(){});
                    $rootScope.subscriptionProduct={title:"GoPlanDo",
                        description:"GoPlanDo helps teams achieve more. "
                        + " To activate all features of the GoPlanDo app"
                        + " tap the button below to subscribe.",
                        price:"$35.99"};
                } else {
                    // do nothing
                }
            });
    }

    if(window.cordova){
        if(ionic.Platform.isIOS()){
            if(localStorage.getItem('iosReceipt')){
                var receipt = localStorage.getItem('iosReceipt');
                // alert('iosReceipt : ' + JSON.stringify(receipt));
                // Handle receipt
                var req = {
                    url: 'https://scrumsoup.herokuapp.com/verify/ios',
                    method: "POST",
                    data: {
                        transaction: {
                            transactionReceipt: receipt
                        }
                    }
                };
                $http(req).then(function (succ) {
                    if(succ.data.ok){
                        // alert('succ data ok length : ' + succ.data.data.length);
                        // alert('succ data : ' + JSON.stringify(succ));
                        if(succ.data.data.length > 0){
                            $rootScope.subscriptionProduct={title:"GoPlanDo",
                                description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
                                price:undefined};
                        } else {
                            // cancel subscription
                            localStorage.setItem('iosReceipt', '');
                            // alert('cancelActiveSubscription');
                            cancelActiveSubscription();
                        }
                    } else {
                        // alert('succ data Not OK cancelActiveSubscription');
                        // cancel subscription
                        localStorage.setItem('iosReceipt', '');
                        cancelActiveSubscription();
                    }
                }).catch(function (err) {
                    // alert('WS ERR : ', JSON.stringify(err));
                });
            }
        }

        if(ionic.Platform.isAndroid()){
            inAppPurchase
                .restorePurchases()
                .then(function (purchases) {
                    var rece = JSON.parse(purchases[0].receipt);
                    if(rece.autoRenewing) {
                      $rootScope.subscriptionProduct={title:"GoPlanDo",
                        description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
                        price:undefined};
                    } else {
                      cancelActiveSubscription();
                    }
                }).catch(function (err) {
                    cancelActiveSubscription();
                });
        }
    }

    if(window.cordova){
    		$rootScope.initializeNotification = function (time){
      			var q = $q.defer();
      			try{
      				$rootScope.pushObj = PushNotification.init(pushService.initializedPushObj());
      			}catch(e){
      				 console.log("log error");
					 alert(JSON.stringify(e));
      			}

      			$rootScope.pushObj.on('notification', function(data) {
      				console.log(JSON.stringify(data));
      				pushService.onNotificationHandler(data)

				});

      			$rootScope.pushObj.on('registration', function(data){
					   
      				window.localStorage.setItem( 'device_uuid', data.registrationId );
      				$rootScope.notificationRegId = data.registrationId;
      				if(data.registrationId != null && data.registrationId != undefined){
      					pushService.initializeTokenAndSave(data, time).then(function(data){
							   q.resolve("success");
      					});
      				}
      			});
          	return q.promise;
        };

      		$rootScope.initializeNotification(4000).then(function(data){
      			console.log("success");
      		});
    }
	if(window.cordova){
    $rootScope.scheduleDelayedNotification = function (title, text, at, data) {
      $cordovaLocalNotification.schedule({
        id: Math.floor(100000 + Math.random() * 900),
        title: title,
        text: text,
        at: at,
        data: data
      }).then(function (result) {
        // ...
      });
    };

    $rootScope.scheduleDelayedNoti = function (title, text, at, data) {
      var now = new Date().getTime();
      var _10SecondsFromNow = new Date(now + at);
      $cordovaLocalNotification.schedule({
        id: Math.floor(100000 + Math.random() * 900),
        title: title,
        text: text,
        at: _10SecondsFromNow,
        data: data
      }).then(function (result) {
        // ...
      });
    };

    $rootScope.$on('$cordovaLocalNotification:trigger',
      function (event, notification, state) {
        var data = {};
        if(ionic.Platform.isIOS()){
            data = notification.data;
        }
        if(ionic.Platform.isAndroid()){
            try {
                data = JSON.parse(notification.data);
            } catch (e) {
                data = notification.data;
            }
        }
        var confirmPopup = $ionicPopup.confirm({
          title: 'Check-in with the Team?',
          template: 'Your available time for ' + data.name + ' project is scheduled to begin. Would you like to check-in with the team?'
        });
        confirmPopup.then(function (resConfirmed) {
          if (resConfirmed) {
            checkIn(data);
          }
        });
      });
        /*if(ionic.Platform.isIOS()){*/
            $rootScope.$on('$cordovaLocalNotification:click',
                function (event, notification, state) {
                    var data = {};
                    if(ionic.Platform.isIOS()){
                        data = notification.data;
                    }
                    if(ionic.Platform.isAndroid()){
                        try {
                            data = JSON.parse(notification.data);
                        } catch (e) {
                            data = notification.data;
                        }
                    }
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Check-in with the Team?',
                        template: 'Your available time for ' + data.name + ' project is beginning. Would you like to check-in with the team?'
                    });
                    confirmPopup.then(function (resConfirmed) {
                        if (resConfirmed) {
                            checkIn(data);
                        }
                    });
                });
        /*}*/
	}

	// fetch all the vsts team and check working time

    function flattenSchedule(sch) {
      var schedule = {"day":{"monday":false,"tuesday":false,"thursday":false,"friday":false,"wednesday":false,"saturday":false,"sunday":false}};
      for(var i = 0; i < sch.date.length; i++){
        var _date = new Date(sch.date[i].date);
        if(_date.getDay() === 0) {
          schedule.day.sunday = true;
          schedule.day.sundayTo = new Date(sch.date[i].to);
          schedule.day.sundayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 1) {
          schedule.day.mondayTo = new Date(sch.date[i].to);
          schedule.day.monday = true;
          schedule.day.mondayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 2) {
          schedule.day.tuesday = true;
          schedule.day.tuesdayTo = new Date(sch.date[i].to);
          schedule.day.tuesdayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 3) {
          schedule.day.wednesday = true;
          schedule.day.wednesdayTo = new Date(sch.date[i].to);
          schedule.day.wednesdayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 4) {
          schedule.day.thursday = true;
          schedule.day.thursdayTo = new Date(sch.date[i].to);
          schedule.day.thursdayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 5) {
          schedule.day.friday = true;
          schedule.day.fridayTo = new Date(sch.date[i].to);
          schedule.day.fridayFrom = new Date(sch.date[i].from);
        }
        if(_date.getDay() === 6) {
          schedule.day.saturday = true;
          schedule.day.saturdayTo = new Date(sch.date[i].to);
          schedule.day.saturdayFrom = new Date(sch.date[i].from);
        }
      }
      return schedule;
    }

      function getCurrentUser(projectID, cb) {
          Projects.getVSTSProjectCredentialsViaProjectID(parseInt(projectID))
              .then(function(res) {
                  CurrentVSTSUser.getCurrentVSTSUserByAreaPathNodeName(res.areaPathNodeName)
                      .then(function(resCurrentUser) {
                          if (resCurrentUser[0] !== undefined) {
                              var person = resCurrentUser[0].userName;
                              var memName = person.substring(person.indexOf("<") + 1, person.indexOf(">"));
                              cb(memName);
                          } else {
                              cb('');
                          }
                      });
              });
      }

      function checkIn(vstsTeam) {
          var chatObj = {
              msgType: 'txt',
              msg: vstsTeam.meName + ' is now online.',
              from: vstsTeam.me,
              fromName: vstsTeam.meName,
              imgUrl: vstsTeam.imgUrl,
              time: moment.now()
          };
          fireService.sendTeamMsg(vstsTeam.vstsProjectID, chatObj, function (succ, info) {
              console.log(succ, info);
              if(localStorage.getItem('checkin')) {
                  var chekinInfo = [];
                  chekinInfo = JSON.parse(localStorage.getItem('checkin'));
                  var found = false;
                  for(var i = 0;i < chekinInfo.length;i++){
                      if(chekinInfo[i].vstsProjectID === vstsTeam.vstsProjectID) {
                          console.log('info', JSON.stringify(info));
                          chekinInfo[i].date = moment.now();
                          found = true;
                      }
                  }
                  if(!found) {
                      chekinInfo.push({vstsProjectID: vstsTeam.vstsProjectID, date: moment.now()});
                  }
                  localStorage.setItem('checkin', JSON.stringify(chekinInfo));
              } else {
                  var arr = [];
                  arr.push({vstsProjectID: vstsTeam.vstsProjectID, date: moment.now()});
                  localStorage.setItem('checkin', JSON.stringify(arr));
              }

          });
      }

      $rootScope.checkFoWorkingTime = function(teamData, daysArr) {
          var _date = new Date();
          var currentHour = _date.getHours();
          var currentMin = _date.getMinutes();
          if(teamData && teamData.length > 0){
          teamData.forEach(function (vstsTeam, index) {
              daysArr.forEach(function (_day, idx) {
                  var _date = new Date(_day);
                  if(_date.getDay() === 0 && vstsTeam.datetime.day.sunday) {
                    var sunday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.sundayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.sundayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        sunday.set({hour:new Date(vstsTeam.datetime.day.sundayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.sundayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(sunday), vstsTeam);
                      }
                    } else {
                      sunday.set({hour:new Date(vstsTeam.datetime.day.sundayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.sundayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(sunday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 1 && vstsTeam.datetime.day.monday) {
                    var monday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.mondayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.mondayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        monday.set({hour:new Date(vstsTeam.datetime.day.mondayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.mondayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(monday), vstsTeam);
                      }
                    } else {
                      monday.set({hour:new Date(vstsTeam.datetime.day.mondayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.mondayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(monday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 2 && vstsTeam.datetime.day.tuesday) {
                    var tuesday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.tuesdayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.tuesdayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        tuesday.set({hour:new Date(vstsTeam.datetime.day.tuesdayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.tuesdayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(tuesday), vstsTeam);
                      }
                    } else {
                      tuesday.set({hour:new Date(vstsTeam.datetime.day.tuesdayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.tuesdayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(tuesday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 3 && vstsTeam.datetime.day.wednesday) {
                    var wednesday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.wednesdayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.wednesdayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        wednesday.set({hour:new Date(vstsTeam.datetime.day.wednesdayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.wednesdayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(wednesday), vstsTeam);
                      }
                    } else {
                      wednesday.set({hour:new Date(vstsTeam.datetime.day.wednesdayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.wednesdayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(wednesday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 4 && vstsTeam.datetime.day.thursday) {
                    var thursday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.thursdayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.thursdayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        thursday.set({hour:new Date(vstsTeam.datetime.day.thursdayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.thursdayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(thursday), vstsTeam);
                      }
                    } else {
                      thursday.set({hour:new Date(vstsTeam.datetime.day.thursdayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.thursdayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(thursday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 5 && vstsTeam.datetime.day.friday) {
                    var friday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.fridayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.fridayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        friday.set({hour:new Date(vstsTeam.datetime.day.fridayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.fridayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(friday), vstsTeam);
                      }
                    } else {
                      friday.set({hour:new Date(vstsTeam.datetime.day.fridayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.fridayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(friday), vstsTeam);
                    }
                  }
                  if(_date.getDay() === 6 && vstsTeam.datetime.day.saturday) {
                    var saturday = moment(_date);
                    if(moment().isSame(_date, 'd')) {
                      var start = moment.duration(currentHour + ':' + currentMin, "HH:mm");
                      var end = moment.duration(new Date(vstsTeam.datetime.day.saturdayFrom).getHours() + ':' + new Date(vstsTeam.datetime.day.saturdayFrom).getMinutes(), "HH:mm");
                      var diff = end.subtract(start);
                      console.log('diff', diff._milliseconds);
                      if(diff > 0) {
                        saturday.set({hour:new Date(vstsTeam.datetime.day.saturdayFrom).getHours(),
                          minute:new Date(vstsTeam.datetime.day.saturdayFrom).getMinutes(), second:0,millisecond:0});
                        $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(saturday), vstsTeam);
                      }
                    } else {
                      saturday.set({hour:new Date(vstsTeam.datetime.day.saturdayFrom).getHours(),
                        minute:new Date(vstsTeam.datetime.day.saturdayFrom).getMinutes(), second:0,millisecond:0});
                      $rootScope.scheduleDelayedNotification('Check-in', vstsTeam.name, new Date(saturday), vstsTeam);
                    }
                  }
              });
          });
        }
      }

    function getWorkingTimeInTeams() {
      var daysArr = [];
      var dayy = moment().startOf('day');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      dayy = dayy.clone().add(1, 'd');
      daysArr.push(dayy.toDate());
      var chekinInfo = [];
	    if(localStorage.getItem('checkin')) {
            chekinInfo = JSON.parse(localStorage.getItem('checkin'));
        }
        if(window.cordova && !$rootScope.internetDisconnected) {
            $cordovaLocalNotification.cancelAll().then(function (result) {
                VSTSTeams.allVSTSTeams().then(function(vstsTeams){
                    vstsTeams = underscore.uniq(vstsTeams, 'vstsProjectID');
                    vstsTeams.forEach(function (vstsTeam, index) {
                        getCurrentUser(vstsTeam.projectID, function (_me) {
                            var canProced = true;
                            if(canProced) {
                                fireService.getMembersByPID(vstsTeam.vstsProjectID, function (fireMembers) {
                                    fireMembers.forEach(function (tdata, index) {
                                        if(tdata.uniqueName == _me) {
                                            var teamData = [];
                                            teamData.push({
                                                name: vstsTeam.name,
                                                vstsProjectID: vstsTeam.vstsProjectID,
                                                vstsTeamID: vstsTeam.vstsTeamID,
                                                me: _me,
                                                meName: tdata.name,
                                                imgUrl: tdata.imgUrl,
                                                datetime: flattenSchedule(JSON.parse(tdata.datetime))
                                            });
                                            /*if(index === (fireMembers.length - 1)) {*/
                                                $rootScope.checkFoWorkingTime(teamData, daysArr);
                                            /*}*/
                                        }

                                    });
                                });
                            }
                        });
                    });
                });
            });
        }
    }
    // start of working time checkin method
    $timeout(function() {
        getWorkingTimeInTeams();
    }, 100);

	$rootScope.trgWrkDateTime = function () {
        getWorkingTimeInTeams();
    };

  });

}])
.run(['$ionicPlatform', '$cordovaDeeplinks', '$state', '$timeout','Projects','$rootScope', 'YesterdaySummaryService',
 function($ionicPlatform, $cordovaDeeplinks, $state, $timeout,Projects,$rootScope, YesterdaySummaryService) {
  $ionicPlatform.ready(function() {

    if(ionic.Platform.isAndroid()){
      $cordovaDeeplinks.route({
        '/goplando/tab/all/:vstsProjectID/:areaPathNodeName/:workItemID': {
          target: 'tab.deeplink',
          parent: 'tab.all'
        }
      }).subscribe(function(match) {
        goSearch(match);
      }, function(nomatch) {
        console.warn('No match', nomatch);
      });
    } else {
      $cordovaDeeplinks.route({
        '/all/:vstsProjectID/:areaPathNodeName/:workItemID': {
          target: 'tab.deeplink',
          parent: 'tab.all'
        }
      }).subscribe(function(match) {
        goSearch(match);
      }, function(nomatch) {
        console.warn('No match', nomatch);
      });
    }

    function goSearch(match) {
      console.log('match: ' + JSON.stringify(match));
      var project = {};
      project.vstsProjectID=match.$args.vstsProjectID;
      project.areaPathNodeName=match.$args.areaPathNodeName;

      Projects
        .getProjectsByVSTSProjectIDWorkItemIDAndAreaPathNodeName(project)
        .then(function(resolvedProject){
          if(resolvedProject.length > 0){
            var projectID = resolvedProject[0].id;
            $state
              .go('tab.all', {projectID:projectID})
              .then(function(){
                $rootScope.matchArg = match.$args;
                console.log('$rootScope.matchArg', JSON.stringify($rootScope.matchArg));
                // $rootScope.$emit("showCalendarUrlSearch", match.$args);
              });
          }
        });
    }

    YesterdaySummaryService.endOfDaySummaryReport(false, true);
    $timeout(function() {
        $rootScope.updateFocusProjectWhenAppLoad();
    }, 1000);

  });
}])
.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider', '$compileProvider', '$ionicFilterBarConfigProvider',
 function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $compileProvider,$ionicFilterBarConfigProvider) {
     var config = {
         apiKey: "AIzaSyCfYYsGz8qmU3e8qzM81nLW21PCG0-rN6w",
         authDomain: "scrum-soup.firebaseapp.com",
         databaseURL: "https://scrum-soup.firebaseio.com",
         projectId: "scrum-soup",
         storageBucket: "scrum-soup.appspot.com",
         messagingSenderId: "841097580189"
     };
     firebase.initializeApp(config);

  $ionicConfigProvider.tabs.position('bottom');
  $compileProvider.debugInfoEnabled(false);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })
  // Each tab has its own nav history stack:
  .state('tab.all', {
    url: '/all/:projectID',
    cache:false,
    resolve:{
      GoPlanDoMigrationDatabaseService:'GoPlanDoMigrationDatabaseService',
      initializeDb:['GoPlanDoMigrationDatabaseService', function(GoPlanDoMigrationDatabaseService){
         //return;
		 //service that does the actual db creation and update
         return GoPlanDoMigrationDatabaseService.migrate();
      }]
    },
    views: {
      'tab-all': {
        templateUrl: 'templates/tab-all.html',
         controller: 'WorkItemController'
      }
    }
  })
  // Each tab has its own nav history stack:
  .state('tab.deeplink', {
    url: '/all/:vstsProjectID/:areaPathNodeName/:workItemID',
    cache:false,
    views: {
      'tab-all': {
        templateUrl: 'templates/tab-all.html',
         controller: 'WorkItemController'
      }
    }
  })
  .state('tab.workitem-edit', {
    url: '/workitem/:workItemID/viewscope/:viewscope',
    cache: false,
    views: {
      'tab-all': {
        templateUrl: 'templates/work-item-detail.html',
         controller: 'WorkItemDetailsController'
      }
    }
  })
      .state('tab.workitem-hire', {
          url: '/projectID/:projectID/workItemID/:workItemID/postScreen/:postScreen/bucketID/:bucketID',
          cache: false,
          views: {
              'tab-all': {
                  templateUrl: 'templates/workitem-hire.html',
                  controller: 'WorkItemHireController'
              }
          }
      })
  .state('tab.team', {
      url: '/team',
      cache: false,
      views: {
        'tab-team': {
          templateUrl: 'templates/tab-team.html',
           controller: 'TeamController'
        }
      }
 }).state('tab.workitem-editt', {
      url: '/workitem/:workItemID/viewscope/:viewscope',
      cache: false,
      views: {
          'tab-team': {
              templateUrl: 'templates/work-item-detail.html',
              controller: 'WorkItemDetailsController'
          }
      }
  }).state('chat-room', {
      url: '/chatType/:chatType/pID/:pID/vstsPID/:vstsPID/memberID/:memberID/title/:title',
      cache: false,
      templateUrl: 'templates/chatRoom.html',
      controller: 'ChatRoomController'
  })
  .state('tab.team-details', {
      url: '/team/:teamMemberUniqueName/:teamMemberDisplayName/:teamMemberProjectID',
      cache: false,
      views: {
        'tab-team': {
          templateUrl: 'templates/tab-team-screen-details.html',
           controller: 'TeamController'
        }
      }
  }).state('tab.reports', {
      url: '/reports',
      views: {
        'tab-reports': {
          templateUrl: 'templates/tab-reports.html',
           controller: 'ReportsController'
        }
      }
  })

  .state('tab.reportsLeader', {
      url: '/reports/:projectID',
      views: {
        'tab-reports': {
          templateUrl: 'templates/tab-reports.html',
           controller: 'ReportsController'
        }
      }
  })

  .state('tab.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/tab-settings-menu.html',
        controller: 'SettingsController'
      }
    }
  })
  .state('tab.projectSettings', {
    url: '/settings/:viewscope',
    views: {
      'tab-settings': {
        templateUrl: 'templates/tab-settings.html',
	       controller: 'SettingsController'
      }
    }
  })
  .state('tab.about', {
    url: '/about',
    views: {
      'tab-settings': {
        templateUrl: 'templates/tab-about.html',
		    controller: 'AboutController'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/all/1');
  //search bar settings
  $ionicFilterBarConfigProvider.theme('stable');
  $ionicFilterBarConfigProvider.placeholder('Search Work Items');

}])
.config(['ngQuillConfigProvider', function (ngQuillConfigProvider) {
    ngQuillConfigProvider.set(null, null, '');
}])
.constant('SCRUMSOUP_API', {
   baseURL:"https://scrumsoup.herokuapp.com",
   triageURL: "https://scrumsoup.herokuapp.com/triage",
   push:"https://scrumsoup.herokuapp.com/push-notification-api",
   key:"YWl2YW50ZWNoOkdvUGxhbkRvQEFpdmFudGVjaA=="
})
.constant('HIRE_API', {
    baseURL:"http://40.68.247.197/api/v1",
    getToken: '/oauth/token',
    login:"/users/login",
    register:"/users/register",
    addGetProject:"/project_main",
    getSaveEditJob: "/projects",
    bids: "/bids",
    reviews: "/reviews",
    chat: "/app/messages"
})
.constant('CHECK_ENV', {
   runningInDevice:document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1
})
.constant('Prouction_ENV',{
   isProduction:false
});
