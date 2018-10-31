/**
 * Created on 08/10/2015.
 * Map Controller test
 */

app.controller('MapCtrl', function($rootScope, $scope, $state, API, Msgs, $http, $stateParams, $ionicModal, $ionicPopover,
                                     $timeout, ionicMaterialMotion, $cordovaGeolocation, SecuredPopups, AuthService,$window,$ionicSideMenuDelegate) {
  // Set Header
  $scope.$parent.hideHeader();
  $scope.$parent.clearFabs();

  //Variable bool que muestra o esconde el boton de menu
  $rootScope.menuToggleBtn=true;

  //Back state
  $rootScope.lastState='exit';

  $ionicSideMenuDelegate.canDragContent(false);

  var clat = null;
  var clng = null;
  var indicator, counter;

  //$rootScope.cp_number_ride = $rootScope.cp_number;
  console.log('entrando a map Ctrl');

  //SOLO PARA VOYMAI
  $rootScope.winPopup = SecuredPopups.show('alert', {
    title: 'Información',
    template:'Recuerde lo siguiente para su viaje:<br>' +
    '• Tener a pie de calle su auto para ser remolcado.<br>' +
    '• No haber estado involucrado en alguien tipo de accidente (de lo contrario su vehículo no será remolcado).<br>' +
    '• Tendrá que ir durante el traslado una persona responsable del vehículo.<br>' +
    '• Consulte nuestro aviso de privacidad en: www.voymai.com',
    okText: $rootScope.i18nStrings.app.serviceInfoOk
  });

  //Mostrar loader pequeno de esquina
  $scope.loadingLocation=true;


  $scope.disableTap = function() {
    var container = document.getElementsByClassName('pac-container');
    angular.element(container).attr('data-tap-disabled', 'true');
    var backdrop = document.getElementsByClassName('backdrop');
    angular.element(backdrop).attr('data-tap-disabled', 'true');
    angular.element(container).on("click", function() {
      document.getElementById('pac-input').blur();
    });
  };

  $scope.addCheckPoint= function(lat, lng, counter, indicator) {
    $rootScope.check_points.push({
      latitude: lat,
      longitude: lng,
      counter: counter,
      indicator: indicator
    });
  };

// CONSULTA INICIAL DE UBICACION DEL USUARIO

  $scope.initLocation = function() {
    if($window.localStorage['lastLocation']===undefined){
      var position={};
      API.getLocationbyIp()
        .then(function(response) {
          position.latitude=response.data.latitude;
          position.longitude = response.data.longitude;
          $window.localStorage['lastLocation']=JSON.stringify(position);
          build_map(position);
        });
    }else{
      position=JSON.parse($window.localStorage['lastLocation']);
      build_map(position);
    }

  };

  //Set up passenger pick up location
  $scope.setPassengerLocation = function() {
    var latlng = new google.maps.LatLng($scope.map.getCenter().lat(), $scope.map.getCenter().lng());
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        $rootScope.passengerAddress=results[0].formatted_address;
        if(AuthService.getUserRole() == 'passenger') {
          $state.go('app.mark_routes');
        }else{
          $state.go('app.mark_routes_tele');
        }
      } else {

        $rootScope.passengerAddress=$rootScope.i18nStrings.map.passengerAddressNotSet;
        console.log("Geocoder failed due to: " + status);
      }
    });
    $rootScope.check_points = [];
    $scope.addCheckPoint($scope.map.getCenter().lat(), $scope.map.getCenter().lng(), counter = 0, indicator = 'start');
  };

  $scope.startGetCurrentPosition = function() {
    var posOptions = {timeout: 7000, enableHighAccuracy: false, maximumAge: 3000};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        var pos= {};
        pos.latitude=position.coords.latitude;
        pos.longitude = position.coords.longitude;
        $window.localStorage['lastLocation']=JSON.stringify(pos);

        $scope.map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
        //Ocultar loader pequeno de esquina
        $scope.loadingLocation=false;
      }, function (err) {
        console.log(err);
        $scope.get_position();
      });
  };
  $scope.get_position = function() {

    // Msgs.waiting($rootScope.i18nStrings.map.gettingLocation);
    cordova.plugins.diagnostic.getLocationMode(function(locationMode){
      if(locationMode=='location_off'){
        // Msgs.close();
        $rootScope.winPopup = SecuredPopups.show('confirm', {
          title: $rootScope.i18nStrings.map.gpsInactive,
          template: $rootScope.i18nStrings.map.gpsInactiveTpl,
          okText: $rootScope.i18nStrings.map.gpsInactiveTryAgain,
          cancelText: $rootScope.i18nStrings.map.gpsInactiveCancel
        });
        $rootScope.winPopup.then(function (res) {
          if (res) {
            window.cordova.plugins.settings.open("location", function() {
              // Msgs.waiting($rootScope.i18nStrings.map.gettingLocation);
              $scope.startGetCurrentPosition();
            },function () {
              $scope.get_position();
            });
          } else {
            //do nothing
          }
        });
      }else{
        $scope.startGetCurrentPosition();
      }
    });
  };
  //========================
  // Ends getCurrentPosition
  //========================

  function build_map(position){
    if ($rootScope.points_check == 0) {
      Msgs.show($rootScope.msgsLabel, 2000);
    }

    //console.log('localStorage >>> state >>>> ',$window.localStorage['state'])
    if($window.localStorage['state']=='AvailableDrivers'){

      Msgs.show('Existe un viaje en proceso, estamos cargando la información...', 2500);
      $rootScope.dataServiceRequest= JSON.parse($window.localStorage['dataServiceRequest']);
      $rootScope.check_points=JSON.parse($window.localStorage['checkPoints']);
      if($window.localStorage['driverArrived']!=undefined){
        $rootScope.driver_arrived=JSON.parse($window.localStorage['driverArrived']);
      }

      $state.go('app.available_drivers');
    }

    console.log('check_points: ', $rootScope.check_points);
    console.log('check_points.length: ', $rootScope.check_points.length);
    if ($rootScope.setPassengerLocationMode) {
      if ($rootScope.check_points.length > 0) {
        clat = $rootScope.check_points[0].latitude;
        clng = $rootScope.check_points[0].longitude;
      } else {
        console.log('PassengerLocation: true, check_points: 0');
        clat = position.latitude;
        clng = position.longitude;
        $rootScope.gpsPassengerLat = clat;
        $rootScope.gpsPassengerLng = clng ;
      }
    }else{
      clat = position.latitude;
      clng = position.longitude;
      $rootScope.gpsPassengerLat = clat;
      $rootScope.gpsPassengerLng = clng ;
    }

    console.log('clat: ', clat);
    console.log('clng: ', clng);

    if($rootScope.check_points.length==0){
      $scope.addCheckPoint($rootScope.gpsPassengerLat, $rootScope.gpsPassengerLng, counter = 0, indicator = 'start');
    }
    var mapEl=document.getElementById('map');

    var styles =[{
      featureType: "poi",
      elementType: "labels",
      stylers: [
        { visibility: "off" }
      ]
    },{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#7c93a3"},{"lightness":"-10"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"administrative.country","elementType":"geometry.stroke","stylers":[{"color":"#a0a4a5"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"color":"#62838e"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#dde3e3"}]},{"featureType":"landscape.man_made","elementType":"geometry.stroke","stylers":[{"color":"#3f4a51"},{"weight":"0.30"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.place_of_worship","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":"-100"},{"visibility":"on"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#bbcacf"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"lightness":"0"},{"color":"#bbcacf"},{"weight":"0.50"}]},{"featureType":"road.highway","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"color":"#a9b4b8"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"invert_lightness":true},{"saturation":"-7"},{"lightness":"3"},{"gamma":"1.80"},{"weight":"0.01"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#a3c7df"}]}];


    $scope.map = new google.maps.Map(mapEl, {
      zoom: 16,
      center: {lat: clat, lng: clng},
      disableDefaultUI: true,
      styles: styles
    });

    // var markerEl = document.createElement("div");
    // markerEl.className='centerMarker';

    //new icon changes code
    var markerEl = this.div = document.createElement('div');
    markerEl.className = 'markers';
    //markerEl.style.position = 'absolute';
    markerEl.style.cursor = 'pointer';
    //markerEl.style.width = '40px';
    //markerEl.style.height = '40px';
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
    markerEl.appendChild(elem);
    markerEl.appendChild(elem1);



    mapEl.appendChild(markerEl);



    var input = (document.getElementById('pac-input'));

    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', $scope.map);

    //OBTENER UBICACION DEL GPS
    $scope.get_position();

    autocomplete.addListener('place_changed', function() {

      var place = autocomplete.getPlace();
      if (!place.geometry) {

        Msgs.show($rootScope.i18nStrings.map.cantfind, 1000);
        return;
      }
      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        $scope.map.fitBounds(place.geometry.viewport);
      }
      else
      {
        $scope.map.panTo(place.geometry.location);
        $scope.map.setZoom(16);
      }
    });
  }

  // Start
  // $scope.get_position();
  $scope.initLocation();

   $rootScope.isBidEnable = false;
  $scope.bidIcon = 'img/bidFeature/bid_off.png';
//Enable/disable bid feature
  $scope.EnableDisableBidFeature = function() {
    if($rootScope.isBidEnable){
      $scope.bidIcon = 'img/bidFeature/bid_off.png';
      $rootScope.isBidEnable = false;
    }
   else {
      $scope.bidIcon = 'img/bidFeature/bid_on.png';
      $rootScope.isBidEnable = true;
    }

  }


  // Save every checkpoint in an array that later will be stored
  // ===========================================================

  $scope.CheckPoint = function() {
    if( $rootScope.points_check < $rootScope.cp_number ){

      $rootScope.points_check += 1;
      indicator = ($rootScope.points_check < $rootScope.cp_number) ? 'stop' : 'end';

      $scope.addCheckPoint($scope.map.getCenter().lat(), $scope.map.getCenter().lng(), $rootScope.points_check, indicator);

      if($rootScope.points_check == $rootScope.cp_number ){
        $rootScope.cp_number = 1;
        //$state.go('app.mapped_points');
      }else {
        var num_check_point = $rootScope.points_check + 1;
        Msgs.show($rootScope.msgsLabel +' '+ num_check_point , 2000);
        document.getElementById('pac-input').value = "";
      }
    }else if($rootScope.points_check == $rootScope.cp_number ) {
      $rootScope.cp_number = 1;
      $state.go('app.mapped_points');
    }
  };

  $timeout(function() {
    ionicMaterialMotion.fadeSlideIn({
      startVelocity: 3000,
      selector: '.animate-fade-slide-in'
    });
  }, 700);
});
