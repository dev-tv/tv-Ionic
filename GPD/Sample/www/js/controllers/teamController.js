angular.module('go-plan-do.teamController', ['ionic.native'])
.controller("TeamController", ['$state', '$firebaseArray', '$stateParams', 'underscore', 'VSTSTeamMembers', 'VSTSTeamRefreshService', 'VSTSTeams', 'Subscriptions', '$interval', '$scope', '$q', 'Projects', 'basicAuthorizationService', 'rootURLService', 'performCRUDService', '$ionicLoading', '$rootScope', 'CurrentVSTSUser', 'fireService', '$timeout', '$ionicModal', function($state,$firebaseArray,$stateParams,underscore,VSTSTeamMembers,VSTSTeamRefreshService,VSTSTeams,Subscriptions,$interval,$scope, $q, Projects,  basicAuthorizationService, rootURLService, performCRUDService, $ionicLoading, $rootScope, CurrentVSTSUser, fireService, $timeout, $ionicModal)  {
    $scope.$on("$ionicView.enter", function(event, data){
		$scope.showSpinner = false;
		$scope.showVSTSMemberList = true;
        $rootScope.hdr = '';
        Subscriptions.checkIfFreeTrialExpired();
        //get current team members

		if (ionic.Platform.isIOS()) {
			$scope.side = "primary";
            $scope.devicePlatform = "IOS";
        }
		if (ionic.Platform.isAndroid()) {
			$scope.devicePlatform = "Android";
			$scope.side = "secondary";
		}

        $timeout(function() {
            if($rootScope.teamScreenCache) {
                $scope.refreshTeamMembersRoot();
            } else {
                $scope.refreshTeamMemberslocal();
            }
        }, 300);
		
		var d = new Date();
		 $scope.todayVal = d.getDay();
    });

    if($rootScope.userSubscribed || !$rootScope.freeTrialVersionHasExpired){
        $scope.subsActive = true;
    } else {
        $scope.subsActive = false;
    }

  $scope.$on("$ionicView.leave", function (event, data) {
    $scope.unwatchg.$destroy();
    $scope.unwatchp.$destroy();
  });

  $scope.unwatchg = '';
  $scope.unwatchp = '';

 localStorage.removeItem('filterText');

    if ($stateParams.teamMemberUniqueName){
      var teamScreenDetailsInfo =  VSTSTeamRefreshService.getTeamMemberTodayTomorrowInfoArray();
      if(teamScreenDetailsInfo===null){
         $state.go("tab.team", {});
         return;
      }
      if(teamScreenDetailsInfo.length>0){
          var teamMemberProjectID = $stateParams.teamMemberProjectID;
         var teamMemberUniqueName = $stateParams.teamMemberUniqueName;
          $scope.teamMemberDisplayName = $stateParams.teamMemberDisplayName;

          $scope.teamScreenDetailsInfo = {};

          var one = underscore.filter(teamScreenDetailsInfo, function (todayTomorrowObj) {
           return (teamMemberUniqueName === todayTomorrowObj.today || teamMemberUniqueName === todayTomorrowObj.tomorrow) && todayTomorrowObj.projectID == teamMemberProjectID;
           });
          var info = underscore.uniq(one, function(num){
              return num.today === teamMemberUniqueName;
          });
          var _info = underscore.uniq(one, function(num){
              return num.tomorrow === teamMemberUniqueName;
          });
          $scope.teamScreenDetailsInfo = underscore.union(info, _info);
          /*$scope.teamScreenDetailsInfo = underscore.filter(teamScreenDetailsInfo, function (todayTomorrowObj) {
              return teamMemberUniqueName === todayTomorrowObj.today || teamMemberUniqueName === todayTomorrowObj.tomorrow;
          });*/
          $scope.todayWorkItemsCount = underscore.countBy($scope.teamScreenDetailsInfo, function(todayTomorrowObj) {
              return todayTomorrowObj.today === teamMemberUniqueName ? 'today' : 'tomorrow';
          });
          $scope.tomorrowWorkItemsCount = underscore.countBy($scope.teamScreenDetailsInfo, function(todayTomorrowObj) {
              return todayTomorrowObj.tomorrow === teamMemberUniqueName ? 'tomorrow' : 'today';
          });
      }
      else{
        $state.go("tab.team", {});
      }
    }

    $scope.selectRowBg = function(wiID) {
        var cls = '';
        if (wiID === 7) {
            cls = {'background-color': '#F0FFFF'};
        } else if (wiID === 1) {
            cls = {'background-color': '#FFCCCC'};
        } else {
            cls = {'background-color':  '#FFEDCC'};
        }
        return cls;
    };

     //ion list variables
    $scope.shouldShowDelete = false;
    $scope.shouldShowReorder = false;
    $scope.listCanSwipe = false;
    //team list scope vars
    $scope.showSpinner = false;
    $scope.showVSTSMemberList = false;
    //team list expand/collapse variable
    $scope.collapsedTeams = [];
    $scope.showIcon = false;


    //team list optimizations
    $scope.numberOfTeamMembersToDisplay = 60;
    $scope.loadMoreTeamMembers = true;


    //load additional team members with each scroll
    $scope.loadMoreData = function() {

        if($scope.vstsTeamMembers !== undefined){
            if($scope.vstsTeamMembers.length > $scope.numberOfTeamMembersToDisplay ){
              $scope.numberOfTeamMembersToDisplay  += $scope.numberOfTeamMembersToDisplay; // load number of more items
               //update the scope
              $scope.vstsTeamMemberExpr  = Math.random(0,10).toString();
              $scope.$broadcast('scroll.infiniteScrollComplete')
            }
            else{
                $scope.loadMoreTeamMembers = false;
            }

        }


    };

    // workitem detail
    $scope.goDetail = function (id) {
        $state.go('tab.workitem-editt', {workItemID: id, viewscope:'edit-workitem'});
    };

    //color array for the hire button
    var hireButtonColors=["#e6e1df","#6ca77c","#bb504b","#93c9df","#f75988",
    "#7ce5c1","#01aaff","#507e8d","#67a977","#ffb4b4","#850b18","#967604"];
    //change the hire color button every 1 hour
    var colorChangeInterval = 60000 * 60;

    //change the hire button
    $interval(function(){
      if(document.getElementById('hireBtn')!==null
        &&document.getElementById('hireBtn')!==undefined){
          document.getElementById('hireBtn').style.backgroundColor = hireButtonColors[$rootScope.colorIndex];
          document.getElementById('hireBtn').style.color = "#ffffff";
          $rootScope.colorIndex = $rootScope.colorIndex + 1;
      }

    },colorChangeInterval );

    //show hire team members form
    $scope.showHireForm = function(){
      var ref = window.open("http://pxlme.me/silootgw", '_blank', 'location=no,clearcache=yes,clearsessioncache=yes');
      ref.addEventListener('loadstart', function(event) {

      });
      if (typeof String.prototype.startsWith != 'function') {
            String.prototype.startsWith = function (str){
                return this.indexOf(str) == 0;
            };
      }

    };


    //function that expands or collapses a team
    $scope.expandCollapseTeam = function(projectID){
		
		if($scope.vstsTeams!== null
            && $scope.vstsTeams!==undefined){
				for(obj in $scope.vstsTeams){
					$scope.vstsTeams[obj][0];
					//check if the team member has been flagged as collpased/expanded and do the reverse
					if(String($scope.vstsTeams[obj][0].projectID)===String(projectID)){
					   if(String($scope.vstsTeams[obj][0].collapsed)==="true"){
							 $scope.vstsTeams[obj][0].collapsed = "false";
					   }
					   else{

							  $scope.vstsTeams[obj][0].collapsed = "true";
					   }
					}
				}
				 
		}
		
		
        if($scope.vstsTeamMembers!== null
            && $scope.vstsTeamMembers!==undefined){

            $scope.vstsTeamMembers.forEach(function(teamMember){

                //check if the team member has been flagged as collpased/expanded and do the reverse
                if(String(teamMember.projectID)===String(projectID)){
                   if(String(teamMember.collapsed)==="true"){
                         teamMember.collapsed = "false";
                   }
                   else{

                          teamMember.collapsed = "true";
                   }
                }
            });
            //update the bindings
            $scope.vstsTeamExpr = Math.random(0,10).toString();
            $scope.vstsTeamMemberExpr  = Math.random(0,10).toString();
        }

    };

    //function that shows the team screen details for a member of a team
    $scope.showTeamScreenDetails = function(teamMemberUniqueName,displayName,projectID){
         $state.go("tab.team-details", {teamMemberUniqueName:teamMemberUniqueName,
          teamMemberDisplayName:displayName,teamMemberProjectID:projectID}); 
    };

  $scope.refreshTeamMembersRoot = function () {
    $scope.showSpinner = true;
    $scope.showVSTSMemberList = false;
    $scope.vstsTeamMembers= [];
    var vstsTeams = $rootScope.teamScreenCache.vstsTeams;
    var vstsTeamsMembers = $rootScope.teamScreenCache.vstsTeamMembers;
    var counter = 0;
    vstsTeams.forEach(function (vstsTeam) {
      counter++;
      if (counter === vstsTeams.length) {
        $scope.vstsTeamMembers = underscore.sortBy(vstsTeamsMembers, 'displayName');
        // combineSprint(vstsTeams);
        $scope.vstsTeams =  underscore.groupBy(vstsTeams, 'vstsProjectID');
        $scope._refreshTeamMembersRoot();
        $scope.showSpinner = false;
        $scope.showVSTSMemberList = true;
      }
    });
    /*// delete the chat count data wrt vstsProjectID
    fireService.removeChatsByPID(vstsTeam.vstsProjectID).then(function (succ) {
    }).catch(function (err) {
    });*/
  };

  $scope._refreshTeamMembersRoot = function () {
    var vstsTeams = $rootScope.teamScreenCache.vstsTeams;
    var vstsTeamsMembers = $scope.vstsTeamMembers;
    var counter = 0;
    vstsTeams.forEach(function (vstsTeam) {
      $scope.getCurrentUser(vstsTeam.projectID, function (_me) {
        vstsTeams[counter].me = _me;
        counter++;
        if (counter === vstsTeams.length) {
          vstsTeamsMembers.forEach(function (vstsTeamMember) {
            if (vstsTeamMember.uniqueName === _me) {
              vstsTeamMember.isMine = true;
            }
          });
          $scope.vstsTeamMembers = underscore.sortBy(vstsTeamsMembers, 'displayName');
          $scope.showIcon = true;
          combineSprint(vstsTeams);
        }
      });
    })
  };

    $scope.refreshTeamMemberslocal = function () {
        $scope.showSpinner = true;
        $scope.showVSTSMemberList = false;
        $scope.vstsTeamMembers= [];
        //get current team details
        VSTSTeams
            .allVSTSTeams()
            .then(function(res){
                if(res.length<=0){
                    $scope.showSpinner = false;
                    $scope.showVSTSMemberList = false;
                }
                else{

                    var vstsTeams = res;
                    $scope.vstsTeams  = vstsTeams;
                    var counter = 0;

                    //init the today tomorrow info array
                    VSTSTeamRefreshService.initTeamMemberTodayTomorrowInfoArray();

                    //then start syncing down team info
                    vstsTeams
                        .forEach(function (vstsTeam) {
                            VSTSTeamRefreshService
                                .refreshTeamMemberslocal(vstsTeam)
                                .then(function () {
                                    $scope.getCurrentUser(vstsTeam.projectID, function (_me) {
                                        $scope.vstsTeams[counter].me = _me;
                                        counter++;
                                        if (counter === $scope.vstsTeams.length) {

                                            VSTSTeamMembers
                                                .allVSTSTeamMembers()
                                                .then(function (vstsTeamMembers) {
                                                  if(vstsTeamMembers.length === 0) {
                                                   // console.log('called again');
                                                    $timeout(function() {
                                                      $scope.refreshTeamMemberslocal();
                                                      $timeout(function() {
                                                        $scope.refreshTeamMemberslocal();
                                                      }, 1000);
                                                    }, 100);

                                                    return;
                                                  }
                                                    //update the today tomorrow counts
                                                    vstsTeamMembers.forEach(function (vstsTeamMember) {
                                                        if (vstsTeamMember.uniqueName === _me) {
                                                            vstsTeamMember.isMine = true;
                                                        }
                                                        vstsTeamMember.todayWorkItemCount = 0;
                                                        vstsTeamMember.tomorrowWorkItemCount = 0;
                                                        VSTSTeamRefreshService
                                                            .getTeamMemberTodayTomorrowInfoArray()
                                                            .filter(function (todayTomorrowObj) {

                                                                if (vstsTeamMember.uniqueName === todayTomorrowObj.today
                                                                    && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                                                    vstsTeamMember.todayWorkItemCount = todayTomorrowObj.todayWorkItems.length;
                                                                }
                                                                if (vstsTeamMember.uniqueName === todayTomorrowObj.tomorrow
                                                                    && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                                                    vstsTeamMember.tomorrowWorkItemCount = todayTomorrowObj.tomorrowWorkItems.length;
                                                                }

                                                            });

                                                    });

                                                    //update the ui
                                                    $scope.showIcon = true;
                                                    $scope.vstsTeamMembers = underscore.sortBy(vstsTeamMembers, 'displayName');
                                                    combineSprint($scope.vstsTeams);
                                                    //then hide the spinner
                                                    $scope.showSpinner = false;
                                                    $scope.showVSTSMemberList = true;
                                                });
                                        }
                                    });
                                }, function (error) {
                                    console.log(error.error);

                                    counter++;
                                    if (counter === $scope.vstsTeams.length) {
                                        VSTSTeamMembers
                                            .allVSTSTeamMembers()
                                            .then(function (vstsTeamMembers) {
                                                //update the today tomorrow counts
                                                vstsTeamMembers.forEach(function (vstsTeamMember) {
                                                    vstsTeamMember.todayWorkItemCount = 0;
                                                    vstsTeamMember.tomorrowWorkItemCount = 0;
                                                    VSTSTeamRefreshService
                                                        .getTeamMemberTodayTomorrowInfoArray()
                                                        .filter(function (todayTomorrowObj) {

                                                            if (vstsTeamMember.uniqueName === todayTomorrowObj.today
                                                                && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                                                vstsTeamMember.todayWorkItemCount = todayTomorrowObj.todayWorkItems.length;
                                                            }
                                                            if (vstsTeamMember.uniqueName === todayTomorrowObj.tomorrow
                                                                && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                                                vstsTeamMember.tomorrowWorkItemCount = todayTomorrowObj.tomorrowWorkItems.length;
                                                            }

                                                        });

                                                });

                                                //update the ui
                                                $scope.vstsTeamMembers = underscore.sortBy(vstsTeamMembers, 'displayName');
                                                combineSprint($scope.vstsTeams);
                                                //then hide the spinner
                                                $scope.showSpinner = false;
                                                $scope.showVSTSMemberList = true;
                                            });
                                    }
                                });
                        });
                }
            });
    };

  //function that refresh all the team members
    $scope.refreshTeamMembers = function () {
      $scope.showSpinner = true;
      $scope.showVSTSMemberList = false;
      $scope.vstsTeamMembers= [];
      //get current team details
      VSTSTeams
      .allVSTSTeams()
      .then(function(res){
          if(res.length<=0){
              $scope.showSpinner = false;
              $scope.showVSTSMemberList = false;
          }
          else{

              var vstsTeams = res;
              $scope.vstsTeams  = vstsTeams;            
              var counter = 0;

            //init the today tomorrow info array
            VSTSTeamRefreshService.initTeamMemberTodayTomorrowInfoArray();

            //then start syncing down team info

            vstsTeams
              .forEach(function (vstsTeam) {
                VSTSTeamRefreshService
                  .refreshTeamMembers(vstsTeam)
                  .then(function () {
                    $scope.getCurrentUser(vstsTeam.projectID, function (_me) {
                      $scope.vstsTeams[counter].me = _me;
                      counter++;
                      if (counter === $scope.vstsTeams.length) {

                        VSTSTeamMembers
                          .allVSTSTeamMembers()
                          .then(function (vstsTeamMembers) {
                            //update the today tomorrow counts
                            vstsTeamMembers.forEach(function (vstsTeamMember) {
                              if (vstsTeamMember.uniqueName === _me) {
                                vstsTeamMember.isMine = true;
                              }
                              vstsTeamMember.todayWorkItemCount = 0;
                              vstsTeamMember.tomorrowWorkItemCount = 0;
                              VSTSTeamRefreshService
                                .getTeamMemberTodayTomorrowInfoArray()
                                .filter(function (todayTomorrowObj) {

                                  if (vstsTeamMember.uniqueName === todayTomorrowObj.today
                                    && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                    vstsTeamMember.todayWorkItemCount = todayTomorrowObj.todayWorkItems.length;
                                  }
                                  if (vstsTeamMember.uniqueName === todayTomorrowObj.tomorrow
                                    && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                    vstsTeamMember.tomorrowWorkItemCount = todayTomorrowObj.tomorrowWorkItems.length;
                                  }

                                });

                            });

                            //update the ui
                            $scope.vstsTeamMembers = underscore.sortBy(vstsTeamMembers, 'displayName');
                            combineSprint($scope.vstsTeams);
                            //then hide the spinner
                            $scope.showSpinner = false;
                            $scope.showVSTSMemberList = true;
                          });
                      }
                    });
                  }, function (error) {
                    console.log(error.error);

                    counter++;
                    if (counter === $scope.vstsTeams.length) {
                      VSTSTeamMembers
                        .allVSTSTeamMembers()
                        .then(function (vstsTeamMembers) {
                          //update the today tomorrow counts
                          vstsTeamMembers.forEach(function (vstsTeamMember) {
                            vstsTeamMember.todayWorkItemCount = 0;
                            vstsTeamMember.tomorrowWorkItemCount = 0;
                            VSTSTeamRefreshService
                              .getTeamMemberTodayTomorrowInfoArray()
                              .filter(function (todayTomorrowObj) {

                                if (vstsTeamMember.uniqueName === todayTomorrowObj.today
                                  && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                  vstsTeamMember.todayWorkItemCount = todayTomorrowObj.todayWorkItems.length;
                                }
                                if (vstsTeamMember.uniqueName === todayTomorrowObj.tomorrow
                                  && vstsTeamMember.projectID === todayTomorrowObj.projectID) {

                                  vstsTeamMember.tomorrowWorkItemCount = todayTomorrowObj.tomorrowWorkItems.length;
                                }

                              });

                          });

                          //update the ui
                          $scope.vstsTeamMembers = underscore.sortBy(vstsTeamMembers, 'displayName');
                          combineSprint($scope.vstsTeams);
                          //then hide the spinner
                          $scope.showSpinner = false;
                          $scope.showVSTSMemberList = true;
                        });
                    }
                  });
              });
          }
        });
    };

    function combineSprint(vstsTeams) {
        $scope.vstsTeams =  underscore.groupBy(vstsTeams, 'vstsProjectID');
        /*$scope.showChatCount();
        $scope.showPersonalChatCount();*/
        $scope.chkFbProjects(vstsTeams);
        $scope.getAllFirebaseMembers();
        $scope.setWatch();
    }

    $scope.getCombineTodayTommorow = function (vstsTeamID, uniqueName, isToday) {
        var todayCount = 0;
        var tomorowCount = 0;
        var temp =  underscore.where($scope.vstsTeamMembers, {vstsTeamID: vstsTeamID, uniqueName: uniqueName});
        for(var i = 0;i < temp.length;i++){
            todayCount = todayCount + temp[i].todayWorkItemCount;
            tomorowCount = tomorowCount + temp[i].tomorrowWorkItemCount;
        }
        if(isToday){
            return todayCount;
        } else {
            return tomorowCount;
        }
    };

    // get current user

    $scope.getCurrentUser = function (projectID, cb) {
        Projects
            .getVSTSProjectCredentialsViaProjectID(parseInt(projectID))
            .then(function(res) {
                CurrentVSTSUser
                    .getCurrentVSTSUserByAreaPathNodeName(res.areaPathNodeName)
                    .then(function(resCurrentUser) {
                        if (resCurrentUser[0] !== undefined) {
                            var person = resCurrentUser[0].userName;
                            var memName = person.substring(person.indexOf("<") + 1, person.indexOf(">"));
                            cb(memName)
                        } else {
                            //console.log('cannot get the current user');
                            cb('');
                        }
                    });
            });
    };

    // chat count implementation

    $scope.allCount = {};

    $scope.showChatCount = function () {
        var j = 0;
        angular.forEach($scope.vstsTeams, function(value, key) {
            async.waterfall([
                function(cb) {
                var _nm = value[0].name;
                    fireService.getGrpLastMID(key).then(function (succ) {
                        if(succ.length === 0) {
                            fireService.insertGrpLastMID(key, 0);
                            cb(null, key);
                        } else {
                            fireService.getGroupLastMsgId(key, function (data) {
                                if(data[0]) {
                                    if(succ[0].mid == data[0].$id){
                                        $scope.allCount[key] = 0;
                                        cb(null, key);
                                    } else {
                                        $scope.allCount[key] = 1;
                                        cb(null, key);
                                    }
                                } else {
                                    $scope.allCount[key] = 0;
                                    cb(null, key);
                                }
                             });
                        }
                    }).catch(function (err) {
                        cb(null, key);
                    });
                },
                function(_key, cb) {
                    j++;
                }
            ], function(error) {
                if (error) {
                    console.log(error);
                }
            });
        });
    };

    $scope.showPersonalChatCount = function () {
        angular.forEach($scope.vstsTeams, function(value, key) {
            for(var i = 0;i < $scope.vstsTeamMembers.length;i++) {
                if($scope.vstsTeamMembers[i].vstsTeamID == value[0].vstsTeamID && $scope.vstsTeamMembers[i].projectID == value[0].projectID){
                    async.waterfall([
                        function(cb) {
                      if(!value[0].me){
                        if($scope.vstsTeamMembers.length == (i + 1)){
                          $timeout(function() {
                            if($rootScope.teamScreenCache) {
                              $scope.refreshTeamMembersRoot();
                            } else {
                              $scope.refreshTeamMemberslocal();
                            }
                          }, 300);
                        } else {
                          return;
                        }
                      }
                            var _me = value[0].me;
                            var _other = $scope.vstsTeamMembers[i].uniqueName;
                            var ids = [value[0].me, $scope.vstsTeamMembers[i].uniqueName];
                            ids.sort();
                            var room = ids[0]+ '-' + ids[1];
                            var iid = $scope.vstsTeamMembers[i].vstsTeamID
                            fireService.getPersonalLastMID(key, room).then(function (succ) {
                                if(succ.length === 0) {
                                    fireService.insertPersLastMID(key,room, 0);
                                    cb(null, key);
                                } else {
                                    fireService.getPersonalLastMsgId(key, room, function (data) {
                                        var cmbine = _other + '-' + iid;
                                        if(data[0]) {
                                            if(succ[0].mid == data[0].$id){
                                                $scope.allCount[cmbine] = 0;
                                                cb(null, key);
                                            } else {
                                                $scope.allCount[cmbine] = 1;
                                                cb(null, key);
                                            }
                                        } else {
                                            $scope.allCount[cmbine] = 0;
                                            cb(null, key);
                                        }
                                    });
                                }
                            }).catch(function (err) {
                                cb(null, key);
                            });
                        },
                        function(_key, cb) {
                        }
                    ], function(error) {
                        if (error) {
                            console.log(error);
                        }
                    });
                }
            }
        });
    };

    $scope.setWatch = function () {
        angular.forEach($scope.vstsTeams, function(value, key) {
            var ref = firebase.database().ref().child(key + '/groupChat/').limitToLast(1);
            var _ref = firebase.database().ref().child(key + '/personalChat/').limitToLast(1);
            $scope.unwatchg = $firebaseArray(ref);
            $scope.unwatchp = $firebaseArray(_ref);
            $scope.unwatchg.$watch(function(event) {
                if(event.event == 'child_added') {
                    $scope.showChatCount();
                }
            });
            $scope.unwatchp.$watch(function(event) {
                if(event.event == 'child_added') {
                    $scope.showPersonalChatCount();
                }
            });
        });

    };

    $scope.subsPromt = function () {
        alert('Please subscribe to get access to all features.');
    };

    $scope.schedule = {"day":{"monday":false,"tuesday":false,"thursday":false,"friday":false,"wednesday":false,"saturday":false,"sunday":false}, "from":"","to": ""};
    $scope.showDateTimeModal = function (fireMembers, uniqueName, me, pid) {
        if(uniqueName === me){
            angular.forEach(fireMembers, function(value, key) {
                if(value.uniqueName === uniqueName) {
                    $scope.selPID = pid;
                    $scope.selMID = value.$id;
                    if(value.datetime || value.datetime == '') {
                        flattenSchedule(JSON.parse(value.datetime));
                    }
                    $ionicModal
                        .fromTemplateUrl('templates/popups/dateTimeModal.html', {
                            scope: $scope
                        })
                        .then(function (modal) {
                            $scope.dateTimeModal = modal;
                            $scope.dateTimeModal.show();
                        });
                }
            });
        }
    };

    $scope.closePopup = function () {
        $scope.selPID = '';
        $scope.selMID = '';
        $scope.dateTimeModal.hide();
        $scope.dateTimeModal = undefined;
    };

    $scope.saveDateTime = function () {
        var dateTimeArr = {
            date: [],
            to: '',
            from: ''
        };

        console.log($scope.schedule);
        if($scope.schedule.day.sunday) {
            console.log(new Date().setDate(new Date().getDate() + (0 - new Date().getDay())));
            var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (0 - new Date().getDay())), $scope.schedule.day.sundayFrom || "", $scope.schedule.day.sundayTo || "");
            dateTimeArr.date.push(ob);
        }
        if($scope.schedule.day.monday) {
             var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (1 - new Date().getDay())), $scope.schedule.day.mondayFrom || "" , $scope.schedule.day.mondayTo || "");
             dateTimeArr.date.push(ob);
        }
        if($scope.schedule.day.tuesday) {
          var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (2 - new Date().getDay())), $scope.schedule.day.tuesdayFrom || "" , $scope.schedule.day.tuesdayTo || "");
             dateTimeArr.date.push(ob);
        }
        if($scope.schedule.day.wednesday) {
            var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (3 - new Date().getDay())), $scope.schedule.day.wednesdayFrom || "" , $scope.schedule.day.wednesdayTo || "");
             dateTimeArr.date.push(ob);
        }
        if($scope.schedule.day.thursday) {
           var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (4 - new Date().getDay())), $scope.schedule.day.thursdayFrom || "" , $scope.schedule.day.thursdayTo || "");
             dateTimeArr.date.push(ob);
        }
        if($scope.schedule.day.friday) {
          var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (5 - new Date().getDay())), $scope.schedule.day.fridayFrom || "" , $scope.schedule.day.fridayTo || "")
            dateTimeArr.date.push(ob);
          }
        if($scope.schedule.day.saturday) {
          var ob = makeScheduleObj(new Date().setDate(new Date().getDate() + (6 - new Date().getDay())), $scope.schedule.day.saturdayFrom || "", $scope.schedule.day.saturdayTo || "")
            dateTimeArr.date.push(ob);
        }
        console.log(dateTimeArr);
        fireService.addDateTime($scope.selPID, $scope.selMID, dateTimeArr, function (succ) {
            $scope.closePopup();
            $rootScope.trgWrkDateTime();
        });
        
    };

    function makeScheduleObj(date, from, to){
      return {
        "date": date,
        "from": from,
        "to":to
      };

    }

    $scope.fireMembers = [];
    $scope.getAllFirebaseMembers = function () {
        angular.forEach($scope.vstsTeams, function(value, key) {
            fireService.getMembersByPID(key, function (fireMembers) {
                $scope.vstsTeams[key][0].fireMembers = fireMembers;
            });
        });
    };

    $scope.checkDateTime = function (members, uniqueName) {
        if(members) {
            for(var i = 0;i < members.length;i++){
                if(members[i].uniqueName === uniqueName && members[i].datetime) {
                    if(members[i].datetime || members[i].datetime !== '') {
                        return 1;
                    } else {
                        return 2;
                    }
                }
                if(members.length === i + 1){
                    return 0;
                }
            }
        } else {
            return 0;
        }
    };

    $scope.checkDay = function (day, members, uniqueName) {
        if(members) {
            for(var i = 0;i < members.length;i++){
                if(members[i].uniqueName === uniqueName && members[i].datetime) {
                    var obj = JSON.parse(members[i].datetime);
                    for(var j = 0;j < obj.date.length;j++) {
                        var _date = new Date(obj.date[j].date || obj.date[j]);
                        if(_date.getDay() === day) { // obj.date[j] === day
                            return true;
                        }
                        if(obj.date.length === j + 1){
                            return false;
                        }
                    }
                }
                if(members.length === i + 1){
                    return false;
                }
            }
        } else {
            return false;
        }
    };

     $scope.checkDayAndOnline = function (day, members, uniqueName, todayDay, from , to) {
        if(members) {
            for(var i = 0;i < members.length;i++){
                if(members[i].uniqueName === uniqueName && members[i].datetime) {
                    var obj = JSON.parse(members[i].datetime);
                     var format = 'HH:mm a';
                     var currentTime = moment(new Date(), format);
                     var test = moment(new Date(obj.from)).format(format);
                     var startTime = moment(test, format);
                      var test1 = moment(new Date(obj.to)).format(format);
                      var endTime = moment(test1, format); 
                    for(var j = 0;j < obj.date.length;j++) {
                        var _date = new Date(obj.date[j].date || obj.date[j]);
                        if(_date.getDay() === day && _date.getDay() === todayDay) {
                          
                             $scope.currentfromTime = new Date(obj.date[j].from).toLocaleTimeString().replace(/:\d+ /, ' ');
                             $scope.currentToTime = new Date(obj.date[j].to).toLocaleTimeString().replace(/:\d+ /, ' ');

                            if ( (startTime.hour() >=12 && endTime.hour() <=12 ) || endTime.isBefore(startTime) ){ 
                              //consoe.log("added");
                              endTime.add(1, "days");       // handle spanning days endTime

                              if (currentTime.hour() <=12 )
                              {
                                currentTime.add(1, "days");       // handle spanning days currentTime
                              }
                            }
                         
                            return true;
                        }else{
                          //$scope.currentfromTime = "";
                           //$scope.currentToTime = "";

                        }

                        if(obj.date.length === j + 1){
                            return false;
                        }
                    }
                }
                if(members.length === i + 1){
                    return false;
                }
            }
        } else {
            return false;
        }
    };

    $scope.getTime = function (action, members, uniqueName, todayDay) {
        if(members) {
            for(var i = 0;i < members.length;i++){
                if(members[i].uniqueName === uniqueName && members[i].datetime) {
                    var obj = JSON.parse(members[i].datetime);
					 for(var j = 0;j < obj.date.length;j++) {
						var _date = new Date(obj.date[j].date || obj.date[j]);
						 if(_date.getDay() === todayDay) {
							 if(action === 'from') {
								return new Date(obj.date[j].from).toLocaleTimeString().replace(/:\d+ /, ' ');
							} else {
								return new Date(obj.date[j].to).toLocaleTimeString().replace(/:\d+ /, ' ');
							}
							 
						}
					}
                }
                if(members.length === i + 1){
                    return '--:--';
                }
            }
        } else {
            return '--:--';
        }
    };
    //Note:it could be one function and re usable, cz same func is using in app.js
    function flattenSchedule(sch) {
        console.log(sch);
        var to = new Date(sch.to).getTime();
        var from = new Date(sch.from).getTime();
        $scope.schedule.from = new Date(from);
        $scope.schedule.to = new Date(to);
        for(var i = 0; i < sch.date.length; i++){
            var _date = new Date(sch.date[i].date);
            if(_date.getDay() === 0) {
                $scope.schedule.day.sunday = true;
                $scope.schedule.day.sundayTo = new Date(sch.date[i].to);
                $scope.schedule.day.sundayFrom = new Date(sch.date[i].from);
            }
            if(_date.getDay() === 1) {
                $scope.schedule.day.monday = true;
                $scope.schedule.day.mondayTo = new Date(sch.date[i].to);
                $scope.schedule.day.mondayFrom = new Date(sch.date[i].from);
            }
            if(_date.getDay() === 2) {
                $scope.schedule.day.tuesday = true;
                 $scope.schedule.day.tuesdayTo = new Date(sch.date[i].to);
                $scope.schedule.day.tuesdayFrom = new Date(sch.date[i].from);
            }
            if(_date.getDay() === 3) {
                $scope.schedule.day.wednesday = true;
                 $scope.schedule.day.wednesdayTo = new Date(sch.date[i].to);
                $scope.schedule.day.wednesdayFrom = new Date(sch.date[i].from);
            }
            if(_date.getDay() === 4) {
                $scope.schedule.day.thursday = true;
                 $scope.schedule.day.thursdayTo = new Date(sch.date[i].to);
                $scope.schedule.day.thursdayFrom = new Date(sch.date[i].from);

            }
            if(_date.getDay() === 5) {
                $scope.schedule.day.friday = true;
                $scope.schedule.day.fridayTo = new Date(sch.date[i].to);
                $scope.schedule.day.fridayFrom = new Date(sch.date[i].from);
            }
            if(_date.getDay() === 6) {
                $scope.schedule.day.saturday = true;
                $scope.schedule.day.saturdayTo = new Date(sch.date[i].to);
                $scope.schedule.day.saturdayFrom = new Date(sch.date[i].from);
            }
        }
    }

    // return image url
  $scope.retImgUrl = function (displayName, url) {
      if(window.cordova) {
          var avatarName = displayName.replace(/\s+/g, '.');
          return cordova.file.dataDirectory + avatarName;
      } else {
          return url;
      }
  }

  // check and add project in firebase
  $scope.chkFbProjects = function (vstsTeams) {
      angular.forEach(vstsTeams, function(value, key) {
          fireService.checkMainRoom(value.vstsProjectID, function (indx) {
              if(indx === -1) {
                  VSTSTeamMembers.getAllTeamMembersByProjectID(value.projectID).then(function (vstsTeamMembers) {
                      angular.forEach(vstsTeamMembers, function(_value, _key) {
                          fireService.addMemberInMainRoom(value.vstsProjectID,_value, function (cb) {});
                      });
                  });
              }
          });
      });
  }

}]);
