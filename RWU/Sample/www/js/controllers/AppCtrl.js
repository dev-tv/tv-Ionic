/**
 * Created on 09/07/15.
 * Application Controller
 */

app.controller('AppCtrl', function($scope, $ionicModal, $ionicPopover, $timeout, USER_ROLES, AuthService, $location, API,COMPANY_NAME,
                                   $state, Msgs, $rootScope, $cordovaLocalNotification, API_CONFIG, SecuredPopups, Watch, $filter,
                                   CURRENCY, socket, BackgroundGeolocationService, ICONS, CONTACTPHONE, UNIT_SYSTEM, ACTIVATE_CC,$window ) {
  // Form data for the login modal
  $scope.loginData = {};
  $scope.isExpanded = false;
  $scope.hasHeaderFabLeft = false;
  $scope.hasHeaderFabRight = false;
  $scope.USER_ROLES = USER_ROLES;
  $scope.activatecc = ACTIVATE_CC;

  //Variable bool que muestra o esconde el boton de menu
  $rootScope.menuToggleBtn=true;

  // Variable que almacenará los datos de la solicitud
  // de servicio de un cliente
  // =================================================
  if($rootScope.dataServiceRequest==undefined){
    $rootScope.dataServiceRequest = {};
  }
  // *************************************************

  // Assign icon new service to rootScope for a global variable
  // ==============================
  $rootScope.icon_new_request = ICONS.new_service;

  // Indica si el conductor ha llegado a donde esta el pasajero
  $rootScope.driver_arrived = false;

  // Assign the timer to a variable
  // ==============================
  $rootScope.myWatch = Watch;

  // Declare ride_id for future assignments
  // ======================================
  $rootScope.ride_id = null;

  // Assign payment method by default
  // ================================
  $rootScope.data = {
    paymentMethod: 'efectivo'
  };
  // Declare credit card information
  // ================================
  $rootScope.creditCardInfo = {
    'name':'',
    'lastname':'',
    'cardnumber':'',
    'hidedCard':'',
    'date':'',
    'securityCode':''
  };

  // Declare and reset variables for ride
  // ====================================
  $rootScope.reset_ride = function () {
    $rootScope.cp_number = 1;
    $rootScope.points_check = 0;
    $rootScope.mapSearchInputPlaceholder=$rootScope.i18nStrings.app.pickADestination;
    $rootScope.msgsLabel = $rootScope.i18nStrings.app.pickADestinationLbl;
    $rootScope.check_points = [];
    $rootScope.r_point = null;
    $rootScope.gpsPassengerLat = null;
    $rootScope.gpsPassengerLng = null;
    $rootScope.passengerAddress = undefined;
  };

  // Reset the user selected to assign the route "MarkRoutesTeleCtrl.js"
  // ===========================================
  $rootScope.resetPassenger = function(){
    $rootScope.passenger = {
      id:       null,
      name:     null,
      lastname: null,
      user_name: null,
      email:    null,
      avatar:   'img/user.png'
    };
  };

  $rootScope.reset_ride();
  $rootScope.resetPassenger();
  // ====================================

  var navIcons = document.getElementsByClassName('ion-navicon');
  for (var i = 0; i < navIcons.length; i++) {
    navIcons.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  }

  //Call contact number
  // =====================
  $rootScope.callContactNumber = function(){
    window.open('tel:'+CONTACTPHONE.number, '_system');
  };

  // Close the session user
  // =====================
  $rootScope.logout = function () {
    var user_role = AuthService.getUserRole();

    // if user is passenger and invitation sent (is active service) or if the user is driver and the service is active
    // they can't logout
    if (((user_role == 'passenger') && ($rootScope.invitationSent == true)) || ((user_role == 'taxi_driver') && ($rootScope.activeService == true))) {
      Msgs.show($rootScope.i18nStrings.app.exitWarning);
      return false;
    }

    // Stop set position driver
    if ($rootScope.current_pos_driver) {
      //clearInterval($rootScope.current_pos_driver);
      $rootScope.current_pos_driver.clearWatch();
      $rootScope.current_pos_driver = undefined;
    }

    /* Correct conection to api (When the API is working)*/
    API.logout()
      .then(function(response) {
        if(AuthService.getUserData().user_role == 'taxi_driver') {
          //stop bg geolocation
          BackgroundGeolocationService.stop();
        }

        AuthService.setUserUnAuthenticated();

        socket.disconnect();
        socket.removeAllListeners();

        $state.go('login');
        Msgs.show($rootScope.i18nStrings.app.logout);
      }, function(response) {
        Msgs.show();
      });
    /* ------------------------------------------------- */
  };


  // Return true if user is authorized
  // =================================
  $scope.isAuthorized = function(){
    return (AuthService.isAuthorized([USER_ROLES.passenger, USER_ROLES.telephonist]));
  };

  // Return true if user is authorized the driver
  // ============================================
  $scope.isAuthorizedDriver = function(){
    return (AuthService.isAuthorized([USER_ROLES.taxi_driver]));
  };

  // Return route that correspond with user role
  // ===========================================
  $scope.urlMarkRoutes = function(){
    var role = AuthService.getUserData().user_role;
    return (role == 'telephonist') ? 'app.mark_routes_tele' : 'app.mark_routes'
  };

  ////////////////////////////////////////
  // Layout Methods
  ////////////////////////////////////////

  $scope.hideNavBar = function() {
    document.getElementsByTagName('ion-nav-bar')[0].style.display = 'none';
  };

  $scope.showNavBar = function() {
    document.getElementsByTagName('ion-nav-bar')[0].style.display = 'block';
  };

  $scope.noHeader = function() {
    var content = document.getElementsByTagName('ion-content');
    for (var i = 0; i < content.length; i++) {
      if (content[i].classList.contains('has-header')) {
        content[i].classList.toggle('has-header');
      }
    }
  };

  $scope.drag = function(value) {
    $scope.numbers = Math.floor(value / 10);
    // $scope.months = value % 10;
  };

  $scope.rangeValue = 1;

  $scope.setExpanded = function(bool) {
    $scope.isExpanded = bool;
  };

  $scope.setHeaderFab = function(location) {
    var hasHeaderFabLeft = false;
    var hasHeaderFabRight = false;

    switch (location) {
      case 'left':
        hasHeaderFabLeft = true;
        break;
      case 'right':
        hasHeaderFabRight = true;
        break;
    }

    $scope.hasHeaderFabLeft = hasHeaderFabLeft;
    $scope.hasHeaderFabRight = hasHeaderFabRight;
  };

  $scope.hasHeader = function() {
    var content = document.getElementsByTagName('ion-content');
    for (var i = 0; i < content.length; i++) {
      if (!content[i].classList.contains('has-header')) {
        content[i].classList.toggle('has-header');
      }
    }

  };

  $scope.hideHeader = function() {
    $scope.hideNavBar();
    $scope.noHeader();
  };

  $scope.showHeader = function() {
    $scope.showNavBar();
    $scope.hasHeader();
  };

  $scope.clearFabs = function() {

    var fabs = document.getElementsByClassName('fab-service');
    for(var i = 0; i < fabs.length; i++) {
      fabs[i].remove();
    }

  };
  ///////////////////////////////////////////////////

  console.log('entrando a app');
  //----------------------------------------------------------

  // Create the message to send to the node server
  // =============================================
  $rootScope.create_push_msg = function(to, data, dataServiceRequest, options){
    data.to = {
      user_name: to.user_name,
      device_token: to.device_token,
      platform: to.platform
  };

  if (dataServiceRequest !== undefined) data.msg.dataServiceRequest = dataServiceRequest;

  // The options must have this format {a: 'asd', b: '465'}
  if (options !== undefined) {
    for (var key in options){
      data.msg[key] = options[key];
      console.log('opciones -> key: ' + key + 'data: ' + options[key]);
    }
  }
  console.log('data.msg: ', data.msg);

    return data;
  };

  $rootScope.getDriverbyId = function(data, id_search) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id == id_search) {
        driver = data[i];
      }
    }
    return driver;
  };

  //Get data passenger for new service request
  $rootScope.build_passenger = function(id, latitude, longitude) {
    return {
      id: id,
      latitude: latitude,
      longitude: longitude
    };
  };

  $rootScope.getUrlAvatar = function(img, user_id) {
    return (img !== null) ? (API_CONFIG.url_base + API_CONFIG.url_avatar + user_id + '/' + img) : 'img/user.png';
  };

  $rootScope.getAvatarByUrl = function(url_img) {
    return (url_img !== null) ? (API_CONFIG.url_base + url_img) : 'img/user.png';
  };

  $rootScope.get_reverse_percent = function(percent){
    return parseFloat((percent / 100) + 1);
  };

  // New form to build the dataServiceRequest to request a new service
  // =================================================================
  $rootScope.build_data_service = function(passenger, driver_id, driver_unique, total_t, total_d, check_points, lat_c, lng_c,
                                           route_cost, fare_schedule, r_point, payment_method){
    $rootScope.dataServiceRequest = {
      passenger:          passenger,
      driver:             {id: driver_id, unique: driver_unique},
      routePoints: {
        checkPoints:  check_points,
        cp_num:       check_points.length,
        lat_c:        lat_c,
        lng_c:        lng_c,
        total_dist:   total_d,
        total_time:   total_t
      },
      route_cost:         route_cost,
      fare_schedule:      fare_schedule,
      r_point:            r_point,
      ride_id:            '',
      payment_method:     payment_method
    };
  };

  $rootScope.get_data_route = function(distance, time, method, schedule) {
    return {
      distance: distance,
      time: time,
      method: method,
      schedule: schedule
    };
  };

  $scope.showDataRide = function() {

    var dist_unit = (UNIT_SYSTEM === 'km') ? $rootScope.i18nStrings.app.distanceUnitKm : $rootScope.i18nStrings.app.distanceUnitMiles;

    var user_role = AuthService.getUserRole();
    if (user_role == 'passenger') {

      var r_point = $rootScope.i18nStrings.app.serviceInfoReference + $rootScope.dataServiceRequest.r_point;
      if($rootScope.dataServiceRequest.r_point === null){
        r_point ='';
      }
      $rootScope.winPopup = SecuredPopups.show('alert', {
        title: '<div class="padding-top-20 padding-bottom-20"><img src="img/modal/realizar_pago.png" class="img-centrado"></div><span class="title-modal">' + $rootScope.i18nStrings.app.serviceInfo + '</span>',
        template: '<span class="text-gray text-justify">' + r_point

          + $rootScope.i18nStrings.app.serviceInfoDistance + $rootScope.dataServiceRequest.routePoints.total_dist + ' ' + dist_unit
          + $rootScope.i18nStrings.app.serviceInfoTime + $rootScope.dataServiceRequest.routePoints.total_time
          + $rootScope.i18nStrings.app.serviceInfoCost + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost
          + '</span>',
        okText: $rootScope.i18nStrings.app.serviceInfoOk
      });
    } else {

      var latlng = new google.maps.LatLng($rootScope.dataServiceRequest.routePoints.checkPoints[0].latitude, $rootScope.dataServiceRequest.routePoints.checkPoints[0].longitude);
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({'latLng': latlng}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

          var pickupAddress = results[0].formatted_address;

          var latlng = new google.maps.LatLng($rootScope.dataServiceRequest.routePoints.checkPoints[1].latitude, $rootScope.dataServiceRequest.routePoints.checkPoints[1].longitude);
          var geocoder = new google.maps.Geocoder();
          geocoder.geocode({'latLng': latlng}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {

              var destinationAddress = results[0].formatted_address;

              var payment_method = $rootScope.dataServiceRequest.payment_method;
              if($rootScope.dataServiceRequest.payment_method === 'fund'){
                payment_method = 'Saldo';
              }
              var r_point = $rootScope.i18nStrings.app.serviceInfoReference + $rootScope.dataServiceRequest.r_point;
              if($rootScope.dataServiceRequest.r_point === null){
                r_point ='';
              }

              $rootScope.winPopup = SecuredPopups.show('alert', {
                title: '<div class="padding-top-20 padding-bottom-20"><img src="img/modal/realizar_pago.png" class="img-centrado"></div><span class="title-modal">' + $rootScope.i18nStrings.app.serviceInfo + '</span>',
                template: '<span class="text-gray text-justify">' + r_point
                  + $rootScope.i18nStrings.app.origin + ' ' + pickupAddress
                  + $rootScope.i18nStrings.app.destination + ' ' + destinationAddress

                  + $rootScope.i18nStrings.app.youRecieveText
                  + $rootScope.i18nStrings.app.baseFare + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost_details.base_fare
                  + $rootScope.i18nStrings.app.serviceInfoDistance + $rootScope.dataServiceRequest.routePoints.total_dist + ' ' + dist_unit
                  /*+ $rootScope.i18nStrings.app.serviceInfoTime + $rootScope.dataServiceRequest.routePoints.total_time*/
                  + $rootScope.i18nStrings.app.time + $rootScope.dataServiceRequest.routePoints.total_time + ' min'
                  + $rootScope.i18nStrings.app.waitTime + $rootScope.dataServiceRequest.route_cost_details.wait_time_total + ' min'
                  + $rootScope.i18nStrings.app.grandTotal + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.grand_total), 2)

                  + $rootScope.i18nStrings.app.riderPays + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.rider_pays), 2)
                  + '</br></br>'
                  + '<b>' + COMPANY_NAME + '</b>' + $rootScope.i18nStrings.app.appCompanyRecieves
                  + $rootScope.i18nStrings.app.serviceFee + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.service_fee), 2)
                  + $rootScope.i18nStrings.app.bookingFee + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost_details.booking_fare
                  + $rootScope.i18nStrings.app.paymentMethodText + ' ' + payment_method
                  + '</br>'
                  + $rootScope.i18nStrings.app.total + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.total), 2)
                  + '</span>',
                okText: $rootScope.i18nStrings.app.serviceInfoOk
              });
            }
          });
        }
      });


    }
    ;
  }


  // Add a google maps marker



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
        }
      }
    }
  };



  // Add a google maps marker






  var isPassengerIcon = false;
