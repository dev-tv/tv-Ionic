/**
 * Created on 09/07/15.
 * Marking the Amount of Routes Controller
 * Step 1 to request a service
 */

app.controller('MarkRoutesCtrl', function($scope, $rootScope, $stateParams, $timeout, ionicMaterialMotion, ionicMaterialInk,
                                            $state, Msgs, API) {
  // Set Header
  $scope.$parent.showHeader();
  $scope.$parent.clearFabs();
  $scope.isExpanded = false;
  $scope.$parent.setExpanded(false);
  $scope.$parent.setHeaderFab(false);
  $scope.has_company = true;

  $scope.cardPaymentForm='';

  API.passengerHasCompany()
    .then(function(response) {
      Msgs.close();
      $scope.has_company = true;
    }, function(response) {
      Msgs.close();
      $scope.has_company = false;
    });

  if($rootScope.passengerAddress == undefined){
    $rootScope.passengerAddress = $rootScope.i18nStrings.markRoutes.findinfLocation;
    $rootScope.getAddress($rootScope.gpsPassengerLat, $rootScope.gpsPassengerLng,false);
  }

  $scope.paymentMethodChanged = function (){
    console.log($rootScope.data.paymentMethod);
  };
  $scope.changePassengerLocation = function(){

    $rootScope.msgsLabel = $rootScope.i18nStrings.markRoutes.pickLocation;
    $rootScope.mapSearchInputPlaceholder= $rootScope.i18nStrings.markRoutes.pickLocationPH;
    $rootScope.setPassengerLocationMode = true;
    console.log($rootScope.setPassengerLocationMode);
    $state.go('app.map');
  };

  $scope.checknumber = function(value) {
    $rootScope.cp_number = parseInt(value);
  };

  $scope.startCheckPoints = function() {

    $rootScope.mapSearchInputPlaceholder=$rootScope.i18nStrings.markRoutes.pickDestination;
    $rootScope.msgsLabel = $rootScope.i18nStrings.markRoutes.pickDestinationLbl;
    $rootScope.setPassengerLocationMode = false;
    $state.go('app.map');
  };
  $rootScope.lastState=$scope.startCheckPoints;

  $scope.text_payment_method = function () {
    return ($rootScope.data.paymentMethod == "efectivo") ? $rootScope.i18nStrings.markRoutes.cash : ($rootScope.data.paymentMethod == "ticket") ? $rootScope.i18nStrings.markRoutes.voucher : $rootScope.i18nStrings.markRoutes.creditcard;
  }
});
