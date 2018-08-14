angular.module('go-plan-do.settingsController', ['ionic.native'])
.controller("SettingsController", ['$ionicPopup','$cordovaFile','underscore', 'VSTSTeamMembers', 'VSTSTeams',
  'SyncProgressService', 'Subscriptions', 'moment', 'SCRUMSOUP_API', 'HIRE_API', 'EmailProvider', 'TriageEmailSettings',
  '$scope', '$ionicHistory', 'Projects', '$interval', 'Credentials', 'SyncVSOWorkItems', 'SyncVSTSTeamMembers', '$ionicModal', '$timeout',
   'performCRUDService', 'rootURLService', '$ionicLoading', 'basicAuthorizationService', '$rootScope', '$q',
    '$cordovaNetwork', '$cordovaToast', 'WorkItems', '$state', 'IterationHours', 'pushService', '$stateParams',
    'ionicDatePicker', '$filter', 'CHECK_ENV','Images','$cordovaOauth', function ($ionicPopup, $cordovaFile,underscore,VSTSTeamMembers,VSTSTeams,
      SyncProgressService,Subscriptions,moment,SCRUMSOUP_API,HIRE_API,EmailProvider,TriageEmailSettings,$scope,$ionicHistory,
      Projects,$interval, Credentials, SyncVSOWorkItems, SyncVSTSTeamMembers, $ionicModal, $timeout, performCRUDService, rootURLService, $ionicLoading, basicAuthorizationService, $rootScope, $q, $cordovaNetwork, $cordovaToast, WorkItems, $state, IterationHours, pushService ,$stateParams, ionicDatePicker, $filter, CHECK_ENV, Images, $cordovaOauth) {
  $scope.$on("$ionicView.enter", function(event, data){
    $rootScope.hdr = '';
    if($stateParams.viewscope!=='subscribe'){
        Subscriptions.checkIfFreeTrialExpired();
    };
		if(ionic.Platform.isIOS()){
			$scope.devicePlatform="IOS";
		}
		if(ionic.Platform.isAndroid()){
			$scope.devicePlatform="Android";
		}
		$scope.guidedState = -1;
    $scope.guidedStateAdd = -1;

  });


  $scope.viewScope = $stateParams.viewscope;
  if($stateParams.viewscope === "app"){
  	  $scope.title = "App Settings";

      $scope.backlogRefreshTimes = [{
              time: 7,
              name: "7 Minutes"
            }, {
              time: 15,
              name: "15 Minutes"
            }, {
              time: 30,
              name: "30 Minutes"
            }, {
              time: 45,
              name: "45 Minutes"
            },{
              time: 60,
              name: "60 Minutes"
            }];

      $scope.remiaingHours = [{
          time: 1,
          name: "1 Hours"
      }, {
          time: 3,
          name: "3 Hours"
      }, {
          time: 5,
          name: "5 Hours"
      }, {
          time: 8,
          name: "8 Hours"
      }, {
          time: -1,
          name: "OFF"
      }];

  	  Projects.getAutoQueryBacklogTime(1).then(function(res){
      		if(res != undefined){
             $scope.selectedTime = parseInt(res.backlogTime) / 60000;
             if(!res.remainingHrs) {
                 Projects.updateRemainingHrs('8',1).then(function(res){});
                 $scope.selectedHours = 8;
             } else {
                 $scope.selectedHours = parseInt(res.remainingHrs);
             }
             $scope.notification_recv = (res.notification_recv== 1)? true : false;
			 $scope.notification_send = (res.notification_send == 1)? true : false;
      	   }else{
              $scope.notification_recv = false;
			   $scope.notification_send = false;
           }
      });

  	  $scope.selectRefreshBackLogTime = function(time, notification_recv, notification_send, reminingHrs){
            // $scope.selectedTime = undefined;
            var timeInMilliseconds = time * 60000;
		    if(CHECK_ENV.runningInDevice){
				if(notification_recv == false){
					$rootScope.pushObj.unregister(function() {
							//alert("success")
							//console.log('success');
						}, function() {
							alert("fail")
							console.log('error');
						});
				}else{
					$rootScope
          .initializeNotification(1000)
          .then(function(data){
						  console.log($scope.devicePlatform);
							if(!$rootScope.internetDisconnected){
							   Projects
							  .getAllVSTSProjectCredentials()
							  .then(function(allProjects){
									if (allProjects.length>0) {
										var j = 0;
										for(var i = 0; i < allProjects.length; i++){
											async.waterfall([//iterate through the vsts projects updating the work items
											function(cb){
											  var projectID = allProjects[i].id;
												 cb(null,projectID);
											}
											,function(projectID, cb){
											  //then sync them sequentially

											 pushService.uploadNotificationRec(projectID, $scope.devicePlatform)
												.then(function(success){
													  j++;
													  if(j === allProjects.length){
														//console.log("keys  Updated Successfully");
														// alert("updated All keys sami")
													  }
												},function(error){
													 j++;
													  if(j === allProjects.length){
														// console.log("Work Items Updated Successfully");
													}
											  });
											}],function (error) {
												if (error) {
													console.log(error);
												}

										   });

										}

									}
							  });

							}

					});

				}

			}

            Projects.getAutoQueryBacklogTime(1).then(function(res){
                if(res == undefined || res == ""){
                  var recv = (notification_recv == true) ? 1 : 0;
				         var send = (notification_send == true) ? 1 : 0;

                }else{
                  var recv = (notification_recv == true) ? 1 : 0;
				          var send = (notification_send == true) ? 1 : 0;
                  Projects
                  .updateTime(timeInMilliseconds, recv, send, res.notification_uuid ,1)
                  .then(function(res){
                      Projects.updateRemainingHrs(reminingHrs + '',1).then(function(res){});
                        // $scope.selectedTime = undefined;
                        alert("App settings updated successfully");
                  });
                }
            });

        };


  	  if (typeof String.prototype.startsWith != 'function') {
                String.prototype.startsWith = function (str){
                    return this.indexOf(str) == 0;
                };
      }
	}






  if($stateParams.viewscope === "project"){

    $scope.title = "Project Settings";
    $scope.hireTitle = 'adasd';
    $scope.hireDescription = 'asdasd';
    $scope.hireMode = 'ADD';

    // Backup file
	function checkAuthentication(){
		var q = $q.defer();
		if($rootScope.onedrive_token != undefined){
				performCRUDService.simpleGet("https://apis.live.net/v5.0/me/skydrive/files", basicAuthorizationService.basicBearer($rootScope.onedrive_token),function(successAllFiles){
					var result = {};
					result.access_token = $rootScope.onedrive_token
					q.resolve(result);
				},function(error){

					$cordovaOauth.windowsLive("02a08335-7568-4acb-8c90-0430b72ae262", ["wl.signin, wl.skydrive_update "]).then(function(result) {
						$rootScope.onedrive_token = result['access_token'];
						q.resolve(result);
					}, function(error) {
					console.log("Error -> " + error);
					$ionicLoading.hide();
					q.reject("fail")
					});

				});
		}else{
			$cordovaOauth.windowsLive("02a08335-7568-4acb-8c90-0430b72ae262", ["wl.signin, wl.skydrive_update "]).then(function(result) {
						$rootScope.onedrive_token = result['access_token'];
						q.resolve(result);
					}, function(error) {
					console.log("Error -> " + error);
					$ionicLoading.hide();
					q.reject("fail");
					});

		}
		return q.promise;
	};

	function askFileNameForOneDrive(){
		var q = $q.defer();
		$scope.exportData = {}
		var myPopup = $ionicPopup.show({
			template: '<input type="text" ng-model="exportData.name" placeholder="i.e grocery_items">',
			title: 'Enter meaning full Name',
			scope: $scope,
			buttons: [{
				text: '<b>Save</b>',
				type: 'button-positive',
				onTap: function(e) {
				  if (!$scope.exportData.name) {
					//don't allow the user to close unless he enters wifi password
					e.preventDefault();
				  } else {
					  q.resolve($scope.exportData.name)
					//alert($scope.exportData.name)
					return $scope.exportData.name;
				  }
				}
			  }
			]
		});

		return q.promise;
	};



		$scope.importPersonalProject = function(){

			// Added by Ashish
		/* check Free trial over & user has not subscribed */
		 if($rootScope.freeTrialVersionHasExpired && !$rootScope.userSubscribed){
                            var expiryAlert = "Your free trial has been expired. Please subscribe to Restore Personal Project. Thanks."

                              if(window.cordova){
                                navigator.notification.alert(expiryAlert, function() {
                                 }, "Free Trial Expired", "OK");
                              }else{
                                  alert("Your free trial has been expired. Please subscribe to Restore Personal Project. Thanks.");
                              }
                      }else{
			if(window.cordova){
				checkAuthentication().then(function(result) {

					$ionicLoading.show({
						template: 'Importing Tasks from Drive..',
						delay: 500
					});

					performCRUDService.simpleGet("https://apis.live.net/v5.0/me/skydrive/files", basicAuthorizationService.basicBearer(result['access_token']),function(successAllFiles){

						var isGoPlanFolder = _.find(successAllFiles['data'], function(num){ return num['name'] == 'GoPlanDo'; });
						if(isGoPlanFolder){

							performCRUDService.simpleGet("https://apis.live.net/v5.0/"+isGoPlanFolder.id+"/files", basicAuthorizationService.basicBearer(result['access_token']),function(success){
								$ionicLoading.hide();
								$scope.list_files = {};
								   $scope.list_files.token = result['access_token'];
								   $scope.list_files.data = success['data']
								   $scope.importOneDriveFilesModelFnc();


							},function(error2){
									console.log(JSON.stringify(error2))
							})
						}else{
							alert("Please Export your tasks first to Drive");
							$ionicLoading.hide();
						}

					},function(error){
					console.log(JSON.stringify(error));
					});
				}, function(error) {
					alert("Registeration Error")
					console.log("Error -> " + error);
				});

			}
			else{
				console.log("restoring backup")
			}
          }
		};


		$scope.ImportMeFromOneDrive=function(file, token){
			$ionicLoading.show({
				template: 'Importing Tasks from Drive...',
				delay: 500
			});
			performCRUDService.simpleGet("https://apis.live.net/v5.0/"+file.id+"/content?access_token="+token, basicAuthorizationService.basicBearer,function(success){
				//console.log(JSON.stringify(success));
				$scope.closeOneDriveFilesModel();
				var backedUpWorkItems = success;
				backedUpWorkItems
				.forEach(function(backedUpWorkItem,index){
					WorkItems
					 .addWorkItem(backedUpWorkItem)
					 .then(function(){
						if((index + 1)===backedUpWorkItems.length){
							$ionicLoading.hide();
							alert("Personal project work items restored successfully");
						}

						});

				});

			},function(error){
				alert(JSON.stringify(error));

				$scope.closeOneDriveFilesModel();
				$ionicLoading.hide();
			});

		};


		$scope.exportPersonalProject = function(){
            // Added by Ashish
            WorkItems.getWorkItemsByProjectID(1).then(function(personalProjectWorkitems){
                if(personalProjectWorkitems.length > 0){
                    filterWorkItems(personalProjectWorkitems, function (filterdWorkItems) {
                        if(filterdWorkItems.length > 0){
                            checkAuthentication().then(function(result){
                                askFileNameForOneDrive().then(function(fileName){
                                    var date =$filter('date')(new Date(),'MM-dd-yy');
                                    fileName = fileName+"_"+date+".json";
                                    $ionicLoading.show({
                                        template: 'Uploading Tasks ...',
                                        delay: 500
                                    });
                                    performCRUDService.simpleGet("https://apis.live.net/v5.0/me/skydrive/files", basicAuthorizationService.basicBearer(result['access_token']),function(successAllFiles){
                                        var isGoPlanFolder = _.find(successAllFiles['data'], function(num){ return num['name'] == 'GoPlanDo'; });
                                        if(isGoPlanFolder){
                                            var url = "https://apis.live.net/v5.0/"+isGoPlanFolder.id+"/files/"+fileName+"?access_token="+result['access_token'];
                                            uploadFilesToDrive(url, filterdWorkItems);
                                        }else{
                                            createGoPlanDoFolder(basicAuthorizationService.basicBearerJson(result['access_token'])).then(function(folderCreation){
                                                // console.log(JSON.stringify(folderCreation));
                                                var url = "https://apis.live.net/v5.0/"+folderCreation.id+"/files/"+fileName+"?access_token="+result['access_token'];
                                                uploadFilesToDrive(url, filterdWorkItems);
                                            })
                                        }
                                    },function(errorAllFiles){
                                        alert("Error "+JSON.stringify(errorAllFiles));
                                        $ionicLoading.hide();
                                    });
                                });
                            }, function(error) {
                                console.log("Error -> " + error);
                                $ionicLoading.hide();
                            });
                        } else {
                            alert("No work item in personal item")
                        }
                    });
                }else{
                    alert("No work item in personal item")
                }
            });
		};

		function filterWorkItems(wItems, cb) {
      var fArr = [];
      for(var i = 0;i < wItems.length;i++) {
        if(wItems[i].workItemDeleted == 0) {
          fArr.push(wItems[i]);
          if(i == (wItems.length - 1)){
            cb(fArr);
          }
        }
      }
    }


		$scope.showConfirmationForRemoveOneDriveFile = function(file, token,index){
			//alert(file.name)
			var confirmPopup = $ionicPopup.confirm({
				title:'Confirm ',
				template: 'Are you sure you want to remove this file One Drive?'
			});

			confirmPopup.then(function(resConfirmed){
				if(resConfirmed){
					$scope.deleteFileFromOneDrive(file.id, token, index)
					//$scope.confirmDeleteProj(projectID)
				}else{

				//alert("Not removed")
				}

			});
		};

		$scope.deleteFileFromOneDrive=function(fileID, token ,index){
			performCRUDService.simpleDelete("https://apis.live.net/v5.0/"+fileID+"?access_token="+token, "DELETE", function(success){
				//alert(JSON.stringify(success))
				$scope.list_files.data.splice(index, 1);
				if (!$scope.$$phase)$scope.$apply()


			},function(error){
				alert(JSON.stringify(error))
			})

		}


		function findGoPlanDoDriveFolder(success){
			var object = _.find(success['data'], function(num){ return num['name'] == 'GoPlanDo'; });
			//console.log(JSON.stringify(object))
			return object;
		}


		function createGoPlanDoFolder(headers){
			var q = $q.defer();
			performCRUDService.simpleCreate("https://apis.live.net/v5.0/me/skydrive","POST",{"name": "GoPlanDo"}, headers,
				function(successFile){
					q.resolve(successFile)
					alert("Folder created successfully");
					q.resolve(successFile)

				},function(errorFile){
					alert("Error "+JSON.stringify(errorFile))
					q.reject(successFile)
				});

			return q.promise;
		}


		function uploadFilesToDrive(url, personalProjectWorkitems){
			performCRUDService.simpleCreate(url,"PUT", personalProjectWorkitems, basicAuthorizationService.simpleConfig,
				function(successFile){
				//console.log(JSON.stringify(successFile));
				$ionicLoading.hide();
				alert("Personal Project Exported Successfully");

			},function(errorFile){
				console.log(JSON.stringify(errorFile));
				alert("Error "+JSON.stringify(errorFile))
				$ionicLoading.hide();

			});
		}


		$scope.closeOneDriveFilesModel= function () {
            $scope.importOneDriveFilesModel.hide();
            $scope.importOneDriveFilesModel = null;
			$scope.list_files = {};
		};

		$scope.importOneDriveFilesModelFnc = function(){
          $ionicModal.fromTemplateUrl('templates/popups/import-onedrive-files.html', {
              scope: $scope
          }).then(function (modal) {
              $scope.importOneDriveFilesModel = modal;
              $scope.importOneDriveFilesModel.show(); // showing Login Modal

          });
		};

      //vsts projects logic
		$scope.loginData = {vstsInstanceName:"",userToken:""};
		//$scope.loginData.userToken = "ygb724r4pqsbyk5a3onzhu2bj2izlpl3dixe2jaaoup4g6sito3q";
      //temp var for manipulating the area paths
      var loadedAreaPaths = [];
      //check if area paths have been flattened
      var areaPathsFlattened = false;
      //show the selected area path
      $scope.path = false;
       //control for whether to show the add VSTS instace form
      $scope.showAddVSTSInstance = true;
      //control for whether to show the select project dropdown
      $scope.showProjectSelection = false;
      //control for whether the add project button is shown or not
      $scope.showAddProjectButton=false;
      //object for storing the configs for downloading VSO work items
      $scope.addProjectConfig = {};
      //object fopr storing the config needed for updating a project
      $scope.updateProjectConfig = {};
      //control to check the project is being saved so as to disable the next button
      $scope.savingProject = false;
      // tree control options
      $scope.treeOptions = {
          nodeChildren: "children",
          dirSelectable: true,
          injectClasses: {
            ul: "a1",
            li: "a2",
            liSelected: "a7",
            iExpanded: "a3",
            iCollapsed: "a4",
            iLeaf: "a5",
            label: "a6",
            labelSelected: "a8"
          }
      };
      //the project selected from the dropdown
      $scope.selectedProject = "";
      //the selected vsts teams
      $scope.addProjectConfig.selectedVstsTeam = {};
      //the VSTS Teams variables
      var nextTeamsPage = 0;
      var vstsTeamsArray = [];

      //iteration creation object
      $scope.vstsIteration ={iterationName:"",startDate:"",endDate:""};
      //local vars
      var iterationStartDate = "";
      var iterationFinishDate = "";
      // random project id used for adding a new team
      var dummyProjectID = Math.floor(Math.random() * (92400 - 10 + 1)) + 10;

      //function that shows the relevant help video depending on where its been triggered from
      $scope.showHelp = function(helpType){
         if(helpType==='Adding VSTS Project'){
             window.open("https://goplando.supporthero.io/article/show/71694-creating-a-team-project", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes')
         }

      };

      //control for checking whether the "Get Access Token Button should be enabled"
      $scope.checkAccountTitle = function() {
           if($scope.loginData.vstsInstanceName!==undefined){
                  if ($scope.loginData.vstsInstanceName.length > 1) {
                   return false;
                  }
                  else {
                   return true;
                  }
           }else{
               return true;
           }

      };


      // Trigger the login modal to close it
      $scope.closeVSTSLoginModal = function () {
            $scope.vstsLoginModal.hide();
            $scope.vstsLoginModal = null;
             //control for whether to show the add VSTS instace form
            $scope.showAddVSTSInstance = true;
            //control for whether to show the select project dropdown
            $scope.showProjectSelection = false;
            //control for whether the add project button is shown or not
            $scope.showAddProjectButton=false;
      };
      // Open the login modal
      $scope.loginToVSTS = function () {

      	// Added by Ashish
      /* check Free trial over & user has not subscribed */
          if($rootScope.freeTrialVersionHasExpired && !$rootScope.userSubscribed){

              Projects.allProjects().then(function(allProject) {
                  //our scopes object data
                  $scope.data = {};
                  $scope.data.project = {};
                  $scope.data.project = [];
                  $scope.data.project = allProject;

                  // Check if project length is greater than 1
                  if ($scope.data.project.length > 1) {

                      var expiryAlert = "Your free trial has been expired. Please subscribe to get access to all the features. Thanks.";

                      if (window.cordova) {
                          navigator.notification.alert(expiryAlert, function() {}, "Free Trial Expired", "OK");
                      } else {
                          alert("Your free trial has been expired. Please subscribe to get access to all the features. Thanks.");
                      }

                  }else{
                      $scope.showAddVSTSInstance = true;

                      // showing login modal to get credentials from the user
                      $ionicModal.fromTemplateUrl('templates/popups/vsts-login-popup.html', {
                          scope: $scope
                      }).then(function (modal) {
                          $scope.vstsLoginModal = modal;
                          $scope.vstsLoginModal.show(); // show the VSTS login Modal
                      });
                  }
              });
          }else{
            $scope.showAddVSTSInstance = true;

            // showing login modal to get credentials from the user
            $ionicModal.fromTemplateUrl('templates/popups/vsts-login-popup.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.vstsLoginModal = modal;
                $scope.vstsLoginModal.show(); // show the VSTS login Modal
            });
        }
      };

      //get the instance access token from VSTS
      $scope.getToken = function(instanceName){
          if(instanceName!==undefined
              && instanceName.length > 0){
              window.open('https://'+instanceName+'.visualstudio.com/_details/security/tokens','_system','location=no,clearcache=yes,clearsessioncache=yes');
          }
      };

      $scope.createVstsAccountLink = function(){
          window.open('https://go.microsoft.com/fwlink/?LinkId=307137&clcid=0x409&wt.mc_id=o~msft~vscom~product-vsts-hero~464&campaign=gpd','_system','location=no,clearcache=yes,clearsessioncache=yes');
      };


      //login to VSTS and load the projects available
      $scope.getVSTSProjects = function() {
            $scope.vstsInstanceName = $scope.loginData.vstsInstanceName;
            $scope.authCredentials = btoa(":" +$scope.loginData.userToken);
            var  loaderClosed = false;

            //close the loader after a minute because it usually means the get has failed
            $timeout(function(){
              if(loaderClosed===false){

                  $ionicLoading.hide();
                    loaderClosed = true;
                  alert("Please check your token, it may have been inputted incorrectly or may have expired");

              }


            },60000);


            $ionicLoading.show({
                template: 'Loading VSTS Project(s)',
                delay: 500,
                scope:$scope
            });

            performCRUDService
            .simpleGet(rootURLService.projects($scope.vstsInstanceName) + "?" + rootURLService.apiVersion1,
            basicAuthorizationService.basicConfig($scope.authCredentials),
            function(data, status) {
              $scope.vstsProjects = data['value'];
              if(status!==203){
                  //check if credentials for the given VSO instance exist
                  $ionicLoading.hide();
                   loaderClosed = true;

                  //hide VSTS login div
                  $scope.showAddVSTSInstance = false;
                  //show the project selection div
                  $scope.showProjectSelection = true;
                  //clear the login form control scope
                  $scope.loginData = {};
              }
              else{
                $ionicLoading.hide();
                loaderClosed = true;
                 alert("Please check your token, it may have been inputted incorrectly or may have expired");

              }


            }, function(error, status) {
                console.log(error);
               //alert("Error,Unable to get VSTS project(s) because of "  +JSON.stringify(error));
                $ionicLoading.hide();
                 loaderClosed = true;
                alert("Please check your token, it may have been inputted incorrectly or may have expired");
            });
      };

      // Trigger the login modal to close it
      $scope.closeDeleteModal = function () {
            $scope.deleteModal.hide();
            $scope.deleteModal = null;
      };

      /*
      *  delete Projects pop up shows the total projects
      */
		$scope.deleteProject = function(){
		   $scope.data = {}
          $ionicModal.fromTemplateUrl('templates/popups/delete-project-popup.html', {
              scope: $scope
          }).then(function (modal) {
              $scope.deleteModal = modal;
              $scope.deleteModal.show(); // showing Login Modal

              Projects.addedVSProjects().then(function (allProjects) {
                $scope.projectsToDelete = [];
                $scope.projectsToDelete = allProjects;

              });

          });
		};


	  $scope.showConfirmationForRemoveProject = function (projectID){
			//console.log(projectID);
    		var confirmPopup = $ionicPopup.confirm({
    		  title:'Confirm ',
    		  template: 'Are you sure you want to remove this project?'
    		});

    		confirmPopup.then(function(resConfirmed){
    			if(resConfirmed){
    			    //alert("Removed")
    				$scope.confirmDeleteProj(projectID)
    			}else{

    				//alert("Not removed")
    			}

    		});

	  };



      /* first of all remove the subtasks belong to each vso task
      * After this get the the detail of project and delete all the tasks and project
      * at the end credential is deleted on the basis of user_id
      */
		$scope.confirmDeleteProj = function(projectID){

            WorkItems
            .removeProjectWorkItemsAndCredentials(projectID)
            .then(function(sucess){

                  $scope.deleteModal.hide();
                  $ionicHistory.clearCache()//clear the cached views to also remove the view of the deleted VSO project
                  .then(function(){
                      localStorage.setItem('selectedTab', 1);
                      $rootScope.teamScreenCache = undefined;
                        //finally reload the projects screen
                        $ionicHistory.clearCache()
                        .then(function() {
                          $state.go("tab.all", {projectID: 1})
                          .then(function() {
                            $ionicHistory
                            .clearCache()
                            .then(function(){
                                /*localStorage.setItem('selectedTab', 1);
                              $rootScope.refreshProjects();
                              $rootScope.refreshWorkItems();*/
                              if(window.cordova){
                                  cordova.plugins.notification.local.cancel(projectID, function() {
                                  //  alert("done");
                                });
                              }

                               alert("Project deleted successfully");
                            });

                          });
                        });

                  });

            });
		};

	   //function for closing the area path and  iteration modal
  	$scope.closeAreaPathAndIterationModal = function(){
            $scope.selectedProject = "";
            $scope.addProjectConfig = {};
            $scope.iterationModal.hide();

            //control for whether to show the add VSTS instace form
            $scope.showAddVSTSInstance = true;
            //control for whether to show the select project dropdown
            $scope.showProjectSelection = false;
            //control for whether the add project button is shown or not
            $scope.showAddProjectButton=false;
  	};
     //function for loading the VSTS teams
    function loadVSTSTeams(instanceName,vstsProjectID,credentials){
            if(nextTeamsPage===0){
              $ionicLoading.show({
                 template: 'Creating VSTS Area Paths Tree',
                 delay: 500
              });
            }

            performCRUDService
            .simpleGet(rootURLService.baseURL(instanceName)
            + "_apis/projects/"
            + vstsProjectID
            + "/teams?$top=1000&"
            + "$skip=" + nextTeamsPage + "&"
            + rootURLService.apiVersion2_2,
            basicAuthorizationService.basicConfig(credentials),
            function(data, status) {

                if(data.value.length>0){
                    data['value'].forEach(function(vstsTeamObject){
                       vstsTeamsArray.push(vstsTeamObject);
                    });

                    nextTeamsPage +=1000;
                    //recursively call the array until you get all teams
                    loadVSTSTeams(instanceName,vstsProjectID,credentials);
                }
                else{
                    $ionicLoading.hide();
                }

            },
            function(data, status) {
                alert("Error: " + data + " " + status);
                $ionicLoading.hide();
            });

      };
      $scope.getVSTSTeams= function (query, isInitializing) {

           if(query){
                  if(vstsTeamsArray.length > 0){
                      var returnArray = [];
                      vstsTeamsArray
                      .forEach(function(vstsTeam){
                          if (vstsTeam.name.toLowerCase().indexOf(query.toLowerCase()) > -1 ){
                              returnArray.push(vstsTeam);
                          }

                      });

                      return underscore.sortBy(returnArray,'name');
                  }
                  else{
                     return { items: [] };
                  }

           }
           else{
                   return underscore.sortBy(vstsTeamsArray,'name');
           }


      };

      //function for getting the area paths and loading them to the tree control
      function loadAreaPaths(accTitle, projName, credentials,  containerArray){
          $ionicLoading.show({
               template: 'Loading VSTS Area Path(s)',
               delay: 500
          });

          var q = $q.defer();
          performCRUDService
          .simpleGet(rootURLService.areaPathList(accTitle, projName, credentials),
          basicAuthorizationService.basicConfig(credentials),
          function(data, status) {

            containerArray.push(data);

            if(loadedAreaPaths.length > 0 && areaPathsFlattened===false){
                //flatten the area paths synchronously
                flattenAreaPaths();
                areaPathsFlattened=true;

            }

            $ionicLoading.hide();
            q.resolve();


          },function(error, status) {
                $ionicLoading.hide();
                q.resolve();

          });
          return q.promise;

      };
      //function to flatten the area paths array and get the selected node
      function flattenAreaPaths(){
          loadedAreaPaths
          .forEach(function(areaPath,parentIndex){
              if(areaPath.hasChildren){
                    var parentAreaPathName=areaPath.name;
                    var j = 1;
                    if(areaPath.children!==undefined){
                        areaPath.children.forEach(function(childAreaPath){
                           //set the name child area path name
                            childAreaPath.name = parentAreaPathName+"\\"+childAreaPath.name;
                            //insert the child area path in the parent area path
                            loadedAreaPaths.splice((parentIndex + j),0,childAreaPath);
                            j = j + 1;
                        });
                        //make the children flag false to prevent a stack overflow
                        areaPath.hasChildren = false;

                        //and then nulify the children
                        areaPath.children = undefined;

                        //recursively call method so as to flatten the array
                        flattenAreaPaths();
                    }
              }
          });
      };
      function getSelectedAreaPathNodeName(selectedNodeID){

          var selectedAreaPathName = "";
          //then filter for te selected node id
          loadedAreaPaths.filter(function(areaPath){
              if(areaPath.id===selectedNodeID){
                 selectedAreaPathName = areaPath.name;
              }
          });

          return selectedAreaPathName;
      };

  
	  function flattenIterations(iterations){
		  //console.log(iterations)
          if(iterations!==undefined){
			for(var i=1; i<iterations.length; i++){
				// console.log(iterations[i])
				if(iterations[i].hasChildren){
                  var parentIterationName=iterations[i].name;
                  var j = 1;

                  if(iterations[i].children!==undefined){
                      iterations[i].children.forEach(function(childIteration){

                          //set the name
                          childIteration.name = parentIterationName+"\\"+childIteration.name;

                          //insert the child iteration in the parent iteration
                          iterations.splice((i + j),0,childIteration);
                          j = j + 1;

                      });

                  }


                }
			}





          }

        return iterations;
      };

      //function sets the start and end dates of the respective iterations
      function setIterationDates(iterations){
          if(iterations!==undefined){
              iterations.forEach(function(iteration, index){
                  if(iteration.name!== undefined && iteration.attributes!==undefined){
                       iteration.displayName =  iteration.name + "  [" + moment(iteration.attributes.startDate).format('MM/DD/YY') + " : "
                                    + moment(iteration.attributes.finishDate).format('MM/DD/YY') + "]";

                  }
                  else{
                        iteration.attributes={};
                         iteration.attributes.startDate = moment();
                         iteration.attributes.finishDate = moment();
                       iteration.displayName = iteration.name;
                  }

              });
          }


          return iterations;
      };

      // Selection of Project from the dropdown
      $scope.showVSTSProjectAreaPath= function (selectedVSTSProject) {
            //hide the project select div
            $scope.showProjectSelection = false;
            if ((selectedVSTSProject !== undefined) && (selectedVSTSProject !== "")){
                  if(typeof selectedVSTSProject !== Object){
                     //if its not a proper JS object convert it to one
                     selectedVSTSProject= JSON.parse(JSON.stringify(selectedVSTSProject));
                  }

        		$scope.selectedProject = selectedVSTSProject;



        		    	$ionicLoading.show({
                     template: 'Loading VSTS Iteration(s)',
                     delay: 500
                  });
                  // Iteration Path Selection and Filtering on workitems
                  performCRUDService
                  .simpleGet(rootURLService.iterationsList($scope.vstsInstanceName, selectedVSTSProject.name),
                  basicAuthorizationService.basicConfig($scope.authCredentials),
                  function(data, status) {

                       //associate any child iterations with there parent iteration recursively and also set the iteration dates
                        $scope.iterations = setIterationDates(flattenIterations(data.children));

              				  $ionicModal.fromTemplateUrl('templates/popups/area-path-popup.html', {
                  				scope: $scope
                  			}).then(function (modal) {
                  			  $scope.guidedStateAdd = 0;
                  				$scope.iterationModal = modal;
                  				$scope.iterationModal.show();
                  			});

                      //initialize the area path tree model
                      $scope.areaPathTreeControlModel = [];

                      //populate our area path manipulator array first
                      loadAreaPaths($scope.vstsInstanceName,
                                    selectedVSTSProject.name,
                                     $scope.authCredentials,loadedAreaPaths)
                      .then(function(){

                           //after getting the iterations load the area paths
                        loadAreaPaths($scope.vstsInstanceName, selectedVSTSProject.name,
                                      $scope.authCredentials,$scope.areaPathTreeControlModel)
                        .then(function(){
                             //then finally load the VSTS teams
                            loadVSTSTeams($scope.vstsInstanceName,selectedVSTSProject.id,$scope.authCredentials);
                        });

                      });
                  },
                  function(data, status) {
                        $ionicLoading.hide();
                        alert("Error in getting iterations: "+data.error);
                  });
            }
      };


      /*
      *  This function calls onChange when new area path has been choosen during first time login and hide the list
      */

      $scope.showSelectedAreaPath = function(node){

        $scope.addProjectConfig.selectedArea = getSelectedAreaPathNodeName(node.id);
        $scope.path = false;
        $scope.guidedStateAdd = -2;
      };


      $scope.showPath = function(){
          $scope.path = true;
      };



      /*
       * This function calls onChange when  area path has been Updated during set Path  and hide the list
      */
      $scope.showUpdatedAreaPath  = function(node){

          $scope.updateProjectConfig.selectedArea = getSelectedAreaPathNodeName(node.id);
          $scope.path = false;
          // $scope.guidedState = 1;

      };


      // save the project
      $scope.saveProject = function(){
        $scope.savingProject = true;
        //check if the team name has been defined and then save it + the project, if not just save the project
        if($scope.addProjectConfig.selectedVstsTeam.name!==null
            && $scope.addProjectConfig.selectedVstsTeam.name!== undefined){

          var VSTSTeam = {name:$scope.addProjectConfig.selectedVstsTeam.name,
                          url:$scope.addProjectConfig.selectedVstsTeam.url,
                          vstsTeamID: $scope.addProjectConfig.selectedVstsTeam.id,
                          description:$scope.addProjectConfig.selectedVstsTeam.description,
                          identityUrl: $scope.addProjectConfig.selectedVstsTeam.identityUrl,
                          vstsProjectID: $scope.selectedProject.id,
                          projectID:dummyProjectID};

          //first of all add the team details
          VSTSTeams
          .addVSTSTeam(VSTSTeam)
          .then(function(){
            //then save the project
            $scope.addSelectedProject($scope.addProjectConfig);
          });
        } else {
             $scope.addSelectedProject($scope.addProjectConfig);
        }
      };

      $scope.getSelectedIteration = function(iteration){
          $scope.selectedIteration = JSON.parse(iteration);
          $scope.addProjectConfig.selectedIteration =   $scope.selectedIteration.name;
      };

        //function for handling the nullfying of vars used in syncing the work items
      function resetSyncVars(){
            //nullify the project add vars
            $scope.addProjectConfig = {};
            $scope.selectedProject = {};
            $scope.selectedIteration = {};
            vstsTeamsArray =[];
            nextTeamsPage = 0;
            loadedAreaPaths = [];
            areaPathsFlattened = false;
      };



      /* Here we are loading
       * i.  project,
       * ii. task of projects,
       * iii. sub tasks of tasks
       */
      $scope.addSelectedProject = function (config) {
          $scope.isCancelled = false;
        $scope.closeVSTSLoginModal();
          // selected Project from the dropdown
        var projectName = $scope.selectedProject.name;

        var iterationPath = "";
        if(config.root != undefined && config.root != "" && config.root == true){
          iterationPath += projectName + "+" + $scope.selectedIteration.name;
        } else {
          iterationPath += $scope.selectedIteration.name;
        }

        // the project object
        var project = { name:projectName,
                        areaPathNodeName:$scope.addProjectConfig.selectedArea.split("\\").pop(),
                        vstsProjectID:$scope.selectedProject.id, vstsInstanceName:$scope.vstsInstanceName,
                        iteration_path: iterationPath,
                        iteration_id: $scope.selectedIteration.id,
                        start_date: $scope.selectedIteration.attributes['startDate'],
                        finish_date: $scope.selectedIteration.attributes['finishDate'],
                        area_path:config.selectedArea};
        //show the progress bar
        SyncProgressService.showProgressBar();

        //show the fetching message
        SyncProgressService.showFetchingMessage(true);


       //then add the project to the DB
          Projects
          .addProject(project)
          .then(function (result) {
                var projectID = result['last_insert_rowid()'];// get the autoincremented project id to be used in the task table relations


                //first of all store the project credentials
                Credentials
                .storeCredentials($scope.authCredentials, $scope.vstsInstanceName,project.areaPathNodeName,projectID)
                .then(function(result) {


                    //update the project ID for the  VSTS team and then sync
                    VSTSTeams
                    .updateVSTSTeamProjectID(parseInt(projectID),parseInt(dummyProjectID))
                    .then(function(){

                      $scope.addMembers(parseInt(projectID), true).then(function () {

                        //sync the respective VSTS project
                        var credential = $scope.authCredentials;
                        SyncVSOWorkItems
                          .proceduralSync($scope.vstsInstanceName, projectID, projectName, credential, config,"Project-Add")
                          .then(function(success){
                            if(!$scope.isCancelled){
                              //rest the syncing vars
                              $scope.vstsInstanceName = "";
                              $scope.savingProject =false;
                              $scope.closeAreaPathAndIterationModal();
                              if(CHECK_ENV.runningInDevice){
                                pushService.uploadNotificationRec(projectID, $scope.devicePlatform).then(function(data){
                                  console.log("done");
                                  //alert("Project upated with")

                                });

                              }
                              if(success == "404"){
                                $ionicLoading.hide();
                                alert("Project added with no work items");
                              }
                              else{
                                $ionicLoading.hide();
                                alert(project.areaPathNodeName + " work items added successfully.");

                              }
                              $ionicLoading.hide();
                              //hide the progress bar
                              SyncProgressService.hideProgressBar();
                              //then reset the sync vars
                              resetSyncVars();

                              // auto focus added tab
                              Projects.allProjects().then(function(allProjects) {
                                for(var i = 0;i < allProjects.length;i++){
                                  if(allProjects[i].id === projectID){
                                    localStorage.setItem('selectedTab', i);
                                  }
                                }
                              });

                              //finally reload the projects screen
                              $ionicHistory.clearCache()
                                .then(function() {
                                  $rootScope.isTaskStatusChanged = true;
                                  $rootScope.trgWrkDateTime();
                                  $state.go("tab.all", {projectID: projectID})
                                    .then(function() {
                                      $ionicHistory.clearCache();
                                    });
                                });
                            }
                          },function(error){//if a error occurs notify the user


                            console.log(error);

                            //hide the progress bar
                            SyncProgressService.hideProgressBar();
                          });

                      });

                    });

              });



        });



      };

      $scope.addMembers = function (projectID, isAdd) {
        var q = $q.defer();

        var _vstsInstanceName = '';
        var _authCredentials = '';
        if(isAdd){
          _vstsInstanceName = $scope.vstsInstanceName;
          _authCredentials = $scope.authCredentials;
        } else {
          _vstsInstanceName = $scope.vstsProjectToUpdate['vstsInstanceName'];
          _authCredentials = $scope.authCredentials;
        }

        VSTSTeams.getVSTSTeamByProjectID(projectID).then(function (vstsTeam) {
          VSTSTeamMembers
            .removeVSTSMembersByVSTSTeamIDAndPID(vstsTeam.vstsTeamID, projectID)
            .then(function(){
              //get all the members of this project and save them to disk
              performCRUDService
                .simpleGet(rootURLService.baseURL(_vstsInstanceName) + "_apis/projects/" + vstsTeam.vstsProjectID + "/teams/" + vstsTeam.vstsTeamID + "/members/?" + rootURLService.apiVersion2_2,
                  basicAuthorizationService.basicConfig(_authCredentials),
                  function(data, status) {
                    var vstsTeamMembers = data.value;
                    var teamMembersSyncedCount = 0;
                    //sync the team members
                    vstsTeamMembers
                      .forEach(function(vstsTeamMember,index){
                        if(CHECK_ENV.runningInDevice){
                          //save each team member details to the db
                          SyncVSTSTeamMembers
                            .getVSTSTeamMemberAvatarAndSaveToDisk(vstsTeamMember,vstsTeam.vstsTeamID,_authCredentials,vstsTeam.projectID)
                            .then(function(success){
                              teamMembersSyncedCount++;
                              if(teamMembersSyncedCount=== vstsTeamMembers.length){
                                //return the result
                                q.resolve();
                              }
                            },function(error){
                              teamMembersSyncedCount++;
                              if(teamMembersSyncedCount=== vstsTeamMembers.length){
                                //return the result
                                q.resolve();
                              }
                              console.log(error);
                            });
                        } else {
                          //set the VSTS team id
                          vstsTeamMember.vstsTeamID = vstsTeam.vstsTeamID;
                          vstsTeamMember.projectID = vstsTeam.projectID;
                          //save the team member to the db
                          VSTSTeamMembers
                            .addVSTSTeamMember(vstsTeamMember)
                            .then(function(){
                              teamMembersSyncedCount++;
                              if(teamMembersSyncedCount=== vstsTeamMembers.length){
                                //return the result
                                q.resolve();
                              }
                            });
                        }
                      });
                  }, function (error) {
                    q.resolve();
                  });
            });
        });
        return q.promise;
      };


    $scope.showUpdateProjPopup = function(){
		$ionicModal.fromTemplateUrl('templates/popups/project-update-popup.html', {
				 scope: $scope
		}).then(function (modal) {
      $scope.guidedState = -1;
			  $scope.vstsProjectUpdateModal = modal;
			  $scope.vstsProjectUpdateModal.show(); // showing Login Modal
			  Projects.addedVSProjects().then(function (allProjects) {
				  $scope.addedProjects = [];
				  $scope.addedProjects = allProjects;

			  });
		});
    };

	  //close the project update modal
    $scope.closeProjectUpdateModal= function(){
		$scope.vstsProjectUpdateModal.hide();
		  $scope.updateProjectConfig = {};
		 $scope.addedProjects = [];
		 $scope.vstsProjectToUpdate = "";
      $scope.guidedState = -1;


    };



      // update the project on clicking the next button
      $scope.updateProject = function(){

        //show the progress bar
        SyncProgressService.showProgressBar();

        //show the fetching message
        SyncProgressService.showFetchingMessage(true);
        //check if the team name has been defined and then save it + the project, if not just save the project
        if($scope.updateProjectConfig.selectedVstsTeam!==null
            || $scope.updateProjectConfig.selectedVstsTeam!== undefined){

          var VSTSTeam = {name:$scope.updateProjectConfig.selectedVstsTeam.name,
                          url:$scope.updateProjectConfig.selectedVstsTeam.url,
                          vstsTeamID: $scope.updateProjectConfig.selectedVstsTeam.id,
                          description:$scope.updateProjectConfig.selectedVstsTeam.description,
                          identityUrl: $scope.updateProjectConfig.selectedVstsTeam.identityUrl,
                          vstsProjectID: $scope.vstsProjectToUpdate.vstsProjectID,
                          projectID:$scope.vstsProjectToUpdate.id};

                          //get current team details
                          VSTSTeams
                          .getVSTSTeamByProjectID ($scope.vstsProjectToUpdate.id)
                          .then(function(vstsTeam){

                              //delete any team members saved for this team
                              VSTSTeamMembers
                              .removeVSTSMembersByVSTSTeamIDAndPID(vstsTeam.vstsTeamID, $scope.vstsProjectToUpdate.id)
                              .then(function(){
                                 //then delete the team itself
                                 VSTSTeams
                                 .removeVSTSTeamByProjectID($scope.vstsProjectToUpdate.id)
                                 .then(function(){
                                      //then finally add the team details
                                      VSTSTeams
                                      .addVSTSTeam(VSTSTeam)
                                      .then(function(){
                                      //then update the project
                                         $scope.updateVSTSProject();
                                      });

                                 });
                              })
                          });


        }
        else{
             $scope.updateVSTSProject();
        }

      };

		function returnSelectedIterationObject(name){

		    for (var i=0; i<$scope.iterations.length;  i++){
				if($scope.iterations[i].name === name){
					return $scope.iterations[i];
				}
			}
		};

		$rootScope.cancelSync = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Sync Prompt',
                template: 'Are you sure want to cancel Sync?'
            });
            confirmPopup.then(function(resConfirmed) {
                if (resConfirmed) {
                    $scope.isCancelled = true;
                    var pID = 1;

                    if($scope.vstsProjectToUpdate){
                        $scope.vstsInstanceName = "";
                        $scope.savingProject = false;
                        pID = $scope.vstsProjectToUpdate['id'];
                        $scope.closeProjectUpdateModal();
					} else {
                        $scope.closeAreaPathAndIterationModal();
					}
                    SyncProgressService.hideProgressBar();
                    $rootScope.isTaskStatusChanged = true;
                    $state.go("tab.all", {projectID: pID});
                } else {
                }
            });
        };


    $scope.updateVSTSProject = function(){
			$scope.isCancelled = false;
		      	itrObj  = returnSelectedIterationObject($scope.updateProjectConfig.selectedIteration)


            var iterationPath = "";
            if($scope.updateProjectConfig.root != undefined && $scope.updateProjectConfig.root != "" && $scope.updateProjectConfig.root == true){
              iterationPath += $scope.vstsProjectToUpdate['name'] + "+" + $scope.updateProjectConfig.selectedIteration;
            } else {
              iterationPath += $scope.updateProjectConfig.selectedIteration;
            }

            $scope.vstsProjectToUpdate['iteration_path'] = iterationPath;


            //first of all update the credentials area path node name
            Credentials
            .updateCredentialsByProjectID($scope.vstsProjectToUpdate['id'],
             $scope.updateProjectConfig.selectedArea.split("\\").pop())
            .then(function(){

                 // then update the iteration and area path of selected project
                  Projects
                  .updateProjectIterationPath($scope.vstsProjectToUpdate,
                                              $scope.updateProjectConfig.selectedArea,
                                              $scope.updateProjectConfig.selectedArea.split("\\").pop(),
											  itrObj.attributes['startDate'],
											  itrObj.attributes['finishDate'])
                  .then(function(){

                    var iterationPathProjectID = $scope.vstsProjectToUpdate['id'];
                      // deleting all the workitems based on the selected project ID
                      WorkItems
                      .removeWorkItemsByProjectID($scope.vstsProjectToUpdate['id'])
                      .then(function(sucess){
                            IterationHours
                            .removeHoursByProjectID($scope.vstsProjectToUpdate['id'])
                            .then(function(){

                  								Images.removeImagesByProjectID($scope.vstsProjectToUpdate['id']).then(function(){
                  								
                                    $scope.addMembers($scope.vstsProjectToUpdate['id'], false).then(function () {
                                      SyncVSOWorkItems
                                        .proceduralSync($scope.vstsProjectToUpdate['vstsInstanceName'],
                                          $scope.vstsProjectToUpdate['id'], $scope.vstsProjectToUpdate['name'],
                                          $scope.authCredentials, $scope.updateProjectConfig,"Project-Update")
                                        .then(function(success) {
                                          if(!$scope.isCancelled) {
                                            Images.removeAllDeletedImagesByProjectID($scope.vstsProjectToUpdate['id']).then(function () {
                                              if (!$scope.isCancelled) {
                                                $rootScope.refreshProjects();
                                                $scope.vstsProjectUpdateModal.hide();
                                                //hide the progress bar
                                                if (CHECK_ENV.runningInDevice) {
                                                 
                                                  pushService.uploadNotificationRec($scope.vstsProjectToUpdate['id'], $scope.devicePlatform).then(function (data) {
                                                   
                                                  });

                                                }
                                                $scope.areaPathUpd = $scope.vstsProjectToUpdate.areaPathNodeName;
                                                $scope.closeProjectUpdateModal();
                                                SyncProgressService.hideProgressBar();
                                                //go to the updated project
                                                //pushService.getCountsForPushAndUpdatePrj(iterationPathProjectID);


                                                $state.go("tab.all", {projectID: iterationPathProjectID});
                                                alert($scope.areaPathUpd + " work items imported successfully.");
                                                resetSyncVars();
                                              }

                                            })
                                          }
                                        }, function(error){//if a error occurs notify the user
                                          console.log(error);
                                          //hide the progress bar
                                          SyncProgressService.hideProgressBar();
                                        });

                                    });
                                    });

                  					});


                      });
                  });

            });


      };

       
      // iterations loaded during update project
      $scope.iterationsByProject = function(proj){
        if(proj != undefined && proj != ""){
          proj = JSON.parse(proj);
          $ionicLoading.show({
              template: 'Loading ' + proj.areaPathNodeName + ' Iteration Paths',
              delay: 500
          });
          $scope.vstsProjectToUpdate = proj;

          //get current team details
          VSTSTeams
          .allVSTSTeams()
          .then(function(selectedVSTSTeam){
              //then get the project details
              Projects
              .getVSTSProjectCredentialsViaProjectID(parseInt(proj['id']))
              .then(function(res){

                var iteratP = res['iteration_path'].split("+");
                //set the current iteration
                $scope.updateProjectConfig.selectedIteration  = iteratP[iteratP.length -1];
				$scope.updateProjectConfig.selectedArea = $scope.vstsProjectToUpdate.area_path;
				$scope.path = false;
                //set the vsts token
                $scope.authCredentials = res.vstsToken;
                //set the area path node name
                $scope.initialProjectAreaPathNodeName = res.areaPathNodeName;

                var authCredentials = basicAuthorizationService.basicConfig(res.vstsToken);

                performCRUDService
                .simpleGet(rootURLService.iterationsList(proj.vstsInstanceName, proj.name),
                 authCredentials,
                function(data, status) {
                        //set the iterations
                        $scope.iterations = setIterationDates(flattenIterations(data.children));
                        //get the area paths
                        performCRUDService.simpleGet(rootURLService.areaPathList(proj.vstsInstanceName, proj.name),
                        basicAuthorizationService.basicConfig($scope.authCredentials),
                        function(data, status) {
                            $scope.path = true;
                            $scope.areaPathTreeControlModel = [];
                            //after getting the iterations load the area paths
                            loadAreaPaths(proj.vstsInstanceName, proj.name,
                              $scope.authCredentials,$scope.areaPathTreeControlModel)
                            .then(function(){
                                  //populate our area path manipulator array
                                 loadAreaPaths(proj.vstsInstanceName, proj.name,
                                  $scope.authCredentials,loadedAreaPaths)
                                 .then(function(){
                                    //then finally load the VSTS teams
                                      VSTSTeams
                                      .getVSTSTeamByProjectID (proj.id)
                                      .then(function(vstsTeam){
                                          loadVSTSTeams(proj.vstsInstanceName, proj.vstsProjectID,
                                          $scope.authCredentials);
                                          //switch the team ids for update purposes
                                          vstsTeam.id = vstsTeam.vstsTeamID;

                                           //set the selected team
                                          $scope.updateProjectConfig.selectedVstsTeam = vstsTeam;

                                          // start guild
                                          $scope.guidedState = 0;
                                      });
                                });

                            });
                        },function(data, status) {
                                 $ionicLoading.hide();

                        });
                },function(error, status) {
                     $ionicLoading.hide();

                });

            });

          });


        }
      };



    //code for creating a vsts iteration and syncing it to vsts
    $scope.addNewIterationModal = function(){

        // show the iteration modal
        $ionicModal
        .fromTemplateUrl('templates/popups/create-iteration-popup.html', {
            scope: $scope
        })
        .then(function (modal) {
          Projects
          .addedVSProjects()
          .then(function(res){
                $scope.vstsProjects = res;
                   // show the VSTS create iteration Modal
                $scope.vstsCreateIterationModal = modal;
                $scope.vstsCreateIterationModal.show();
          });

        });
    };

     // Close the create iteration modal
    $scope.closeCreateIterationModal = function() {

       $scope.vstsCreateIterationModal.hide();
       $scope.vstsCreateIterationModal.remove();
    };

    $scope.datepickerObject = {
          titleLabel: 'Select '+ $scope.iterationDateType +' Date', //Optional
          todayLabel: 'Today', //Optional
          closeLabel: 'Close', //Optional
          setLabel: 'Set', //Optional
          errorMsgLabel: 'Please select time.', //Optional
          setButtonType: 'button-positive', //Optional
          inputDate: new Date(), //Optional
          mondayFirst: true, //Optional
          templateType: 'popup', //Optional
          modalHeaderColor: 'bar-positive', //Optional
          modalFooterColor: 'bar-positive', //Optional
          callback: function(val) { //Mandatory
               datePickerCallback(val);
          }
    };

    datePickerCallback = function(val) {
        if (typeof(val) === 'undefined') {
            console.log('Date not selected');

        } else {

          var selectedDate = new Date(val);

         // console.log(selectedDate);

          if($scope.iterationDateType==='Start'){
              iterationStartDate = selectedDate;
              $scope.vstsIteration.startDate = moment(iterationStartDate).format('MM/DD/YYYY');
          }
          if($scope.iterationDateType==='Finish'){
               iterationFinishDate = selectedDate;
               $scope.vstsIteration.finishDate = moment(iterationFinishDate).format('MM/DD/YYYY');
          }

          if($scope.vstsIteration.startDate!==null
            &&$scope.vstsIteration.startDate!==undefined
            &&$scope.vstsIteration.startDate!==""
            &&$scope.vstsIteration.endDate!==null
            &&$scope.vstsIteration.endDate!==undefined
            &&$scope.vstsIteration.endDate!==""){
                 //check that the end date is not less than the start date
                var dateDiff = moment(iterationFinishDate).diff(iterationStartDate,'days');
                if(dateDiff<=0){
                     $scope.vstsIteration.endDate = "";
                      alert("The Finish Date should be greater than the Start Date, please modify it");

                      return;
                }

          }

        }
    };
   
    // it creates new iteration with name and start and end date time
    $scope.createVSTSIteration = function(){
       //save the iteration to VSTS
        var vstsProject = $scope.vstsIteration.project;

        $ionicLoading.show({
            template: 'Creating VSTS Iteration',
            delay: 500
        });

       Projects
       .getVSTSProjectCredentialsViaProjectID(vstsProject.id)
       .then(function(res){

            var newIteration = {"name":$scope.vstsIteration.iterationName,
                                attributes:{"startDate":String(moment(iterationStartDate).format('YYYY-MM-DD')) + "T00:00:00Z",
                                            "finishDate":String(moment(iterationFinishDate).format('YYYY-MM-DD')) + "T00:00:00Z"}};

            performCRUDService
            .simpleCreate(rootURLService.createIteration(res.vstsInstanceName,res.name) + "?" + rootURLService.apiVersion1,
            "POST",
            newIteration,
            basicAuthorizationService.basicConfig(res.vstsToken),
            function(data, status) {
				//alert('hello');
				//alert(data);
                  $ionicLoading.hide();
                  //console.log(data);

                  alert("Sprint/Iteration " + $scope.vstsIteration.iterationName+ " has been successfully created in VSTS");


            }, function(error, status) {
               $ionicLoading.hide();
               console.log(error);

               alert("An error occured when creating the iteration");

            });

       });


    };

    $scope.openIterationDatePicker = function(iterationDateType){
        $scope.iterationDateType = iterationDateType;
        ionicDatePicker.openDatePicker($scope.datepickerObject);
    };

  }
	//inbox triage code
  if($stateParams.viewscope === "triage"){
    	  $scope.title = "Triage Inbox Settings";
        $scope.triageEmailObj = {};

        //load  the vso projects
        Projects.allProjects()
        .then(function (allProjects) {
              $scope.vstsProjectsForTriage = {};
              $scope.vstsProjectsForTriage = [];
              $scope.vstsProjectsForTriage = allProjects;

        })
        .then(function(){
            //load the email providers
            EmailProvider.allEmailProviders().then(function(emailProviders){
                $scope.emailProviders = emailProviders;
            });

        }) 
        .then(function(){
            //load the current triage settings if they are there
            TriageEmailSettings.allTriageEmailSettings().then(function(allTriageEmailSettings){
              if(allTriageEmailSettings.length>0){
                //use the last triage settings
                $scope.triageEmailObj = allTriageEmailSettings[(allTriageEmailSettings.length - 1)];
              }

            });
        });

        $scope.saveTriageEmailSettings = function(){
            var  triageEmailSetting = {projectID:$scope.triageEmailObj.projectID,
                                  emailProviderID:$scope.triageEmailObj.emailProviderID,
                                  triageInboxAddress:$scope.triageEmailObj.triageInboxAddress};
            TriageEmailSettings
            .addTriageEmailSetting(triageEmailSetting)
            .then(function(res){
                if(res['last_insert_rowid()']!==undefined){
                     triageEmailSetting.id =  res['last_insert_rowid()'];
                }
                else{
                     triageEmailSetting.id =  res.id;
                }

                $ionicLoading.show({
                    template: 'Getting Triage Oauth URL',
                    delay: 500
                });

                //get the  gmail ouath url after successfully saving the settings
                TriageEmailSettings
                .queryTriageServer('POST',SCRUMSOUP_API.triageURL + '/authurl',{},{userID:$scope.triageEmailObj.triageInboxAddress})
                .then(function(success){
                  $ionicLoading.hide();
                  var ref = window.open(success.authUrl, '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
                  ref.addEventListener('loadstart', function(event) {
                      if((event.url).startsWith("http://localhost/callback")) {
                          var authCode = (event.url).split("code=")[1];
                          var userID = $scope.triageEmailObj.triageInboxAddress;
                           //after getting the gmail auth code, close the innappbrowser
                          ref.close();

                          $ionicLoading.show({
                              template: 'Getting unique identifier',
                              delay: 500
                          });

                          //post the auth code and user id to the server in order to now get the
                          //identifier for the device from the server
                          TriageEmailSettings
                          .queryTriageServer('POST',SCRUMSOUP_API.triageURL + '/authcode',{},{authCode:authCode,userID:userID})
                          .then(function(success){
                             triageEmailSetting.deviceUUID = success.deviceUUID;
                               //then save the device's UUID
                               TriageEmailSettings
                               .updateTriageEmailSettingByID(triageEmailSetting,triageEmailSetting)
                               .then(function(res){
                                 $ionicLoading.hide();
                                  //finally sync this device's triage work items
                                  $ionicLoading.show({
                                      template: 'Syncing triage work items',
                                      delay: 500
                                  });
                                  /*post the device uuid to the server to now do a first time query of the triage work items
                                     for this device
                                  */
                                  TriageEmailSettings
                                  .queryTriageServer('POST',SCRUMSOUP_API.triageURL + '/query',{},{deviceUUID:triageEmailSetting.deviceUUID})
                                  .then(function(success){
                                        $rootScope.triageWorkItems =[];
                                        $rootScope.triageWorkItems = success;
                                        $rootScope.triageWorkItems.forEach(function(triageWorkItem,i){

                                            triageWorkItem.workItemName=triageWorkItem.name;
                                            triageWorkItem.projectID=triageEmailSetting.projectID;
                                            triageWorkItem.workItemTypeID=5;
                                            triageWorkItem.bucketID=5;
                                            triageWorkItem.iterationPath=res.iteration_path;


                                            if((i+1)===$rootScope.triageWorkItems.length){
                                                  $ionicLoading.hide();
                                                  $rootScope.refreshProjects();
                                            }
                                        });

                                  },function(error){
                                     alert(angular.toJson(error));
                                     $ionicLoading.hide();
                                  });


                               },function(error){
                                 alert(angular.toJson(error));
                                 $ionicLoading.hide();

                               });

                          },function(error){
                              alert(angular.toJson(error));
                             $ionicLoading.hide();

                          });
                     }
                });


                },function(error){
                    alert(angular.toJson(error));
                    $ionicLoading.hide();
                });
            });


        };

        if (typeof String.prototype.startsWith != 'function') {
              String.prototype.startsWith = function (str){
                  return this.indexOf(str) == 0;
              };
        }
	}

  if($stateParams.viewscope === "subscribe"){

    $scope.title = $rootScope.subscriptionProduct.title;
    $scope.subscriptionDesc = $rootScope.subscriptionProduct.description;
    // $scope.subscriptionPrice = $rootScope.subscriptionProduct.price;

    Subscriptions
      .allSubscriptions()
      .then(function(subs){
        //console.log(JSON.stringify(subs));
        var currentSub =  subs[0];
        if(currentSub.userSubscribed == 1){
          $scope.subscriptionPrice = undefined;
        } else {
          $scope.subscriptionPrice = '$35.99'
        }
      });

      //check and set device platform
    if(ionic.Platform.isIOS()){
       $scope.appStorePlatform="iTunes";
    }

    if(ionic.Platform.isAndroid()){
       $scope.appStorePlatform="google play";
    }

    $scope.buySubscription = function(){

        var productIds = [$rootScope.subscriptionProductName];
        	inAppPurchase
        	.getProducts(productIds)
      		.then(function (products) {
      			inAppPurchase
	  			.subscribe($rootScope.subscriptionProductName)
				.then(function (data) {
                    localStorage.setItem('iosReceipt', data.receipt);
				    $rootScope.subscriptionProduct={title:"GoPlanDo",
	                description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
	                price:undefined};
	                $scope.subscriptionPrice = undefined;
	                        //update the user has subscribed to the app
	                Subscriptions
	                    .allSubscriptions()
	                    .then(function(subs){
	                        var currentSub =  subs[0];
	                        currentSub.userSubscribed = 1;
	                        Subscriptions
	                        .updateSubscription(currentSub,currentSub)
	                        .then(function(){});

	                });

				})
				.catch(function (err) {
				    console.log(err);
				});

      		})
      		.catch(function (err) {
			    console.log(err);
			});

             

    };

    // 2B7X8jGzVPgDFJs
    $scope.restoreSubscription = function () {

      if(ionic.Platform.isIOS()){
        var productIds = [$rootScope.subscriptionProductName];
        inAppPurchase
          .getProducts(productIds)
          .then(function (products) {
            inAppPurchase
              .subscribe($rootScope.subscriptionProductName)
              .then(function (data) {
                $rootScope.subscriptionProduct={title:"GoPlanDo",
                  description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
                  price:undefined};
                $scope.subscriptionPrice = undefined;
                localStorage.setItem('iosReceipt', data.receipt);
                //update the user has subscribed to the app
                Subscriptions
                  .allSubscriptions()
                  .then(function(subs){
                    var currentSub =  subs[0];
                    currentSub.userSubscribed = 1;
                    Subscriptions
                      .updateSubscription(currentSub,currentSub)
                      .then(function(){});
                  });
                $ionicPopup.alert({
                  title: 'Restore was successful!',
                  template: 'Thanks for restoring GoPlanDo'
                });
              }).catch(function (err) {
                console.log(err);
              });
          }).catch(function (err) {
            console.log(err);
            $ionicPopup.alert({
                title: 'Purchase',
                template: 'No purchase available!'
            });
          });
      }

      if(ionic.Platform.isAndroid()){
        inAppPurchase
          .restorePurchases()
          .then(function (purchases) {
            
              if(purchases.length > 0){
                var rece = JSON.parse(purchases[0].receipt);
                if(rece.autoRenewing) {
                  $rootScope.subscriptionProduct={title:"GoPlanDo",
                    description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
                    price:undefined};
                  $scope.subscriptionPrice = undefined;
                  //update the user has subscribed to the app
                  Subscriptions
                    .allSubscriptions()
                    .then(function(subs){
                      var currentSub =  subs[0];
                      currentSub.userSubscribed = 1;
                      Subscriptions
                        .updateSubscription(currentSub,currentSub)
                        .then(function(){});

                    });
                  $ionicPopup.alert({
                    title: 'Restore was successful!',
                    template: 'Thanks for restoring GoPlanDo'
                  });
                } else {
                  $ionicPopup.alert({
                    title: 'Purchase',
                    template: 'No purchase available!'
                  });
                }
              } else {
                $ionicPopup.alert({
                  title: 'Purchase',
                  template: 'No purchase available!'
                });
              }
            /*}*/

          })
          .catch(function (err) {
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: '',
              template: 'Something went wrong'
            });
          });
      }
    };


    $scope.cancelSubscription = function(){
          if(window.cordova){
               //check and open device store to cancel subscription
              if(ionic.Platform.isIOS()){
                 window.open('https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/manageSubscriptions','_system','location=no,clearcache=yes,clearsessioncache=yes');
              }

              if(ionic.Platform.isAndroid()){
                 window.open('https://play.google.com/store/account','_system','location=no,clearcache=yes,clearsessioncache=yes');
              }
          }

    };

    // 2B7X8jGzVPgDFJs
    $scope.checkCancelledSubscription = function () {
      inAppPurchase
        .restorePurchases()
        .then(function (purchases) {
          if(ionic.Platform.isIOS()){
            if(purchases.length > 0) {
              window.inAppPurchase.getReceipt().then(function (receipt) {
                // Handle receipt
              }).catch(function (error) {
              });
            } else {
            }
          }
          if(ionic.Platform.isAndroid()){
            var rece = JSON.parse(purchases[0].receipt);
            if(rece.autoRenewing) {
              // do nothing
            } else {
              var productIds = [$rootScope.subscriptionProductName];
              inAppPurchase
                .getProducts(productIds)
                .then(function (products) {
                  $rootScope.subscriptionProduct={title:"GoPlanDo",
                    description:"Thank you for subscribing to GoPlanDo, please note that the subscription will auto-renew every year until you cancel it.",
                    price:products[0].price};
                  $scope.subscriptionPrice = products[0].price;
                  //update the user has subscribed to the app
                  Subscriptions
                    .allSubscriptions()
                    .then(function(subs){
                      var currentSub =  subs[0];
                      if(currentSub.userSubscribed == 1){
                        currentSub.userSubscribed = 0;
                        Subscriptions
                          .updateSubscription(currentSub,currentSub)
                          .then(function(){});
                      }
                    });
                }).catch(function (err) {
                console.log(err);
              });
            }
          }
        })
        .catch(function (err) {
          console.log(err);
        });
    };

  }

  if($stateParams.viewscope === "auth") {

      var _user = localStorage.getItem('hireUser');
      if(_user) {
          $scope.hireUser = JSON.parse(localStorage.getItem('hireUser'));
      } else {
          $scope.hireUser = {};
      }

      $scope.showLogin = true;

      if($scope.hireUser && $scope.hireUser.id) {
          $scope.showLogin = false;
      } else {
          $scope.showLogin = true;
      }

      $scope.title = "Authentication";

      $scope.loginUser = function (user) {
          $ionicLoading.show({
              template: 'Please wait..',
              delay: 500
          });
          getAuthToken().then(function(tdata){
              var url = HIRE_API.baseURL + HIRE_API.login + '?token=' + tdata.access_token;
              performCRUDService
                  .simpleCreate(url, "POST", user,
                      basicAuthorizationService.simpleConfig(),
                      function(data, status) {
                          $ionicLoading.hide();
                          if(data.error.code !== 0) {
                              alert(data.error.message);
                          } else {
                              var profile = {
                                  id: data.id,
                                  role_id: data.role_id,
                                  username: data.username,
                                  password: user.password,
                                  email: data.email,
                                  access_token: data.access_token
                              };
                              localStorage.setItem('hireUser', JSON.stringify(profile));
                              $scope.hireUser = profile;
                              $scope.showLogin = false;
                          }
                      },function(error){
                          $ionicLoading.hide();
                          if(error.error){
                              alert(error.error.message);
                          } else {
                              alert('Please try again later');
                          }
                      });
          });
      };

      $scope.logoutUser = function () {
          localStorage.setItem('hireUser', '');
          $scope.hireUser = {};
          $scope.showLogin = true;
      };

      $scope.openRegisterModal = function () {
          window.open('http://40.68.247.197/users/register','_system','location=no,clearcache=yes,clearsessioncache=yes');
      };

      $scope.closeRegisterModal = function () {
          $scope.registerModal.hide();
          $scope.registerModal = null;
      };


  }

        function getAuthToken(){
            var q = $q.defer();
            performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.getToken,"GET",{}, {},
                function(success){
                    q.resolve(success);
                },function(error){
                    alert("Error "+JSON.stringify(error));
                    q.reject(error)
                });
            return q.promise;
        }

  $scope.nextGuidState = function () {
    if($scope.guidedState === 3) {
      $scope.guidedState = -1;
    } else if($scope.guidedState === 0 && $scope.path) {
        $scope.guidedState = $scope.guidedState + 1;
    } else {
      $scope.guidedState = $scope.guidedState + 1;
    }
  };
    $scope.nextGuidStateAdd = function () {
      if($scope.guidedStateAdd === 0) {
        $scope.guidedStateAdd = -2;
      } else if($scope.guidedStateAdd === -4) {
        $scope.guidedStateAdd = 6;
      } else {
        $scope.guidedStateAdd = $scope.guidedStateAdd - 1;
      }
    }
}]);