//img/Map/start.png
  $rootScope.add_marker = function(map, draggable, position, pin, isPassenger){
    //alert(pin)
    isPassengerIcon = isPassenger;

    $rootScope.overlay = new $rootScope.CustomMarker(
      position,
      map,
      {
        marker_id: '123'
      }
    );
    //Old MARKER Code
    //if (isDriverIcon == "img/Map/stop.png" || isDriverIcon == "img/Map/taxi-pin.png") {
    return new google.maps.Marker(/*{
      map: map,
      draggable: draggable,
      position: position,
      icon: pin
    }*/);
    //}
  };

  $rootScope.add_passenger_marker = function(map, draggable, position, pin, isPassenger){
    //alert(pin)
    isPassengerIcon = isPassenger;

    $rootScope.p_overlay = new $rootScope.passengerCustomMarker(
      position,
      map,
      {
        marker_id: '1231'
      }
    );
    //Old MARKER Code
    return new google.maps.Marker(/*{
     map: map,
     draggable: draggable,
     position: position,
     icon: pin
     }*/);

  };



///new map marker code



  $rootScope.CustomMarker = function(latlng, map, args) {
    this.latlng = latlng;
    this.args = args;
    this.setMap(map);
  }

  $rootScope.CustomMarker.prototype = new google.maps.OverlayView();

  $rootScope.CustomMarker.prototype.draw = function() {

    var self = this;

    var div = this.div;

    if (!div) {

      div = this.div = document.createElement('div');
      div.className = 'marker uqe-mrkr';
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.width = '40px';
      div.style.height = '40px';
      //div.style.background = 'blue';
      var elem = document.createElement("img");
      elem.setAttribute("src", "img/markers/icon-passenger.png");
      elem.setAttribute("height", "70");
      elem.setAttribute("width", "70");
      var elem1 = document.createElement("img");

      if($rootScope.user.avatar) {
        elem1.setAttribute("src",  $rootScope.user.avatar);
      } else {
        elem1.setAttribute("src",  "img/user.png");
      }

      elem1.className = 'profilePicClass';
      div.appendChild(elem);
      div.appendChild(elem1);


      var elem2 = document.createElement("img");
      elem2.setAttribute("src", "img/markers/small-car-icon.png");
      elem2.className = 'samllCarPic';
      div.appendChild(elem2);



      if (typeof(self.args.marker_id) !== 'undefined') {
        div.dataset.marker_id = self.args.marker_id;
      }

      // google.maps.event.addDomListener(div, "click", function(event) {
      //   alert('You clicked on a custom marker!');
      //   google.maps.event.trigger(self, "click");
      // });

      var panes = this.getPanes();
      panes.overlayImage.appendChild(div);
    }

    var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    if (point) {
      div.style.left =  (point.x - 33) +'0px';
      div.style.top = (point.y) - 65 + 'px';
    }
  };

  $rootScope.CustomMarker.prototype.remove = function() {

    var aa = document.getElementsByClassName("uqe-mrkr");
    for (var i = 0;i < aa.length;i++) {
      aa[0].parentNode.removeChild(aa[0]);
    }
    /*if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }*/
  };

  $rootScope.CustomMarker.prototype.getPosition = function() {
    return this.latlng;
  };

  // passenger custum marker //

  $rootScope.passengerCustomMarker = function(latlng, map, args) {
    this.latlng = latlng;
    this.args = args;
    this.setMap(map);
  }

  $rootScope.passengerCustomMarker.prototype = new google.maps.OverlayView();

  $rootScope.passengerCustomMarker.prototype.draw = function() {

    var self = this;

    var div = this.div;

    if (!div) {
      div = this.div = document.createElement('div');
      div.className = 'marker psgr_mrkr';
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.width = '40px';
      div.style.height = '40px';
      //div.style.background = 'blue';
      var elem = document.createElement("img");
      elem.setAttribute("src", "img/markers/icon-passenger.png");
      elem.setAttribute("height", "70");
      elem.setAttribute("width", "70");
      var elem1 = document.createElement("img");

      if($rootScope.user.avatar) {
        elem1.setAttribute("src",  $rootScope.user.avatar);
      } else {
        elem1.setAttribute("src",  "img/user.png");
      }

      elem1.className = 'profilePicClass';
      div.appendChild(elem);
      div.appendChild(elem1);


      if (typeof(self.args.marker_id) !== 'undefined') {
        div.dataset.marker_id = self.args.marker_id;
      }

      // google.maps.event.addDomListener(div, "click", function(event) {
      //   alert('You clicked on a custom marker!');
      //   google.maps.event.trigger(self, "click");
      // });

      var panes = this.getPanes();
      panes.overlayImage.appendChild(div);
    }

    var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    if (point) {
      div.style.left =  (point.x - 33) +'0px';
      div.style.top = (point.y) - 65 + 'px';
    }
  };

  $rootScope.passengerCustomMarker.prototype.remove = function() {
    if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }


    var aa = document.getElementsByClassName("psgr_mrkr");
    //console.log('passengerCustomMarker.prototype.remove called aa length >>> ',aa.length);
    for (var i = 0;i < aa.length;i++) {
      //console.log(aa)
      aa[0].parentNode.removeChild(aa[0]);
    }

  };

  $rootScope.passengerCustomMarker.prototype.getPosition = function() {
    return this.latlng;
  };


///Custom Marker code ended here


  $rootScope.getAddress = function(lat,lng,notAssingToRoot) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (!notAssingToRoot) {
          $rootScope.passengerAddress = results[0].formatted_address;
          console.log('passengerAddress: ', $rootScope.passengerAddress);
        }else{
          return results[0].formatted_address;
        }
      } else {
        if (!notAssingToRoot) {
          $rootScope.passengerAddress = $rootScope.i18nStrings.app.locationNotRegistered;
          console.log("Geocoder failed due to: " + status);
        }else {
          return null;
        }
      }
    });
  };


  $rootScope.go_home = function (user_role) {
    switch (user_role) {
      case 'taxi_driver':
        $location.path('/app/profile');
        break;
      case 'telephonist':
        $location.path('/app/mark_routes_tele');
        break;
      default:
        $location.path('/app/map');
    }
  };
});
