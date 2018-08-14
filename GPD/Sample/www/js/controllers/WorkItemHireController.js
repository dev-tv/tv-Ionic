angular.module('go-plan-do.WorkItemHireController', ['ui.bootstrap.rating']).controller("WorkItemHireController",
    ['$stateParams', '$scope', '$rootScope', '$q', '$timeout', 'GetPhoto','Projects', '$state', '$ionicModal', '$ionicActionSheet', '$ionicPopup','performCRUDService', 'basicAuthorizationService', '$ionicLoading', '$ionicHistory', '$ionicScrollDelegate', 'WorkItems', 'HIRE_API', 'underscore', 'ModifyVSTSWorkItemService', '$ionicPopover', 'rootURLService', 'AlignWorkItems', 'CurrentVSTSUser',
        function($stateParams, $scope, $rootScope, $q, $timeout,GetPhoto, Projects, $state, $ionicModal,$ionicActionSheet, $ionicPopup, performCRUDService, basicAuthorizationService, $ionicLoading, $ionicHistory, $ionicScrollDelegate, WorkItems, HIRE_API, underscore, ModifyVSTSWorkItemService, $ionicPopover, rootURLService, AlignWorkItems, CurrentVSTSUser)  {

      $scope.projectID = $stateParams.projectID;
      $scope.workItemID = $stateParams.workItemID;
      $scope.postScreen = $stateParams.postScreen;
      $scope.bucketID = $stateParams.bucketID;
      $scope.projectName = '';
      $scope.meUniqueName = '';
      $scope.headerTitle = 'Post';

            $scope.user = {
                hireTitle: '',
                hireDescription: ''
            };

            $scope.showSpin = true;
            $scope.hireMode = 'ADD';
            $scope.canGoNext = false;
            $scope.canEditJob = false;
            $scope.taskList = '';

            Projects.getProject($scope.projectID).then(function(proj){
                $scope.vstsProjectID = proj.vstsProjectID;
                $scope.projectName = proj.name;
            });

            WorkItems.getAllWorkItemByProjectID(parseInt($scope.projectID)).then(function(_workItems) {
                var i = 1;
                var txt = 'Task list are as follow : \n';
                    angular.forEach(_workItems, function(value, key){
                    if(value.workItemVSOID === parseInt($scope.workItemID) ||
                        value.parentWorkItemID === parseInt($scope.workItemID)) {
                        txt = txt + i + '. ' + value.name + ' (Task ID : ' + value.workItemVSOID + ')\n';
                        i += 1;
                    }
                });
                $scope.taskList = txt;
            });

            $scope.selTitle = {txt: ''};
            $scope.selType = {txt: []};
            $scope.selSkill = {txt: []};
            $scope.project = {
                title: '',
                description: '',
                custom_range: {
                    min_amount: 1,
                    max_amount: 2000
                },
                biddingDays: 5
            };
            $scope.rating  = {
                rate: 3.5,
                max: 5
            };
            $scope.isProjectCompleted = false;
            $scope.moreProjectInfo = {
                featured: '',
                private: '',
                urgent: '',
                sealed: ''
            };
            $scope.bidPageCount = 1;
            $scope.bidItemCount = 10;
            $scope.enableLoadMore = false;
            $scope.allBids = {
                total_bids: 0,
                data: []
            };
            $scope.lancerProfile = {};
            $scope.lancerReviews = {};
            $scope.reviewsParam = {
                rating: 0,
                message: '',
                max: 5
            };

            // manage back navigation
            $scope.goBack = function () {
                $ionicScrollDelegate.scrollTop(true);
                if($scope.postScreen === '0') {
                    $ionicHistory.goBack();
                } else if($scope.postScreen === '1') {
                    // $scope.postScreen = '0';
                    $ionicHistory.goBack();
                } else if($scope.postScreen === '2'){
                    // $scope.postScreen = '0';
                    $ionicHistory.goBack();
                } else if($scope.postScreen === '3'){
                    $scope.postScreen = '2';
                } else if($scope.postScreen === '4') {
                    $ionicHistory.goBack();
                } else if($scope.postScreen === '5') {
                    if ($scope.freelancer_user_id && $scope.freelancer_user_id > 0) {
                        $ionicHistory.goBack();
                    } else {
                        if($scope.isProjectCompleted) {
                            $ionicHistory.goBack();
                        } else {
                            $scope.postScreen = '4';
                        }
                    }
                } else if($scope.postScreen === '6') {
                    $scope.postScreen = '5';
                } else {
                    $ionicHistory.goBack();
                }
            };

            // show select modal
            $scope.showModal = function (val) {
                if(val === 'title') {
                    $scope.modalTitle = 'Choose a service from the given list or input your own';
                    $scope.list = [];
                    $scope.modalName = 'title';
                } else if(val === 'type') {
                    $scope.modalTitle = 'Select the thing to be delivered or write your own';
                    $scope.list = [];
                    $scope.modalName = 'type';
                } else if(val === 'skill') {
                    $scope.modalTitle = 'Select skills to find related Freelancers';
                    $scope.list = [];
                    $scope.modalName = 'skill';
                }
                $ionicModal.fromTemplateUrl('templates/popups/selectTitle.html', {
                    scope: $scope
                }).then(function (modal) {
                    $scope.titleModal = modal;
                    $scope.titleModal.show();
                    if(val === 'title') {
                        $scope.getTxtList('job_titles', false);
                    } else if (val === 'skill') {
                        $scope.getTxtList('job_skills', false);
                    } else if(val === 'type') {
                        $scope.getTxtList('job_types', false);
                    }
                });
            };

            // hide select modal
            $scope.hideModal = function () {
                $scope.titleModal.hide();
                $scope.titleModal = null;
            };

            $scope.next = function (page) {
                $ionicScrollDelegate.scrollTop(true);
                if(page === '1'){
                    callGetSavedJobApi().then(function (data) {
                        if(data && data.data) {
                            if(data.data[0].project_status_id === 14) {
                                $scope.isProjectCompleted = true;
                                $scope.postScreen = '5';
                                $scope.lancerProfile = {};
                                $scope.lancerReviews = {};
                                $scope.populateProfile(data.data[0].freelancer_user_id, true);
                                $scope.getMilestoneOnBid(data.data[0].id, false);
                                $scope.populateReviews(data.data[0].freelancer_user_id, true);
                                return;
                            }
                            if(data.data[0].project_type === 'save') {
                                $scope.canEditJob = true;
                                $scope.selTitle.txt = data.data[0].name;
                                $scope.project.description = data.data[0].description;
                                $scope.selType.txt = data.data[0].types;
                                var bg = data.data[0].budget_range.split("-");
                                $scope.project.custom_range.min_amount = parseInt(bg[0]);
                                $scope.project.custom_range.max_amount = parseInt(bg[1]);
                                $scope.project.biddingDays = data.data[0].bid_duration;
                                // $scope.selSkill.txt = data.data[0].skills;
                                var tmp = data.data[0].skills.split(',');
                                angular.forEach(tmp,function(sugg){
                                    $scope.selSkill.txt.push({text: sugg});
                                });
                                $scope.selSkill.txt = underscore.uniq($scope.selSkill.txt, 'text');
                                $scope.postScreen = '4';
                            } else if(data.data[0].project_type === 'post'){
                                $scope.canEditJob = false;
                                $scope.postScreen = '4';
                                $scope.bidPageCount = 1;$scope.bidItemCount = 10;
                                $scope.freelancer_user_id = data.data[0].freelancer_user_id;
                                $scope.populateBids($scope.bidPageCount, $scope.bidItemCount, true);
                            } else {
                                $scope.canEditJob = false;
                                $scope.postScreen = '2';
                            }
                        } else {
                            $scope.canEditJob = false;
                            $scope.postScreen = '2';
                        }
                    },function (error) {
                        $scope.canEditJob = false;
                    });
                } else if(page === '3'){
                    $scope.postScreen = page;
                } else if (page === '2') {
                    $scope.postScreen = page;
                }
            };

            function callGetSavedJobApi(){
                var q = $q.defer();
                /*$ionicLoading.show({
                    template: 'Please wait..',
                    delay: 300
                });*/
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                var url = HIRE_API.baseURL + '/app' +  HIRE_API.getSaveEditJob + '/' + $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token;
                performCRUDService.simpleCreate(url,"GET",{}, {},
                    function(success){
                        $ionicLoading.hide();
                        q.resolve(success);
                    },function(error){
                        $ionicLoading.hide();
                        if(error.error){
                            q.resolve({});
                        }
                        q.reject(error);
                    });
                return q.promise;
            }

            // select multiple or single option
            $scope.select = function(idx, val) {
                if($scope.modalName === 'title' || $scope.modalName === 'type') {
                    for(var i = 0;i < $scope.list.length;i++) {
                        $scope.list[i].selected = i === idx;
                    }
                } else {
                    $scope.list[idx].selected = !val;
                }
            };

            // navigate to lancer detail screen
            $scope.goDetail = function (lancerID, bidID) {
                $ionicScrollDelegate.scrollTop(true);
                $scope.postScreen = '5';
                $scope.lancerProfile = {};
                $scope.lancerReviews = {};
                $scope.milestones = [];
                $scope.populateProfile(lancerID, bidID, true);
                $scope.getMilestoneOnBid(bidID, false);
                $scope.populateReviews(lancerID, true);
            };

            // navigate to review screen
            $scope.goReview = function () {
                if($scope.isProjectCompleted) {
                    $ionicScrollDelegate.scrollTop(true);
                    $scope.postScreen = '6';
                }
            };

            // navigate to bid list screen
            $scope.goBids = function (val) {
                $scope.clearSuggestion();
                $scope.clearTitle();
                if($scope.hireMode === 'ADD') {
                    $ionicLoading.show({
                        template: 'Preparing your project..',
                        delay: 200
                    });
                    $scope.addHireProject($scope.projectName, $scope.project.description, $scope.vstsProjectID).then(function (succ) {
                        $ionicLoading.hide();
                        $scope.canGoNext = true;
                        $scope.finalGetPostJob(val);
                    }, function (error) {
                        $ionicLoading.hide();
                        $ionicHistory.goBack();
                        alert('Please try again later.');
                    });
                } else {
                    $scope.finalGetPostJob(val);
                }
                $ionicScrollDelegate.scrollTop(true);
            };

            $scope.finalGetPostJob = function (val) {
                // to save job project_status_id is 1 and for post job project_status_id is 4
                var param = {};
                var typeArr = $scope.selType.txt;
                var skillArr = '';
                /*for (var i = 0;i < $scope.selType.txt.length; i++) {
                    if(typeArr === '') {
                        typeArr = $scope.selType.txt[i].text;
                    } else {
                        typeArr = typeArr + ',' + $scope.selType.txt[i].text;
                    }
                }*/
                for (var j = 0;j < $scope.selSkill.txt.length; j++) {
                    if(skillArr === '') {
                        skillArr = $scope.selSkill.txt[j].text;
                    } else {
                        skillArr = skillArr + ',' + $scope.selSkill.txt[j].text;
                    }
                }
                if(val === 'post'){
                    if(!$scope.canEditJob) {
                        param = {
                            name: $scope.selTitle.txt,
                            appId: $scope.vstsProjectID,
                            storyId: $scope.workItemID,
                            description: $scope.project.description,
                            project_status_id: 4,
                            bid_duration: $scope.project.biddingDays,
                            image: 'sfdf',
                            skills: skillArr,
                            project_types: typeArr,
                            additional_description: $scope.taskList,
                            custom_range: {
                                min_amount: $scope.project.custom_range.min_amount,
                                max_amount: $scope.project.custom_range.max_amount
                            },
                            is_active:1,
                            uniqueRoomId: $scope.meUniqueName
                        };
                        callPostSaveJobApi(param).then(function (succ) {
                            // $ionicHistory.goBack();
                            alert('Job posted successfully. Please check your mail for more details.');
                            $scope.next('1');
                        }, function (error) {
                            $ionicHistory.goBack();
                        });
                    } else {
                        param = {
                            name: $scope.selTitle.txt,
                            description: $scope.project.description,
                            project_status_id: 4,
                            bid_duration: $scope.project.biddingDays,
                            image: 'sfdf',
                            skills: skillArr,
                            project_types: typeArr,
                            additional_description: $scope.taskList,
                            custom_range: {
                                min_amount: $scope.project.custom_range.min_amount,
                                max_amount: $scope.project.custom_range.max_amount
                            },
                            uniqueRoomId: $scope.meUniqueName
                        };
                        callEditJobApi(param).then(function (succ) {
                            // $ionicHistory.goBack();
                            alert('Job posted successfully. Please check your mail for more details.');
                            $scope.next('1');
                        }, function (error) {
                            $ionicHistory.goBack();
                        });
                    }
                }else {
                    if(!$scope.canEditJob) {
                        param = {
                            name: $scope.selTitle.txt,
                            appId: $scope.vstsProjectID,
                            storyId: $scope.workItemID,
                            description: $scope.project.description,
                            project_status_id: 1,
                            bid_duration: $scope.project.biddingDays,
                            image: 'sfdf',
                            skills: skillArr,
                            project_types: typeArr,
                            additional_description: $scope.taskList,
                            custom_range: {
                                min_amount: $scope.project.custom_range.min_amount,
                                max_amount: $scope.project.custom_range.max_amount
                            },
                            uniqueRoomId: $scope.meUniqueName
                        };
                        callPostSaveJobApi(param).then(function (succ) {
                            $ionicHistory.goBack();
                        }, function (error) {
                            $ionicHistory.goBack();
                        });
                    } else {
                        param = {
                            name: $scope.selTitle.txt,
                            description: $scope.project.description,
                            project_status_id: 1,
                            bid_duration: $scope.project.biddingDays,
                            image: 'sfdf',
                            skills: skillArr,
                            project_types: typeArr,
                            additional_description: $scope.taskList,
                            custom_range: {
                                min_amount: $scope.project.custom_range.min_amount,
                                max_amount: $scope.project.custom_range.max_amount
                            },
                            uniqueRoomId: $scope.meUniqueName
                        };
                        callEditJobApi(param).then(function (succ) {
                            $ionicHistory.goBack();
                        }, function (error) {
                            alert('Please try again');
                        });
                    }
                }
            };

            //call post job api
            function callPostSaveJobApi(params){
                $ionicLoading.show({
                    template: 'Please wait..',
                    delay: 300
                });
                var q = $q.defer();
                var _user = localStorage.getItem('hireUser');
                if(_user) {
                    var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                    var url = HIRE_API.baseURL + HIRE_API.getSaveEditJob + '?token=' + hireUser.access_token;
                    performCRUDService.simpleCreate(url,"POST",params, basicAuthorizationService.simpleConfig(),
                        function(success){
                            $ionicLoading.hide();
                            q.resolve(success);
                        },function(error){
                            $ionicLoading.hide();
                            q.reject(error);
                        });
                } else {
                    q.reject({});
                }
                return q.promise;
            }

            //call save job api
            function callEditJobApi(params){
                $ionicLoading.show({
                    template: 'Please wait..',
                    delay: 300
                });
                var q = $q.defer();
                var _user = localStorage.getItem('hireUser');
                if(_user) {
                    var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                    var url = HIRE_API.baseURL + '/app' + HIRE_API.getSaveEditJob + '/' + $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token;
                    performCRUDService.simpleCreate(url,"PUT",params, {},
                        function(success){
                            $ionicLoading.hide();
                            q.resolve(success);
                        },function(error){
                            $ionicLoading.hide();
                            q.reject(error);
                        });
                } else {
                    q.reject(error);
                }
                return q.promise;
            }

            // done selected option
            $scope.done = function () {
                var val = '';
                if($scope.modalName === 'title') {
                    for (var i = 0;i < $scope.list.length; i++) {
                        if($scope.list[i].selected) {
                            val = $scope.list[i].name;
                        }
                    }
                    $scope.selTitle.txt = val;
                } else if($scope.modalName === 'type') {
                    for (var j = 0;j < $scope.list.length; j++) {
                        if($scope.list[j].selected) {
                            val = $scope.list[j].name;
                        }
                    }
                    $scope.selType.txt = val;
                } else if($scope.modalName === 'skill') {
                    for (var k = 0;k < $scope.list.length; k++) {
                        if($scope.list[k].selected) {
                            if(!$scope.selSkill.txt) {
                                $scope.selSkill.txt = [];
                            }
                            $scope.selSkill.txt.push({text: $scope.list[k].name});
                        }
                    }
                    $scope.selSkill.txt = underscore.uniq($scope.selSkill.txt, 'text');
                }
                $scope.hideModal();
            };

            // get profile token for logged in user
            function getLoginAuthToken(user) {
                var q = $q.defer();
                getAuthToken().then(function(tdata){
                    var url = HIRE_API.baseURL + HIRE_API.login + '?token=' + tdata.access_token;
                    performCRUDService
                        .simpleCreate(url, "POST", user,
                            basicAuthorizationService.simpleConfig(),
                            function(data, status) {
                                $ionicLoading.hide();
                                if(data.error.code !== 0) {
                                } else {
                                    $scope.hireUser.access_token = data.access_token;
                                    localStorage.setItem('hireUser', JSON.stringify($scope.hireUser));
                                }
                                q.resolve(data);
                            },function(error){
                                if(error.error){
                                    alert(error.error.message);
                                } else {
                                    alert('Please try again later');
                                }
                                q.reject(error);
                            });
                });
                return q.promise;
            }

            // get guest token
            function getAuthToken(){
                var q = $q.defer();
                performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.getToken,"GET",{}, {},
                    function(success){
                        q.resolve(success);
                    },function(error){
                        alert('Please try again later');
                        $ionicHistory.goBack();
                        q.reject(error);
                    });
                return q.promise;
            }

            // add project info if not found
            $scope.addHireProject = function (title, description, projectId) {
                var q = $q.defer();
                var para = {
                    name: title,
                    app_id: projectId,
                    description: description,
                    project_status_id: 1
                };
                var _user = localStorage.getItem('hireUser');
                if(_user) {
                    var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                    var url = HIRE_API.baseURL + '/app' + HIRE_API.addGetProject + '?token=' + hireUser.access_token;
                    performCRUDService.simpleCreate(url,"POST",para, {},
                        function(success){
                            q.resolve(success);
                        },function(error){
                            q.reject(error)
                        });
                } else {
                    q.reject(error)
                }
                return q.promise;
            };

            // edit project info if already added
            $scope.editHireProject = function (title, description, projectId) {
                var q = $q.defer();
                var para = {
                    name: title,
                    app_id: projectId,
                    description: description,
                    project_status_id: 1
                };
                var _user = localStorage.getItem('hireUser');
                if(_user) {
                    var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                    var url = HIRE_API.baseURL + '/app' + HIRE_API.addGetProject + '/' + projectId + '?token=' + hireUser.access_token;
                    performCRUDService.simpleCreate(url,"PUT",para, {},
                        function(success){
                            q.resolve(success);
                        },function(error){
                            q.reject(error);
                        });
                } else {
                    q.reject(error);
                }
                return q.promise;
            };

            // save Edit project info
            $scope.addEditProject = function () {
                $ionicLoading.show({
                    template: 'Please wait..',
                    delay: 300
                });
                if($scope.hireMode === 'ADD') {
                    $scope.addHireProject($scope.user.hireTitle, $scope.user.hireDescription, $scope.vstsProjectID).then(function (succ) {
                        $ionicLoading.hide();
                        $scope.canGoNext = true;
                        $scope.next('1');
                    }, function (error) {
                        $ionicLoading.hide();
                        alert('Please try again later.');
                    });
                } else {
                    $scope.editHireProject($scope.user.hireTitle, $scope.user.hireDescription, $scope.vstsProjectID).then(function (succ) {
                        $ionicLoading.hide();
                        $scope.canGoNext = true;
                        $scope.next('1');
                    }, function (error) {
                        $ionicLoading.hide();
                        alert('Please try again later.');
                    });
                }
            };

            $scope.populateBids = function (page, item, showLoader) {
                callGetBids(page, item, showLoader).then(function (succ) {
                    $scope.allBids.total_bids = succ.total_bids;
                    $scope.enableLoadMore = true;
                    angular.forEach(succ.data, function(value, key){
                        $scope.allBids.data.push(value);
                    });
                }, function (err) {
                });
            };

            $scope.loadMore = function() {
                if($scope.allBids.total_bids && $scope.allBids.total_bids > 0) {
                    if($scope.allBids.data.length < $scope.allBids.total_bids) {
                        $scope.bidPageCount = $scope.bidPageCount + 1;
                        $scope.populateBids($scope.bidPageCount, $scope.bidItemCount);
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    }
                }
            };

            $scope.getProImg = function (val) {
                if(val) {
                    return val;
                } else {
                    return 'images/user.png';
                }
            };

            $scope.postReview = function (lancerID, showLoader) {
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var param = {
                    message: $scope.reviewsParam.message,
                    rating: $scope.reviewsParam.rating,
                    bid_lancer_id: $scope.lancerProfile.userID
                };
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + '/app' + HIRE_API.reviews + '/' +
                    $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token,"POST",param, {},
                    function(success){
                        $ionicLoading.hide();
                        $scope.postScreen = '5';
                    },function(error){
                        $ionicLoading.hide();
                        alert('Please try again later');
                        $ionicHistory.goBack();
                    });
            };

            $scope.getTxtList = function (type, showLoader) {
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.getSaveEditJob +
                    '?token=' + hireUser.access_token + '&type=' + type,"GET",{}, {},
                    function(success){
                        $scope.list = success.data.data;
                        $ionicLoading.hide();
                    },function(error){
                        $ionicLoading.hide();
                    });
            };

            function callGetBids(page, item, showLoader) {
                var q = $q.defer();
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + '/app' + HIRE_API.bids + '/' +
                    $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token +
                    '&page=' + page + '&limit=' + item,"GET",{}, {},
                    function(success){
                        $ionicLoading.hide();
                        q.resolve(success);
                    },function(error){
                        $ionicLoading.hide();
                        alert('Please try again later');
                        $ionicHistory.goBack();
                        q.reject(error);
                    });
                return q.promise;
            }

            $scope.populateProfile = function (lancerID, bidID, showLoader) {
                callGetProfile(lancerID, showLoader).then(function (succ) {
                    $scope.lancerProfile = succ;
                    $scope.lancerProfile.userID = lancerID;
                    $scope.lancerProfile.bidID = bidID;
                }, function (err) {
                    $ionicHistory.goBack();
                });
            };

            function callGetProfile(lancerID, showLoader) {
                var q = $q.defer();
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + '/app' + HIRE_API.bids + '/' +
                    $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token + '&bid_lancer_id=' + lancerID,"GET",
                    {}, {},
                    function(success){
                        $ionicLoading.hide();
                        q.resolve(success);
                    },function(error){
                        $ionicLoading.hide();
                        alert('Please try again later');
                        $ionicHistory.goBack();
                        q.reject(error);
                    });
                return q.promise;
            }

            $scope.pull = function () {
                if($scope.postScreen === '4') {
                    $scope.enableLoadMore = false;
                    $scope.allBids.data = [];
                    $scope.bidPageCount = 1;
                    $scope.bidItemCount = 10;
                    $scope.populateBids($scope.bidPageCount, $scope.bidItemCount, false);
                    $timeout(function() {
                        $scope.$broadcast('scroll.refreshComplete');
                    }, 1000);
                } else {
                    $scope.$broadcast('scroll.refreshComplete');
                }
            };

            $scope.populateReviews = function (lancerID, showLoader) {
                callGetReviews(lancerID, showLoader).then(function (succ) {
                    $scope.lancerReviews = succ;
                }, function (err) {
                });
            };

            function callGetReviews(lancerID, showLoader) {
                var q = $q.defer();
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + '/app' + HIRE_API.reviews + '/' +
                    $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' + hireUser.access_token +
                    '&bid_lancer_id=' + lancerID,"GET",{}, {},
                    function(success){
                        $ionicLoading.hide();
                        q.resolve(success);
                    },function(error){
                        $ionicLoading.hide();
                        alert('Please try again later');
                        $ionicHistory.goBack();
                        q.reject(error);
                    });
                return q.promise;
            }

      // accept freelancer bid
      $scope.acceptBid = function (showLoader) {
        if ($scope.freelancer_user_id) {
          if ($scope.lancerProfile.userID !== $scope.freelancer_user_id) {
            alert('Freelancer is already hired for the story');
          }
          return;
        }
        var confirmPopup = $ionicPopup.confirm({
          title: 'Confirm',
          template: 'Are you sure you want to accept bid?'
        });
        confirmPopup.then(function (resConfirmed) {
          if (resConfirmed) {
            if (showLoader) {
              $ionicLoading.show({template: 'Please wait..', delay: 300});
            }
            var hireUser = JSON.parse(localStorage.getItem('hireUser'));
            performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.bids + '/' +
              $scope.lancerProfile.bidID + '/update_status?token=' +
              hireUser.access_token, "PUT", {bid_status_id: 2, app_check_hire: true}, basicAuthorizationService.simpleConfig(),
              function (success) {
                  $ionicLoading.hide();
                  var resp = success;
                  if (success.error.code === 0) {
                      if(resp.add_credit === 'credit available'){
                          //user has credit available
                          $scope.freelancer_user_id = $scope.lancerProfile.userID;
                          if($scope.milestones.length > 0) {
                              $scope.addTasksInStory($scope.milestones);
                          }
                      } else {
                          //user has not credit available then redirect to payment page
                          var _confirmPopup = $ionicPopup.confirm({
                              title: 'Confirm',
                              template: 'You do not have enough credits for hire. Do you want to add credits?'
                          });
                          _confirmPopup.then(function (resConfirmed) {
                              if(resConfirmed) {
                                  window.open(resp.add_credit + '','_system','location=no,clearcache=yes,clearsessioncache=yes');
                              }
                          });
                      }
                  }
              }, function (error) {
                $ionicLoading.hide();
                alert('Please try again later');
                $ionicHistory.goBack();
              });
          }
        });
      };

            $scope.loadTags = function(query, type) {
                return promiseAuto(query, type);
            };

            function promiseAuto(query, type) {
                var deferred = $q.defer();
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.getSaveEditJob +
                    '?token=' + hireUser.access_token + '&type=' + type + '&q=' + query, "GET", {}, {},
                    function(success){
                        $scope.filterTxt = [];
                        angular.forEach(success.data,function(sugg){
                            if($scope.filterTxt.length < 5){
                                $scope.filterTxt.push({text: sugg.name});
                            }
                        });
                        deferred.resolve($scope.filterTxt);
                    },function(error){
                        deferred.resolve([]);
                    });
                return deferred.promise;
            }

            // get auto suggestions for title, type and skill
            $scope.getAutoSuggestion = function (str, type, eve) {
                if(str.length < 3) {
                    return;
                }
                if(type === 'auto_job_types' || type === 'auto_job_skills') {
                    if(str || str.length > 0) {
                        var temp = str.split(",");
                        str = temp[(temp.length - 1)];
                    }
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + HIRE_API.getSaveEditJob +
                    '?token=' + hireUser.access_token + '&type=' + type + '&q=' + str, "GET", {}, {},
                    function(success){
                        $scope.filterTxt = [];
                        $scope.filterTitle = [];
                        angular.forEach(success.data,function(sugg){
                            if($scope.filterTxt.length < 5){
                                if(type === 'auto_job_titles') {
                                    $scope.filterTitle.push(sugg);
                                } else {
                                    $scope.filterTxt.push(sugg);
                                }

                            }
                        });
                    },function(error){
                    });
            };

            $scope.fillTextbox = function(str, type){
                if(type === 'auto_job_titles') {
                    $scope.selTitle.txt = str;
                } else if(type === 'auto_job_types') {
                    // $scope.selType.txt.push({text: str});
                    $scope.selType.txt = str;
                } else if(type === 'auto_job_skills') {
                    $scope.selType.txt = $scope.selSkill.txt + ', ' + str;
                }
                $scope.filterTxt = null;
            };

            $scope.clearSuggestion = function () {
                $scope.filterTxt = null;
            };
            $scope.clearTitle = function () {
                $scope.filterTitle = null;
            };

            // get the milestone added by freelancer on bid
            $scope.getMilestoneOnBid = function (bidId, showLoader) {
                if(showLoader){
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                }
                var hireUser = JSON.parse(localStorage.getItem('hireUser'));
                performCRUDService.simpleCreate(HIRE_API.baseURL + '/app/milestones/' +
                    $scope.vstsProjectID + '/' + $scope.workItemID + '?token=' +
                    hireUser.access_token + '&bid_id=' + bidId,"GET",{}, {},
                    function(success){
                        $scope.milestones = success.data;
                        $ionicLoading.hide();
                    },function(error){
                        $ionicLoading.hide();
                    });
            };

            //check for the minimum amount for budget, reset to 0 when it exceeds max amount.
            $scope.checkGreaterValue = function () {
                if($scope.project.custom_range.min_amount > 0){
                    if ($scope.project.custom_range.min_amount>$scope.project.custom_range.max_amount && ($scope.project.custom_range.max_amount > 0)){
                        $scope.project.custom_range.min_amount = 0;
                    }
                }
            };


            $scope.init = function () {
                var _user = localStorage.getItem('hireUser');
                if(_user) {
                    $scope.hireUser = JSON.parse(localStorage.getItem('hireUser'));
                } else {
                    $timeout(function(){
                        alert('Please login with JobHireHub on Setting section and try again');
                        $ionicHistory.goBack();
                    },1000);
                    return;
                }
                getLoginAuthToken({username: $scope.hireUser.username, password: $scope.hireUser.password}).then(function(tdata){
                    var url = HIRE_API.baseURL + '/app' + HIRE_API.addGetProject + '/' + $scope.vstsProjectID + '?token=' + tdata.access_token;
                    performCRUDService
                        .simpleCreate(url, "GET", {},
                            basicAuthorizationService.simpleConfig(),
                            function(data, status) {
                                if(data.error.code !== 0) {
                                    $scope.hireMode = 'ADD';
                                    $scope.canEditJob = false;
                                    $scope.postScreen = '2';
                                } else {
                                    $scope.canGoNext = true;
                                    $scope.user.hireTitle = data.data[0].name;
                                    $scope.user.hireDescription = data.data[0].description;
                                    $scope.hireMode = 'EDIT';
                                    callGetSavedJobApi().then(function (data) {
                                        $scope.showSpin = false;
                                        if(data && data.data) {
                                            if(data.data[0].project_status_id === 14) {
                                                $scope.isProjectCompleted = true;
                                                $scope.postScreen = '5';
                                                $scope.lancerProfile = {};
                                                $scope.lancerReviews = {};
                                                $scope.populateProfile(data.data[0].freelancer_user_id, true);
                                                $scope.getMilestoneOnBid(data.data[0].id, false);
                                                $scope.populateReviews(data.data[0].freelancer_user_id, true);
                                                return;
                                            }
                                            if(data.data[0].project_type === 'save') {
                                                $scope.canEditJob = true;
                                                $scope.selTitle.txt = data.data[0].name;
                                                $scope.project.description = data.data[0].description;
                                                /*var _tmp = data.data[0].types.split(',');
                                                angular.forEach(_tmp,function(sugg){
                                                    $scope.selType.txt.push({text: sugg});
                                                });*/
                                                // $scope.selType.txt = underscore.uniq($scope.selType.txt, 'text');
                                                $scope.selType.txt = data.data[0].types;
                                                var bg = data.data[0].budget_range.split("-");
                                                $scope.project.custom_range.min_amount = parseInt(bg[0]);
                                                $scope.project.custom_range.max_amount = parseInt(bg[1]);
                                                $scope.project.biddingDays = data.data[0].bid_duration;
                                                // $scope.selSkill.txt = data.data[0].skills;
                                                var tmp = data.data[0].skills.split(',');
                                                angular.forEach(tmp,function(sugg){
                                                    $scope.selSkill.txt.push({text: sugg});
                                                });
                                                $scope.selSkill.txt = underscore.uniq($scope.selSkill.txt, 'text');
                                                $scope.postScreen = '2';
                                            } else if(data.data[0].project_type === 'post'){
                                                ////////////
                                                $scope.canEditJob = true;
                                                $scope.selTitle.txt = data.data[0].name;
                                                $scope.project.description = data.data[0].description;
                                                $scope.selType.txt = data.data[0].types;
                                                var bgg = data.data[0].budget_range.split("-");
                                                $scope.project.custom_range.min_amount = parseInt(bgg[0]);
                                                $scope.project.custom_range.max_amount = parseInt(bgg[1]);
                                                $scope.project.biddingDays = data.data[0].bid_duration;
                                                var tmpp = data.data[0].skills.split(',');
                                                angular.forEach(tmpp,function(sugg){
                                                    $scope.selSkill.txt.push({text: sugg});
                                                });
                                                $scope.selSkill.txt = underscore.uniq($scope.selSkill.txt, 'text');
                                                ///////////
                                                $scope.freelancer_user_id = data.data[0].freelancer_user_id;
                                                $scope.canEditJob = false;
                                                if ($scope.freelancer_user_id && $scope.freelancer_user_id > 0) {
                                                    $scope.postScreen = '5';
                                                    $scope.lancerProfile = {};
                                                    $scope.lancerReviews = {};
                                                    $scope.headerTitle = 'Active';
                                                    $scope.populateProfile(data.data[0].freelancer_user_id, true);
                                                    $scope.getMilestoneOnBid(data.data[0].id, false);
                                                    $scope.populateReviews(data.data[0].freelancer_user_id, true);
                                                    return;
                                                }

                                                $scope.postScreen = '4';
                                                $scope.bidPageCount = 1;$scope.bidItemCount = 10;
                                                $scope.populateBids($scope.bidPageCount, $scope.bidItemCount, true);
                                            } else {
                                                $scope.canEditJob = false;
                                                $scope.postScreen = '2';
                                            }
                                        } else {
                                            $scope.canEditJob = false;
                                            $scope.postScreen = '2';
                                        }
                                    },function (error) {
                                        $scope.canEditJob = false;
                                        $scope.postScreen = '2';
                                    });
                                }
                            },function(error){
                                $scope.showSpin = false;
                                $scope.canGoNext = false;
                                if(error.error.code === 1){
                                    $scope.hireMode = 'ADD';
                                    $scope.canEditJob = false;
                                    $scope.postScreen = '2';
                                } else {
                                    alert('Please login with JobHireHub on Setting section and try again');
                                    $ionicHistory.goBack();
                                }
                            });
                });
            };

            // start from here
            $scope.init();

      ////////////////////// add tasks in story methods ////////////////

      $scope.tasksObj = {};
      $scope.parentWorkItemID = $scope.workItemID;
      $scope.tasksObj.workItemPriority = 3;

      $scope.addTasksInStory = function (tasks) {
        $ionicLoading.show({
          template: 'Adding VSTS task',
          delay: 500
        });
        var j = 0;
        for (var i = 0; i < tasks.length; i++) {
          async.waterfall([ //iterate through the vsts projects updating the work items
            function(cb) {
            var task = tasks[i];
              cb(null, task);
            },
            function(task ,cb) {
              Projects
                .getVSTSProjectCredentialsViaProjectID(parseInt($scope.projectID))
                .then(function (res) {
                  var specificProjectName = res['name'];
                  var specificAccTitle = res['vstsInstanceName'];
                  var specificBase64 = res['vstsToken'];
                  $scope.tasksObj.workItemPriority = 3;
                  $scope.tasksObj.iterationPath = res['name'] + "\\" + res['iteration_path'];
                  $scope.tasksObj.name = task.description + ' $' + task.amount;
                  var obj = $scope.tasksObj;
                  var newTask = ModifyVSTSWorkItemService.addNewFieldsForVso(obj);
                  var typeID = 5;
                  var url = rootURLService.baseURL(specificAccTitle) +
                    specificProjectName + "/_apis/wit/workitems/$Task?api-version=1.0";
                  ModifyVSTSWorkItemService
                    .addNewWorkItemToVSTS(newTask, specificBase64, url, typeID, $scope.bucketID,
                      $scope.projectID, $scope.parentWorkItemID, specificAccTitle)
                    .then(function (success) {
                      j++;
                      if(j === tasks.length) {
                        AlignWorkItems
                          .alignWorkItems(parseInt($scope.projectID), "")
                          .then(function () {
                            $ionicLoading.hide();
                            $scope.tasksObj = {};
                          });
                      }
                    }, function (error) {
                      $ionicLoading.hide();
                      console.log(error);
                      alert("An error has occurred when adding a new VSTS task");
                    });
                });
            }
          ], function(error) {
            $ionicLoading.hide();
            if (error) {
              console.log(error);
            }
          });
        }
      };

        /////////////////// cancel posted job ////////////////
        $scope.openPopover = function ($event) {
            var template = '<ion-popover-view class="popoveroption">' +
                '<ion-header-bar><h1 class="title">Option</h1></ion-header-bar>' +
                '<ion-content>' +
                '<ion-item class="row prolist">' +
                '<div class="row" style="width: 100%" ng-click="cancelPost()">' +
                '<div class="projetnames">Cancel Post</div>' +
                '</div>' +
                '</ion-item>' +
                '<ion-item class="row prolist" style="padding: 0">' +
                '<div class="row" style="width: 100%" ng-click="editPostedJob()">' +
                '<div class="projetnames" style="margin-top: 5px">Edit Post</div>' +
                '</div>' +
                '</ion-item>' +
                '</ion-content>' +
                '</ion-popover-view>';
            $scope.popover = $ionicPopover.fromTemplate(template, {
                scope: $scope
            });
            $scope.popover.show($event);
        };

        $scope.closePopover = function () {
            $scope.popover.hide();
        };

        $scope.cancelPost = function () {
            $scope.popover.hide();
            var confirmPopup = $ionicPopup.confirm({
                title: 'Confirm',
                template: 'Are you sure you want to cancel your posted job?'
            });
            confirmPopup.then(function (resConfirmed) {
                if (resConfirmed) {
                    $ionicLoading.show({template: 'Please wait..', delay: 300});
                    cancelPostedJobApi().then(function (data) {
                        alert('Job cancelled successfully.');
                        $ionicLoading.hide();
                        $ionicHistory.goBack();
                    },function (error) {
                        alert('Please try again later.');
                        $ionicLoading.hide();
                        $ionicHistory.goBack();
                    });
                }
            });
        };

        $scope.editPostedJob = function () {
            $ionicModal.fromTemplateUrl('templates/popups/editJobPopup.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.editModal = modal;
                $scope.editModal.show();
            });
        };

        $scope.hideEditModal = function () {
            $scope.editModal.hide();
            $scope.editModal = null;
            $scope.popover.hide();
        };

        function cancelPostedJobApi(){
            var q = $q.defer();
            var hireUser = JSON.parse(localStorage.getItem('hireUser'));
            var url = HIRE_API.baseURL + '/app' + HIRE_API.getSaveEditJob + '/' + $scope.vstsProjectID + '/' + $scope.workItemID + '/update_status?token=' + hireUser.access_token;
            performCRUDService.simpleCreate(url,"PUT",{
                project_status_id: 10,
                mutual_cancel_note: 'Cancelled job',
                message: 'Cancelled job'
                }, {},
                function(success){
                    $ionicLoading.hide();
                    q.resolve(success);
                },function(error){
                    $ionicLoading.hide();
                    if(error.error){
                        q.resolve({});
                    }
                    q.reject(error);
                });
            return q.promise;
        }

        $scope.updatePostedJob = function () {
            var typeArr = $scope.selType.txt;
            var skillArr = '';
            for (var j = 0;j < $scope.selSkill.txt.length; j++) {
                if(skillArr === '') {
                    skillArr = $scope.selSkill.txt[j].text;
                } else {
                    skillArr = skillArr + ',' + $scope.selSkill.txt[j].text;
                }
            }
            var param = {
                name: $scope.selTitle.txt,
                description: $scope.project.description,
                project_status_id: 1,
                bid_duration: $scope.project.biddingDays,
                image: 'sfdf',
                skills: skillArr,
                project_types: typeArr,
                additional_description: $scope.taskList,
                custom_range: {
                    min_amount: $scope.project.custom_range.min_amount,
                    max_amount: $scope.project.custom_range.max_amount
                }
            };
            callEditJobApi(param).then(function (succ) {
                alert('Job updated successfully.');
                $scope.hideEditModal();
            }, function (error) {
                $scope.hideEditModal();
                $ionicHistory.goBack();
            });
        };

            // get current user
            function getCurrentUser (){
                Projects
                    .getVSTSProjectCredentialsViaProjectID(parseInt($scope.projectID))
                    .then(function(res) {
                        CurrentVSTSUser
                            .getCurrentVSTSUserByAreaPathNodeName(res.areaPathNodeName)
                            .then(function(resCurrentUser) {
                                if (resCurrentUser[0] !== undefined) {
                                    var person = resCurrentUser[0].userName;
                                    $scope.meUniqueName = person.substring(person.indexOf("<") + 1, person.indexOf(">"));
                                } else {
                                    console.log('cannot get the current user');
                                }
                            });
                    });
            }
            getCurrentUser();

    }]);
