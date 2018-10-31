/**
 * Created on 08/10/2015.
 * Check Points -Visible on Map- Controller
 */

app.controller('MappedPointsCtrl', function($rootScope, $scope, $state,$ionicPopup,gcm, API, Msgs, $http, AuthService, $stateParams,$ionicPopup,
                                            $ionicModal, $ionicPopover, $timeout, API_CONFIG, $filter, CURRENCY, SecuredPopups) {

  $scope.$parent.showHeader();

  //Variable bool que muestra o esconde el boton de menu
  $rootScope.menuToggleBtn=false;

  $rootScope.lastState='app.mark_routes';

  $scope.responseRideId =  0;
  $scope.bidValue = 5000;
  $scope.notyID = 0;



  // If invitationSent is undefined then assign to false
  // ===================================================
  if ($rootScope.invitationSent === undefined) {
    $rootScope.invitationSent = false;
  }

  var ready_route, ready_cost = false;
  Msgs.waiting($rootScope.i18nStrings.mappedPoints.tracingroute);

  var role = AuthService.getUserData().user_role;
  $scope.txt_btn = (role == 'telephonist') ? $rootScope.i18nStrings.mappedPoints.pickDriver : $rootScope.i18nStrings.mappedPoints.sendRequest;

  $scope.displayRoute = function(datos, cp_num, service, display) {
    $rootScope.passengerLat = parseFloat(datos[0].latitude);
    $rootScope.passengerLng = parseFloat(datos[0].longitude);
    var cp_waypoints = [];
    angular.forEach(datos, function(value, key){
      if(key != 0 && key != (cp_num-1))
      {
        cp_waypoints.push({location: {lat: parseFloat(datos[key].latitude) , lng: parseFloat(datos[key].longitude)}});
      }
    });

    console.log("cp_waypoints: ", cp_waypoints);

    service.route({
      origin: {lat: parseFloat(datos[0].latitude), lng: parseFloat(datos[0].longitude)},  // Origen.
      destination: {lat: parseFloat(datos[cp_num-1].latitude), lng: parseFloat(datos[cp_num-1].longitude)},  //  Destino.
      waypoints: cp_waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidTolls: true
    }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        display.setDirections(response);
        ready_route = true;
        hide_loading();
      } else {
        alert('Could not display directions due to: ' + status);
        Msgs.show_redirect($rootScope.i18nStrings.mappedPoints.googleError, 'app.profile', 5000);
      }
    });
  };

  // Compute Fare Values
  // ===================
  $scope.ComputeFare = function(result) {
    console.log('result: ', result);
    var total = 0;
    var time = 0;

    var myroute = result.routes[0];
    for (var i = 0; i < myroute.legs.length; i++) {
      total += myroute.legs[i].distance.value;
      time += myroute.legs[i].duration.value; //This value is in seconds
    }

    console.log("Tiempo antes: ", time);
    $rootScope.total_d = Math.round(total / 1000); //Converted to kilometers
    $rootScope.total_t = Math.round(time / 60); //Converted to minutes
    console.log("Distancia: ", $rootScope.total_d);
    console.log("Tiempo: ", $rootScope.total_t);

    //Get route cost to the server
    var data_route = $rootScope.get_data_route($rootScope.total_d, $rootScope.total_t, 'cash', '');


    console.log('data_route: ' + data_route);
    console.log(data_route);
    var origin ={lat:$rootScope.check_points[0].latitude, lng:$rootScope.check_points[0].longitude};
    var destination ={lat:$rootScope.check_points[1].latitude, lng:$rootScope.check_points[1].longitude};


    $scope.bid_cost={
      value: ''
    };

    //USAMOS EL COSTO CALCULADO ESTIMADO ANTES DE VIAJAR

    ///($rootScope.data.payment_method)
    //alert(JSON.stringify($rootScope.dataServiceRequest))

    console.log(JSON.stringify($rootScope.data.paymentMethod))
    if(($rootScope.data.paymentMethod ==  "fund"  && $rootScope.isBidEnable) ||  ($rootScope.data.paymentMethod ==  "efectivo"  && $rootScope.isBidEnable) ) {
         //when bid pop need to show from here
      ready_cost = true;
      var newHight = window.screen.height / 4 - 10
      hide_loading();
      $ionicModal.fromTemplateUrl('templates/ModelPopUp/offered_bid_popup.html', {
        scope: $scope,
      }).then(function (modal) {
        $scope.bidPopUpModel = modal;
        $scope.bidPopUpModel.show();
        $timeout(function() {
          //document.getElementsByClassName("modal-backdrop active")[0].className += " customepop";
          document.getElementsByClassName("modal-backdrop active")[0].setAttribute('style','top: auto; height:'+newHight+'px;bottom: 0px');
        }, 50);
      });
      //$rootScope.$emit('showIncreaseModel',null);

    }else {


      API.calculateRouteCost(data_route, origin, destination)
        .then(function (response) {
          console.log('Respuesta calculate route cost: ', response);
          if (response.data == -1) {
            Msgs.show_redirect($rootScope.i18nStrings.mappedPoints.noEquation, 'app.profile', 5000);
          }
          else {
            $rootScope.route_cost = $filter('number')(response.data.cost, 2);
            $rootScope.dataServiceRequest.route_cost = $filter('number')(response.data.cost, 2);
            $rootScope.fare_schedule = response.data.schedule;

            ready_cost = true;
            hide_loading();

            $rootScope.winPopup = SecuredPopups.show('alert', {
              title: '<div class="padding-top-20 padding-bottom-10"><img src="img/modal/ride_cost.png" class="img-centrado"></div><span class="title-modal">' + $rootScope.i18nStrings.mappedPoints.estimatedCostTitle + '</span>',
              template: '<b class="text-gray text-justify">' + $rootScope.i18nStrings.mappedPoints.estimatedCostTpl + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost + '</b>',
              okText: $rootScope.i18nStrings.mappedPoints.estimatedCostOk
            });

            /*$rootScope.winPopup = SecuredPopups.show('alert', {
             title: $rootScope.i18nStrings.mappedPoints.estimatedCostTitle,
             scope:$scope,
             template: $rootScope.i18nStrings.mappedPoints.estimatedCostTpl + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost
             +'</br> Please insert your bid cost : </br> <input type="number" ng-model="bid_cost.value">',
             okText: $rootScope.i18nStrings.mappedPoints.estimatedCostOk
             });*/
          }
        }, function (response) {
          //error
          console.log('Error, there is no recorded rate for the shift: ', response);
          Msgs.show_redirect($rootScope.i18nStrings.mappedPoints.noRate, 'app.profile', 5000);
        });

    }


  };

  // Get All Points on the Map
  // =========================
  var cp_num = $rootScope.check_points.length;
  var lat_c = 0;
  var lng_c = 0;

  angular.forEach($rootScope.check_points, function(value, key){
    lat_c = lat_c + parseFloat(value.latitude);
    lng_c = lng_c + parseFloat(value.longitude);
  });

  $rootScope.lat_c = lat_c/cp_num;
  $rootScope.lng_c = lng_c/cp_num;

  var map = new google.maps.Map(document.getElementById('mapa'), {
    zoom: 14,
    center: {lat: lat_c, lng: lng_c}  // Centro.
  });

  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer({
    draggable: false,
    map: map,
    panel: document.getElementById('right-panel')
  });

  directionsDisplay.addListener('directions_changed', function() {
    $scope.ComputeFare(directionsDisplay.getDirections());
  });

  $scope.displayRoute($rootScope.check_points, cp_num, directionsService, directionsDisplay);

  // =============================
  // TaxiApp Adaptation / Part 1
  // =============================
  function new_service_request() {
    console.log('new_service_request');

    var passenger = $rootScope.build_passenger(AuthService.getUserData().user_id, $rootScope.passengerLat, $rootScope.passengerLng);
    $rootScope.build_data_service(passenger, driver_id = null, driver_unique = false, $rootScope.total_t, $rootScope.total_d,
      $rootScope.check_points, $rootScope.lat_c, $rootScope.lng_c, $rootScope.route_cost,
      $rootScope.fare_schedule, $rootScope.r_point, $rootScope.data.paymentMethod);

    if($scope.bid_cost.value){
      $rootScope.dataServiceRequest.bid_cost = {
        method:'true',
        value : $scope.bid_cost.value
      };
      console.log('into iff >> $rootScope.dataServiceRequest >> ',$scope.bid_cost.value);
    }

    API.createNotificationService($rootScope.dataServiceRequest)
      .then(function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPoints.requestSuccess, 3000);
        $rootScope.invitationSent = true;
        $scope.responseRideId = response.data[0].id;
        if ($scope.myPopup ){
          hideCustomPopUp()
        }
        showCustomPopup();
        if($scope.bidPopUpModel) {
          $scope.bidPopUpModel.hide();
        }
      }, function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPoints.requestFail, 5000);
        $rootScope.invitationSent = false;
      });
  }


