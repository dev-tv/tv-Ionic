// Ionic Starter App
// 171298
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

// Function loaded when the app is launched from URL
var handleOpenURL = function(url) {
  console.log("received url: " + url);
  window.localStorage.setItem("external_load", url)
};

var app = angular.module('starter', ['ionic','ionic-material', 'ionMdInput', 'ngMessages', 'ngCordova','ionic.rating',
                                      'ionMdInputLogin', 'numberFixedLenFilter', 'btford.socket-io','ngPatternRestrict' ])

  .run(function($ionicPlatform, gcm, BackgroundGeolocationService, SecureStorageService,  $rootScope, $state, SecuredPopups,
                $location, Translation, AuthService, TERMS, CONTACTPHONE) {
    $ionicPlatform.ready(function() {
      //last visited state
      $rootScope.lastState='exit';
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }

      if(window.StatusBar) {
        StatusBar.styleDefault();
      }

      BackgroundGeolocationService.initialize();

      SecureStorageService.initialize();

      gcm.initialize(); // Initialize the listener to GCM when close and reopen the APP

      // Get the url from external load
      if (typeof window.localStorage.getItem("external_load") !== "undefined"){
        //$location.path('/app/mark_routes_tele');
        console.log("external_load url: " + window.localStorage.getItem("external_load"));
      }

      function goToMainView(){
        if (AuthService.isUserAuthenticated()) {
          switch (AuthService.getUserData().user_role) {
            case 'passenger':
              $location.path("/app/map");
              break;
            case 'telephonist':
              $location.path('/app/mark_routes_tele');
              break;
            default:
              $location.path("/app/profile");
          }
        }else{
          $location.path("/login");
        }
      }

      // Get the translation
      // ===================
      Translation.initialize()
        .then(function(){
          goToMainView();
        });
    });

    /*document.addEventListener('deviceready', function () {
      // cordova.plugins.backgroundMode is now available

      console.log('deviceready is called !!!');
      cordova.plugins.backgroundMode.enable();
      console.log('backgroundMode is active >>>> ',cordova.plugins.backgroundMode.isActive());

      cordova.plugins.backgroundMode.overrideBackButton();
      cordova.plugins.backgroundMode.excludeFromTaskList(); //Exclude the app from the recent task list

      /!*cordova.plugins.backgroundMode.on('activate', function() {
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
        console.log('activate is called !!!');
      });*!/
    }, false);*/

    $rootScope.goBackState = function() {
      // console.log($rootScope.lastState);
      if($rootScope.lastState=='exit'){
        $rootScope.winPopup = SecuredPopups.show('confirm', {
          title: '¿Desea salir?',
          template: 'Desea salir de la aplicación',
          okText: $rootScope.i18nStrings.notifications.OK,
          cancelText: $rootScope.i18nStrings.availableDrivers.cancelRequestAlertCancel
        });
        $rootScope.winPopup.then(function (res) {
          if (res) {
            navigator.app.exitApp();
          }

        });

      }else if ($rootScope.lastState instanceof Function) {
        $rootScope.lastState();
      }else if($rootScope.lastState=='blockBack'){
        $rootScope.winPopup = SecuredPopups.show('alert', {
          title: 'Aviso',
          template:  'No puedes regresar mientras estas durante un proceso viaje',
          okText: $rootScope.i18nStrings.notifications.OK
        });
      }
      else{
        $state.go($rootScope.lastState);

        if($rootScope.lastState=='login'){
          $rootScope.lastState='exit';
        }
      }
    };

    $ionicPlatform.registerBackButtonAction(function(event) {
      event.preventDefault();

      $rootScope.goBackState();
    }, 101);

    // Assign TERMS new service to rootScope for a global variable
    $rootScope.termsLink = TERMS.link;
    $rootScope.termsShow = TERMS.show;
    // Assign CONTACTPHONE new service to rootScope for a global variable
    $rootScope.phoneShow = CONTACTPHONE.show;

    $rootScope.goToTermsLink= function () {
      console.log($rootScope.termsLink);
      window.open($rootScope.termsLink,'_system');
    };

    //TODO: get if device to set in config global the platform
    //var currentPlatform = ionic.Platform.device();
    //console.log('plataforma: ', currentPlatform);

  })


