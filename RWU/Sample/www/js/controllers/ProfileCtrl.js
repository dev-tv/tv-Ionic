/**
 * Created on 09/07/15.
 * Profile Controller
 */

app.controller('ProfileCtrl', function($scope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk, API, Msgs,
                                         API_CONFIG, $rootScope, $state, AuthService, USER_ROLES, SecuredPopups,$ionicPopup,
                                         $cordovaGeolocation, CheckVersionService, $window, BackgroundGeolocationService) {
  // Set Header
  $scope.$parent.showHeader();
  $scope.$parent.clearFabs();
  $scope.isExpanded = false;
  $scope.$parent.setExpanded(false);
  $scope.$parent.setHeaderFab(false);
  $scope.available_driver = false;

  //Variable bool que muestra o esconde el boton de menu

  $rootScope.menuToggleBtn = true;

  //Check if a ride is pending
       if(($window.localStorage['state'] == 'RideRequest') || ($window.localStorage['state'] == 'WaitOnArrivalCtrl')){
         Msgs.show('Existe un viaje en proceso, estamos cargando la información...', 2500);
         $rootScope.dataServiceRequest = JSON.parse($window.localStorage['dataServiceRequest']);
         $state.go('app.ride_request');
        }
  //Reset ride, because when a telephonist is in "select_driver" she can to go to profile
  $rootScope.reset_ride();
  $rootScope.resetPassenger();

  //Role label
  (AuthService.getUserRole() === 'taxi_driver')? $scope.roleLbl = $rootScope.i18nStrings.signUp.driver : $scope.roleLbl = $rootScope.i18nStrings.signUp.user;

  console.log('entrando a profile');

  $scope.isTaxidriver = (AuthService.getUserRole() == 'taxi_driver');

  $scope.document = {
    driverLicenseImg: '../www/img/header.png',
    vehicleRegistrationImg: '../www/img/header.png',
    vehicleInsuranceImg: '../www/img/header.png',
    vehicleInspectionImg: '../www/img/header.png'
  };


  $rootScope.user = {
    email: '',
    name: '',
    lastname: '',
    phone: '',
    username: $window.localStorage.getItem('user_name'),
    address: '',
    role: '',
    department: '',
    company: '',
    avatar: 'img/user.png',

    driver_attributes: {
      car_model: '',
      car_brand: '',
      car_plates: '',
      t_number: '',

      license_number: '',
      driving_tickets: 'true',
      motor_number: '',
      chasis_number: '',
      vehicle_status: '',
      documents_attributes: {
        0: {
          expire_date: '',
          doc_type: 'Insurance',
          file: ''
        },
        1: {
          expire_date: '',
          doc_type: 'License',
          file: ''
        },
        2: {
          expire_date: '',
          doc_type: 'Vehicle Registration',
          file: ''
        },
        3: {
          expire_date: '',
          doc_type: 'Vehicle Inspection',
          file: ''
        }
      }
    }
  };

  CheckVersionService.initialize();
  function ifDriver(){
    $rootScope.lastState='exit';
    window.plugins.insomnia.keepAwake();
    // =================================================
    // Variable para contabilizar la distancia recorrida en tres estados del conductor en backend, se envia en API.updateDriversPosition
    // mientras esta sin un viaje y disponible (stage 1)
    // mientras esta en un viaje y buscando al pasajero (stage 2)
    // y mientras esta en un viaje y yendo al destino (stage 3)

    $rootScope.processStage = 1;
    BackgroundGeolocationService.set_stage(1);
    // =================================================

    $timeout(function() {
      app.bgGeo.changePace(true);
    }, 1000 * 5);
  }
    // Get de profile data
    // ===================
    API.getProfile()
        .then(function(response) {

          //console.log('get profile response >>> ',JSON.stringify(response));
          (response.data.role==='taxi_driver') ? ifDriver() : $rootScope.lastState = 'app.map';

          Msgs.close();
           var avatar = (response.data.avatar !== null) ? (API_CONFIG.url_base + response.data.avatar) : 'img/user.png';

          $rootScope.user.name=response.data.name;
          $rootScope.user.lastname=response.data.lastname;
          $rootScope.user.phone= response.data.phone;
          $rootScope.user.email= response.data.email;
          $rootScope.user.address= response.data.address;
          $rootScope.user.avatar= avatar;
          $rootScope.user.role= response.data.role;
          $rootScope.user.department= response.data.department;
          $rootScope.user.company= response.data.company;

          if(response.data.drivers){
            $rootScope.user.driver_attributes.car_model= response.data.drivers.car_model;
            $rootScope.user.driver_attributes.car_brand= response.data.drivers.car_brand;
            $rootScope.user.driver_attributes.car_plates= response.data.drivers.car_plates;
            $rootScope.user.driver_attributes.t_number= response.data.drivers.t_number;

            $rootScope.user.driver_attributes.chasis_number= response.data.drivers.chasis_number;
            $rootScope.user.driver_attributes.license_number= response.data.drivers.license_number;
            $rootScope.user.driver_attributes.motor_number = response.data.drivers.motor_number;
            $rootScope.user.driver_attributes.vehicle_status = response.data.drivers.vehicle_status;

            if(response.data.drivers.documents["0"]){
              $rootScope.user.driver_attributes.documents_attributes["0"].expire_date = response.data.drivers.documents["0"].expire_date;
              var vehicleInsurance = document.getElementById('vehicleRegistration');
              vehicleInsurance.style.backgroundImage = "url('"+API_CONFIG.url_base + response.data.drivers.documents["0"].file.url+"')";
              $rootScope.user.driver_attributes.documents_attributes["0"].file = API_CONFIG.url_base + response.data.drivers.documents["0"].file.url;
            }

            if(response.data.drivers.documents["1"]){
              $rootScope.user.driver_attributes.documents_attributes["1"].expire_date = response.data.drivers.documents["1"].expire_date;
              var driverlicense = document.getElementById('vehicleInsurance');
              driverlicense.style.backgroundImage = "url('"+API_CONFIG.url_base + response.data.drivers.documents["1"].file.url+"')";
              $rootScope.user.driver_attributes.documents_attributes["1"].file = API_CONFIG.url_base + response.data.drivers.documents["1"].file.url;
            }

            if(response.data.drivers.documents["2"]){
              $rootScope.user.driver_attributes.documents_attributes["2"].expire_date = response.data.drivers.documents["2"].expire_date;
              var vehicleRegistration = document.getElementById('driverlicense');
              vehicleRegistration.style.backgroundImage = "url('"+API_CONFIG.url_base + response.data.drivers.documents["2"].file.url+"')";
              $rootScope.user.driver_attributes.documents_attributes["2"].file = API_CONFIG.url_base + response.data.drivers.documents["2"].file.url;
            }

            if(response.data.drivers.documents["3"]){
              $rootScope.user.driver_attributes.documents_attributes["3"].expire_date = response.data.drivers.documents["3"].expire_date;
              var vehicleInspection = document.getElementById('vehicleInspection');
              vehicleInspection.style.backgroundImage = "url('"+API_CONFIG.url_base + response.data.drivers.documents["3"].file.url+"')";
              $rootScope.user.driver_attributes.documents_attributes["3"].file = API_CONFIG.url_base + response.data.drivers.documents["3"].file.url;
            }
          }


          console.log('user will be >> ',$rootScope.user);

         // set_position_driver();

          $scope.available_driver = response.data.available_driver;

        }, function(response) {
            Msgs.show();
        });



//commented code

  // Set the position driver
  // =======================
  /*function set_position_driver() {
    if(AuthService.getUserRole() == 'taxi_driver') {

      var watchOptions = {
        timeout : 1000 * 10,
        enableHighAccuracy: false // may cause errors if true
      };

      if (!$rootScope.current_pos_driver) {
        (function get_current_pos_driver() {
          $rootScope.current_pos_driver = $cordovaGeolocation.watchPosition(watchOptions);

          $rootScope.current_pos_driver.then(
            null,
            function (err) {
              // error
              //Msgs.show(err, 1000);
              console.log(err);

              // It runs again the method
              setTimeout(get_current_pos_driver, 1000);
            },
            function (position) {
              $rootScope.cab_lat = position.coords.latitude;
              $rootScope.cab_lng = position.coords.longitude;

              API.updateDriversPosition($rootScope.cab_lat, $rootScope.cab_lng, $rootScope.ride_id, $rootScope.processStage)
                .then(function (info) {
                  //console.log(info);
                  console.log("Lat Inicial:" + $rootScope.cab_lat + ' stage'+ $rootScope.processStage);
                  console.log("Lng Inicial:", $rootScope.cab_lng);
                });
            });
        })();
      }
     }
  }
*/

    // Link to profile edit
    // =====================
    $scope.link_to_profile_edit = function () {
        $state.go('app.profile_edit');
    };

    // Link to password edit
    // =====================
    $scope.link_to_password_edit = function () {
        $state.go('app.password_edit');
    };

    // Set Motion
    $timeout(function () {
        ionicMaterialMotion.slideUp({
            selector: '.slide-up'
        });
    }, 0);

    //ionicMaterialMotion.ripple();

    $timeout(function() {
        ionicMaterialMotion.fadeSlideInRight({
            startVelocity: 3000
        });
    }, 700);

    //// Set Ink
    ionicMaterialInk.displayEffect();

    // Change the driver's status
    // ==========================
    $rootScope.changeStatusDriver = function () {
        $rootScope.winPopup = SecuredPopups.show('confirm', {
            title: $rootScope.i18nStrings.profile.driverStatusChangeTitle,
            template: $rootScope.i18nStrings.profile.driverStatusChangeTpl,
            okText: $rootScope.i18nStrings.profile.driverStatusChangeOK,
            cancelText: $rootScope.i18nStrings.profile.driverStatusChangeCancel
        });

        $rootScope.winPopup.then(function(res) {
            if (res) {
                // Verificar primero a través del boton si se coloca en ocupado o disponible
                API.updateStatusDriver(!$scope.available_driver)
                    .then(function (response) {
                        $scope.available_driver = !$scope.available_driver;
                        Msgs.show($rootScope.i18nStrings.profile.driverStatusChangeSuccess);
                    }, function (response) {
                        Msgs.show();
                    });
            }
        });
    };

    // Return true if user is driver
    // =============================
    $scope.isDriver = function(){
        return (AuthService.isAuthorized([USER_ROLES.taxi_driver]));
    };

    // Assign a class depending of driver's status
    // ===========================================
    $scope.classStatusDriver = function () {
        return $scope.available_driver ? 'status-available' : 'status-busy';
    };


  $rootScope.check_new_service = function() {

    if(AuthService.getUserRole() == 'passenger') {
      $state.go('app.map');
    } else if(AuthService.getUserRole() == 'telephonist'){
      $state.go('app.mark_routes_tele');
    }else{
      return false;
    }
  };

  $scope.openImageModal = function(value) {

    switch (value){
      case 'Driver license': $scope.shownImage = $rootScope.user.driver_attributes.documents_attributes["2"].file;
        break;
      case 'Vehicle registration': $scope.shownImage = $rootScope.user.driver_attributes.documents_attributes["0"].file;
        break;
      case 'Vehicle insurance': $scope.shownImage = $rootScope.user.driver_attributes.documents_attributes["1"].file;
        break;
      case 'Vehicle Inspection': $scope.shownImage = $rootScope.user.driver_attributes.documents_attributes["3"].file;
        break;
      default:
        break;
    }


    $ionicPopup.show({
      template: "<style>.popup { width:100% !important; }</style><img style='width: 100%;height: 100%' src='{{shownImage}}'>",
      title: value,
      scope: $scope,
      buttons: [
        { text: $rootScope.i18nStrings.profile.driverStatusChangeCancel,
          type: 'button-positive'
        }
      ]
    });

  };

});