function showCustomPopup() {
    $scope.myPopup = $ionicPopup.show({
      template: '<div style="text-align: center">' + $rootScope.i18nStrings.availableDrivers.cancelPopUpTitle + '</div> <div style="text-align: center;padding-top: 10px; "><ion-spinner icon="spiral"></ion-spinner></div>',

    scope: $scope,
    buttons: [
     {
        text: $rootScope.i18nStrings.availableDrivers.cancelRide,
        type: 'button-positive',
        onTap: function(e) {
          $scope.cancel_request_before_accept();
        }
      }
    ]
  });

}
function hideCustomPopUp() {
    try{$scope.myPopup.close();} catch (e) {}
}

  // Handling broadcast function from notification controller
  // ============================================================

  $rootScope.$on('handleAlertHideShow', function (event, data) {
    hideCustomPopUp();
  });


  // Check if send the request or pass to a view to select driver
  // ============================================================
  $scope.check_for_request = function(hideModel){
    // if(hideModel){
    //   $scope.bidPopUpModel.hide();
    // }

    return (role == 'telephonist') ? $state.go('app.select_driver') : new_service_request();
  };

  function hide_loading() {
    if (ready_route && ready_cost) {
      Msgs.close();
    }
  }


  var listnerBroadCast =  $rootScope.$on('showIncreaseModel', function (event, data) {
    console.log("increase show model called  ")
    $rootScope.invitationSent = false;
    hideCustomPopUp();
    $scope.bidValue = data.bid_cost.value;
    $scope.notyID   =   data.notification_id

    var newHight = window.screen.height / 4 + 40 ;
    $ionicModal.fromTemplateUrl('templates/ModelPopUp/increase_bid_popup.html', {
      scope: $scope,
    }).then(function (modal) {
      $scope.increaseBidPopUpModel = modal;
      $scope.increaseBidPopUpModel.show();
      $timeout(function() {
        document.getElementsByClassName("modal-backdrop active")[0].setAttribute('style','top: auto; height:205px;bottom: 0px');
      }, 50);

    });

    //$timeout(function() {listnerBroadCast();}, 100);

  });

  $scope.getFullAddress = function(lat,lng,assignToVar) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (assignToVar) {
          $scope.sourceAddress = results[0].formatted_address;
        }else{
          $scope.destinyAddress = results[0].formatted_address;
        }
      }
    });
  };



 var driverOfferListBroadCast =  $rootScope.$on('showDriverOfferedListModel', function (event, data) {
    console.log("offeredByDriverListModel show model called  ")
    $rootScope.invitationSent = false;
    hideCustomPopUp();
    $scope.bidValue = data.bid_cost.value;
    $scope.notyID   = data.notification_id
    $scope.offerListData = [];
    $scope.offerListData.push(data)

    $scope.getFullAddress(data.routePoints.checkPoints[0].latitude,data.routePoints.checkPoints[0].longitude,true);
    $scope.getFullAddress(data.routePoints.checkPoints[1].latitude,data.routePoints.checkPoints[1].longitude,false);

    var newHight = window.screen.height ;
    $ionicModal.fromTemplateUrl('templates/ModelPopUp/passenger_offered_bid_list.html', {
      scope: $scope,
    }).then(function (modal) {
      $scope.offeredByDriverListModel = modal;
      $scope.offeredByDriverListModel.show();
      $timeout(function() {
        document.getElementsByClassName("modal-backdrop active")[0].setAttribute('style','top: auto; bottom: 0px');
      }, 50);

    });

    $timeout(function() {listnerBroadCast();}, 100);

  });








  $scope.cancel_request_before_accept = function(){
     gcm.clear_notifications();
    $rootScope.invitationSent = false;
     API.cancelNotificationService($scope.responseRideId)
      .then(function (response) {
        console.log(JSON.stringify(response));
        Msgs.show_redirect($rootScope.i18nStrings.mappedPointsDriver.requestRejected, 'app.map');
      }, function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPointsDriver.errorCanceling, 3000);
      });
  }
  //alert((window.screen.height/2));

  //$scope.myStyle = {'height':(window.screen.height/2)+'vh'};
  //document.getElementsByClassName("modal-backdrop").className += "customepop";

   $scope.isChangedVal = false;

  $scope.calNewBidAmount  = function(isIncreaseVal){
    $scope.isChangedVal = true;
   if (isIncreaseVal){
     $scope.bidValue = $scope.bidValue + 500;
   }else {
     if ($scope.bidValue > 0) {
       $scope.bidValue = $scope.bidValue - 500;
     }
   }
  };

  $scope.cancel_request = function(hideModel){
    if(hideModel == 1){
      $scope.bidPopUpModel.remove();
    }else if(hideModel == 2){
      $scope.increaseBidPopUpModel.remove();
    }else if (hideModel == 3){
      $rootScope.offeredByDriverListModel.remove();
    }
    $rootScope.reset_ride();
    $rootScope.resetPassenger();
    $rootScope.go_home(AuthService.getUserData().user_role);
  };

  $scope.increaseBidAmount = function () {
    API.increaseBid($scope.notyID,$scope.bidValue)
      .then(function (response) {
        console.log(JSON.stringify(response));
        //Msgs.show_redirect($rootScope.i18nStrings.mappedPointsDriver.requestRejected, 'app.map');
        Msgs.show($rootScope.i18nStrings.mappedPoints.requestSuccess, 3000);
        $rootScope.invitationSent = true;
        $scope.responseRideId = response.data.id;
        showCustomPopup();
        debugger;
        if($scope.increaseBidPopUpModel) {
          $scope.increaseBidPopUpModel.hide();
        }

      }, function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPointsDriver.errorCanceling, 3000);
      });

  };


});