.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, USER_ROLES, $httpProvider) {

    // Turn off caching for demo simplicity's sake
    $ionicConfigProvider.views.maxCache(0);

    $stateProvider

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })

      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'SessionsCtrl',
        data: {
            authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('sign_up', {
        url: '/sign_up',
        templateUrl: 'templates/sign_up.html',
        controller: 'SessionsCtrl',
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('forgot_password', {
        url: '/forgot_password',
        templateUrl: 'templates/forgot_password.html',
        controller: 'SessionsCtrl',
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.profile', {
        url: '/profile',
        views: {
          'menuContent': {
              templateUrl: 'templates/profile.html',
              controller: 'ProfileCtrl'
          },
          'fabContent': {
            templateUrl: 'templates/btn_service.html',
            controller: 'BtnServiceCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.passenger, USER_ROLES.taxi_driver, USER_ROLES.telephonist]
        }
      })

      .state('app.profile_edit', {
        url: '/profile_edit',
        cache: true,
        views: {
          'menuContent': {
            templateUrl: 'templates/profile_edit.html',
            controller: 'ProfileEditCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.payment_edit', {
        url: '/payment_edit',
        cache: true,
        views: {
          'menuContent': {
            templateUrl: 'templates/payment_edit.html',
            controller: 'PaymentEditCtrl'
          }
        },
        data: {
          authorizedRoles:[USER_ROLES.passenger]
        }
      })

      .state('app.new_credit_card', {
        url: '/new_credit_card',
        cache: true,
        views: {
          'menuContent': {
            templateUrl: 'templates/new_credit_card.html',
            controller: 'NewCreditCardCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.passenger]
        }
      })

      .state('app.add_funds', {
        url: '/add_funds',
        cache: true,
        views: {
          'menuContent': {
            templateUrl: 'templates/add_funds.html',
            controller: 'AddFundsCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.passenger]
        }
      })

      .state('app.password_edit', {
        url: '/password_edit',
        views: {
          'menuContent': {
            templateUrl: 'templates/password_edit.html',
            controller: 'PasswordEditCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.map', {
        url: '/map',
        views: {
          'menuContent': {
            templateUrl: 'templates/map.html',
            controller: 'MapCtrl'
          },
          'fabContent': {
            template: '',
            controller: function ($timeout) {

            }
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.available_drivers', {
        url: '/available_drivers',
        views: {
          'menuContent': {
            templateUrl: 'templates/available_drivers.html',
            controller: 'AvailableDriversCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.passenger]
        }
      })

      .state('app.rating_driver', {
        url: '/rating_driver',
        views: {
          'menuContent': {
            templateUrl: 'templates/rating_driver.html',
            controller: 'RatingDriverCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.rating', {
        url: '/rating',
        views: {
          'menuContent': {
            templateUrl: 'templates/rating.html',
            controller: 'RatingCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.ride_request', {
        url: '/ride_request',
        views: {
          'menuContent': {
            templateUrl: 'templates/ride_request.html',
            controller: 'RideRequestCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.wait_on_arrival', {
        url: '/wait_on_arrival',
        views: {
          'menuContent': {
            templateUrl: 'templates/wait_on_arrival.html',
            controller: 'WaitOnArrivalCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.taxi_driver]
        }
      })

      .state('app.rating_feedback', {
        url: '/rating_feedback',
        views: {
          'menuContent': {
            templateUrl: 'templates/rating_feedback.html',
            controller: 'RatingFeedbackCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.rating_driver_feedback', {
        url: '/rating_driver_feedback',
        views: {
          'menuContent': {
            templateUrl: 'templates/rating_driver_feedback.html',
            controller: 'RatingDriverFeedbackCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })
      .state('app.mark_routes', {
        url: '/mark_routes',
        views: {
          'menuContent': {
            templateUrl: 'templates/mark_routes.html',
            controller: 'MarkRoutesCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.passenger]
        }
      })

      .state('app.mapped_points', {
        url: '/mapped_points',
        views: {
          'menuContent': {
            templateUrl: 'templates/mapped_points.html',
            controller: 'MappedPointsCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.mapped_points_driver', {
        url: '/mapped_points_driver',
        views: {
          'menuContent': {
            templateUrl: 'templates/mapped_points_driver.html',
            controller: 'MappedPointsDriverCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.mark_routes_tele', {
        url: '/mark_routes_tele',
        views: {
          'menuContent': {
            templateUrl: 'templates/telephonist/mark_routes_tele.html',
            controller: 'MarkRoutesTeleCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.telephonist]
        }
      })

      .state('app.service_history', {
        url: '/service_history',
        views: {
          'menuContent': {
            templateUrl: 'templates/service_history.html',
            controller: 'ServiceHistoryCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.all]
        }
      })

      .state('app.select_driver', {
        url: '/select_driver',
        views: {
          'menuContent': {
            templateUrl: 'templates/telephonist/select_driver.html',
            controller: 'SelectDriverCtrl'
          },
          'fabContent': {
            template: '<button id="fab-drivers" class="button button-fab button-fab-top-left expanded button-assertive spin fab-service" ng-click="request_automatic_driver()" ng-if="true" style="opacity: 1;"><i class="icon ion-wand"></i></button>',
            controller: function ($timeout) {
              $timeout(function () {
                document.getElementById('fab-drivers').classList.toggle('on');
              }, 900);
            }
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.telephonist]
        }
      })

      .state('app.income', {
        url: '/income',
        views: {
          'menuContent': {
            templateUrl: 'templates/driver/income.html',
            controller: 'IncomeCtrl'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.taxi_driver]
        }
      })

      .state('app.report_accidents', {
        url: '/report_accidents',
        views: {
          'menuContent': {
            templateUrl: 'templates/driver/report_accidents.html',
            controller: 'ReportAccidents'
          }
        },
        data: {
          authorizedRoles: [USER_ROLES.taxi_driver]
        }
      });

    });
