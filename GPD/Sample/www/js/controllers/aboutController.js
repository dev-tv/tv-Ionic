angular.module('go-plan-do.aboutController', ['ionic.native'])
	.controller("AboutController", ['$scope', 'Projects', '$ionicModal', '$rootScope',
		'WorkItems', 'SyncVSOWorkItems', 'chartService', '$filter', '$cordovaSocialSharing',
		'performCRUDService', 'basicAuthorizationService', 'moment', '$state', '$window',
		function($scope, Projects,
			$ionicModal, $rootScope, WorkItems, SyncVSOWorkItems, chartService, $filter, $cordovaSocialSharing,
			performCRUDService, basicAuthorizationService, moment, $state, $window) {

      $scope.$on("$ionicView.enter", function(event, data){
        $rootScope.hdr = '';
      });

			localStorage.removeItem('filterText');
			//initialize app version
			$rootScope.appVersion = "0.0.1";
			$scope.title = "About ";
			if (window.cordova) {
				cordova.getAppVersion.getVersionNumber(function(version) {
					if (String(version).includes(".")) {
						$rootScope.appVersion = version;
					} else {
						var majorVersionPoint = parseInt(moment().year()) - 2016;
						var minorPointMonth = parseInt(moment().month()) + 1;
						$rootScope.appVersion = String(majorVersionPoint) + "." + String(minorPointMonth) + "." + version;
					}
				});
			}

			var email = {
				to: 'support@goplando.com',
				subject: 'Feedback: Descriptive Title Here',
				body: 'Constructive feedback welcome. :)',
				isHtml: true
			};

			$scope.shareGeneral = function() {

				var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
				if (app) {

					$cordovaSocialSharing
						.share('Checkout the GoPlanDo project management app for Android and IOS', 'Amazing App', "./images/chart.png", 'http://www.goplando.com', function(sucess) {
							alert("GoPlanDo has been successfully shared :)");
						}, function(error) {
							alert("Not able to share GoPlanDo because, " + error);
						});
				}
			};

			$scope.composeEmail = function() {
                window.open("https://goplando.supporthero.io/content", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes')
				/*$cordovaSocialSharing
					.canShareViaEmail()
					.then(function(result) {
						// yes we can
						$cordovaSocialSharing
							.shareViaEmail('Constructive feedback is welcome. :) <p> [App Version ' + $rootScope.appVersion + '], [DB Version ' + $rootScope.currentDBVersion + ']', "GoPlanDo Feedback", ['support@goplando.com'], null, null, null)
							.then(function(result) {}, function(err) {
								// An error occurred. Show a message to the user
							});
					}, function(err) {
						// Nope
						alert("Please configure email");
					});*/
			};

			//open the tours page

			$scope.openToursPage = function() {
				window.open("http://goplando75.mrktgpg.com/video-tours", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
			};

			// Open the Privacy link
			$scope.openPrivacy = function() {
				window.open("http://goplando75.mrktgpg.com/privacy", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
			};

			// Trigger the privacy modal to close it
			$scope.closeprivacyModal = function() {
				$scope.privacyModal.hide();
				$scope.privacyModal = null;
			};

			// Open the terms  modal	
			$scope.openTerms = function() {
				window.open("http://goplando75.mrktgpg.com/terms/", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
			};

			// Trigger the login modal to close it
			$scope.closeTermsModal = function() {
				$scope.termModal.hide();
				$scope.termModal = null;
			};

		}
	]);