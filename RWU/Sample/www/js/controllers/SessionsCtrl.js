/**
 * Created on 09/07/15.
 * Login Controller
 */

app.controller('SessionsCtrl', function($scope, $timeout, $stateParams, ionicMaterialInk, API, Msgs, $location, AuthService,$ionicActionSheet,$cordovaCamera,SecuredPopups,
                                        CURRENCY,$window, $state, $rootScope, $cordovaGeolocation, gcm, PLATFORM, socket, BackgroundGeolocationService,$ionicScrollDelegate) {

  console.log('entrando a sessions');

  $scope.isDriverNextPage = false;

  $scope.credentials = {
    email: '',
    password: ''
  };

  $scope.setLastStatetoLogin = function () {
    $rootScope.lastState='login';

  };

  /*set max date +10 years*/
  function add_years(dt,n)
  {
    return new Date(dt.setFullYear(dt.getFullYear() + n));
  }
  var newDate = '',month ,date;
  newDate = new Date(add_years(new Date(), 10).toString());
  month = newDate.getMonth()+1
  date = newDate.getDate();
  if((newDate.getMonth()+1)<10){
    month = '0'+newDate.getMonth()+1;
  }
  if(newDate.getDate()<10){
    date = '0'+newDate.getDate();
  }
  //console.log('>>>>>>>>>>>>>>>>',newDate.getFullYear()+'-'+month+'-'+date);
  $scope.maxDate=newDate.getFullYear()+'-'+month+'-'+date;


  /*ENDS HERE*/

  $scope.login = function () {
    $scope.credentials.platform_logged = PLATFORM;
    $scope.credentials.email=$scope.credentials.email.toLowerCase();

    /* Correct conection to api (When the API is working)*/
    API.login($scope.credentials)
      .then(function(response) {
        console.log('login response: ', response);
        AuthService.setUserAuthenticated(response.data.api_token, response.data.role, response.data.user_name, response.data.user_id);

        socket.connect();

        gcm.initialize();

        $scope.go_home(response.data.role);

        BackgroundGeolocationService.initialize();

        Msgs.show($rootScope.i18nStrings.sessions.successLogin);

      }, function(response) {
        if (response.status === 401) {
          Msgs.show($rootScope.i18nStrings.sessions.userNotAuthorized);
        }else{
          Msgs.show($rootScope.i18nStrings.sessions.incorrectData);
        }
      });
    /*$scope.go_home('taxi_driver');*/
    /* -------------------- */
  };

  // Object for sign up data
  // =======================
  $scope.register = {
    name: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: ''
  };



  $scope.document = {
    driverLicenseImg: '../www/img/header.png',
    vehicleRegistrationImg: '../www/img/header.png',
    vehicleInsuranceImg: '../www/img/header.png',
    vehicleInspectionImg: '../www/img/header.png'
  };

  $scope.user = {
    email: '',
    name: '',
    lastname: '',
    phone: '',
    username:'',
    password: '',
    password_confirmation: '',
    address: '',
    role_type:'taxi_driver',
    avatar: '',

    driver_attributes:{
      car_model:'',
      car_brand:'',
      car_plates:'',
      t_number:'',

      license_number:'',
      driving_tickets:'true',
      motor_number:'',
      chasis_number:'',
      vehicle_status:'',
      documents_attributes:{
        0:{
          expire_date:'',
          doc_type:'Insurance',
          file:''
        },
        1:{
          expire_date:'',
          doc_type:'License',
          file:''
        },
        2:{
          expire_date:'',
          doc_type:'Vehicle Registration',
          file:''
        },
        3:{
          expire_date:'',
          doc_type:'Vehicle Inspection',
          file:''
        },
      }
    }/*,
    company_id: '',
    department_id: '',
    identificationNumber: ''*/
  };

  $scope.signUpAsDriver='user';
  $scope.isSignUpAsDriver=false;

  /* -------------------------------------------------- */
  // country
  // =======

  API.geoCountryRegister()
    .then (function(response) {
      console.log('geoCountryRegister >>>response >> ',response.data[0].country_code);

      var country = response.data[0].country_code;
      if(country == 'PE' || country == 'pe'){
        CURRENCY = 'S/.';
      }
      //console.log('after >>> geoCountryRegister >>>',CURRENCY);

      if(country == ""){
        var posOptions = {timeout: 10000, enableHighAccuracy: false};
        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
            $scope.lat  = position.coords.latitude;
            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({'latLng': latlng}, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                if(results[0]) {
                  for(var i = 0; i < results[0].address_components.length; i++) {
                    if(results[0].address_components[i].types[0] == "country") {
                      $scope.countrycode = results[0].address_components[i].short_name;
                    }
                  }
                }
              }
            });
          }, function(err) {
            // error
          });
      }else{
        $scope.countrycode = country;
      }
    });


  // Sign up
  // =======
  /*$scope.sign_up = function() {
    $scope.go_home('telephonist');
  }*/


  $scope.goBack = function() {
    ($scope.isDriverNextPage)?$scope.isDriverNextPage=false:$location.path("/login");
  };

  $scope.nextPage = function() {

    $scope.user.email=$scope.user.email.toLowerCase();
    if (!$scope.user.name || !$scope.user.lastname || !$scope.user.email || !$scope.user.username
      || !$scope.user.password || !$scope.user.password_confirmation|| !$scope.user.phone || !$scope.user.driver_attributes.car_plates || !$scope.user.driver_attributes.car_model
      || !$scope.user.driver_attributes.car_brand || !$scope.user.driver_attributes.t_number  || !$scope.user.driver_attributes.vehicle_status) {
      Msgs.show($rootScope.i18nStrings.sessions.errorOne);
      return false;
    }

    if ($scope.user.name.length > 255 || !$scope.user.lastname.length > 255 || !$scope.user.email.length > 255
      || !$scope.user.username.length > 255 || !$scope.user.phone.length > 255) {
      Msgs.show($rootScope.i18nStrings.sessions.errorTwo, 3000);
      return false;
    }

    if ($scope.user.password.length < 9 || $scope.user.password_confirmation.length < 9) {
      Msgs.show($rootScope.i18nStrings.sessions.errorThree, 3000);
      return false;
    }

    if ($scope.user.password.length > 20 || $scope.user.password_confirmation.length > 20) {
      Msgs.show($rootScope.i18nStrings.sessions.errorFour, 3000);
      return false;
    }

    if ($scope.user.password !== $scope.user.password_confirmation) {
      Msgs.show($rootScope.i18nStrings.sessions.errorFive, 3000);
      return false;
    }

    if ($scope.user.driver_attributes.vehicle_status < 1 || $scope.user.driver_attributes.vehicle_status > 5) {
      Msgs.show($rootScope.i18nStrings.sessions.errorEight, 3000);
      return false;
    }

    API.formatPhoneRegister($scope.user.phone, $scope.countrycode)
      .then(function(response1){
        console.log(response1.data[0]['phone']);
        if(response1.data[0]['phone'] != false) {
          $scope.user.phone = response1.data[0]['phone'];

          $scope.isDriverNextPage=true;
          $ionicScrollDelegate.scrollTop();

        }else {
          Msgs.show($scope.register.phone + $rootScope.i18nStrings.sessions.notValidPhone);
          return false;
        }
      });
  };


  $scope.registerUser = function () {
    console.log('registerUser >>> ',!$scope.register.lastname);
    $scope.register.email=$scope.register.email.toLowerCase();
    if (!$scope.register.name || !$scope.register.lastname || !$scope.register.email || !$scope.register.username
      || !$scope.register.password || !$scope.register.password_confirmation|| !$scope.register.phone ) {
      Msgs.show($rootScope.i18nStrings.sessions.errorOne);
      return false;
    }

    if ($scope.register.name.length > 255 || !$scope.register.lastname.length > 255 || !$scope.register.email.length > 255
      || !$scope.register.username.length > 255 || !$scope.register.phone.length > 255) {
      Msgs.show($rootScope.i18nStrings.sessions.errorTwo, 3000);
      return false;
    }

    if ($scope.register.password.length < 9 || $scope.register.password_confirmation.length < 9) {
      Msgs.show($rootScope.i18nStrings.sessions.errorThree, 3000);
      return false;
    }

    if ($scope.register.password.length > 20 || $scope.register.password_confirmation.length > 20) {
      Msgs.show($rootScope.i18nStrings.sessions.errorFour, 3000);
      return false;
    }

    if ($scope.register.password !== $scope.register.password_confirmation) {
      Msgs.show($rootScope.i18nStrings.sessions.errorFive, 3000);
      return false;
    }

    $scope.register.platform_logged = PLATFORM;

    API.formatPhoneRegister($scope.register.phone, $scope.countrycode)
      .then(function(response1){
        console.log(response1.data[0]['phone']);
        if(response1.data[0]['phone'] != false) {
          $scope.register.phone = response1.data[0]['phone'];
          API.signup($scope.register)
            .then(function(response) {
              console.log('response >>>>>> ',response);
              console.log('response.data.role >>>>>> ',response.data.role);
              AuthService.setUserAuthenticated(response.data.api_token, response.data.role, response.data.user_name, response.data.user_id);
              //socket.connect();
              gcm.initialize();

              $scope.go_home(response.data.role);

              Msgs.show($rootScope.i18nStrings.sessions.successfulRegistration);

            }, function(response) {
              if (response.status === 422) {
                Msgs.show($rootScope.i18nStrings.sessions.failedRegistration);
              }else{
                Msgs.show();
              }
            });
        }else {
          Msgs.show($scope.register.phone + $rootScope.i18nStrings.sessions.notValidPhone);
          return false;
        }
      });
  };

  $scope.registerDriver = function (isNext) {

    if(isNext){
      if(($scope.user.driver_attributes.documents_attributes["0"].file ==='')||($scope.user.driver_attributes.documents_attributes["1"].file ==='')
        || ($scope.user.driver_attributes.documents_attributes["2"].file ==='')|| ($scope.user.driver_attributes.documents_attributes["3"].file ==='')){
        Msgs.show($rootScope.i18nStrings.sessions.errorNine, 3000);
        return false;
      }
    }

    //console.log('registerDriver !!!! $scope.user >>> ',$scope.user);
    API.createUser($scope.user)
      .then(function(response) {
        console.log('createUser >>> response >>>>>> ',response);

        if(response.data || response.data !== null) {

          if(response.data.api_token && response.data.role && response.data.user_name && response.data.user_id){
            AuthService.setUserAuthenticated(response.data.api_token, response.data.role, response.data.user_name, response.data.user_id);
            //socket.connect();
            gcm.initialize();

            /*$scope.go_home(response.data.role);
              Msgs.show($rootScope.i18nStrings.sessions.successfulRegistration);*/

            //=================================
            //show alert for document recieve and notify to driver after signup
            Msgs.close();
            var text = $rootScope.i18nStrings.sessions.documentText;
            if(!isNext){
              text = 'Documents can be uploaded from profile screen';
            }
            $rootScope.winPopup = SecuredPopups.show('alert', {
              title: $rootScope.i18nStrings.sessions.titleSuccessSignUp,
              template: text,
              okText: $rootScope.i18nStrings.notifications.OK
            });
            $rootScope.winPopup.then(function (res) {
              $scope.go_home(response.data.role);
              Msgs.show($rootScope.i18nStrings.sessions.successfulRegistration);
            });

            //==================================
          }else {
            if(response.data[0]){
              Msgs.close();
              Msgs.show(response.data[0]);
            }else {
              Msgs.close();
              Msgs.show($rootScope.i18nStrings.sessions.errorTen, 3000);
            }
          }

        }else {
          Msgs.close();
          Msgs.show($rootScope.i18nStrings.sessions.errorTen, 3000);
        }

      }, function(response) {
        if (response.status === 422) {
          Msgs.show($rootScope.i18nStrings.sessions.failedRegistration);
        }else{
          Msgs.show();
        }
      });
  };

  // Object for reset data
  // =====================
  $scope.reset_form = {
    email: ''
  };

  // Reset password
  // ==============
  $scope.reset_password = function() {
    if ( !$scope.reset_form.email ) {
      Msgs.show($rootScope.i18nStrings.sessions.errorSix);
      return false;
    }

    API.reset_password($scope.reset_form)
      .then(function(response) {
        $state.go('login');
        Msgs.show($rootScope.i18nStrings.sessions.restorePass, 4000)
      }, function(response) {
        console.log(response);
        if (response.status === 422) {
          Msgs.show($rootScope.i18nStrings.sessions.errorSeven);
        }else{
          Msgs.show();
        }
      });
  };

  $scope.showSelectDriverValue = function (mySelect) {
    //console.log('showSelectDriverValue >>>mySelect >> ',mySelect,'$scope.signUpAsDriver>>>',$scope.signUpAsDriver);
    $scope.signUpAsDriver=mySelect;
    if($scope.signUpAsDriver == 'driver'){
      $scope.isSignUpAsDriver=true;
    }else {
      $scope.isSignUpAsDriver=false;
    }
  };


  $scope.go_home = function (user_role) {
    //console.log(user_role);
    switch (user_role) {
      case 'taxi_driver':
        $location.path('/app/profile');
        break;
      case 'telephonist':
        $location.path('/app/mark_routes_tele');
        break;
      default:
        $rootScope.setPassengerLocationMode = false;
        $location.path('/app/map');
    }
  };

  $scope.showSelectValue = function (mySelect) {
    $scope.user.driver_attributes.driving_tickets=mySelect;
  };

  ionicMaterialInk.displayEffect();


  $scope.selectorImage = function (value) {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        {text: $rootScope.i18nStrings.profileEdit.takePic},
        {text: $rootScope.i18nStrings.profileEdit.pickFromGallery}
      ],
      //destructiveText: 'Delete',
      titleText: $rootScope.i18nStrings.profileEdit.loadImg,
      cancelText: $rootScope.i18nStrings.profileEdit.loadImgCancel,
      cancel: function () {
        return true;
      },
      buttonClicked: function (index) {
        // Seleccionar como obtener la foto
        switch (index) {
          case 0 :
            //Tomar foto
            $scope.takePhoto(value);
            return true;

          //Seleccionar de galería
          case 1 :
            //Handle Move Button

            //$scope.modal.show();
            $scope.getGallery(value);
            return true;
        }
      }
    });

    // For example's sake, hide the sheet after three seconds
    $timeout(function () {
      hideSheet();
    }, 3000);
  };

  // Tomar una foto
  $scope.takePhoto = function (value) {
    var options = {
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 200,
      targetHeight: 200
    };

    $cordovaCamera.getPicture(options).then(function (imageDataBase64) {
      /*var avatar = document.getElementById('avatar');
      avatar.style.backgroundImage = "url('data:image/jpeg;base64," + imageData + "')";*/
      window.imageResizer.resizeImage(
        function(data) {
      switch (value) {
        case 'Avtar':
          var avatar = document.getElementById('avatar');
          avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
          break;

        case 'Vehicle insurance':
          //console.log('Gallary >> Vehicle insurance >> ', imageData);

          var avatar = document.getElementById('vehicleInsurance');
          avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
          var avatarDATA = document.getElementById("vehicleInsurance").style.backgroundImage;

          avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
          var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
          $scope.user.driver_attributes.documents_attributes["0"].file = file;

          break;

        case 'Driver license':
          //console.log('Gallary >> Driver license >> ',imageData);

          var avatar = document.getElementById('driverlicense');
          avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
          var avatarDATA = document.getElementById("driverlicense").style.backgroundImage;

          avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
          var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
          $scope.user.driver_attributes.documents_attributes["1"].file = file;

          break;
        case 'Vehicle registration':
          var avatar = document.getElementById('vehicleRegistration');
          avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
          var avatarDATA = document.getElementById("vehicleRegistration").style.backgroundImage;

          avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
          var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
          $scope.user.driver_attributes.documents_attributes["2"].file = file;
          break;

        case 'Vehicle Inspection':

          var avatar = document.getElementById('vehicleInspection');
          avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
          var avatarDATA = document.getElementById("vehicleInspection").style.backgroundImage;

          avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
          var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
          $scope.user.driver_attributes.documents_attributes["3"].file = file;

          break;
        default:
          break;
      }
        }, function (error) {
          console.log("Error : \r\n" + error);
        }, imageDataBase64, 1, 1, {
          resizeType: ImageResizer.RESIZE_TYPE_FACTOR,
          imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
          format: ImageResizer.FORMAT_JPG,
          quality:90
        }
      );
    }, function (err) {
      // error
      console.log('Failed because: ' + err);
    });
  };

  // Obtener una imagen de la galería
  $scope.getGallery = function (value) {
    console.log('Gallary >>> value >> ', value);
    var options = {
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 200,
      targetHeight: 200
    };

    $cordovaCamera.getPicture(options).then(function (imageDataBase64) {
      //console.log('Gallary >> imageDataBase64 >> ',imageDataBase64);
      window.imageResizer.resizeImage(
        function(data) {
          /*var image = document.getElementById('myImage');
          image.src = "data:image/jpeg;base64," + data.imageData;*/
          switch (value) {
            case 'Avtar':
              var avatar = document.getElementById('avatar');
              avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
              break;

            case 'Vehicle insurance':
              //console.log('Gallary >> Vehicle insurance >> ', imageData);

              var avatar = document.getElementById('vehicleInsurance');
              avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
              var avatarDATA = document.getElementById("vehicleInsurance").style.backgroundImage;

              avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
              var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
              $scope.user.driver_attributes.documents_attributes["0"].file = file;

              break;

            case 'Driver license':
              //console.log('Gallary >> Driver license >> ',imageData);

              var avatar = document.getElementById('driverlicense');
              avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
              var avatarDATA = document.getElementById("driverlicense").style.backgroundImage;

              avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
              var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
              $scope.user.driver_attributes.documents_attributes["1"].file = file;

              break;
            case 'Vehicle registration':
              var avatar = document.getElementById('vehicleRegistration');
              avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
              var avatarDATA = document.getElementById("vehicleRegistration").style.backgroundImage;

              avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
              var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
              $scope.user.driver_attributes.documents_attributes["2"].file = file;
              break;

            case 'Vehicle Inspection':

              var avatar = document.getElementById('vehicleInspection');
              avatar.style.backgroundImage = "url('data:image/jpeg;base64," + data.imageData + "')";
              var avatarDATA = document.getElementById("vehicleInspection").style.backgroundImage;

              avatarDATA = avatarDATA.replace('url(', '').replace(')', '');
              var file = (avatarDATA.substring(1, 23) == 'data:image/jpeg;base64') ? avatarDATA : '';
              $scope.user.driver_attributes.documents_attributes["3"].file = file;

              break;
            default:
              break;
          }

        }, function (error) {
          console.log("Error : \r\n" + error);
        }, imageDataBase64, 1, 1, {
          resizeType: ImageResizer.RESIZE_TYPE_FACTOR,
          imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
          format: ImageResizer.FORMAT_JPG,
          quality:90
        }
      );



    }, function (err) {
      // error
      console.log('Failed because: ' + err);
    });
  };




});
