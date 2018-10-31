/**
 * Created on 08/10/2015.
 * Check Points -Visible on Map for Driver- Controller
 *
 */

app.controller('MappedPointsDriverCtrl', function($rootScope, $scope, $state, API, Msgs, gcm, SecuredPopups, CURRENCY,$filter, UNIT_SYSTEM,COMPANY_NAME,$ionicModal,$timeout) {

  // It indicates that a service is active
  // If activeService is undefined then assign to false
  // ===================================================
  //Variable bool que muestra o esconde el boton de menu
  $rootScope.menuToggleBtn=false;


  if ($rootScope.activeService === undefined) $rootScope.activeService = false;

  var lat_c           = $rootScope.dataServiceRequest.routePoints.lat_c;
  var lng_c           = $rootScope.dataServiceRequest.routePoints.lng_c;
  var checkPoints     = $rootScope.dataServiceRequest.routePoints.checkPoints;
  var cp_num          = $rootScope.dataServiceRequest.routePoints.cp_num;

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

  var dist_unit = (UNIT_SYSTEM ==='km')?$rootScope.i18nStrings.app.distanceUnitKm : $rootScope.i18nStrings.app.distanceUnitMiles;

  $scope.totalKm = $rootScope.dataServiceRequest.routePoints.total_d + dist_unit;
  $scope.totalMin = $rootScope.dataServiceRequest.routePoints.total_t + ' Min';


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
        var refPoint =($rootScope.dataServiceRequest.r_point!=null)?$rootScope.i18nStrings.app.serviceInfoReference + $rootScope.dataServiceRequest.r_point:'';

        var dist_unit = (UNIT_SYSTEM ==='km')?$rootScope.i18nStrings.app.distanceUnitKm : $rootScope.i18nStrings.app.distanceUnitMiles;

        console.log('mostrando informacion');

        //OCULTADO PARA TRIPCOLOMBIA
//HIDDEN FOR TRIPCOLOMBIA

        var latlng = new google.maps.LatLng($rootScope.dataServiceRequest.routePoints.checkPoints[0].latitude,$rootScope.dataServiceRequest.routePoints.checkPoints[0].longitude);
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'latLng': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var pickupAddress= results[0].formatted_address;
            var latlng = new google.maps.LatLng($rootScope.dataServiceRequest.routePoints.checkPoints[1].latitude,$rootScope.dataServiceRequest.routePoints.checkPoints[1].longitude);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({'latLng': latlng}, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                var destinationAddress=results[0].formatted_address;
                var payment_method = $rootScope.dataServiceRequest.payment_method;
                if($rootScope.dataServiceRequest.payment_method === 'fund'){
                  payment_method = 'Saldo';
                }

                if(!$rootScope.dataServiceRequest.bid_cost.method) {

                  $rootScope.winPopup = SecuredPopups.show('alert', {
                    title: '<div class="padding-top-20 padding-bottom-20"><img src="img/modal/realizar_pago.png" class="img-centrado"></div><span class="title-modal">' + $rootScope.i18nStrings.app.serviceInfo + '</span>',
                    template: '<span class="text-gray text-justify">' + refPoint
                    + $rootScope.i18nStrings.app.origin + ' ' + pickupAddress
                    + $rootScope.i18nStrings.app.destination + ' ' + destinationAddress

                    + $rootScope.i18nStrings.app.youRecieveText
                    + $rootScope.i18nStrings.app.baseFare + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost_details.base_fare
                    + $rootScope.i18nStrings.app.serviceInfoDistance + $rootScope.dataServiceRequest.routePoints.total_dist + ' ' + dist_unit
                    /*+ $rootScope.i18nStrings.app.serviceInfoTime + $rootScope.dataServiceRequest.routePoints.total_time*/
                    + $rootScope.i18nStrings.app.time + $rootScope.dataServiceRequest.routePoints.total_time + ' min'
                    + $rootScope.i18nStrings.app.waitTime + $rootScope.dataServiceRequest.route_cost_details.wait_time_total + ' min'
                    + $rootScope.i18nStrings.app.grandTotal + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.grand_total), 2)
                    /*+ $rootScope.i18nStrings.app.serviceInfoCost + CURRENCY  + ' ' + $rootScope.dataServiceRequest.route_cost*/

                    + $rootScope.i18nStrings.app.riderPays + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.rider_pays), 2)
                    + '</br></br>'
                    + '<b>' + COMPANY_NAME + '</b>' + $rootScope.i18nStrings.app.appCompanyRecieves
                    + $rootScope.i18nStrings.app.serviceFee + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.service_fee), 2)
                    + $rootScope.i18nStrings.app.bookingFee + CURRENCY + ' ' + $rootScope.dataServiceRequest.route_cost_details.booking_fare
                    + $rootScope.i18nStrings.app.paymentMethodText + ' ' + payment_method

                    + '</br>' + $rootScope.i18nStrings.app.total + CURRENCY + ' ' + $filter('number')(parseFloat($rootScope.dataServiceRequest.route_cost_details.total), 2)
                    + '</span>',
                    okText: $rootScope.i18nStrings.app.serviceInfoOk
                  });
                }else{
                  var newHight = window.screen.height - 40 ;
                  //if (!$rootScope.bidList){
                  $rootScope.bidList = [];

                  // }


                  getAddressFromLatLng($rootScope.dataServiceRequest.routePoints.checkPoints[0].latitude,
                    $rootScope.dataServiceRequest.routePoints.checkPoints[0].longitude,
                    function (succ, data) {
                    if(succ) {
                      $rootScope.dataServiceRequest.sourceAddress = data;
                      getAddressFromLatLng($rootScope.dataServiceRequest.routePoints.checkPoints[1].latitude,
                        $rootScope.dataServiceRequest.routePoints.checkPoints[1].longitude,
                        function (_succ, _data) {
                        if(_succ) {
                          $rootScope.dataServiceRequest.destinationAddress = _data;
                          $rootScope.bidList.push($rootScope.dataServiceRequest);
                        } else {
                          $rootScope.dataServiceRequest.destinationAddress = '';
                          $rootScope.bidList.push($rootScope.dataServiceRequest);
                        }
                        });
                    } else {
                      $rootScope.dataServiceRequest.sourceAddress = '';
                      getAddressFromLatLng($rootScope.dataServiceRequest.routePoints.checkPoints[1].latitude,
                        $rootScope.dataServiceRequest.routePoints.checkPoints[1].longitude,
                      function (_succ, _data) {
                        if(_succ) {
                          $rootScope.dataServiceRequest.destinationAddress = _data;
                          $rootScope.bidList.push($rootScope.dataServiceRequest);
                        } else {
                          $rootScope.dataServiceRequest.destinationAddress = '';
                          $rootScope.bidList.push($rootScope.dataServiceRequest);
                        }
                      });
                    }
                  });


                  // var latlng = new google.maps.LatLng(lat, lng);
                  // var geocoder = new google.maps.Geocoder();
                  // geocoder.geocode({'latLng': latlng}, function(results, status) {
                  //   if (status == google.maps.GeocoderStatus.OK) {
                  //     var latlng = new google.maps.LatLng(lat, lng);
                  //     var geocoder = new google.maps.Geocoder();
                  //     geocoder.geocode({'latLng': latlng}, function(results, status) {
                  //       if (status == google.maps.GeocoderStatus.OK) {
                  //
                  //
                  //
                  //         $rootScope.dataServiceRequest.address = results[0].formatted_address;
                  //         $rootScope.bidList.push($rootScope.dataServiceRequest);
                  //       }
                  //     });
                  //
                  //
                  //     $rootScope.dataServiceRequest.address = results[0].formatted_address;
                  //     $rootScope.bidList.push($rootScope.dataServiceRequest);
                  //   }
                  //});




                  $ionicModal.fromTemplateUrl('templates/ModelPopUp/driver_offered_bid_list.html', {
                    scope: $scope,
                  }).then(function (modal) {
                    $rootScope.offeredDriverListModel = modal;
                    $rootScope.offeredDriverListModel.show();
                    $timeout(function() {
                      document.getElementsByClassName("modal-backdrop active")[0].setAttribute('style','top: auto; bottom: 0px');
                    }, 50);

                  });
                }
              }
            });
          }
        });
      } else {
        console.log('Could not display directions due to: ' + status);
      }
    });
  };

  function getAddressFromLatLng(lat, lng, cb) {
    var latlng = new google.maps.LatLng(lat, lng);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        cb(true, results[0].formatted_address);
      } else {
        cb(false, results[0].formatted_address);
      }
    });
  }

  console.log('checkPoints: ', checkPoints);

  $scope.displayRoute(checkPoints, cp_num, directionsService, directionsDisplay);

  // Driver accepts the request
  // =========================
  $scope.accept_request = function(){
    gcm.clear_notifications();

    API.driverAcceptRequest($rootScope.dataServiceRequest.notification_id)
      .then(function (response) {
        // It indicates that the service is active
        $rootScope.activeService = true;
        $rootScope.dataServiceRequest.ride_id = response.data.id;

        console.log("twilio_temporal_phone: ", response.data.twilio_temporal_phone);
        // If the server does not send the twilio phone is because twilio not activated on server
        if (response.data.twilio_temporal_phone != undefined) $rootScope.dataServiceRequest.passenger.phone = response.data.twilio_temporal_phone;

        Msgs.show_redirect($rootScope.i18nStrings.mappedPointsDriver.notificationSent, 'app.ride_request');
        $rootScope.lastState='blockBack';
        if($scope.bidDetailModal) {
          $scope.bidDetailModal.remove();
        }
        if($scope.offeredDriverListModel) {
          $scope.offeredDriverListModel.remove();
        }
      }, function(response) {
        Msgs.show($rootScope.i18nStrings.mappedPointsDriver.errorTryAgain, 3000);
      });
  };

  // Driver rejects the request
  // =========================
  $scope.reject_request = function() {

    gcm.clear_notifications();
    API.cancelNotificationService($rootScope.dataServiceRequest.notification_id)
      .then(function (response) {
        Msgs.show_redirect($rootScope.i18nStrings.mappedPointsDriver.requestRejected, 'app.profile');
        if($scope.bidDetailModal) {
          $scope.bidDetailModal.remove();
          console.log("bid detail from driver constoller  removed ");
        }
        if($scope.offeredDriverListModel) {
          $scope.offeredDriverListModel.remove();
          console.log("bid list from driver constoller  removed ");
        }
      }, function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPointsDriver.errorCanceling, 3000);
      });
  };

  $scope.offeredBidAmount = 500;


  $scope.requestBackBidAmount = function (increaseBy) {
    // if(notification_id == 1){
    //   $scope.offeredBidAmount = $scope.offeredBidAmount + 500;
    // }else if(notification_id == 2){
    //   $scope.offeredBidAmount = $scope.offeredBidAmount + 1000;
    // }else if(notification_id == 3){
    //   $scope.offeredBidAmount = $scope.offeredBidAmount + 1500;
    // }
    API.requestBackBid($rootScope.dataServiceRequest.notification_id,$scope.offeredBidAmount)
      .then(function (response) {
        console.log(JSON.stringify(response));
        $scope.responseRideId = response.data.notification_id;
        // debugger;
        if($scope.bidDetailModal) {
          $scope.bidDetailModal.remove();
        }
      }, function (response) {
        Msgs.show($rootScope.i18nStrings.mappedPointsDriver.errorCanceling, 3000);
      });

  };


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

  //Send request api to offer back a ride to passenger with increase amount



  $scope.showBidDetail = function (bideddData) {
    var newHight = window.screen.height ;
    $rootScope.dataServiceRequest =  bideddData;


    $scope.getFullAddress(bideddData.routePoints.checkPoints[0].latitude,bideddData.routePoints.checkPoints[0].longitude,true);
    $scope.getFullAddress(bideddData.routePoints.checkPoints[1].latitude,bideddData.routePoints.checkPoints[1].longitude,false);
    $scope.offeredBidAmount = bideddData.bid_cost.value;
    $scope.bidDetailData = bideddData

    $ionicModal.fromTemplateUrl('templates/ModelPopUp/driver_offered_bid_detail.html', {
      scope: $scope,
    }).then(function (modal) {

      $scope.bidDetailModal = modal;
      $scope.bidDetailModal.show();
      $timeout(function() {
        //document.getElementsByClassName("modal-backdrop active")[0].className += " customePopUpList";
        $timeout(function() {
          document.getElementsByClassName("modal-backdrop active")[0].setAttribute('style','top: auto; height:'+newHight+'px;bottom: 0px');
        }, 50);
        var mapEl=document.getElementById('mapas');

        var styles =[{
          featureType: "poi",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
          ]
        },{"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#7c93a3"},{"lightness":"-10"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"on"}]},{"featureType":"administrative.country","elementType":"geometry.stroke","stylers":[{"color":"#a0a4a5"}]},{"featureType":"administrative.province","elementType":"geometry.stroke","stylers":[{"color":"#62838e"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#dde3e3"}]},{"featureType":"landscape.man_made","elementType":"geometry.stroke","stylers":[{"color":"#3f4a51"},{"weight":"0.30"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.government","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.place_of_worship","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":"-100"},{"visibility":"on"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#bbcacf"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"lightness":"0"},{"color":"#bbcacf"},{"weight":"0.50"}]},{"featureType":"road.highway","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"road.highway","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"road.highway.controlled_access","elementType":"geometry.stroke","stylers":[{"color":"#a9b4b8"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"invert_lightness":true},{"saturation":"-7"},{"lightness":"3"},{"gamma":"1.80"},{"weight":"0.01"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#a3c7df"}]}];


        $scope.map = new google.maps.Map(mapEl, {
          zoom: 16,
          center: {lat: bideddData.routePoints.checkPoints[0].latitude, lng: bideddData.routePoints.checkPoints[0].longitude},
          disableDefaultUI: true,
          styles: styles
        });
        // var myLatLng = {lat: bideddData.routePoints.checkPoints[0].latitude, lng: bideddData.routePoints.checkPoints[0].longitude};

        var directionsDisplay = new google.maps.DirectionsRenderer();
        var directionsService = new google.maps.DirectionsService();
        directionsDisplay.setMap($scope.map);

        var start = new google.maps.LatLng(bideddData.routePoints.checkPoints[0].latitude, bideddData.routePoints.checkPoints[0].longitude);
        var end = new google.maps.LatLng(bideddData.routePoints.checkPoints[1].latitude, bideddData.routePoints.checkPoints[1].longitude);
        var request = {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, function(response, status) {
          console.log(response);
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
            directionsDisplay.setMap($scope.map);
          } else {
            alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
          }
        });


      }, 50);

    });

  }

  //set last state
  $rootScope.lastState=$scope.reject_request;



});
