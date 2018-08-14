angular.module('go-plan-do.services', ['ngCordova'])

.factory('DBA', ['$cordovaSQLite', '$q', '$ionicPlatform', function($cordovaSQLite, $q, $ionicPlatform) {
  var self = this;
   // Handle query's and potential errors
  self.query = function (query, parameters) {
      parameters = parameters || [];
      var q = $q.defer();
      $ionicPlatform.ready(function () {
          $cordovaSQLite.execute(db, query, parameters)
          .then(function (result) {
                q.resolve(result);
          },function (error) {
                console.warn('I found an error');
                console.warn(error);
                console.warn("The query was " + query);
                console.warn(parameters);
                q.reject(error);
          });
      });

      return q.promise;
  };
  // Process a result set
  self.getAll = function(result) {
      var output = null;
      var output = [];

      for (var i = 0; i < result.rows.length; i++) {
        output.push(result.rows.item(i));
      }
      return output;
  };
  // Process a single result
  self.getById = function(result) {
      var output = null;
       if(result.rows.length > 0){
           output = angular.copy(result.rows.item(0));
           //convert output into json from an object
           output = JSON.parse(JSON.stringify(output));
       }

      return output;
  };
  return self;
}])
// the video popup alert service
.factory ('VideoPopupsService',['DBA','moment', function (DBA,moment) {
   var self = this;

   self.allVideoPopupAlerts = function(){
       return DBA.query("SELECT * FROM videoPopups")
      .then(function(result){
        return DBA.getAll(result);
      });
  };
  self.getVideoPopupAlertID = function(id) {
    var parameters = [id];
    return DBA.query("SELECT * FROM videoPopups WHERE id = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
          });
  };
  self.addVideoPopupAlert = function(videoPopupAlert) {
    var parameters = [videoPopupAlert.showVideoAlertOnStart,moment().format(),moment().format()];
    return DBA.query("INSERT INTO videoPopups (showVideoAlertOnStart,dateAdded,dateModified ) VALUES (?,?,?)", parameters);
  };

  self.removeVideoPopupAlert = function(videoPopupAlert) {
    var parameters = [videoPopupAlert.id];
    return DBA.query("DELETE FROM videoPopups WHERE id = (?)", parameters);
  };

  self.removeAllVideoPopupAlerts = function() {
    var parameters = [];
    return DBA.query("DELETE FROM videoPopups", parameters);
  };

  self.updateVideoPopupAlert= function(origVideoPopupAlert, editVideoPopupAlert) {
    var parameters = [editVideoPopupAlert.showVideoAlertOnStart,moment().format(), origVideoPopupAlert.id];
    return DBA.query("UPDATE videoPopups SET showVideoAlertOnStart = (?), dateModified = (?) WHERE id = (?)", parameters);
  };
   return self;

}])
//stores info regarding the current vsts user
.factory('CurrentVSTSUser',['DBA', function(DBA){
    var self = this;

    self.getCurrentVSTSUserByAreaPathNodeName = function(areaPathNodeName){
       var parameters = [areaPathNodeName];
      return DBA.query("SELECT * FROM vstsUser WHERE areaPathNodeName = (?)", parameters)
      .then(function(result){
        return DBA.getAll(result);
      });


    };

    self.addCurrentVSTSUser = function(currentVSTSUser){

      var parameters = [currentVSTSUser.userName, currentVSTSUser.areaPathNodeName];
       return DBA
      .query("INSERT INTO vstsUser(userName,areaPathNodeName) VALUES (?,?)", parameters)
      .then(function(){
             return DBA.query("SELECT last_insert_rowid();")
              .then(function (result) {
                return DBA.getById(result);
              });
      });


    };
    self.addCurrentVSTSUserWithPID = function(currentVSTSUser, pid){
        var parameters = [currentVSTSUser.userName, currentVSTSUser.areaPathNodeName, pid];
        return DBA
            .query("INSERT INTO vstsUser(userName,areaPathNodeName, projectID) VALUES (?,?,?)", parameters)
            .then(function(){
                return DBA.query("SELECT last_insert_rowid();")
                    .then(function (result) {
                        return DBA.getById(result);
                    });
            });
    };

    self.removeCurrentVSTSUserByAreaPathNodeName= function(areaPathNodeName){
        var parameters = [areaPathNodeName];
        return DBA.query("DELETE FROM vstsUser WHERE areaPathNodeName = (?)", parameters);

    };

    self.removeCurrentVSTSUserByAreaPathNodeNamePID= function(areaPathNodeName, pid){
        var parameters = [areaPathNodeName, pid];
        return DBA.query("DELETE FROM vstsUser WHERE areaPathNodeName = (?) AND projectID = (?)", parameters);
    };

     return self;

}])


.factory('WorkItems',['DBA', 'VSTSTeams', 'VSTSTeamMembers', 'Projects', 'Credentials', 'TriageEmailSettings', 'IterationHours', '$q', '$rootScope', 'CurrentVSTSUser', 'Images',  function(DBA, VSTSTeams, VSTSTeamMembers, Projects, Credentials,TriageEmailSettings,IterationHours,$q,$rootScope, CurrentVSTSUser, Images){
   var self = this;

   self.allWorkItems = function(){
      return DBA.query("SELECT * FROM workItems")
      .then(function(result){
        return DBA.getAll(result);
      });
   };

   self.getWorkItemByID = function(workItemID) {
    var parameters = [workItemID];
    return DBA.query("SELECT * FROM workItems WHERE id = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
          });
   };


    self.getWorkItemByVSOIDAndProjectID = function(workItemVSOID, projectID) {
		var parameters = [workItemVSOID, projectID];
		return DBA.query("SELECT * FROM workItems WHERE workItemVSOID = (?) AND projectID = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
        });
   };


  self.getWorkItemByBucketID = function(bucketID) {
    var parameters = [bucketID];
    return DBA.query("SELECT * FROM workItems WHERE bucketID = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
          });
   };
   self.getWorkItemsByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("SELECT * FROM workItems WHERE projectID = (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
   };

  self.getWorkItemsByBucketIDAndProjectIDAndAssignedMember = function(projectID,bucketID,assignedTo) {
    var parameters = [projectID,bucketID,bucketID,assignedTo, 'Closed'];
    return DBA.query("SELECT * FROM workItems WHERE projectID = (?) and (bucketID = (?) OR bucketIDTag = (?)) AND workItemAssignedTo = (?) and workItemVSOState != (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
   };


	self.getWorkItemsByProjectIDAndAssignedMemberForReminder = function(projectID,assignedTo) {
		var parameters = [projectID,assignedTo];
		return DBA.query("SELECT DISTINCT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?) AND (remainingWork ='' OR originalEstimate ='' ) AND workitemTypeID != 7  AND workItemVSOState != 'Closed' AND workItemVSOState != 'Removed'", parameters)
			.then(function(result) {
				return DBA.getAll(result);
          });
	};


	self.getWorkItemsByProjectIDAndAssignedMemberForTodayAndTomorrow= function(projectID,assignedTo) {
		var parameters = [projectID,assignedTo];
		return DBA.query("SELECT DISTINCT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?) AND workitemTypeID != 7 AND bucketID != 1 AND bucketID != 2 AND bucketID !=4 AND bucketID != 5 ", parameters)
			.then(function(result) {
				return DBA.getAll(result);
          });
	};


	self.getWorkItemsOfTodayAndTomorrowBuckets= function(projectID,assignedTo) {
		var parameters = [projectID,assignedTo];
		return DBA.query("SELECT workItemVSOID FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?) AND workItemVSOState != 'Closed' AND workItemVSOState != 'Removed' AND workitemTypeID != 7 and (bucketID = 1 OR bucketID = 2 )", parameters)
			.then(function(result) {
				return DBA.getAll(result);
          });
	};

	self.getVSTSExpiryAndTasksForEndOfSprint = function(projectID, assignedTo) {
    var parameters = [projectID,assignedTo];
	return DBA.query("SELECT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?) AND workitemTypeID != 7 AND workItemVSOState != 'Closed' AND workItemVSOState != 'Removed'", parameters)
		.then(function(result) {
			return DBA.getAll(result);
	  });
	};

  self.getWorkItemByTypeId = function(workItemTypeID) {
    var parameters = [workItemTypeID];
    return DBA.query("SELECT * FROM workItems WHERE workItemTypeID = (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
   };

	self.getWorkItemCloseMemberCounts = function(projectID, workItemVSOState){
	    var parameters = [projectID, workItemVSOState];
       return DBA.query("SELECT workItemClosedBy,workItemAssignedTo, count(workItemAssignedTo)as total FROM workItems WHERE projectID = (?) and workItemVSOState = (?) and workItemDeleted != 1 and (workItemTypeID == 5 OR workItemTypeID == 1) GROUP BY workItemAssignedTo ORDER BY workItemAssignedTo DESC Limit 3", parameters)
         .then(function (result) {
             return DBA.getAll(result);
         });
	}

	self.getWorkItemCloseMemberCountsSub = function(projectID, workItemVSOState){
	    var parameters = [projectID, workItemVSOState];
       return DBA.query("SELECT workItemClosedBy,workItemAssignedTo, count(workItemAssignedTo)as total FROM workItems WHERE projectID = (?) and workItemVSOState = (?) and workItemDeleted != 1 and (workItemTypeID == 5 OR workItemTypeID == 1) GROUP BY workItemAssignedTo ORDER BY workItemAssignedTo DESC Limit 3", parameters)
         .then(function (result) {
             return DBA.getAll(result);
         });
	}

   self.getWorkItemProjectIDandVSOState = function (projectID, workItemVSOState) {
       var parameters = [projectID, workItemVSOState];
       return DBA.query("SELECT count(*) as count FROM workItems WHERE projectID = (?) and workItemVSOState = (?) ", parameters)
         .then(function (result) {
             return DBA.getById(result);
         });
   };


   self.getWorkItemByVsWorkAndProjectID = function (vsTaskID, projectID) {
      var parameters = [vsTaskID, projectID];
      return DBA.query("SELECT * FROM workItems WHERE workItemVSOID = (?) and projectID =(?)  ", parameters)
        .then(function(result) {
            return DBA.getById(result);
        });
  };

   self.getAllWorkItemByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("SELECT * FROM workItems WHERE projectID = (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
   };
 self.getWorkItemsByProjectIDAndSortThem = function(projectID) {
        var parameters = [projectID];
	   return DBA.query("SELECT * FROM workItems WHERE projectID = (?) ORDER BY bucketID, sort asc", parameters)
          .then(function(result) {
			    return DBA.getAll(result);
        });

	};
    self.getWorkItemsByProjectIDAndTest = function(projectID) {
        var parameters = [projectID];
        return DBA.query("SELECT * FROM workItems WHERE projectID = (?) ORDER BY bucketID", parameters)
          .then(function(result) {
			         return DBA.getAll(result);
        });
    };



   self.getWorkItemsByProjectIDAndCloseThem = function(projectID) {
    var parameters = [projectID];
    return DBA.query("SELECT * FROM workItems WHERE projectID = (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
   };
   //130, 131, 136, 134, 138, 140, 141, 155, 156, 157, 142, 143, 144, 145, 146, 149, 150
   self.getWorkItemsByProjectIDForDel = function(projectID) {
    var parameters = [projectID];
    return DBA.query("SELECT workItemVSOID FROM workItems WHERE projectID = (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
	};

	self.getWorkItemsByProjectIDForDelCount = function(projectID, Ids) {
    var parameters = [projectID, Ids];
    return DBA.query("SELECT * FROM workItems WHERE projectID = (?) AND workItemVSOID NOT IN (?)", parameters)
          .then(function(result) {
            return DBA.getAll(result);
          });
	};

    self.getUnassignedWorkItems = function(projectID){
        var parameters = [projectID];
        return DBA.query("SELECT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = '' AND workItemDeleted != 1", parameters)
            .then(function(result){
                return DBA.getAll(result);
            });
    };

    self.getWorkItemsByTeamMemberNameAndProjectID = function(projectID,assignedTo){
        var parameters = [projectID,assignedTo];

        return DBA.query("SELECT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?)", parameters)
            .then(function(result){
                return DBA.getAll(result);
            });
    };

    self.getCloseVSTSWorkItemsByTeamMember = function(projectID, assignedTo) {
      var parameters = [projectID,assignedTo];
      return DBA.query("SELECT * FROM workItems WHERE projectID = (?) AND workItemAssignedTo = (?) AND workitemTypeID != 7 AND workItemVSOState = 'Closed' AND workItemVSOState != 'Removed'", parameters)
        .then(function(result) {
           return DBA.getAll(result);
        });
    };


   self.addWorkItem = function(workItem) {
       var parameters = '';
       var tags = '';
       var workItemCreatedDate = '';
       if(workItem.tags) {
           tags = workItem.tags;
       }
       if(workItem.workItemCreatedDate) {
           workItemCreatedDate = workItem.workItemCreatedDate;
       }
       if(workItem.acceptanceCriteria) {
           parameters = [workItem.vstsTagID,workItem.bucketIDTag,workItem.bucketID,workItem.projectID,workItem.name,workItem.alarmNotificationDate,
               workItem.workItemPriority,workItem.description,workItem.iterationPath,workItem.originalEstimate,
               workItem.remainingWork,workItem.completedWork,workItem.workItemTypeID,
               workItem.workItemVSOID, workItem.workItemVSOState, workItem.workItemClosedBy, workItem.workItemClosedDate
               ,workItem.bucketID,workItem.workItemAssignedTo, workItem.parentWorkItemID, workItem.acceptanceCriteria, tags, workItemCreatedDate];
           return DBA.query("INSERT INTO workItems(vstsTagID,bucketIDTag,bucketID,projectID, name,alarmNotificationDate, "
               + " workItemPriority, description, iterationPath, originalEstimate, remainingWork, "
               + " completedWork, workItemTypeID,  workItemVSOID, workItemVSOState, workItemClosedBy ,workItemClosedDate, "
               + " sort,workItemAssignedTo, parentWorkItemID, acceptanceCriteria, tags, workItemCreatedDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"
               + " (select (count(*) + 1) from workItems where bucketID=?),?,?,?,?,?)", parameters);
       } else {
           parameters = [workItem.vstsTagID,workItem.bucketIDTag,workItem.bucketID,workItem.projectID,workItem.name,workItem.alarmNotificationDate,
               workItem.workItemPriority,workItem.description,workItem.iterationPath,workItem.originalEstimate,
               workItem.remainingWork,workItem.completedWork,workItem.workItemTypeID,
               workItem.workItemVSOID, workItem.workItemVSOState, workItem.workItemClosedBy, workItem.workItemClosedDate
               ,workItem.bucketID,workItem.workItemAssignedTo, workItem.parentWorkItemID, tags, workItemCreatedDate];
           return DBA.query("INSERT INTO workItems(vstsTagID,bucketIDTag,bucketID,projectID, name,alarmNotificationDate, "
               + " workItemPriority, description, iterationPath, originalEstimate, remainingWork, "
               + " completedWork, workItemTypeID,  workItemVSOID, workItemVSOState, workItemClosedBy ,workItemClosedDate, "
               + " sort,workItemAssignedTo, parentWorkItemID, tags, workItemCreatedDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"
               + " (select (count(*) + 1) from workItems where bucketID=?),?,?,?,?)", parameters);
       }
  };

  self.addWorkItemWithRepeat = function(workItem) {

    var parameters = [workItem.vstsTagID,workItem.bucketIDTag,workItem.bucketID,workItem.projectID,workItem.name,workItem.alarmNotificationDate,
      workItem.workItemPriority,workItem.description,workItem.iterationPath,workItem.originalEstimate,
      workItem.remainingWork,workItem.completedWork,workItem.workItemTypeID,workItem.workItemHasRepeatSchedule,
      workItem.workItemVSOID, workItem.workItemVSOState, workItem.workItemClosedBy, workItem.workItemClosedDate
      ,workItem.bucketID,workItem.workItemAssignedTo, workItem.parentWorkItemID];

    //console.log(parameters)
    return DBA.query("INSERT INTO workItems(vstsTagID,bucketIDTag,bucketID,projectID, name,alarmNotificationDate, "
      + " workItemPriority, description, iterationPath, originalEstimate, remainingWork, "
      + " completedWork, workItemTypeID, workItemHasRepeatSchedule,  workItemVSOID, workItemVSOState, workItemClosedBy ,workItemClosedDate, "
      + " sort,workItemAssignedTo, parentWorkItemID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"
      + " (select (count(*) + 1) from workItems where bucketID=?),?,?)", parameters);
  };

  self.removeWorkItem = function(workItem) {
    var parameters = [workItem.id];
    return DBA.query("DELETE FROM workItems WHERE id = (?)", parameters);
  };

   self.removeWorkItemByTypeId = function(workItemTypeID) {
    var parameters = [workItemTypeID];
    return DBA.query("DELETE FROM workItems WHERE workItemTypeID = (?)", parameters);
  };

  self.updateWorkItem = function(origWorkItem, editWorkItem) {
      var parameters = '';
      var tags = '';
      if(editWorkItem.tags) {
          tags = editWorkItem.tags;
      }
      if(editWorkItem.acceptanceCriteria) {
          parameters = [editWorkItem.bucketID,editWorkItem.projectID,editWorkItem.name,editWorkItem.alarmNotificationDate,
              editWorkItem.workItemPriority,editWorkItem.description,editWorkItem.iterationPath,
              editWorkItem.originalEstimate,
              editWorkItem.remainingWork,editWorkItem.completedWork,editWorkItem.workItemTypeID,
              editWorkItem.workItemDeleted,editWorkItem.workItemVSOID, editWorkItem.workItemVSOState,
              editWorkItem.sort, editWorkItem.workItemClosedBy, editWorkItem.workItemClosedDate,editWorkItem.acceptanceCriteria,
              tags,origWorkItem.id];
          return DBA.query("UPDATE workItems SET bucketID = (?), projectID = (?), name = (?), alarmNotificationDate = (?), "
              + " workItemPriority = (?), description = (?), iterationPath = (?), originalEstimate = (?), "
              + " remainingWork = (?), completedWork = (?), workItemTypeID = (?), workItemDeleted = (?), "
              + " workItemVSOID = (?), workItemVSOState =(?), sort = (?) ,  workItemClosedBy= (?) , "
              +"  workItemClosedDate = (?) ,  acceptanceCriteria= (?), tags= (?)"
              + " WHERE id = (?)", parameters);
      } else {
          parameters = [editWorkItem.bucketID,editWorkItem.projectID,editWorkItem.name,editWorkItem.alarmNotificationDate,
              editWorkItem.workItemPriority,editWorkItem.description,editWorkItem.iterationPath,
              editWorkItem.originalEstimate,
              editWorkItem.remainingWork,editWorkItem.completedWork,editWorkItem.workItemTypeID,
              editWorkItem.workItemDeleted,editWorkItem.workItemVSOID, editWorkItem.workItemVSOState,
              editWorkItem.sort, editWorkItem.workItemClosedBy, editWorkItem.workItemClosedDate,
              tags,origWorkItem.id];
          return DBA.query("UPDATE workItems SET bucketID = (?), projectID = (?), name = (?), alarmNotificationDate = (?), "
              + " workItemPriority = (?), description = (?), iterationPath = (?), originalEstimate = (?), "
              + " remainingWork = (?), completedWork = (?), workItemTypeID = (?), workItemDeleted = (?), "
              + " workItemVSOID = (?), workItemVSOState =(?), sort = (?) ,  workItemClosedBy= (?) , "
              +"  workItemClosedDate = (?) , tags= (?) "
              + " WHERE id = (?)", parameters);
      }
  };

    self.deleteWorkItem = function(origWorkItem) {
        var parameters = [origWorkItem.workItemVSOID];
        return DBA.query("DELETE FROM workItems WHERE workItemVSOID = (?)", parameters);
    };

    self.setWorkItemDeletedByVSOID = function (workItemVSOID) {
        var parameter = [workItemVSOID];
        return DBA.query("DELETE FROM workItems WHERE workItemVSOID = (?)", parameter);
    };


  self.updateWorkItemAndTaskParentID = function(origWorkItem, editWorkItem) {
    var parameters = [editWorkItem.bucketID,editWorkItem.projectID,editWorkItem.name,editWorkItem.alarmNotificationDate,
                      editWorkItem.workItemPriority,editWorkItem.description,editWorkItem.iterationPath,editWorkItem.originalEstimate,
                      editWorkItem.remainingWork,editWorkItem.completedWork,editWorkItem.workItemTypeID,
                      editWorkItem.workItemDeleted,editWorkItem.workItemVSOID, editWorkItem.workItemVSOState,
                      editWorkItem.sort, editWorkItem.workItemClosedBy, editWorkItem.workItemClosedDate, editWorkItem.parentWorkItemID, origWorkItem.id];
    return DBA.query("UPDATE workItems SET bucketID = (?), projectID = (?), name = (?), alarmNotificationDate = (?), "
                    + " workItemPriority = (?), description = (?), iterationPath = (?), originalEstimate = (?), "
                    + " remainingWork = (?), completedWork = (?), workItemTypeID = (?), workItemDeleted = (?), "
                    + " workItemVSOID = (?), workItemVSOState =(?), sort = (?) ,  workItemClosedBy= (?) , workItemClosedDate = (?), parentWorkItemID = (?) "
                    + " WHERE id = (?)", parameters);
  };

    self.updateWorkItemEstimations = function(workItem) {
        var parameters = [workItem.originalEstimate,workItem.remainingWork, workItem.completedWork, workItem.id];
        return DBA.query("UPDATE workItems SET originalEstimate = (?), remainingWork = (?), completedWork = (?) WHERE id = (?)", parameters);
    };

    self.updateWorkItemRemainingHrs = function(workItem) {
        var parameters = [workItem.remainingWork, workItem.workItemVSOID];
        return DBA.query("UPDATE workItems SET remainingWork = (?) WHERE workItemVSOID = (?)", parameters);
    };

  self.updateWorkItemVSTSTag = function(origWorkItem, editWorkItem) {
    var parameters = [editWorkItem.vstsTagID,origWorkItem.id];
    return DBA.query("UPDATE workItems SET vstsTagID = (?) WHERE id = (?)", parameters);
  };


  self.updateWorkItemSortIndex = function(origWorkItem, editWorkItem) {
    var parameters = [editWorkItem.sort,origWorkItem.workItemVSOID,origWorkItem.projectID];
    return DBA.query("UPDATE workItems SET sort = (?) WHERE workItemVSOID = (?) AND projectID = (?)", parameters);
  };

  self.updateWorkItemParentIDByVSTSID = function(parentWorkItemID, workItemVSOID) {
    var parameters = [parentWorkItemID,workItemVSOID];

    return DBA.query("UPDATE workItems SET parentWorkItemID = (?) WHERE workItemVSOID = (?)", parameters);
  };

   self.updateWorkItemStateAndAssignedTo = function(origWorkItem, editWorkItem) {
    var parameters = [editWorkItem.assignedTo,editWorkItem.state,origWorkItem.workItemVSOID];
    return DBA.query("UPDATE workItems SET workItemAssignedTo = (?), workItemVSOState = (?) WHERE workItemVSOID = (?)", parameters);
  };

    self.updateWorkItemBucket = function(origWorkItem, editWorkItem) {
        var parameters = [origWorkItem,editWorkItem];
        return DBA.query("UPDATE workItems SET bucketID = (?) WHERE workItemVSOID = (?)", parameters);
    };

    self.updateWorkItemStateAndAssignedToAndBucketID = function(origWorkItem, editWorkItem) {
        var parameters = [editWorkItem.assignedTo,editWorkItem.state,editWorkItem.bucketId,origWorkItem.workItemVSOID];
        return DBA.query("UPDATE workItems SET workItemAssignedTo = (?), workItemVSOState = (?), bucketID = (?) WHERE workItemVSOID = (?)", parameters);
    };


    self.removeWorkItemsByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("DELETE FROM workItems WHERE projectID = (?)", parameters);
  };

  self.removeWorkItemsByProjectIDAndWorkItemVSOID = function(projectID, workItemVSOID) {
    var parameters = [projectID, workItemVSOID];
    return DBA.query("DELETE FROM workItems WHERE projectID = (?) AND workItemVSOID = (?)", parameters);
  };



  self.removeProjectWorkItemsAndCredentials = function(projectID){
    var q = $q.defer();
	//console.log(projectID);
    self.removeWorkItemsByProjectID(projectID).then(function() {
    //get the project details
    Projects.getProject(projectID).then(function(res) {
		//console.log(res);
        CurrentVSTSUser
            .removeCurrentVSTSUserByAreaPathNodeNamePID(res.areaPathNodeName, projectID)
            .then(function() {
                //remove any team members in the local db
                VSTSTeams
                    .getVSTSTeamByProjectID(projectID)
                    .then(function(vstsTeam) {
                        VSTSTeamMembers
                            .removeVSTSMembersByVSTSTeamIDAndPID(vstsTeam.vstsTeamID, projectID)
                            .then(function() {
                                //then remove the  vsts team associated with this project
                                VSTSTeams
                                    .removeVSTSTeamByProjectID(projectID)
                                    .then(function() {
                                        //then remove the project
                                        Projects
                                            .removeProject(projectID)
                                            .then(function() {
                                                //clear the credentials associated with this project
                                                Credentials
                                                    .clearCredentialsByProjectID(projectID)
                                                    .then(function() {
                                                        // remove the app settings associated with this project
                                                        TriageEmailSettings
                                                            .removeTriageEmailSettingByProjectID(projectID)
                                                            .then(function() {
                                                                $rootScope.triageWorkItems.filter(function(index, el) {
                                                                    if (parseInt(el.projectID) === parseInt(projectID)) {
                                                                        $rootScope.triageWorkItems.splice(index, 1);
                                                                    }
                                                                });

                                                            })
                                                            .then(function() {
                                                                //finally also remove the remainging Hours when project is deleted
                                                                IterationHours.removeHoursByProjectID(projectID).then(function() {
																	Images.removeImagesByProjectID(projectID).then(function(){

																		 q.resolve("sucess");

																	})

                                                                });

                                                            });


                                                    });

                                            });

                                    });

                            });

                    });




            });

    });

});

    return q.promise;
  };

   return self;
}])
.factory('WorkItemTypes',['DBA', function(DBA){
   var self = this;

  self.allWorkItemTypes = function(){
       return DBA.query("SELECT * FROM workItemTypes")
      .then(function(result){
        return DBA.getAll(result);
      });
  };
  self.getWorkItemTypeByID = function(bucketID) {
    var parameters = [bucketID];
    return DBA.query("SELECT * FROM workItemTypes WHERE id = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
          });
  };
  self.addWorkItemType = function(workItemType) {
    var parameters = [workItemType.name];
    return DBA.query("INSERT INTO workItemTypes (name) VALUES (?)", parameters);
  };

  self.removeWorkItemType = function(workItemType) {
    var parameters = [workItemType.id];
    return DBA.query("DELETE FROM workItemTypes WHERE id = (?)", parameters);
  };

  self.updateWorkItemType= function(origWorkItemType, editWorkItemType) {
    var parameters = [editWorkItemType.name,  origWorkItemType.id];
    return DBA.query("UPDATE workItemTypes SET name = (?) WHERE id = (?)", parameters);
  };
  return self;

}])
.factory('Buckets',['DBA', function(DBA){
   var self = this;
      //db functions for the buckets
      self.allBuckets = function() {
        return DBA.query("SELECT * FROM buckets ORDER by id")
          .then(function(result){
            return DBA.getAll(result);
          });
      };
      self.getBucketByID = function(bucketID) {
        var parameters = [bucketID];
        return DBA.query("SELECT * FROM buckets WHERE id = (?)", parameters)
              .then(function(result) {
                return DBA.getById(result);
              });
      };
      self.addBucket = function(bucket) {
        var parameters = [bucket.title];
        return DBA.query("INSERT INTO buckets (title) VALUES (?)", parameters);
      };
      self.removeBucket = function(bucket) {
        var parameters = [bucket.id];
        return DBA.query("DELETE FROM buckets WHERE id = (?)", parameters);
      };

      self.updateBucket= function(origBucket, editBucket) {
        var parameters = [editBucket.title,  origBucket.id];
        return DBA.query("UPDATE buckets SET title = (?) WHERE id = (?)", parameters);
      };
  return self;
}])
.factory('Credentials',['DBA', function(DBA){
  var self = this;
      //store the necessary vsts credentials
      self.storeCredentials = function (vstsToken, vstsInstanceName,areaPathNodeName,projectID) {
          var parameters = [projectID,vstsToken, vstsInstanceName,areaPathNodeName];
          return DBA.query("INSERT INTO vstsCredentials (projectID,vstsToken, vstsInstanceName,areaPathNodeName) VALUES (?,?,?,?)", parameters);

      };

      self.clearCredentialsByProjectID= function (projectID) {
          var parameters = [projectID]
          return DBA.query("DELETE FROM vstsCredentials WHERE projectID = (?)", parameters);
      };

      self.updateCredentialsByProjectID = function(projectID,changedAreaPathNodeName) {
        var parameters = [changedAreaPathNodeName,projectID];
        return DBA.query("UPDATE vstsCredentials set areaPathNodeName = (?)  WHERE projectID = (?)", parameters);

      };

  return self;
}])
.factory('CollapsedBuckets',['DBA', function(DBA){
  var self = this;

      //db functions for the collapsed buckets table
      self.allCollapsedBuckets = function() {
        return DBA.query("SELECT * FROM collapsedBuckets")
          .then(function(result){
            return DBA.getAll(result);
          });
      };
      self.getCollapsedBucketByBucketIDAndProjectID = function(bucketID,projectID) {
        var parameters = [bucketID,projectID];
        return DBA.query("SELECT * FROM collapsedBuckets WHERE bucketID = (?) AND projectID = (?) ", parameters)
              .then(function(result) {
                return DBA.getById(result);
              });
      };
      self.addCollapsedBucket = function(collapsedBucket) {
        var parameters = [collapsedBucket.bucketID,collapsedBucket.projectID];
        return DBA.query("INSERT INTO collapsedBuckets (bucketID,projectID) VALUES (?,?)", parameters);
      };
      self.removeCollapsedBucketByBucketIDAndProjectID = function(collapsedBucket) {
        var parameters = [collapsedBucket.bucketID,collapsedBucket.projectID];
        return DBA.query("DELETE FROM collapsedBuckets WHERE bucketID = (?) AND projectID = (?)", parameters);
      };

      self.updateCollapsedBucket= function(origCollapsedBucket, editCollapsedBucket) {
        var parameters = [editCollapsedBucket.bucketID, editCollapsedBucket.projectID, origCollapsedBucket.id];
        return DBA.query("UPDATE collapsedBuckets SET title = (?) WHERE id = (?)", parameters);
      };

  return self;
}])
.factory('Counts',['DBA', function(DBA){
  var self = this;
     //counts
  self.getTableCountByParams = function(tblName,whereCondition,params) {
    var parameters = params;
    return DBA.query("SELECT count(*) as count FROM "+ tblName +" WHERE "+ whereCondition, parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

  self.getTableCount= function(tblName) {
    var parameters = [];
    return DBA.query("SELECT count(*) as count FROM "+ tblName, parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

   return self;
}])
.factory('TriageEmailSettings',['DBA', '$q', '$http', 'Counts', function(DBA,$q,$http,Counts){
  var self = this;

  //db functions for the triage email settings
  self.allTriageEmailSettings = function() {
    return DBA.query("SELECT * FROM triageEmailSettings ORDER by id")
      .then(function(result){
        return DBA.getAll(result);
      });
  };

  self.addTriageEmailSetting = function(triageEmailSetting) {
    var q = $q.defer();
    var parameters = [triageEmailSetting.projectID,triageEmailSetting.emailProviderID,triageEmailSetting.triageInboxAddress];
    //checks to prevent adding of more than 1 triage setting per VSO project & email provider combination
    Counts
    .getTableCountByParams("triageEmailSettings","projectID=(?) AND emailProviderID=(?)",
      [triageEmailSetting.projectID,triageEmailSetting.emailProviderID])
    .then(function(res){
          if(res.count>0){
            var parameters1 = [triageEmailSetting.triageInboxAddress,
                               triageEmailSetting.projectID,
                               triageEmailSetting.emailProviderID];
            DBA.query("UPDATE triageEmailSettings SET  "
            + "triageInboxAddress = (?) WHERE projectID=(?) AND emailProviderID=(?)",
             parameters1)
            .then(function (result) {
                DBA.query("SELECT * FROM triageEmailSettings WHERE triageInboxAddress=(?) AND projectID=(?) AND emailProviderID=(?)",
                  parameters1)
                .then(function(res) {

                    q.resolve(DBA.getById(res));
                });

             });
          }
          else{
               DBA.query("INSERT INTO triageEmailSettings (projectID,emailProviderID,triageInboxAddress) "
                        +" VALUES (?,?,?)", parameters)
               .then(function(res){
                  DBA.query("SELECT last_insert_rowid();")
                      .then(function (result) {
                      q.resolve(DBA.getById(result));
                  });
               });
          }

    });
     return q.promise;

  };

  self.updateTriageEmailSettingByID = function(origTriageEmailSetting,editTriageEmailSetting){
     var parameters = [editTriageEmailSetting.deviceUUID,
                               origTriageEmailSetting.projectID,
                               origTriageEmailSetting.emailProviderID];
    return DBA.query("UPDATE triageEmailSettings SET  "
            + "deviceUUID = (?) WHERE projectID=(?) AND emailProviderID=(?)",
             parameters);

  };

  self.removeTriageEmailSettingByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("DELETE FROM triageEmailSettings WHERE projectID = (?)", parameters);
  };


  //server funcs
  //Function used to query the triage inbox server
  self.queryTriageServer = function(method,url,headers,data){
    var q = $q.defer();
    var req = {
       method: method,
       url: url,
       headers: headers,
       data: data
    };

    $http(req)
    .success(function(data, status, headers, config){
          q.resolve(data, status);
    }).error(function (data, status, headers, config) {
          q.reject(data, status);
    });
    return q.promise;
  };
  return self;

}])

.factory('Projects',['DBA','$rootScope','$timeout',function(DBA,$rootScope,$timeout){

	var self = this;
	self.addAutoQueryBacklogTime = function(time, notification_recv, notification_send, notification_uuid ) {
      var parameters = [time, notification_recv, notification_send, notification_uuid];
      return DBA.query("INSERT INTO appSettings (backlogTime, notification_recv, notification_send, notification_uuid) VALUES (?, ?, ?, ?)", parameters);
	};

  self.updateTime= function(time, notification_recv, notification_send, notification_uuid ,id) {
      var parameters = [time, notification_recv, notification_send, notification_uuid ,id];
      return DBA.query("UPDATE appSettings SET backlogTime = (?), notification_recv = (?), notification_send = (?), notification_uuid = (?) WHERE id = (?)", parameters);
  };
    self.updateRemainingHrs= function(remainingHrs ,id) {
        var parameters = [remainingHrs ,id];
        return DBA.query("UPDATE appSettings SET remainingHrs = (?) WHERE id = (?)", parameters);
    };
  self.getAutoQueryBacklogTime = function(ID) {
      var parameters = [ID];
      return DBA.query("SELECT * FROM appSettings WHERE id = (?)", parameters)
          .then(function(result) {
            return DBA.getById(result);
          });
  };

  // Update Close task counts , if it is same do not notify to users,
	self.updateCloseTaskofProjects = function(origId, closeTask) {
    var parameters = [closeTask, origId];
    return DBA.query("UPDATE projects SET closeTask = (?) WHERE id = (?)", parameters);
  };


  // Notification
  self.addLeaderBoardNotification = function(notification) {
      var parameters = [notification];
      return DBA.query("INSERT INTO leaderBrdSetting (notification) VALUES (?)", parameters);
  };


  self.allProjects = function() {
      return DBA.query("SELECT * FROM projects")
          .then(function(result){
            return DBA.getAll(result);
          });
  };
  self.addedVSProjects = function() {
      return DBA.query("SELECT * FROM projects WHERE vstsProjectID <> '001'")
      .then(function(result){
            return DBA.getAll(result);
      });
  };
  self.getProject = function(projectID) {
      var parameters = [projectID];
      return DBA.query("SELECT * FROM projects WHERE id = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };
  self.getProjectByVSTSID = function(vstsProjectID) {
      var parameters = [vstsProjectID];
      return DBA.query("SELECT * FROM projects WHERE vstsProjectID = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };
  self.getProjectsByAccTitle = function(vstsInstanceName) {
    var parameters = [vstsInstanceName];
    return DBA.query("SELECT * FROM projects WHERE vstsInstanceName = (?)", parameters)
      .then(function(result) {
        return DBA.getAll(result);
      });
  };
  //get the projects by vsts project id, work item id and area path node name
  self.getProjectsByVSTSProjectIDWorkItemIDAndAreaPathNodeName = function(project) {
    var parameters = [project.vstsProjectID,project.areaPathNodeName];
    return DBA.query("SELECT * FROM projects WHERE vstsProjectID = (?) AND areaPathNodeName = (?)", parameters)
      .then(function(result) {
        return DBA.getAll(result);
      });
  };
  self.addProject = function(project) {
    var parameters = [project.name, project.areaPathNodeName, project.vstsProjectID, project.vstsInstanceName,  project.iteration_path, project.iteration_id,project.start_date,project.finish_date, project.area_path, new Date()];
    DBA.query("INSERT INTO projects (name,areaPathNodeName,vstsProjectID,vstsInstanceName,iteration_path,iteration_id, start_date, finish_date, area_path, summaryDate) VALUES (?,?,?,?,?,?,?,?,?,?)", parameters);
    return DBA.query("SELECT last_insert_rowid();")
        .then(function (result) {
            return DBA.getById(result);
        });
  };
  self.removeProject = function(projectID) {
    var parameters = [projectID];
    return DBA.query("DELETE FROM projects WHERE id = (?)", parameters);
  };
  self.updateProject = function(origProject, editProject) {
    var parameters = [editTProject.name, origProject.id];
    return DBA.query("UPDATE projects SET name = (?) WHERE id = (?)", parameters);
  };

  self.updateProjectIterationPath = function(project, projectAreaPath, projectAreaPathNodeName, star_date, finish_date){
  var parameters = [project.iteration_path, projectAreaPath, projectAreaPathNodeName, star_date, finish_date, project.id];
  return DBA.query("UPDATE projects SET iteration_path = (?), area_path = (?), areaPathNodeName = (?), start_date = (?), finish_date = (?)"
                  +" WHERE id = (?)", parameters);
  };

  self.getProjectCountByName = function (projectName) {
      var parameters = [projectName];
      return DBA.query("SELECT count(*) as count FROM projects WHERE LIKE (?)", parameters)
        .then(function (result) {
            return DBA.getById(result);
        });
  };

  self.getAllVSTSProjectCredentials = function() {
		return DBA.query("SELECT DISTINCT projects.id, projects.name, projects.areaPathNodeName, projects.vstsProjectID, projects.vstsInstanceName, projects.iteration_path, projects.area_path, projects.finish_date ,projects.closeTask,projects.summaryDate, vstsCredentials.vstsToken, vstsCredentials.vstsInstanceName FROM projects,vstsCredentials WHERE projects.areaPathNodeName = vstsCredentials.areaPathNodeName")
			.then(function(result) {
            return DBA.getAll(result);
      });
  };

  self.getVSTSProjectCredentialsViaProjectID = function(projectID) {
    var parameters = [projectID];
     return DBA.query("SELECT projects.id, projects.name,projects.areaPathNodeName, projects.vstsProjectID, projects.vstsInstanceName, projects.iteration_path, projects.start_date,projects.finish_date, projects.iteration_path, projects.area_path,projects.summaryDate ,vstsCredentials.vstsToken,vstsCredentials.vstsInstanceName FROM projects,vstsCredentials WHERE projects.areaPathNodeName = vstsCredentials.areaPathNodeName and projects.id ="+projectID)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

  self.updateProjectSummaryDate = function(projectId) {
    var parameters = [new Date(), projectId];
    return DBA.query("UPDATE projects SET summaryDate = (?) WHERE id = (?)", parameters);
  };

   self.timercounter = function() {

	 var countval = 1;
	function test(){
 $timeout(function() {
	 alert(countval)
     //countval++;
    test();
   }, 60000);





	}
	test();

  };










   return self;
}])
.factory('VSTSTeamMembers', ['DBA', function(DBA) {
  var self = this;

  self.allVSTSTeamMembers = function() {
    return DBA.query("SELECT * FROM vstsTeamMembers")
      .then(function(result){
        return DBA.getAll(result);
      });
  };
  self.getVSTSTeamMemberByID = function(id) {
    var parameters = [id];
    return DBA.query("SELECT * FROM vstsTeamMembers WHERE id = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

	self.getVSTSTeamMemberByVSTSTeamID = function(vstsTeamID) {
    var parameters = [vstsTeamID];
    return DBA.query("SELECT * FROM vstsTeamMembers WHERE vstsTeamID = (?)", parameters)
      .then(function(result) {
       return DBA.getAll(result);
      });
  };

    self.getAllTeamMembersByProjectID = function(projectID) {
        var parameters = [projectID];
        return DBA.query("SELECT * FROM vstsTeamMembers WHERE projectID = (?) ORDER BY displayName", parameters)
            .then(function(result) {
                return DBA.getAll(result);
            });
    };

	self.addVSTSTeamMember = function(vstsTeamMember) {
		  var parameters = [vstsTeamMember.projectID,vstsTeamMember.vstsTeamID, vstsTeamMember.displayName,
       vstsTeamMember.uniqueName, vstsTeamMember.imageUrl];
		   return DBA
      .query("INSERT INTO vstsTeamMembers(projectID,vstsTeamID, displayName, uniqueName, imageUrl) VALUES (?, ?, ?, ?, ?)", parameters)
      .then(function(){
             return DBA.query("SELECT last_insert_rowid();")
              .then(function (result) {
                return DBA.getById(result);
              });
      });

	};

  self.getTeamMembersByUniqueName = function(vstsTeamID, uniqueName) {
    var parameters = [vstsTeamID, uniqueName];
    return DBA.query("SELECT * FROM vstsTeamMembers WHERE vstsTeamID = (?) AND uniqueName = (?)", parameters)
      .then(function(result) {
        return DBA.getAll(result);
      });
  };

  self.removeVSTSMemberByID = function(id) {
    var parameters = [id];
    return DBA.query("DELETE FROM vstsTeamMembers WHERE id = (?)", parameters);
  };

  self.removeVSTSMembersByVSTSTeamID = function(vstsTeamID) {
    var parameters = [vstsTeamID];
    return DBA.query("DELETE FROM vstsTeamMembers WHERE vstsTeamID = (?)", parameters);
  };
    self.removeVSTSMembersByVSTSTeamIDAndPID = function(vstsTeamID, pid) {
        var parameters = [vstsTeamID, pid];
        return DBA.query("DELETE FROM vstsTeamMembers WHERE vstsTeamID = (?) AND projectID = (?)", parameters);
    };

  self.updateVSTSMemberByID = function(origVSTSMember, editVSTSMember) {
    var parameters = [editVSTSMember.vstsTeamID, editVSTSMember.displayName,
                      editVSTSMember.uniqueName, editVSTSMember.imageUrl, origVSTSMember.id]
    return DBA.query("UPDATE vstsTeamMembers SET vstsTeamID = (?), displayName = (?), "
                     +" uniqueName = (?), imageUrl = (?) "
                     +" WHERE id = (?)", parameters);
  };
  
  self.getTeamMembersByUniqeDisplayAndProjectId = function(projectID, uniqueName, displayName) {
    var parameters = [projectID, uniqueName, displayName];
    return DBA.query("SELECT * FROM vstsTeamMembers WHERE projectID = (?) AND uniqueName = (?) AND displayName = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };
  return self;
}])
.factory('VSTSTeams', ['DBA', function(DBA) {
  var self = this;

  self.allVSTSTeams = function() {
    return DBA.query("SELECT * FROM vstsTeams")
      .then(function(result){
        return DBA.getAll(result);
      });
  };

  self.getVSTSTeamByID = function(id) {
    var parameters = [id];
    return DBA.query("SELECT * FROM vstsTeams WHERE id = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

  self.getVSTSTeamByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("SELECT * FROM vstsTeams WHERE projectID = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

    self.getVSTSTeamByVstsProjectID = function(projectID) {
        var parameters = [projectID];
        return DBA.query("SELECT * FROM vstsTeams WHERE vstsProjectID = (?)", parameters)
            .then(function(result) {
                return DBA.getById(result);
            });
    };


  self.getVSTSTeamByTeamID = function(vstsTeamID) {
    var parameters = [vstsTeamID];
    return DBA.query("SELECT * FROM vstsTeams WHERE vstsTeamID = (?)", parameters)
      .then(function(result) {
        return DBA.getById(result);
      });
  };

  self.addVSTSTeam = function(vstsTeam) {
      var parameters = [vstsTeam.name, vstsTeam.url, vstsTeam.vstsTeamID,
                        vstsTeam.description, vstsTeam.identityUrl,vstsTeam.vstsProjectID,
                        vstsTeam.projectID];
      return DBA.query("INSERT INTO vstsTeams(name, url, vstsTeamID, description, "
                      + " identityUrl,vstsProjectID,projectID) VALUES (?,?,?,?,?,?,?)", parameters);

  };
  self.removeVSTSTeamByID = function(id) {
    var parameters = [id];
    return DBA.query("DELETE FROM vstsTeams WHERE id = (?)", parameters);
  };

  self.removeVSTSTeamByProjectID = function(projectID) {
    var parameters = [projectID];
    return DBA.query("DELETE FROM vstsTeams WHERE projectID = (?)", parameters);
  };


  self.updateVSTSTeam = function(origVSTSTeam, editVSTSTeam) {
    var parameters = [editVSTSTeam.name,editVSTSTeam.url, editVSTSTeam.vstsTeamID, editVSTSTeam.description,
                      editVSTSTeam.identityUrl,editVSTSTeam.vstsProjectID, origVSTSTeam.id];
    return DBA.query("UPDATE vstsTeams SET name = (?), url =(?), vstsTeamID = (?), "
                 +" description = (?),identityUrl =(?), vstsProjectID = (?) WHERE id = (?)", parameters);
  };

  self.updateVSTSTeamProjectID = function(projectID,dummyProjectID) {
    var parameters = [projectID,dummyProjectID];
    return DBA.query("UPDATE vstsTeams SET projectID = (?) WHERE projectID = (?)", parameters);
  };
   return self;
}])
.factory('SetWorkItemSchedule',['Projects','WorkItems', '$rootScope','DBA',
 function(Projects,WorkItems,$rootScope,DBA){
    var self =  this;
    self.getAllCalendarEvents = function(){
        return DBA.query("SELECT * FROM calendarEvents")
        .then(function(result){
          return DBA.getAll(result);
        });

    };
    self.getCalendarEventsByID = function(eventID){
        var parameters = [eventID];
        return DBA.query("SELECT * FROM calendarEvents WHERE id = (?)", parameters)
        .then(function(result) {
          return DBA.getById(result);
        });

    };
    self.addCalendarEvent = function(calendarEvent){
      var parameters = [calendarEvent.calendarEventID,calendarEvent.workItemVSOID,calendarEvent.vstsProjectID,
                        calendarEvent.vstsAreaPathNodeName,calendarEvent.eventDate];
      return DBA.query("INSERT INTO calendarEvents(calendarEventID,workItemVSOID,vstsProjectID,vstsAreaPathNodeName,eventDate) "
       + " VALUES (?,?,?,?,?)", parameters);
    };
    self.scheduleWorkItem = function(workItemVSOID,workItemProjectID,workItemName,workItemDesc,startDate,endDate){
        if(window.cordova){
          // prep some variables
          var startDate = startDate;
          var endDate = endDate;
          var title = workItemName;
          var eventLocation = "Work";
          var notes = workItemDesc;
          var vstsProjectID = "";
          var vstsAreaPathNodeName = "";

          var success = function(message) {

            var calendarEvent = {};
            calendarEvent.calendarEventID = message;
            calendarEvent.workItemVSOID= workItemVSOID;
            calendarEvent.vstsProjectID = vstsProjectID;
            calendarEvent.vstsAreaPathNodeName = vstsAreaPathNodeName;
            calendarEvent.eventDate = startDate;
            //save the calendar event
            self
            .addCalendarEvent(calendarEvent)
            .then(function(){
                alert("Calendar event created successfully");
            });

          };
          var error = function(message) { alert("Error: " + message); };
          // create an event silently (on Android < 4 an interactive dialog is shown which doesn't use this options) with options:
          var calOptions = window.plugins.calendar.getCalendarOptions(); // grab the defaults
          //create the event
          Projects
          .getProject(workItemProjectID)
          .then(function(project){
              vstsProjectID = project.vstsProjectID;
              vstsAreaPathNodeName = project.areaPathNodeName;
              // And the URL can be passed since 4.3.2 (will be appended to the notes on Android as there doesn't seem to be a sep field)
              // create an event silently (on Android < 4 an interactive dialog is shown)

              if(ionic.Platform.isAndroid()){
                calOptions.url = "https://aivantech.visualstudio.com/goplando/tab/all/" +project.vstsProjectID+ "/" + project.areaPathNodeName + "/"+workItemVSOID;
              } else {
                calOptions.url = "goplando://tab/all/"+project.vstsProjectID+"/"+project.areaPathNodeName+"/"+workItemVSOID;
              }
              window.plugins.calendar.createEventWithOptions(title,eventLocation,notes,startDate,endDate,calOptions,success,error);
          });
        }
    };
    return self;
}])
.factory('EmailProvider',['DBA', function(DBA){
  var self = this;

   //db function  for triage mail providers
   self.allEmailProviders = function(){
     return DBA.query("SELECT * FROM emailProviders")
        .then(function(result){
          return DBA.getAll(result);
        });
   };

   self.getEmailProviderByID = function(emailProviderID){
    var parameters = [emailProviderID];
      return DBA.query("SELECT * FROM emailProviders WHERE id = (?)", parameters)
        .then(function(result) {
          return DBA.getById(result);
        });
   };

   self.addEmailProvider = function(emailProvider){
     var parameters = [emailProvider.name];
      return DBA.query("INSERT INTO emailProviders(name) VALUES (?)", parameters);
   };

   self.removeEmailProviderByID = function(emailProviderID){
      var parameters = [emailProviderID];
      return DBA.query("DELETE FROM emailProviders WHERE id = (?)", parameters);
   };

   self.updateEmailProvider = function(origEmailProvider, editEmailProvider){
     var parameters = [editEmailProvider.name, origEmailProvider.id];
      return DBA.query("UPDATE emailProviders SET name = (?) WHERE id = (?)", parameters);

   };

   return self;
}])
.factory('Images', ['DBA', function(DBA) {
  var self = this;

    //db functions for images
    self.allImages = function() {
      return DBA.query("SELECT * FROM images")
        .then(function(result){
          return DBA.getAll(result);
        });
    };


	self.allUnSyncImages = function() {
		var isSync = 0;
		var parameters = [isSync]
      return DBA.query("SELECT * FROM images WHERE isSync = (?)", parameters)
        .then(function(result){
          return DBA.getAll(result);
        });
    };

    self.getImageByID = function(imageID) {
      var parameters = [imageID];
      return DBA.query("SELECT * FROM images WHERE id = (?)", parameters)
        .then(function(result) {
          return DBA.getById(result);
        });
    };

	self.getImagesByProjects = function(projectID) {
      var parameters = [projectID];
      return DBA.query("SELECT DISTINCT * FROM images WHERE projectID = (?)", parameters)
        .then(function(result) {
          return DBA.getAll(result);
        });
    };

	self.getImagesByProjectAndWorkItemVsoID = function(projectID, workItemVSOID) {
      var parameters = [projectID, workItemVSOID];
      return DBA.query("SELECT DISTINCT imagePath,workItemVSOID FROM images WHERE projectID = (?) AND workItemVSOID = (?)", parameters)
        .then(function(result) {
          return DBA.getAll(result);
        });
    };

  self.getImagesByProjectAndWorkItemVsoIDWithName = function(projectID, workItemVSOID) {
    var parameters = [projectID, workItemVSOID];
    return DBA.query("SELECT DISTINCT imagePath,workItemVSOID,name FROM images WHERE projectID = (?) AND workItemVSOID = (?)", parameters)
      .then(function(result) {
        return DBA.getAll(result);
      });
  };

	self.verifyImagePathByProjectAndWorkItemVsoID = function(imagePath, projectID, workItemVSOID) {
      var parameters = [imagePath, projectID, workItemVSOID];
      return DBA.query("SELECT * FROM images WHERE imagePath = (?) AND projectID = (?) AND workItemVSOID = (?)", parameters)
        .then(function(result) {
           return DBA.getById(result);
        });
    };


	 self.removeImagesByProjectAndWorkItemVsoIDAndImagePath = function(projectID, workItemVSOID, imagePath) {
      var parameters = [projectID, workItemVSOID, imagePath];
      return DBA.query("DELETE FROM images WHERE projectID = (?) AND workItemVSOID = (?) AND imagePath = (?)", parameters)

    };



	 self.removeImagesByProjectID = function(projectID) {
      var parameters = [projectID];
      return DBA.query("DELETE FROM images WHERE projectID = (?)", parameters);
    };


    self.getImagesByWorkItemID = function(workItemID) {
      var parameters = [workItemID];
      return DBA.query("SELECT * FROM images WHERE workItemID = (?)", parameters)
        .then(function(result) {
          return DBA.getAll(result);
        });
    };
    self.getImagesBymemberID = function(subTaskID) {
      var parameters = [memberID];
      return DBA.query("SELECT * FROM images WHERE memberID = (?)", parameters)
        .then(function(result) {
          return DBA.getAll(result);
        });
    };
    self.addImage = function(image) {
      var parameters = [image.workItemID, image.memberID, image.imagePath, image.projectID, image.workItemVSOID, image.isSync, image.isDeleted];
      return DBA.query("INSERT INTO images(workItemID,memberID,imagePath,projectID,workItemVSOID, isSync, isDeleted) VALUES (?,?,?,?,?,?,?)", parameters);
    };
  self.addHttpImageWithName = function(image) {
    var parameters = [image.workItemID, image.memberID, image.imagePath, image.projectID, image.workItemVSOID, image.isSync, image.isDeleted, image.name];
    return DBA.query("INSERT INTO images(workItemID,memberID,imagePath,projectID,workItemVSOID, isSync, isDeleted, name) VALUES (?,?,?,?,?,?,?,?)", parameters);
  };

    self.removeImageByID = function(imageID) {
      var parameters = [imageID];
      return DBA.query("DELETE FROM images WHERE id = (?)", parameters);
    };

    self.removeImageByWorkItemID = function(workItemID) {
      var parameters = [workItemID];
      return DBA.query("DELETE FROM images WHERE workItemID = (?)", parameters);
    };

    self.removeImageBymemberID = function(memberID) {
      var parameters = [memberID];
      return DBA.query("DELETE FROM images WHERE memberID = (?)", parameters);
    };

    self.updateImage = function(editImage,origImage) {
      var parameters = [editImage.taskID, editImage.subTaskID,
      editImage.memberID,editImage.imagePath,origImage.id];
      return DBA.query("UPDATE images SET workItemID = (?), "
       +  " memberID = (?), imagePath = (?) WHERE id = (?)", parameters);
    };

	self.updateImageSync = function(isSync,projectID, workItemVSOID) {
      var parameters = [isSync, projectID, workItemVSOID, ]
      return DBA.query("UPDATE images SET isSync = (?) WHERE projectID = (?) and workItemVSOID = (?) ", parameters);
    };

  self.updateImagePath = function(imagePath,projectID, workItemVSOID, name) {
    var parameters = [imagePath, projectID, workItemVSOID, name];
    return DBA.query("UPDATE images SET imagePath = (?) WHERE projectID = (?) and workItemVSOID = (?) and name = (?) ", parameters);
  };


	self.updateImageDeleted = function(isDeleted,projectID, workItemVSOID) {
      var parameters = [isDeleted, projectID, workItemVSOID, ]
      return DBA.query("UPDATE images SET isDeleted = (?) WHERE projectID = (?) and workItemVSOID = (?) ", parameters);
    };

	self.updateAlImagesToOne = function(projectID){
		 var parameters = [1, projectID ]
		return DBA.query("UPDATE images SET isDeleted = (?) WHERE projectID = (?)", parameters);
	}

	self.removeAllDeletedImagesByProjectID = function(projectID){
		 var parameters = [projectID, 1];
      return DBA.query("DELETE FROM images WHERE projectID = (?) AND isDeleted = (?)", parameters);
	}

  return self;
}])
.factory('IterationHours', ['DBA', function(DBA) {
    var self = this;
    //db functions for getting all remaining hours

    self.getHoursWithIterationName = function(projectID, iteration_path) {
        var parameters = [projectID, iteration_path];
       // console.log(parameters);
        return DBA.query("SELECT * FROM ScrumHrs WHERE projectID = (?) and iteration_path = (?)", parameters)
            .then(function(result) {
             //   console.log(result);
                return DBA.getAll(result);
            });
    };

    self.addRemainingHours = function(iteration) {
        var parameters = [iteration.projectID, iteration.iteration_path, iteration.remainingHours, iteration.rDate];
        return DBA.query("INSERT INTO ScrumHrs(projectID,iteration_path,remainingHours,rDate) VALUES (?,?,?,?)", parameters);
    };

    self.updateRemainingHours = function(remaining, id){
        var parameters = [remaining,id];
        return DBA.query("UPDATE ScrumHrs SET remainingHours = (?) WHERE id = (?)", parameters);

    };

  	self.removeHoursByProjectID = function(projectID) {
	    	var parameters = [projectID];
        return DBA.query("DELETE FROM ScrumHrs WHERE projectID = (?)", parameters);
    };

    return self;
}])
/* service used to manage app tours*/
.factory('AppTours',['DBA',function(DBA){
  var self = this;


   //db function  for  app tours
   self.allAppTours = function(){
     return DBA.query("SELECT * FROM appTours")
        .then(function(result){
          return DBA.getAll(result);
        });
   };

    self.addAppTour = function(appTour){
     var parameters = [appTour.tourComplete];
      return DBA.query("INSERT INTO appTours(tourComplete) VALUES (?)", parameters);
   };

  return self;
}])
/*service used to manage subscriptions*/
.factory('Subscriptions',['DBA', '$rootScope', 'moment', '$state', 'Counts',
 '$ionicModal', '$timeout', 'pushService','CHECK_ENV', 'VideoPopupsService','Prouction_ENV','WorkItems','$ionicLoading','$ionicHistory',
  function(DBA,$rootScope,moment,$state,Counts,$ionicModal,$timeout, pushService,CHECK_ENV,VideoPopupsService, Prouction_ENV,WorkItems,$ionicLoading,$ionicHistory){
  var self = this;

   //db function  for subscriptions
   self.allSubscriptions = function(){
     return DBA.query("SELECT * FROM subscriptions")
        .then(function(result){
          return DBA.getAll(result);
        });
   };

   self.getSubscriptionID = function(subscriptionID){
    var parameters = [emailProviderID];
      return DBA.query("SELECT * FROM subscriptions WHERE id = (?)", parameters)
        .then(function(result) {
          return DBA.getById(result);
        });
   };

   self.addSubscription = function(subscription){
     var parameters = [subscription.dateUserFirstOpenedApp];
      return DBA.query("INSERT INTO subscriptions(dateUserFirstOpenedApp ) VALUES (?)", parameters);
   };

   self.removeSubscriptionByID = function(subscriptionID){
      var parameters = [subscriptionID];
      return DBA.query("DELETE FROM subscriptions WHERE id = (?)", parameters);
   };

   self.updateSubscription = function(origSubscription, editSubscription){
     var parameters = [editSubscription.userSubscribed, editSubscription.dateUserSubscribedToApp, origSubscription.id];
      return DBA.query("UPDATE subscriptions SET userSubscribed = (?), dateUserSubscribedToApp = (?) WHERE id = (?)", parameters);

   };


   /*  delete Project If Trial has beeen Expired And User has Not Subscribed */
   self.deleteProjectIfTrialExpiredAndUserNotSubscribed = function(projectID){
           $ionicLoading.show();
           WorkItems
           .removeProjectWorkItemsAndCredentials(projectID)
                       .then(function(success){
                             $ionicHistory.clearCache()//clear the cached views to also remove the view of the deleted VSO project
                             .then(function(){
                                   //finally reload the projects screen
                                   $ionicHistory.clearCache()
                                    // $state.go("tab.all", {projectID: 1})
                                     .then(function(){
                                       $ionicHistory
                                       .clearCache()
                                       .then(function(){
                                          $state.go("tab.all", {projectID: 1})
                                         $rootScope.refreshProjects();
                                         $rootScope.refreshWorkItems();
                                         if(window.cordova){
                                             cordova.plugins.notification.local.cancel(projectID, function() {
                                           });
                                         }
                                         $ionicLoading.hide();
                                       });
                                     });
                                   
                             });
                       });
   };

   self.checkIfFreeTrialExpired = function(){
       Counts.getTableCount("subscriptions")
        .then(function(res){
          if(res.count > 0){//subscription info already added to db
              self.allSubscriptions()
              .then(function(allSubs){//so get the stored sub

                $rootScope.dateUserFirstOpenedApp = allSubs[0].dateUserFirstOpenedApp;
                $rootScope.subExpiryDate = moment($rootScope.dateUserFirstOpenedApp).add(30, 'days').format("dddd, MMMM Do YYYY, h:mm:ss a");

                //params to check if the user is subscribed to the app
                $rootScope.freeTrialDaysPast = moment().diff($rootScope.dateUserFirstOpenedApp,'days');

                $rootScope.userSubscribed = allSubs[0].userSubscribed===0?false:true;
                // Changes by Ashish
                // Check if trial is over & user has not subscribed, set variable to true
                if($rootScope.freeTrialDaysPast > 30 && $rootScope.userSubscribed===false){
                 $rootScope.freeTrialVersionHasExpired = true;
                }
                else{
                   if(window.cordova){
                      window.open = cordova.InAppBrowser.open;
                      
                      if($rootScope.showVideoToursCount <= 0){
                         VideoPopupsService
                         .allVideoPopupAlerts()
                         .then(function(res){
                            console.log(res);
                            if(res[0].showVideoAlertOnStart===1){
                             $rootScope.showVideoTours();
                            }
                             $rootScope.showVideoToursCount +=1;
                         });

                      }


                   }
                }
                if($rootScope.freeTrialDaysPast <= 30 && $rootScope.userSubscribed===false){
                  console.log("free trial still running");
                }
                if($rootScope.freeTrialDaysPast > 30 && $rootScope.userSubscribed===true){
                   console.log("user is subscribed to the app");
                }

              });


			}else{//no subscription info in db which means its the first time user has opened the app
                  // show the subscriptions intro/onboarding modal
                  $ionicModal
                  .fromTemplateUrl('templates/popups/subscription-intro.html', {
                      scope: $rootScope                  })
                  .then(function (modal) {
                     // show the Subscription Intro Modal
                     $rootScope.subscriptionIntroModal = modal;
                     $rootScope.subscriptionIntroModal.show();
                     $rootScope.promptToShowVideoTours = true;
                     $rootScope.subscriptionExpiryDate = moment().add(30, 'days').format("dddd, MMMM Do YYYY, h:mm:ss a");

                  });

                  //close the modal
				        	$rootScope.closeSubscriptionsIntroModal = function(){
                      //subscribe the user if its there first time to open the app
						if(CHECK_ENV.runningInDevice){
              						if(Prouction_ENV.isProduction == true){
                							if(window.store){
                    								store
                    								.order($rootScope.subscriptionProductName)
                    								.then(function(){
                    								     // console.log('successful sub order');
                    								}).error(function(err){
                    									   console.log('error in ordering sub..'+err.code)
                    								});

                    								store.when($rootScope.subscriptionProductName).approved(function(p) {
                    									//console.log("sub approved");
                    								  console.log("approved sub is ", p);
                    									//no need to verify the sub since this won't be a purchase, just a start of the free trial
                    									var sub = {dateUserFirstOpenedApp:moment().format()};
                    									self
                    									.addSubscription(sub)
                    									.then(function(){
                    										//console.log(p);
                    										$rootScope.subscriptionIntroModal.hide();
                    										$rootScope.subscriptionIntroModal.remove();
                    										p.finish();
                    										//global function to show video tours
                    										$rootScope.showVideoTours();
                    									});

                    								});


            												store.when($rootScope.subscriptionProductName).cancelled(function(p) {
            													console.log("sub cancelled");
            													console.log("cancelled sub is ", p);

            													alert("You must start the free trial to use GoPlanDo");

            												});

                    								store.when($rootScope.subscriptionProductName).error(function(err) {
                    								//	console.log(err);
                    									console.log("bypassing subscription for sim testing");
                    									 var sub = {dateUserFirstOpenedApp:moment().format()};
                    									self
                    									.addSubscription(sub)
                    									.then(function(){

                    										$rootScope.subscriptionIntroModal.hide();
                    										$rootScope.subscriptionIntroModal.remove();
                    									  //  p.finish();
                    										//global function to show video tours
                    										$rootScope.showVideoTours();
                									  });
                								// alert("Sorry an error occurred when trying to subscribe: " + JSON.stringify(err));

                								});

                							}

                							else{
                								alert("An error occured when attempting to subscribe to GoPlanDo, please restart and try again");
                							}
              						}else{
              							   var sub = {dateUserFirstOpenedApp:moment().format()};
                                self
                                .addSubscription(sub)
                                .then(function(){
                                    $rootScope.subscriptionExpiryDate = moment().add(30, 'days').format("dddd, MMMM Do YYYY, h:mm:ss a");
                                    $rootScope.subscriptionIntroModal.hide();
                                    $rootScope.subscriptionIntroModal.remove();
                                    // show video tours
                                    $rootScope.showVideoTours();
                                });
              						}
                      }
                      else{//mark this as a new sub and close the modal if running in browser
                            var sub = {dateUserFirstOpenedApp:moment().format()};
                            self
                            .addSubscription(sub)
                            .then(function(){
                                $rootScope.subscriptionExpiryDate = moment().add(30, 'days').format("dddd, MMMM Do YYYY, h:mm:ss a");
                                $rootScope.subscriptionIntroModal.hide();
                                $rootScope.subscriptionIntroModal.remove();
                            });
                      }

                  };
          }


        });

   }

   return self;
}])

/*
*Camera service used to get photos for the app
*/
.factory('GetPhoto',['$q', '$cordovaCamera', function($q, $cordovaCamera){
    var self = this;

    self.getPicture = function(source){
             var q = $q.defer();
             var options = null;

             if(String(source)==="filesystem"){

                options = {
                   quality : 100,
                   destinationType : Camera.DestinationType.FILE_URI,
                   sourceType :  Camera.PictureSourceType.PHOTOLIBRARY,
                   allowEdit : false,
                   encodingType: Camera.EncodingType.JPEG,
                   popoverOptions: CameraPopoverOptions,
                };

             }
             if(String(source)==="camera"){

                  options = {
                     quality : 100,
                     destinationType : Camera.DestinationType.FILE_URI,
                     sourceType : Camera.PictureSourceType.CAMERA, // Camera.PictureSourceType.PHOTOLIBRARY
                     allowEdit : false,
                     encodingType: Camera.EncodingType.JPEG,
                     popoverOptions: CameraPopoverOptions,
                 };
             }

             // 3
             $cordovaCamera.getPicture(options).then(function(imageData) {
             // 4
                    onImageSuccess(imageData);

                    function onImageSuccess(fileURI) {
                             createFileEntry(fileURI);
                    }

                    function createFileEntry(fileURI) {
                            window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
                    }

                     // 5
                    function copyFile(fileEntry) {
                         var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
                         var newName = makeid() + name;

                         window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(fileSystem2) {
                             fileEntry.copyTo(fileSystem2,newName,onCopySuccess,fail);
                         },fail);
                    }
                     // 6
                    function onCopySuccess(entry) {
                          q.resolve(entry);
                    }
                    function fail(error) {
                          q.reject(error);
                    }

                    function makeid() {
                       var text = "";
                       var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                       for (var i=0; i < 10; i++) {
                           text += possible.charAt(Math.floor(Math.random() * possible.length));
                       }
                      return text;
                    }

                }, function(error) {
                     q.reject(error);
                });

          return q.promise;
    };

    self.getPictureb64 = function(source, cb){
        var options = null;
        if(String(source)==="filesystem"){
            options = {
                quality : 80,
                destinationType : Camera.DestinationType.DATA_URL,
                sourceType :  Camera.PictureSourceType.PHOTOLIBRARY,
                allowEdit : false,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions
            };
        }
        if(String(source)==="camera"){
            options = {
                quality : 80,
                destinationType : Camera.DestinationType.DATA_URL,
                sourceType : Camera.PictureSourceType.CAMERA, // Camera.PictureSourceType.PHOTOLIBRARY
                allowEdit : false,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions
            };
        }
      $cordovaCamera.getPicture(options).then(function(imageData) {
          cb(imageData);
        }, function(error) {
          cb('');
        });
      };

    self.urlForImage = function(imageName) {
          var name = imageName.substr(imageName.lastIndexOf('/') + 1);
          var trueOrigin = cordova.file.dataDirectory + name;
          return trueOrigin;
    };

    return self;

}])
/*
 * Headers that are passed as a request
 * are defined in this service
 */
.factory('basicAuthorizationService', function (){

    return {
        basicConfig: function (userPass) {
            var obj = {
                headers: {
                    "Authorization": "Basic " + userPass,
                    "Content-Type": "application/json"
                }
            };
            return obj;
        },
        basicPatchConfig: function (userPass) {
            var obj = {
                headers: {
                    "Authorization": "Basic " + userPass,
                    "Content-Type": "application/json-patch+json"
                }
            };
            return obj;
        },
    		simpleConfig: function(){
    			  var obj = {
                headers: {
                    "Content-Type": "application/json"
                }
            };
            return obj;
    		},
		basicBearer:function(userPass){
			 var obj = {
                headers: {
                    "Authorization": "bearer " +userPass
                }
            };
            return obj;

		},
		basicBearerJson:function(userPass){
			 var obj = {
                headers: {
                    "Authorization": "bearer " +userPass,
					 "Content-Type": "application/json"
                }
            };
            return obj;

		},
		simpleTextConfig: function(){
			var obj = {
                headers: {
                    "Content-Type": "application/text"
                }
            };
            return obj;
    	}
    }
})
/*
 * rootURLService has a set of URL and URL parts, including Base URL,
 * Project Name, API Version and Account Title
 */
.factory('rootURLService', ['$rootScope', function ($rootScope) {


    return {

          projects : function(projectName){
              return "https://" + projectName + ".visualstudio.com/DefaultCollection/_apis/projects";
          },

    		  createIteration: function(instanceName , projectName){
    			  //https://sami1212.visualstudio.com/DefaultCollection/NewTasktic /_apis/wit/classificationNodes/iterations?api-version=1.0
    			  return "https://" + instanceName + ".visualstudio.com/DefaultCollection/" + projectName + "/_apis/wit/classificationNodes/iterations";
    		  },
          vstsTags:function(instanceName,teamProjectID){
             return "https://" + instanceName + ".visualstudio.com/DefaultCollection/_apis/tagging/scopes/"+teamProjectID+"/tags"
          },

          iterationsList : function(instanceName ,projectName){

              return "https://" + instanceName + ".visualstudio.com/DefaultCollection/" + projectName + "/_apis/wit/classificationNodes/iterations?$depth=10&api-version=1.0";
          },

    		  areaPathList:function(instanceName ,projectName){
    			     return "https://" + instanceName + ".visualstudio.com/DefaultCollection/" + projectName + "/_apis/wit/classificationNodes/areas?$depth=50";
    		  },

          workItemDetail : function(instanceName){
              return "https://" + instanceName + ".visualstudio.com/DefaultCollection/_apis/wit/workitems/";
          },

          expandedWorkItem : function(instanceName,vstsWorkItemID){
              return "https://" + instanceName + ".visualstudio.com/DefaultCollection/_apis/wit/workitems/" + vstsWorkItemID + "?$expand=all&api-version=1.0";
          },

          baseURL: function(instanceName){
              return "https://" + instanceName + ".visualstudio.com/DefaultCollection/";
          },
          treeQuery: function(instanceName,projectName){
              return "https://" + instanceName + ".visualstudio.com/DefaultCollection/" + projectName + "/_apis/wit/wiql";
          },
          // for VSO API Version
          apiVersion1: "api-version=1.0",
          apiVersion2Preview: "api-version=v2.0-preview",
          apiVersion2_2: "api-version=2.2"
    }
}])

/*
 * Perform CRUD Service has a set of methods that let you make
 * CRUD Requests easy way
 */
.factory('performCRUDService', ['$http', function ($http) {
    return {
        /*
         * Service method to perform GET operation
         * Args (URL, Config Obj, Success Callback, Error Callback)
         */
        simpleGet: function (url, config, success, error, headers) {
            $http.get(url, config)
            .success(function (data, status, headers, config) {
                success(data, status);
            })
            .error(function (data, status, headers, config) {
                error(data, status);
            });

        },
        /*
         * Service method to perform CREATE operation using method as a passed argument
         * Args (URL, METHOD, Data Obj, Config Obj, Success Callback, Error Callback)
         */
        simpleCreate: function (url, method, data, config, success, error) {

            var req = {
                method: method,
                url: url,
                headers: config.headers,
                data: JSON.stringify(data)
            };

            $http(req).success(function(data, status, headers, config){
                success(data, status);
            }).error(function (data, status, headers, config) {
                error(data, status);
            });
        },

		/*
         * Service method to use for delete file from one drive
         * Args (URL, method, success and error callback)
         */
        simpleDelete: function (url, method, success, error) {

            var req = {
                method: method,
                url: url
            };

            $http(req).success(function(data, status, headers, config){
                success(data, status);
            }).error(function (data, status, headers, config) {
                error(data, status);
            });
        }

    }
}])

.factory('ModifyVSTSWorkItemService',['WorkItems', '$q', 'performCRUDService',
  'basicAuthorizationService', '$ionicLoading', 'rootURLService',
  function(WorkItems,$q, performCRUDService, basicAuthorizationService, $ionicLoading, rootURLService){
      var self =  this;
      self.addNewWorkItemToVSTS = function(newWorkItem,instanceUserCredentials,addNewVSTSWorkItemURL,
       typeID, bucketID, projectID, parentWorkItemID, acc_title){
          var q = $q.defer();
          performCRUDService
          .simpleCreate(addNewVSTSWorkItemURL,
          "PATCH",
          newWorkItem,
          basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
          function(data, status) {

        				if(parentWorkItemID){
    							  var link_obj = [{
    									"op": "add",
    									"path": "/relations/-",
    									"value": {
    									  "rel": "System.LinkTypes.Hierarchy-Forward",
    									  "url": data["url"],
    									  "attributes": {
    										   "comment": "Making a new link for the dependency"
    									  }
    									}
    								  }];
        							var link_url = rootURLService.baseURL(acc_title) + "/_apis/wit/workitems/"+parentWorkItemID+"?api-version=1.0";
        							performCRUDService
      							  .simpleCreate(link_url,
      								"PATCH",
      								link_obj,
      								basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
      								function(link_data, status){

      									self
                        .storeItemLocally(data, projectID, bucketID, parentWorkItemID, typeID)
                        .then(function(res){
      											q.resolve(data);
      									});
      								},function(error, status) {
      								  $ionicLoading.hide();
      									alert("Error: " + status);
      									q.reject({error:error});

      								});


        				}else{

    								self.storeItemLocally(data, projectID, bucketID, parentWorkItemID, typeID).then(function(res){
    									 q.resolve(data);
    								});
        				}


          }, function(data, status) {
                $ionicLoading.hide();
                  alert("Error: " + status);
                  q.reject("error");

          });
          return q.promise;
    };

      self.addNewWorkItemToVSTSNoCache = function(newWorkItem,instanceUserCredentials,addNewVSTSWorkItemURL,
                                           typeID, bucketID, projectID, parentWorkItemID, acc_title){
          var q = $q.defer();
          performCRUDService
              .simpleCreate(addNewVSTSWorkItemURL,
                  "PATCH",
                  newWorkItem,
                  basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
                  function(data, status) {
                      q.resolve(data);
                  }, function(data, status) {
                      $ionicLoading.hide();
                      alert("Error: " + status);
                      q.reject("error");

                  });
          return q.promise;
      };


	self.storeItemLocally = function(data, projectID, bucketID, parentWorkItemID, typeID){
		  var q = $q.defer();
		  //console.log(data)
			var fields = data['fields'];

		// Mohit changes
        if(typeID === 7 && parentWorkItemID === '' && !parentWorkItemID) {
            parentWorkItemID = parseInt(data['id'])
        }

      var createdWorkItem = {
          bucketIDTag:0,
          name: data['fields']['System.Title'],
          workItemVSOState:data['fields']['System.State'],
          workItemPriority:parseInt(data['fields']['Microsoft.VSTS.Common.Priority']),
          iterationPath:data['fields']['System.IterationPath'],
          bucketID: bucketID,
          projectID: parseInt(projectID),
          workItemVSOID: parseInt(data['id']),
          originalEstimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'],
          remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'],
          completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'],
          workItemTypeID: typeID,
          description:fields['System.Description'],
          alarmNotificationDate:"",
	        workItemClosedBy:"",
	        workItemClosedDate:"",
          workItemAssignedTo:"",
          vstsTagID:"",
          parentWorkItemID:parentWorkItemID
      };


      for(var key in createdWorkItem){
          if(createdWorkItem[key] == undefined){
             createdWorkItem[key] = "";
          }
      }
      //now add the user story to the DB
      WorkItems.addWorkItem(createdWorkItem).then(function(){
          q.resolve("success1");
      });

		return q.promise;
	}

    self.addNewWorkItemToVSTSWithRepeat = function(newWorkItem,instanceUserCredentials,addNewVSTSWorkItemURL,
                                         typeID, bucketID, projectID, parentWorkItemID, acc_title){
      var q = $q.defer();
      performCRUDService
        .simpleCreate(addNewVSTSWorkItemURL,
          "PATCH",
          newWorkItem,
          basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
          function(data, status) {
            if(parentWorkItemID){
              var link_obj = [{
                "op": "add",
                "path": "/relations/-",
                "value": {
                  "rel": "System.LinkTypes.Hierarchy-Forward",
                  "url": data["url"],
                  "attributes": {
                    "comment": "Making a new link for the dependency"
                  }
                }
              }];
              var link_url = rootURLService.baseURL(acc_title) + "/_apis/wit/workitems/"+parentWorkItemID+"?api-version=1.0";
              performCRUDService
                .simpleCreate(link_url,
                  "PATCH",
                  link_obj,
                  basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
                  function(link_data, status){
                    self
                      .storeItemLocallyWithRepeat(data, projectID, bucketID, parentWorkItemID, typeID)
                      .then(function(res){
                        q.resolve(data);
                      });
                  },function(error, status) {
                    $ionicLoading.hide();
                    alert("Error: " + status);
                    q.reject({error:error});
                  });
            }else{
              self.storeItemLocallyWithRepeat(data, projectID, bucketID, parentWorkItemID, typeID).then(function(res){
                q.resolve(data);
              });
            }
          }, function(data, status) {
            $ionicLoading.hide();
            alert("Error: " + status);
            q.reject("error");

          });
      return q.promise;
    };


	self.storeItemLocallyWithRepeat = function(data, projectID, bucketID, parentWorkItemID, typeID){
		  var q = $q.defer();
		  //console.log(data)
			var fields = data['fields'];

		// Mohit changes
        if(typeID === 7 && parentWorkItemID === '' && !parentWorkItemID) {
            parentWorkItemID = parseInt(data['id'])
        }

      var createdWorkItem = {
          bucketIDTag:0,
          name: data['fields']['System.Title'],
          workItemVSOState:data['fields']['System.State'],
          workItemPriority:parseInt(data['fields']['Microsoft.VSTS.Common.Priority']),
          iterationPath:data['fields']['System.IterationPath'],
          bucketID: bucketID,
          projectID: parseInt(projectID),
          workItemVSOID: parseInt(data['id']),
          originalEstimate: fields['Microsoft.VSTS.Scheduling.OriginalEstimate'],
          remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'],
          completedWork: fields['Microsoft.VSTS.Scheduling.CompletedWork'],
          workItemTypeID: typeID,
          description:fields['System.Description'],
          alarmNotificationDate:"",
	        workItemClosedBy:"",
	        workItemClosedDate:"",
          workItemAssignedTo:"",
          vstsTagID:"",
          parentWorkItemID:parentWorkItemID,
          workItemHasRepeatSchedule: 1
      };


      for(var key in createdWorkItem){
          if(createdWorkItem[key] == undefined){
             createdWorkItem[key] = "";
          }
      }
      //now add the user story to the DB
      WorkItems.addWorkItemWithRepeat(createdWorkItem).then(function(){
          q.resolve("success1");
      });

		return q.promise;
	}

	// function that delete workItems
      self.deleteVSTSWorkItem = function(setWorkItemState,instanceUserCredentials,updateURL,
                                         typeID, bucketID, projectID, workItemDeleted, workItem){
          var q = $q.defer();
          performCRUDService
              .simpleCreate(updateURL,
                  "DELETE",
                  setWorkItemState,
                  basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
                  function (data, status) {
                      var updatedWorkItem = workItem;
                      updatedWorkItem.workItemVSOState = "Removed";
                      updatedWorkItem.workItemDeleted = 1;
                      WorkItems.deleteWorkItem(workItem).then(function(){
                          q.resolve("sucess");
                      });
                  }, function (data, status) {
                      $ionicLoading.hide();
                      alert("Error: " + status + " " + data);
                  });
          return q.promise;
      };

   // function that updates a work item
    self.updateVSTSWorkItem = function(setWorkItemState,instanceUserCredentials,updateURL,
     typeID, bucketID, projectID, workItemDeleted, workItem){
        var q = $q.defer();
        performCRUDService
        .simpleCreate(updateURL,
        "PATCH",
        setWorkItemState,
        basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
        function (data, status) {

            var updatedWorkItem = {
                name: data['fields']['System.Title'],
                workItemVSOState:data['fields']['System.State'],
                workItemPriority:parseInt(data['fields']['Microsoft.VSTS.Common.Priority']),
                iterationPath:data['fields']['System.IterationPath'],
                bucketID: bucketID,
                projectID: parseInt(projectID),
                workItemVSOID: parseInt(data['id']),
                originalEstimate: data['fields']['Microsoft.VSTS.Scheduling.OriginalEstimate'],
                remainingWork: data['fields']['Microsoft.VSTS.Scheduling.RemainingWork'],
                completedWork: data['fields']['Microsoft.VSTS.Scheduling.CompletedWork'],
                workItemTypeID: typeID,
                description:data['fields']['System.Description'],
                alarmNotificationDate:workItem.alarmNotificationDate,
                workItemDeleted:workItemDeleted,
								workItemClosedBy:workItem.workItemClosedBy,
								workItemClosedDate:workItem.workItemClosedDate

            };
      			if(typeID == 5){
      				if(data['fields']['System.State'] == "Closed"){
      					person = data['fields']["Microsoft.VSTS.Common.ClosedBy"];
      					var memName = person.substring(0, person.indexOf("<") - 1);
      					updatedWorkItem.workItemClosedBy = memName ;
      					updatedWorkItem.workItemClosedDate = data['fields']["Microsoft.VSTS.Common.ClosedDate"];

      				}

      			}

            WorkItems.updateWorkItem(workItem,updatedWorkItem).then(function(){
                 q.resolve("sucess");
            });
        }, function (data, status) {
            $ionicLoading.hide();
            q.reject(status);
        });

          return q.promise;
  };

  self.addNewFieldsForVso = function(obj){
     var newWorkItem = [{
            "op": "add",
            "path": "/fields/System.Title",
            "value": obj.name
          }, {
            "op": "add",
            "path": "/fields/System.Description",
            "value": obj.description
          }, {
            "op": "add",
            "path": "/fields/System.IterationPath",
            "value": obj.iterationPath
          }, {
            "op": "add",
            "path": "/fields/Microsoft.VSTS.Common.Priority",
            "value": obj.workItemPriority
          }, {
            "op": "add",
            "path": "/fields/Microsoft.VSTS.Scheduling.OriginalEstimate",
            "value": obj.originalEstimate
          }, {
            "op": "add",
            "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
            "value": obj.remainingWork
          }, {
            "op": "add",
            "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
            "value": obj.completedWork
          }];
         if(obj.acceptanceCriteria) {
             newWorkItem.push({
                 "op": "add",
                 "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
                 "value": obj.acceptanceCriteria
             })
         }
          if(obj.tags || obj.tags === '') {
              newWorkItem.push({
                  "op": "add",
                  "path": "/fields/System.Tags",
                  "value": obj.tags
              })
          }
          newWorkItem.forEach(function(elem, i) {
            if (elem['value'] == null || elem['value'] == undefined)
               elem['value'] = "";
          });
          return newWorkItem;
   };

     return self;
}])

.factory('SyncVSTSTeamMembers', ['$cordovaFileTransfer', '$q', 'VSTSTeamMembers', function($cordovaFileTransfer, $q, VSTSTeamMembers ) {
	var self = this;


	self.getVSTSTeamMemberAvatarAndSaveToDisk = function(vstsTeamMember, vstsTeamID, credentials, projectID) {
		var q = $q.defer();
		var url = vstsTeamMember['imageUrl'];
		var uniqueName = vstsTeamMember['uniqueName'];
		var displayName = vstsTeamMember['displayName'];
    var avatarName = displayName.replace(/\s+/g, '.');


		var targetPath = cordova.file.dataDirectory + avatarName;


		var options = {
  			headers: {
  				'Authorization': 'Basic ' + credentials,
  				'Content-Type': 'application/json',
  				'Connection': 'close'
  			}
		};
    //download the avatar
		$cordovaFileTransfer
    .download(url, targetPath, options)
		.then(function(result) {
        //then save the team member to disk
				var member = {
					vstsTeamID: vstsTeamID,
					displayName: displayName,
					uniqueName: uniqueName,
					imageUrl: targetPath,
          projectID: projectID
				};
				VSTSTeamMembers
        .addVSTSTeamMember(member)
        .then(function(res) {
					q.resolve(res);
				});
				// Success!
		}, function(err) {
        var member = {
          vstsTeamID: vstsTeamID,
          displayName: displayName,
          uniqueName: uniqueName,
          imageUrl: "./images/user.png",
          projectID:projectID
        };
        VSTSTeamMembers
        .addVSTSTeamMember(member)
        .then(function(res) {
           q.reject(err);
        });



				// Error
		}, function(progress) {

		});

		return q.promise;
	};
	return self;
}])

.factory('uploadAndAttachFileToVSOWorkItem',['$cordovaFileTransfer', '$q', 'performCRUDService', 'rootURLService', 'basicAuthorizationService', function($cordovaFileTransfer,$q,performCRUDService,rootURLService, basicAuthorizationService){
     var self = this;

     self.attachUploadedFileToVSOWorkItem=function(instanceName,attachedFileURL,workItemID,instanceUserCredentials){

         var q = $q.defer();
         var attachFileToWorkItemObj = [{
            "op": "add",
            "path": "/relations/-",
            "value": {
              "rel": "AttachedFile",
              "url": String(attachedFileURL),
              "attributes": {
                "comment": "Attachment for  work item " + workItemID
              }
            }
          }];

          performCRUDService.simpleCreate(rootURLService.workItemDetail(instanceName) + workItemID + "?api-version=1.0",
          "PATCH",
          attachFileToWorkItemObj,
          basicAuthorizationService.basicPatchConfig(instanceUserCredentials),
          function (data, status) {
              q.resolve("File successfully uploaded and attached to work item ID: " +  workItemID);
          },
          function (dataError, status) {
             //  console.log(dataError);
              q.reject("Unable to attach file to work item because: " + dataError);
          });

          return q.promise;
     };
     self.uploadFileToVSO=function(filePath,instanceName,workItemID, instanceUserCredentials,mimeType){
          var q = $q.defer();

           var filename = filePath.split("/").pop();//get the file name
           var options = {
               fileKey: "file",
               fileName: filename,
               chunkedMode: false,
               mimeType: mimeType,
               headers:{
                    'Authorization': 'Basic ' + instanceUserCredentials,
                    'Content-Type': 'application/json',
                    'Connection': 'close'
               }
           };

          var uploadURL = "https://" + instanceName + ".visualstudio.com/DefaultCollection/_apis/wit/attachments?fileName="+filename+"&api-version=1.0";

          $cordovaFileTransfer.upload(uploadURL,filePath, options)
          .then(function(result) {

              var res = angular.fromJson(result.response);
              self.attachUploadedFileToVSOWorkItem(instanceName,res.url,workItemID,instanceUserCredentials)
              .then(function(success){
                  q.resolve(success);
              },function(error){
                  q.reject(error);
              });
          }, function(err) {
                q.reject("ERROR: " + JSON.stringify(err));
          }, function (progress) {
              // constant progress updates
              // $scope.uploadProgress = (progress.loaded / progress.total) * 100;
          });
       return q.promise;
     };


   return self;

}])
/*
 * SyncVSOWorkItems Service syncs tasks and subtasks from VSO into
 * the app
 */
.factory('SyncVSOWorkItems',['CurrentVSTSUser', 'underscore', 'SyncProgressService', '$cordovaFileTransfer',
  'performCRUDService', 'rootURLService', 'basicAuthorizationService', '$rootScope', '$q', 'Images', 'WorkItems',
  '$filter', 'IterationHours', 'Projects','AlignWorkItems','$ionicLoading', 'RepeatService', 'ModifyVSTSWorkItemService', function(CurrentVSTSUser,underscore,
    SyncProgressService,$cordovaFileTransfer,
    performCRUDService,rootURLService, basicAuthorizationService,$rootScope, $q, Images, WorkItems, $filter, IterationHours,
     Projects,AlignWorkItems,$ionicLoading, RepeatService, ModifyVSTSWorkItemService){

    var self = this;
    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    var parentIDS = [];

    self.getWorkItemDetailAndSaveToProject = function(workItemRelation,credentials,projectID,
      filteredBucketTags,currentUser,parentID){
        var q = $q.defer();

        performCRUDService.simpleGet(workItemRelation.target.url + "?$expand=all&api-version=1.0",
        basicAuthorizationService.basicConfig(credentials),
        function(data,status) {

            var vsoWorkItem = data.fields;
            var workItem = null;
            var relations = [];

            if(data.relations != undefined){

               relations=self.getAttachmentIDs(data.relations);
            }
            var bucketID = 3;//by default all workitems should go to the backlog bucket unless otherwirse
            if(vsoWorkItem["System.State"]==="Closed"
            ||vsoWorkItem["System.State"]==="Resolved"){ //if workitem is closed or marked as resolved
                 bucketID = 4;
            }
            if(vsoWorkItem["System.WorkItemType"]==="User Story"){

                 workItem = {
                        name: vsoWorkItem["System.Title"],
                        workItemVSOState: vsoWorkItem["System.State"],
                        workItemPriority:vsoWorkItem["Microsoft.VSTS.Common.Priority"],
                        iterationPath:vsoWorkItem["System.IterationPath"],
                        bucketID: bucketID,
                        projectID: parseInt(projectID),
                        workItemVSOID:vsoWorkItem["System.Id"],
                        originalEstimate:vsoWorkItem["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                        remainingWork: vsoWorkItem["Microsoft.VSTS.Scheduling.RemainingWork"],
                        completedWork: vsoWorkItem["Microsoft.VSTS.Scheduling.CompletedWork"],
                        description:vsoWorkItem["System.Description"],
                        workItemTypeID: 7,
                        alarmNotificationDate:"",
            			      workItemClosedBy:"",
            			      workItemClosedDate:"",
                        workItemAssignedTo:	vsoWorkItem["System.AssignedTo"],
						            parentWorkItemID:parentID,
                        acceptanceCriteria: vsoWorkItem["Microsoft.VSTS.Common.AcceptanceCriteria"],
                        tags: vsoWorkItem["System.Tags"],
                        workItemCreatedDate: vsoWorkItem["System.CreatedDate"],
                    };

            }
            if(vsoWorkItem["System.WorkItemType"]==="Task"){
						//console.log(vsoWorkItem)
                   workItem = {
                        name: vsoWorkItem["System.Title"],
                        workItemVSOState: vsoWorkItem["System.State"],
                        workItemPriority:vsoWorkItem["Microsoft.VSTS.Common.Priority"],
                        iterationPath:vsoWorkItem["System.IterationPath"],
                        bucketID: bucketID,
                        projectID: parseInt(projectID),
                        workItemVSOID:vsoWorkItem["System.Id"],
                        originalEstimate:vsoWorkItem["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                        remainingWork: vsoWorkItem["Microsoft.VSTS.Scheduling.RemainingWork"],
                        completedWork: vsoWorkItem["Microsoft.VSTS.Scheduling.CompletedWork"],
                        description:vsoWorkItem["System.Description"],
                        workItemTypeID: 5,
                        alarmNotificationDate:"",
            			      workItemClosedBy:"",
            			      workItemClosedDate:"",
                        workItemAssignedTo: vsoWorkItem["System.AssignedTo"],
						            parentWorkItemID:parentID,
                       tags: vsoWorkItem["System.Tags"],
                       workItemCreatedDate: vsoWorkItem["System.CreatedDate"]
                    };
          					if(vsoWorkItem["System.State"] == "Closed"){
            						person = vsoWorkItem["Microsoft.VSTS.Common.ClosedBy"];
            						var memName = person.substring(0, person.indexOf("<") - 1);
            						workItem.workItemClosedBy = memName ;
            						workItem.workItemClosedDate = vsoWorkItem["Microsoft.VSTS.Common.ClosedDate"];
        					  }

            }
          /////////// Mohit changes
          if(vsoWorkItem["System.WorkItemType"]==="Bug"){

            workItem = {
              name: vsoWorkItem["System.Title"],
              workItemVSOState: vsoWorkItem["System.State"],
              workItemPriority:vsoWorkItem["Microsoft.VSTS.Common.Priority"],
              iterationPath:vsoWorkItem["System.IterationPath"],
              bucketID: bucketID,
              projectID: parseInt(projectID),
              workItemVSOID:vsoWorkItem["System.Id"],
              originalEstimate:vsoWorkItem["Microsoft.VSTS.Scheduling.OriginalEstimate"],
              remainingWork: vsoWorkItem["Microsoft.VSTS.Scheduling.RemainingWork"],
              completedWork: vsoWorkItem["Microsoft.VSTS.Scheduling.CompletedWork"],
              description:vsoWorkItem["System.Description"],
              workItemTypeID: 1,
              alarmNotificationDate:"",
              workItemClosedBy:"",
              workItemClosedDate:"",
              workItemAssignedTo: vsoWorkItem["System.AssignedTo"],
              parentWorkItemID:parentID,
              tags: vsoWorkItem["System.Tags"],
              workItemCreatedDate: vsoWorkItem["System.CreatedDate"]
            };
            if(vsoWorkItem["System.State"] == "Closed"){
              person = vsoWorkItem["Microsoft.VSTS.Common.ClosedBy"];
              var memName = person.substring(0, person.indexOf("<") - 1);
              workItem.workItemClosedBy = memName ;
              workItem.workItemClosedDate = vsoWorkItem["Microsoft.VSTS.Common.ClosedDate"];
            }
          }
          ///////////////


            //prevent adding of null or undefined work items
            if(vsoWorkItem["System.WorkItemType"]==="User Story"
               || vsoWorkItem["System.WorkItemType"]==="Task" || vsoWorkItem["System.WorkItemType"]==="Bug")
            {

               //replace the undefined values
			  for(var key in workItem){
				  if(workItem[key] == undefined){
					 workItem[key] = "";
				  }
			  }
				workItem.bucketIDTag = 0;
				workItem.vstsTagID = '';
				if(workItem.workItemVSOState != 'Closed') {
				 //get the corresponding bucket id from the filtered tags
					filteredBucketTags
					.filter(function(bucketTag){
						if(String(bucketTag.vstsWorkItemID)
						  ===String(workItem.workItemVSOID)
						  && String(currentUser)
						  ===String(workItem.workItemAssignedTo)){
						  workItem.bucketID = parseInt(bucketTag.bucketID);
						  workItem.vstsTagID  = bucketTag.tagID;

						}
						if(String(bucketTag.vstsWorkItemID)
						  ===String(workItem.workItemVSOID)
						  && String(currentUser)
						  !==String(workItem.workItemAssignedTo)){
						  workItem.bucketIDTag = parseInt(bucketTag.bucketID);
						  workItem.vstsTagID  = bucketTag.tagID;
						}

					});
				}else{
					//console.log("worktem is closed")
				}

              //now add the workitem to the DB
              WorkItems
              .addWorkItem(workItem)
              .then(function(){
                  if(relations.length > 0 && app){//only run the attachment download in an app to avoid the infinite spinner in abrowser
                      self
                      .getWorkItemAttachment(relations, workItem.workItemVSOID, credentials,projectID)
                      .then(function(){
                            q.resolve();
                      });
                  }else{
                     q.resolve();
                  }
              });
            }
            else{
                    q.resolve();
            }

        }, function(error, status) {
              console.log("Error: " +  angular.toJson(error));
              q.reject({error:error,status:status});
        });

      return q.promise;
    };

    self.checkRepeatExist = function (workItem, projectID) {
      var q = $q.defer();
      Projects.getProject(projectID)
        .then(function (project) {
          RepeatService
            .checkIfRepeatScheduleSetForWorkItem(workItem.workItemVSOID, project.areaPathNodeName)
            .then(function (repeatSchedulesResult) {
              if (repeatSchedulesResult.length > 0) {
                repeatSchedulesResult.forEach(function (repeatScheduleResult, index) {
                  if (repeatScheduleResult.repeatCycleDone === 1) {
                    q.reject();
                  } else {
                    q.resolve(repeatScheduleResult);
                  }
                })
              } else {
                q.reject();
              }
            });
        });
      return q.promise;
    };


    self.getParentIDS = function(workItemRelation){
       var q = $q.defer();

        var parentID = 0;

        if(workItemRelation.source){
            if(workItemRelation.source.id){
              var idNotPresent = true;
              parentID = parseInt(workItemRelation.source.id);
              parentIDS.filter(function(id){
                if(id===parentID){
                  idNotPresent = false;
                }

              });
              if(idNotPresent){
                 parentIDS.push(parentID);
              }

                 // to allow association of parent work items with children tasks
              q.resolve(parentID);
            }

        }
        else{

             q.resolve(parentID);
        }

       return q.promise;
    };

    self.getAttachmentIDs = function (relations) {
        var relationIDs = [];
        if ((relations !== undefined) || (relations.length !== 0)) {
            for (var x = 0; x < relations.length; x++) {
                if (relations[x].rel == "AttachedFile") {
                    relationIDs.push(relations[x]);
                }
            }

        }
        return relationIDs;
    };

    //download a workitems attachments if it has them
    self.getWorkItemAttachment = function(workItemAttachmentLinks, workItemVSOID, credentials,projectID){
        var q = $q.defer();


        //init the work item progress sync vars
        var maxAttachmentsToBeSynced = workItemAttachmentLinks.length;
        var numberOfAttachmentsSynced = 0;

        //init the attachment progress bar
        SyncProgressService.setWorkItemAttachmentSyncProgressMaxVar(maxAttachmentsToBeSynced);
        SyncProgressService.setWorkItemAttachmentSyncProgressCurrentVar(0);

        //iterate over all the attachment links and download them one by one
        workItemAttachmentLinks
        .forEach(function(workItemAttachmentLink,i){
          //get the size of the attachment
          var attachmentSizeInMB = (parseInt(workItemAttachmentLink.attributes.resourceSize) / (1024*1024));


          //check the attachment to make sure its an image and its less than 5mb in size
          if(workItemAttachmentLink.attributes.name.match(/\.(jpg|jpeg|png|gif)$/)
            && attachmentSizeInMB <= 5){



              self
              .getWorkItemImageLinkAndSaveToProject(workItemAttachmentLink,workItemVSOID,credentials,projectID)
              .then(function(){
                //set the attachment details
                 SyncProgressService.setAttachmentDetails(workItemAttachmentLink.attributes.name,workItemVSOID);

                 numberOfAttachmentsSynced++;

                 //increment the attachment progress bar
                 SyncProgressService
                 .setWorkItemAttachmentSyncProgressCurrentVar(numberOfAttachmentsSynced);
                 if(numberOfAttachmentsSynced===maxAttachmentsToBeSynced){
                     //reset the attachment progress bar
                    SyncProgressService.setWorkItemAttachmentSyncProgressMaxVar(0);
                    SyncProgressService.setWorkItemAttachmentSyncProgressCurrentVar(0);
                    q.resolve();

                 }
              },function(error){
                  q.reject(error);
              });
          }
          else{
            if(attachmentSizeInMB>5&&workItemAttachmentLink.attributes.name.match(/\.(jpg|jpeg|png|gif)$/)){
              //console.log("Attachment " + workItemAttachmentLink.attributes.name + " just saving url because its greater than 5MB");

              WorkItems
                .getWorkItemByVsWorkAndProjectID(workItemVSOID, projectID)
                .then(function (result) {
                  var workItemID = result['id'];
                  var url = workItemAttachmentLink['url'] + "?api-version=1.0";
                  var name = workItemAttachmentLink['attributes']['name'];
                  name = name.replace(/\s+/g, '-');
                  var targetPath = cordova.file.dataDirectory  + name;
                  Images.verifyImagePathByProjectAndWorkItemVsoID(targetPath, projectID, workItemVSOID).then(function(res){
                    if(res) {
                      Images.updateImageDeleted(0, projectID, workItemVSOID).then(function(){
                      //  console.log("greater than 5MB update to zero");
                      })
                    } else {
                      var image = { workItemID: workItemID, memberID: 0, imagePath: url, projectID:projectID, workItemVSOID:workItemVSOID, isSync:1, isDeleted: 0,name: name};
                      Images.addHttpImageWithName(image).then(function () {
                        console.log("greater than 5MB addImage")
                      });
                    }
                  });
                });
            }
            if(attachmentSizeInMB<5&&!workItemAttachmentLink.attributes.name.match(/\.(jpg|jpeg|png|gif)$/)){
              console.log("Attachment " + workItemAttachmentLink.attributes.name + " cannot be downloaded because its not an image");

            }
            if(attachmentSizeInMB>5&&!workItemAttachmentLink.attributes.name.match(/\.(jpg|jpeg|png|gif)$/)){
              console.log("Attachment " + workItemAttachmentLink.attributes.name + " cannot be downloaded because its greater than 5MB and its not an image");

            }

           numberOfAttachmentsSynced++;

           //increment the attachment progress bar
           SyncProgressService.setWorkItemAttachmentSyncProgressCurrentVar(numberOfAttachmentsSynced);
           if(numberOfAttachmentsSynced===maxAttachmentsToBeSynced){
              //reset the attachment progress bar
              SyncProgressService.setWorkItemAttachmentSyncProgressMaxVar(0);
              SyncProgressService.setWorkItemAttachmentSyncProgressCurrentVar(0);
              q.resolve();

           }



          }

        });

      return q.promise;
    };

    self.getWorkItemImageLinkAndSaveToProject = function (workItemAttachmentLink, workItemVSOID, credentials, projectID) {
        var q = $q.defer();

        WorkItems
        .getWorkItemByVsWorkAndProjectID(workItemVSOID, projectID)
        .then(function (result) {
            var workItemID = result['id'];
            var url = workItemAttachmentLink['url'] + "?api-version=1.0";
            var name = workItemAttachmentLink['attributes']['name'];
            name = name.replace(/\s+/g, '-');

            var targetPath = cordova.file.dataDirectory  + name;


            var options = {
                headers: {
                    'Authorization': 'Basic ' + credentials,
                    'Content-Type': 'application/json',
                    'Connection': 'close'
                }
            };

			Images.verifyImagePathByProjectAndWorkItemVsoID(targetPath, projectID, workItemVSOID).then(function(res){
				//alert(JSON.stringify(res))
				if(res){
					Images.updateImageDeleted(0, projectID, workItemVSOID).then(function(){
						q.resolve();
						//console.log("update to zero")
						//alert("alrady and updated")
					})

				}else{
					$cordovaFileTransfer
						.download(url, targetPath, options)
						.then(function (result) {
						//	console.log("nwly ")
							var image = { workItemID: workItemID, memberID: 0, imagePath: targetPath, projectID:projectID, workItemVSOID:workItemVSOID, isSync:1, isDeleted: 0};
							Images.addImage(image).then(function () {
								  q.resolve();
							});
							  // Success!
						}, function (err) {
							  q.reject(err);
							  console.log(err);
							  //alert(JSON.stringify(err));
							  // Error
						}, function (progress) {

								//  $scope.downloadProgress = (progress.loaded / progress.total) * 100;

						});
				}


			});


        });
        return q.promise;
    };

    //function that gets a list of VSTS tags for use in today/tomorrow buckets
    self.getVSTSTagsAndFilterThem = function (instanceName,areaPathNodeName,vstsProjectID,vstsToken) {
      var q = $q.defer();
      var todayTomorrowVSTSWorkItems = [];

      performCRUDService
      .simpleGet(rootURLService.vstsTags(instanceName,vstsProjectID) + "?" + rootURLService.apiVersion1,
      basicAuthorizationService.basicConfig(vstsToken),
      function(data, status) {
          //return an array containing work items in work item ids and bucket id for current project/scope
          data.value.forEach(function(tag){

             var re = /\s*:\s*/;
             var tokenizedTag = String(tag.name).split(re);
              //check and filter if tag matches current vsts project being synced/refreshed
              if(String(tokenizedTag[0])===String(areaPathNodeName)
                  && String(tokenizedTag[1])===String(vstsProjectID)){
                  //if they match then push this into the today and tomorrow buckets
                  todayTomorrowVSTSWorkItems
                  .push({bucketID:tokenizedTag[2],vstsWorkItemID:tokenizedTag[3], tagID:tag.id});
              }

          });

        q.resolve(todayTomorrowVSTSWorkItems);

      },function(error, status) {
         q.reject({error:error,status:status});
      });


      return q.promise;
    };
    //function that extracts and saves the current user from the tree query
    self.getCurrentVSTSUserFromTreeQuery = function (instanceName, projectID, projectName, credentials, config) {
        var q = $q.defer();
        var queryIterPart = "";
        var queryIterPart2 = "";

        // check if root is true add iterationPath and root(project name)
        if(config.root != undefined && config.root != "" && config.root === true){

          queryIterPart += "(Source.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"' or Source.[System.IterationPath] = @project)";
          queryIterPart2 += "(Target.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"' or Target.[System.IterationPath] = @project)";

        } else {
          queryIterPart += "Source.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"'";
          queryIterPart2 += "Target.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"'";
        }


        var selectQuery = {
            ///// mohit changes
            /*"query": "Select * From WorkItemLinks WHERE ("+ queryIterPart +" AND [Source].[System.AreaPath] UNDER '"+config.selectedArea+"' and Source.[System.TeamProject] = @project and Source.[System.AssignedTo]=@me and Source.[System.State] <> 'Removed' and Source.[System.WorkItemType] <> 'Bug' and Source.[System.WorkItemType] <> 'Feature') and Source.[System.WorkItemType] <> 'Resolved' and ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') and ("+ queryIterPart2 +" and Target.[System.WorkItemType] <> '' and Target.[System.State] <> 'Removed' and Target.[System.WorkItemType] <> 'Bug' and Target.[System.WorkItemType] <> 'Feature' and Target.[System.WorkItemType] <> 'Resolved') mode(Recursive)"*/
          "query": "Select * From WorkItemLinks WHERE ("+ queryIterPart +" AND [Source].[System.AreaPath] UNDER '"+config.selectedArea+"' and Source.[System.TeamProject] = @project and Source.[System.AssignedTo]=@me and Source.[System.State] <> 'Removed' and Source.[System.WorkItemType] <> 'Feature') and Source.[System.WorkItemType] <> 'Resolved' and ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') and ("+ queryIterPart2 +" and Target.[System.WorkItemType] <> '' and Target.[System.State] <> 'Removed' and Target.[System.WorkItemType] <> 'Feature' and Target.[System.WorkItemType] <> 'Resolved') mode(Recursive)"
        };

         performCRUDService
         .simpleCreate(rootURLService.treeQuery(instanceName,projectName) + "?" + rootURLService.apiVersion1,
         "POST",
         selectQuery,
         basicAuthorizationService.basicConfig(credentials),
         function(data, status) {

                //start syncing the work items
                if(data['workItemRelations'].length > 0){
                    var workItemRelations = data.workItemRelations;
                 //  console.log(workItemRelations)

                    workItemRelations
                    .every(function(workItemRelation,i){
                            //get the work item details
                          performCRUDService.simpleGet(workItemRelation.target.url + "?$expand=all&api-version=1.0",
                          basicAuthorizationService.basicConfig(credentials),
                          function(data, status) {
                                  var vsoWorkItem = data.fields;
                                  var workItem = null;

                                   workItem = {
                                          name: vsoWorkItem["System.Title"],
                                          workItemVSOState: vsoWorkItem["System.State"],
                                          workItemPriority:vsoWorkItem["Microsoft.VSTS.Common.Priority"],
                                          iterationPath:vsoWorkItem["System.IterationPath"],
                                          projectID: parseInt(projectID),
                                          workItemVSOID:vsoWorkItem["System.Id"],
                                          originalEstimate:vsoWorkItem["Microsoft.VSTS.Scheduling.OriginalEstimate"],
                                          remainingWork: vsoWorkItem["Microsoft.VSTS.Scheduling.RemainingWork"],
                                          completedWork: vsoWorkItem["Microsoft.VSTS.Scheduling.CompletedWork"],
                                          description:vsoWorkItem["System.Description"],
                                          workItemTypeID: 7,
                                          alarmNotificationDate:"",
                                          workItemClosedBy:"",
                                          workItemClosedDate:"",
                                          workItemAssignedTo: vsoWorkItem["System.AssignedTo"]
                                    };

                                if(workItem.workItemAssignedTo!==undefined){
                                      Projects
                                      .getProject(projectID)
                                      .then(function(localProject){
                                             //remove the old user if any
                                            CurrentVSTSUser
                                            .removeCurrentVSTSUserByAreaPathNodeNamePID(localProject.areaPathNodeName, projectID)
                                            .then(function(){
                                                //then add the new one
                                                 CurrentVSTSUser
                                                 .addCurrentVSTSUserWithPID({userName:workItem.workItemAssignedTo, areaPathNodeName:localProject.areaPathNodeName}, projectID)
                                                 .then(function(){
                                                       q.resolve();
                                                 });
                                            });

                                      });

                                    return false;

                                }


                          }, function(error, status) {
                                console.log("Error: " +  angular.toJson(error));
                                q.reject({error:error,status:status});
                          });

                    });


                } else {
                    var workItem = {"name":"empty"};
                    var wiTypeID = 5;
                    var vsoWorkItemType = "$Task";
                    Projects
                        .getVSTSProjectCredentialsViaProjectID(parseInt(projectID))
                        .then(function(res) {
                            var specificProjectName = res['name'];
                            var specificAccTitle = res['vstsInstanceName'];
                            var specificBase64 = res['vstsToken'];
                            var iterationPath = res['iteration_path'].split("+");
                            var config = {};
                            if (iterationPath.length == 1) {
                                config = {
                                    root: false,
                                    selectedIteration: iterationPath[iterationPath.length - 1]
                                };
                            } else if (iterationPath.length > 1) {
                                config = {
                                    root: true,
                                    selectedIteration: iterationPath[iterationPath.length - 1]
                                };
                            }
                            var iteration = specificProjectName + "\\" + config.selectedIteration;
                            var workItemDescription = "EMPTY";
                            if (workItem.description !== undefined) {
                                workItemDescription = workItem.description;
                            }
                            var newWorkItem = [{
                                "op": "add",
                                "path": "/fields/System.Title",
                                "value": workItem.name.trim()
                            }, {
                                "op": "add",
                                "path": "/fields/System.IterationPath",
                                "value": iteration
                            }, {
                                "op": "add",
                                "path": "/fields/System.Description",
                                "value": workItemDescription
                            }];
                            var typeID = wiTypeID;
                            // add a new vsts work item
                            var url = rootURLService.baseURL(specificAccTitle) + specificProjectName + "/_apis/wit/workitems/" + vsoWorkItemType + "?api-version=1.0";
                            ModifyVSTSWorkItemService
                                .addNewWorkItemToVSTSNoCache(newWorkItem, specificBase64, url,
                                    typeID, 2, projectID, '', specificAccTitle)
                                .then(function(sucess) {
                                    var _workItem = {
                                        name: sucess["System.Title"],
                                        workItemVSOState: sucess.fields["System.State"],
                                        workItemPriority:sucess.fields["Microsoft.VSTS.Common.Priority"],
                                        iterationPath:sucess.fields["System.IterationPath"],
                                        projectID: parseInt(projectID),
                                        workItemVSOID:sucess.id,
                                        description:sucess.fields["System.Description"],
                                        workItemTypeID: 5,
                                        alarmNotificationDate:"",
                                        workItemClosedBy:"",
                                        createdBy: sucess.fields["System.CreatedBy"]
                                    };
                                    Projects
                                        .getProject(projectID)
                                        .then(function(localProject){
                                            //remove the old user if any
                                            CurrentVSTSUser
                                                .removeCurrentVSTSUserByAreaPathNodeNamePID(localProject.areaPathNodeName, projectID)
                                                .then(function(){
                                                    //then add the new one
                                                    CurrentVSTSUser
                                                        .addCurrentVSTSUser({userName:sucess.fields["System.CreatedBy"], areaPathNodeName:localProject.areaPathNodeName}, projectID)
                                                        .then(function(){
                                                            var setWorkItemState = [{
                                                                "op": "add",
                                                                "path": "/fields/System.state",
                                                                "value": "Removed"
                                                            }];
                                                            var url = rootURLService.workItemDetail(specificAccTitle) +
                                                                _workItem.workItemVSOID + "?" +
                                                                rootURLService.apiVersion1;
                                                            ModifyVSTSWorkItemService
                                                                .deleteVSTSWorkItem(setWorkItemState, specificBase64,
                                                                    url, _workItem.workItemTypeID, 2,
                                                                    projectID, 1, _workItem)
                                                                .then(function(sucess) {
                                                                    q.resolve("404");
                                                                });
                                                        });
                                                });

                                        });
                                });
                        });
                  // q.resolve("404");
                }

        }, function(error, status) {
             q.reject({error:error,status:status});
        });



        return q.promise;
    };
     //function that syncs work items from VSTS
    self.proceduralSync = function (instanceName, projectID, projectName, credentials, config,syncType) {
        var q = $q.defer();

        //first of all query the current user info
        self
        .getCurrentVSTSUserFromTreeQuery(instanceName, projectID, projectName, credentials, config)
        .then(function(){
               //then do the normal sync
              var queryIterPart = "";
              var queryIterPart2 = "";
              // check if root is true add iterationPath and root(project name)
              if(config.root != undefined && config.root != "" && config.root === true){

                queryIterPart += "(Source.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"' or Source.[System.IterationPath] = @project)";
                queryIterPart2 += "(Target.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"' or Target.[System.IterationPath] = @project)";

              } else {
                queryIterPart += "Source.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"'";
                queryIterPart2 += "Target.[System.IterationPath] = '"+ projectName +"\\"+ config.selectedIteration +"'";
              }

              var selectQuery = {
                  ///// mohit changes
                  /*"query": "Select * From WorkItemLinks WHERE ("+ queryIterPart +" AND [Source].[System.AreaPath] UNDER '"+config.selectedArea+"' and Source.[System.TeamProject] = @project and Source.[System.State] <> 'Removed' and Source.[System.WorkItemType] <> 'Bug' and Source.[System.WorkItemType] <> 'Feature') and Source.[System.WorkItemType] <> 'Resolved' and ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') and ("+ queryIterPart2 +" and Target.[System.WorkItemType] <> '' and Target.[System.State] <> 'Removed' and Target.[System.WorkItemType] <> 'Bug' and Target.[System.WorkItemType] <> 'Feature' and Target.[System.WorkItemType] <> 'Resolved') mode(Recursive)"*/
                "query": "Select * From WorkItemLinks WHERE ("+ queryIterPart +" AND [Source].[System.AreaPath] UNDER '"+config.selectedArea+"' and Source.[System.TeamProject] = @project and Source.[System.State] <> 'Removed' and Source.[System.WorkItemType] <> 'Feature') and Source.[System.WorkItemType] <> 'Resolved' and ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') and ("+ queryIterPart2 +" and Target.[System.WorkItemType] <> '' and Target.[System.State] <> 'Removed' and Target.[System.WorkItemType] <> 'Feature' and Target.[System.WorkItemType] <> 'Resolved') mode(Recursive)"
              };

              performCRUDService
              .simpleCreate(rootURLService.treeQuery(instanceName,projectName) + "?" + rootURLService.apiVersion1,
              "POST",
              selectQuery,
              basicAuthorizationService.basicConfig(credentials),
              function(data, status) {
                      //start syncing the work items
                      if(data['workItemRelations'].length > 0){
                          var workItemRelations = data.workItemRelations;
                          WorkItems.getWorkItemsByProjectIDAndSortThem(parseInt(projectID))
                              .then(function(_workItems) {
                                  var diffArr = underscore.filter(_workItems, function(obj){
                                      var found = false;
                                      underscore.filter(workItemRelations, function(_obj){if(_obj.target.id === obj.workItemVSOID){found = true;}});
                                      if (!found && obj.workItemDeleted !== 1) {return obj.workItemVSOID;}
                                  });
                                  if(diffArr.length > 0) {
                                      diffArr.forEach(function (wi) {
                                          WorkItems.setWorkItemDeletedByVSOID(wi.workItemVSOID).then(function(_res) {
                                          });
                                      });
                                  }
                              });
							

                          //init the work item progress sync vars
                          var maxWorkItemsToBeSynced = workItemRelations.length;
                          var numberOfWorkItemsSynced = 0;

                          //init the progress bar
                          SyncProgressService.setWorkItemSyncProgressMaxVar(maxWorkItemsToBeSynced);
                          SyncProgressService.setWorkItemSyncProgressCurrentVar(0);
                          //first of all get the list of tags associated with this instance and project
                          Projects
                          .getProject(projectID)
                          .then(function(projo){
                              //then get the current user
                              CurrentVSTSUser
                              .getCurrentVSTSUserByAreaPathNodeName(projo.areaPathNodeName)
                              .then(function(resCurrentUser){
                                   var currentUser = "";
                                   if(resCurrentUser[0] !== undefined){
                                      currentUser = resCurrentUser[0].userName;
									}



                                    //and then get a list of all the tags in VSTS
                                    self
                                    .getVSTSTagsAndFilterThem(instanceName,projo.areaPathNodeName,projo.vstsProjectID,credentials)
                                    .then(function(success){
                                      var filteredBucketTags = success;
                                      workItemRelations
                                      .forEach(function(workItemRelation,i){
                                          //then get the specific work item details
                                          self
                                          .getParentIDS(workItemRelation,projectID)
                                          .then(function(parentID){
                                                self
                                                .getWorkItemDetailAndSaveToProject(workItemRelation,credentials,
                                                  projectID,filteredBucketTags,currentUser,parentID)
                                                .then(function(){
                                                  //the vsts id of the work item being synced
                                                   SyncProgressService.setWorkItemDetails(workItemRelation.target.id);

                                                    numberOfWorkItemsSynced++;
                                                    //hide the fethcing message
                                                    SyncProgressService.showFetchingMessage(false);
                                                    //increment the progress bar
                                                    SyncProgressService.setWorkItemSyncProgressCurrentVar(numberOfWorkItemsSynced);
                                                    if(numberOfWorkItemsSynced===maxWorkItemsToBeSynced){
                                                       //q.resolve("success");
													    if(maxWorkItemsToBeSynced !== 1){
															var j = 0;
                                                            if(parentIDS.length === 0){
                                                                q.resolve("success");
                                                                return;
                                                            }
															for (var i = 0; i < parentIDS.length; i++) {
																WorkItems
															   .updateWorkItemParentIDByVSTSID( parentIDS[i], parentIDS[i])
															   .then(function(result){
																  j+=1;
																	if(j===parentIDS.length){
																	
																	AlignWorkItems
																	  .alignWorkItems(parseInt(projectID),syncType)
																	  .then(function(){

																		  WorkItems.
																		  getWorkItemsByProjectIDAndCloseThem(projectID).
																		  then(function(stories_and_tasks){
																				q.resolve("success");
																				// $ionicLoading.hide()


																		  });
																	  });

																	}
															   });

															};
														}else{
															console.log("one record found only")
															q.resolve("success");
														}



                                                    }

                                                },function(error){
                                                     q.reject(error);
													 $ionicLoading.hide()
                                                });
                                          });
                                      });
                                    },function(error){
                                         q.reject(error);
                                    });


                              });

                          });


                      } else {
                        q.resolve("404");
                      }

              }, function(error, status) {
                   q.reject({error:error,status:status});
              });



        },function(error){
           q.reject(error);
        });

        return q.promise;
	  };





  	self.reportSync = function (instanceName, projectID, projectName, credentials, config, area_path) {
          var q = $q.defer();
            if(config){
                config = projectName + "\\" + config;
                var mode = " MODE (Recursive, ReturnMatchingChildren)";
            }else{
                var mode = " MODE (Recursive)";
            }

            config = config || projectName;


            var selectQuery = {
                "query": "Select [System.WorkItemType],[System.Title],[System.State],[Microsoft.VSTS.Scheduling.Effort],[System.IterationPath] FROM WorkItemLinks WHERE Source.[System.WorkItemType] IN GROUP 'Microsoft.RequirementCategory' AND [Source].[System.AreaPath] UNDER '"+area_path+"' AND [Source].[System.IterationPath] UNDER '"+projectName+"' And Source.[System.State] IN ('New','Closed','Active','Resolved') AND [Target].[System.WorkItemType] != '' AND Target.[System.State] IN ('New','Closed', 'Active') AND [Target].[System.AreaPath] UNDER '"+area_path+"' AND [Target].[System.IterationPath] UNDER '"+config+"' AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' ORDER BY [System.Title] ASC,[System.Id] ASC"+mode
            };


            performCRUDService
            .simpleCreate(rootURLService.treeQuery(instanceName,projectName) + "?" + rootURLService.apiVersion1,
            "POST", selectQuery, basicAuthorizationService.basicConfig(credentials),
            function(data, status) {
  		          var userStory = [];
      		      var storyTask = [];
                var _finalStoryList = [];
                if(data['workItemRelations'].length > 0){

                        var workItemRelations = data.workItemRelations;
  					  //console.log(workItemRelations);
                        var j = 0;

  						var tempWorkItemRels = [];
  						workItemRelations.forEach(function(workItemRelation,i){
  								if(!workItemRelation.rel){
  									  userStory.push(workItemRelation);
  								} else {
  						  storyTask.push(workItemRelation);
  							}
  						});

  						for(var us = 0; us<userStory.length; us++){
  							var _story = userStory[us].target;
  							  userStory[us] = {};
  							  userStory[us]['data'] = _story;
  							  userStory[us]['rel'] = [];
  							  for(var t = 0; t< storyTask.length; t++){
  								  if(userStory[us]['data'] && storyTask[t].source){
  									  if(userStory[us]['data'].id == storyTask[t].source.id){
  										  userStory[us]['rel'].push(storyTask[t].target);
  									  }
  								  }
  							  }
  						}

  					 // console.log(userStory)


                        for (var proj in userStory) {
              	            (function(proj) {
                                self.getStoryDetail(userStory[proj], credentials, projectID)
                                    .then(function(object){
                                        _finalStoryList.push(object);
                                        j++;
                                        if(j === userStory.length){
                                            q.resolve(_finalStoryList);
                                        }
                                    });

                            })(proj);
  						}

                } else {
                  q.resolve("404");
                }

          }, function(error, status) {
                q.reject({error:error,status:status});
          });

          return q.promise;
    };


  	self.reportFeatureSync = function (instanceName, projectID, projectName, credentials, config, area_path) {
        var q = $q.defer();
        if(config){
              config = projectName + "\\" + config;

        }else{

        }
        config = config || projectName;
  	   var selectQuer = {
              "query": "Select [System.WorkItemType],[System.Title],[System.State],[Microsoft.VSTS.Scheduling.Effort],[System.IterationPath] FROM WorkItemLinks WHERE Source.[System.WorkItemType] IN ('Feature') AND [Source].[System.AreaPath] UNDER '"+area_path+"' AND [Source].[System.IterationPath] UNDER '"+projectName+"' And Source.[System.State] IN ('New','Closed','Active','Resolved') AND Target.[System.WorkItemType] IN ('User Story') AND Target.[System.State] IN ('New','Closed', 'Active', 'Resolved') AND [Target].[System.AreaPath] UNDER '"+area_path+"' AND [Target].[System.IterationPath] UNDER '"+config+"' AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' ORDER BY [System.Title] ASC,[System.Id] ASC mode(Recursive)"
        };

  	  	performCRUDService
        .simpleCreate(rootURLService.treeQuery(instanceName,projectName) + "?" + rootURLService.apiVersion1,
        "POST", selectQuer, basicAuthorizationService.basicConfig(credentials),
        function(data, status) {
  				var userStory = [];
      		var feature = [];
  				var _finalFeaListList = [];
  				if(data['workItemRelations'].length > 0){
  					var j = 0;
                        var workItemRelations = data.workItemRelations;
                        var j = 0;
  					  var tempWorkItemRels = [];
  					   workItemRelations.forEach(function(workItemRelation,i){
  								if(!workItemRelation.rel){
  									  feature.push(workItemRelation);
  								} else {

  						  workItemRelation['source']['id'] = feature[feature.length-1]['target']['id'];
  						  userStory.push(workItemRelation);
  					  }
  					});

  					for(var us = 0; us<feature.length; us++){
                            var _feature= feature[us].target;
                            feature[us] = {};
                            feature[us]['data'] = _feature;
                            feature[us]['rel'] = [];
                            for(var t = 0; t< userStory.length; t++){
                                if(feature[us]['data'] && userStory[t].source){
                                    if(feature[us]['data'].id == userStory[t].source.id){
                                        feature[us]['rel'].push(userStory[t].target);
                                    }
                                }
                            }
                      }

  					for (var proj in feature) {
              	            (function(proj) {
                                self.getStoryDetail(feature[proj], credentials, projectID)
                                    .then(function(object){
                                        _finalFeaListList.push(object);
                                        j++;
                                        if(j === feature.length){
                                            q.resolve(_finalFeaListList);
                                        }
                                    });

                            })(proj);
  					}

  				}else{
  					q.resolve("404");
  				}


  			},function(error, status){
  			  q.reject({error:error,status:status});
  		  });

  		  return q.promise;
  	};

  	self.getStoryDetail = function(userStory, credentials, projectID){
      			var q = $q.defer();
      			var _newUserStory = {};
      			var relations = userStory.rel;
      			var relLength = relations.length;
      			var i = 0;
      			performCRUDService
            .simpleGet(userStory.data.url + "?api-version=1.0",
                       basicAuthorizationService.basicConfig(credentials),
            function(data, status){
      					_newUserStory['data'] = data;
      					if(relLength > 0){
      						_newUserStory['rel'] = [];
      						for (var proj in relations) {
      							(function(proj) {
      								self.getUserTask(relations[proj], credentials, projectID)
      									.then(function(object){
      										i++;
      										_newUserStory['rel'].push(object);
      										if(relLength == i){
      											q.resolve(_newUserStory);
      										}
      									});
      							})(proj);
      						}
      					} else {
      						q.resolve(_newUserStory);
      					}

      			},
            function(error,status){
                q.reject({error:error,status:status});
            });

  				return q.promise;
  	};

    self.getUserTask = function(workItemRelation,credentials,projectID){
          var q = $q.defer();
          performCRUDService.simpleGet(workItemRelation.url + "?api-version=1.0",
          basicAuthorizationService.basicConfig(credentials),
          function(data, status) {

                var vsoWorkItem = data.fields;
                var workItem = null;
                var relations = [];
    		        q.resolve(data);

    			},
          function(error,status){
              q.reject({error:error,status:status});

          });

    		return q.promise;
    };


  	self.getAttachmentWithRelationIDs = function (relations) {
          var relationIDs = [];
          if ((relations == undefined) || (relations.length == 0)) {
              relationIDs = [];
          } else {
              for (var x = 0; x < relations.length; x++) {
                  if (relations[x]['rel'] == "System.LinkTypes.Hierarchy-Forward") {
                      relationIDs.push(relations[x]);
                  }
              }
          }
          return relationIDs;
    };


  	function compare(a, b) {
  				if (a.rel.length < b.rel.length) {
  					return 1;
  				}
  				if (a.rel.length > b.rel.length) {
  					return -1;
  				}
  				return 0;
  	};

    self.sortOrignalEstimated = function (success, res) {
  			var obj = {};
  			obj.cols = [];
  			obj.rows = [];
  			var obs = {};
  			obj.cols.push({
  				"id": "month",
  				"label": "Month",
  				"type": "string"
  				});
  			obj.cols.push({
  				"id": "tasks com",
  				"label": "Ideal Glide",
  				"type": "number"
  			 });

  			obj.cols.push({
  				"id": "monsth",
  				"label": "Remaning",
  				"type": "number"
  			});

        var q = $q.defer();
        var idealArr = [] ;
        var a =[];
        var com = [];
        var x = 1;
        var orignalEst = 0;
        var remainingEst = 0;
        var rels = [];

        var comArr = [];
       // console.log(success);
        success.forEach(function(item){
            if(item.rel){
                item.rel.forEach(function(obj){

                rels.push(obj);
        						if(obj['fields']['Microsoft.VSTS.Scheduling.OriginalEstimate']){
        								 orignalEst  = orignalEst + obj['fields']['Microsoft.VSTS.Scheduling.OriginalEstimate'];
        						}

                    if(obj['fields']['Microsoft.VSTS.Scheduling.RemainingWork']){
                        remainingEst  = remainingEst + obj['fields']['Microsoft.VSTS.Scheduling.RemainingWork'];
                    }
                })
            }
        });

        var orghrs = orignalEst;
        var test = res['iteration_path'].split("+");
        if (test.length == 2) {
            res['iteration_path'] = test[1];
        }

        var d = new Date(res.start_date);
        var d2 = new Date(res.finish_date);
        var timeDiff = Math.abs(d2.getTime() - d.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  			var divide = orignalEst / diffDays;
  			if (!isNaN(divide) && divide.toString().indexOf('.') != -1){
  					var divide = parseFloat(divide).toFixed(2);
  			}
        		   //console.log(divide);

  			obs.c = [];
  			obs.c.push({"v": $filter('date')(d,"MM/dd/yy", "UTC")})
  			obs.c.push({"v":orignalEst});
  			obj.rows.push(obs);

              var ideal = {'x':d.getTime() ,'y': orignalEst};
              idealArr.push(ideal);
              for (i=1; i<=diffDays; i++){
                  d.setDate(d.getDate()+ 1);
                  var dd = d.getTime();
                  if(orignalEst >= divide){
                      orignalEst = orignalEst - divide;
                  }
  				    //     console.log(orignalEst);
                  var ideal = {'x':dd ,'y': parseInt(orignalEst)};
                  idealArr.push(ideal);
  				var obs = {};
  				obs.c = [];
  				obs.c.push({"v": $filter('date')(dd,"MM/dd/yy")})
  				obs.c.push({"v":orignalEst});
  				obj.rows.push(obs);
              }

              IterationHours
              .getHoursWithIterationName(res.id, res['iteration_path'])
              .then(function(result){
                  if(result.length < 1 || result === undefined || typeof result === undefined){
                      var star_date = $filter('date')(res.start_date,"MMM-d-yyyy", "UTC");
            				//	console.log(star_date);
            				//	console.log(remainingEst);
                      var obj = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:orghrs, rDate:star_date};
                      IterationHours.addRemainingHours(obj).then(function(){
  						            var star_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
                          var obj = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:remainingEst, rDate:star_date};
                          IterationHours.addRemainingHours(obj).then(function(){
                              IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
                                  sumAllHours(reslt);
                              });

                          });

                      });

                   }else{
                         //console.log(result.length);
                          var a = result[result.length-1];
                          var star_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
                         if(star_date === a.rDate){
                             IterationHours.updateRemainingHours(remainingEst,a.id).then(function(){

                                 IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
                                   //  console.log(reslt);
                                     sumAllHours(reslt);
                                 });

                             });
                         } else{
                             var star_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
                             var obj = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:remainingEst, rDate:star_date};
                             IterationHours.addRemainingHours(obj).then(function(){
                                 IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
                                     sumAllHours(reslt);
                                 });
                             });
                         }
                   }
              });

  			//console.log(obj)
  			//console.log(getIndex(obj.rows, findDate));
              function sumAllHours(rest){

					for (var i=0; i<rest.length; i++){
                      var today  = new Date(rest[i].rDate);
  					var findDate = $filter('date')(today,"MM/dd/yy")
  					var e = getIndex(obj.rows, findDate);
  					//console.log(e);
  					if(e == "nf"){
  						//console.log("not foimd");
  						var obs = {};
  						obs.c = [];
  						obs.c.push({"v": $filter('date')(dd,"MM/dd/yy")})
  						obs.c.push({"v":null});
  						obs.c.push({"v":parseInt(rest[i].remainingHours)});
  						obj.rows.push(obs);

  					}else{
  						obj.rows[i].c.push({"v":parseInt(rest[i].remainingHours)});
  						//console.log("found");
  					}
                      var com = {'x': today.getTime(),'y': parseInt(rest[i].remainingHours)};
                      comArr.push(com);
					}
                 // console.log(comArr);
                  var retArray =  [
                      {
                          values: idealArr,      //values - represents the array of {x,y} data points
                          key: 'Ideal Glide', //key  - the name of the series.
                          color: '#eee',  //color - optional: choose your own line color.
                          strokeWidth: 5
                      },
                      {
                          values:comArr,
                          key:'Remaining',
                          color:'#91E500',
                          strokeWidth:2
                      }

                  ];
                  q.resolve(retArray);
              };


           return q.promise;
    };


     //// Copy for testing purpose
  	self.googleSortOrignalEstimated = function (success, res) {
  		var obj = {};
  		obj.cols = [];
  		obj.rows = [];
		obj.isBelowGlide = false;
  		var obs = {};
  		obj.cols.push({
  			"id": "month",
  			"label": "Month",
  			"type": "string"
  			});
  		obj.cols.push({
  			"id": "tasks com",
  			"label": "Ideal Glide",
  			"type": "number"
  		 });

  		obj.cols.push({
  			"id": "monsth",
  			"label": "Remaning",
  			"type": "number"
  		});


  		var q = $q.defer();
  		var a =[];
  		var x = 1;
  		var orignalEst = 0;
  		var remainingEst = 0;
  		var rels = [];

  		var comArr = [];
  	  //  console.log(success);
  		success.forEach(function(item){
  			if(item.rel){
  				item.rel.forEach(function(obj){
  				rels.push(obj);
  					if(obj['fields']['Microsoft.VSTS.Scheduling.OriginalEstimate']){
  							 orignalEst  = orignalEst + obj['fields']['Microsoft.VSTS.Scheduling.OriginalEstimate'];
  					}
  					if(obj['fields']['Microsoft.VSTS.Scheduling.RemainingWork']){
  						remainingEst  = remainingEst + obj['fields']['Microsoft.VSTS.Scheduling.RemainingWork'];
  					}
  				})
  			}
  		});
		
		console.log(orignalEst, remainingEst);
		if(remainingEst > orignalEst){
			obj.isBelowGlide = true;
		}
		

  		var orghrs = orignalEst;
  		var test = res['iteration_path'].split("+");
  		if (test.length == 2) {
  			res['iteration_path'] = test[1];
  		}
  		try
  		{
  			var d = new Date(res.start_date);
  			//console.log("startdate", d)
  			var d2 = new Date(res.finish_date);
  			//console.log("finishing date", d2)
  			var timeDiff = Math.abs(d2.getTime() - d.getTime());
  			var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  				var divide = orignalEst / diffDays;

  				if (!isNaN(divide) && divide.toString().indexOf('.') != -1){
  						var divide = parseFloat(divide).toFixed(2);
  				}
  			 //  console.log(divide);

  			obs.c = [];
  			obs.c.push({"v": $filter('date')(d,"MM/dd/yy", "UTC")})
  			obs.c.push({"v":orignalEst});
  			obj.rows.push(obs);
  			for (i=1; i<=diffDays; i++){
  				d.setDate(d.getDate()+ 1);
  				//console.log(d)
  				var dd = d.getTime();
  				if(orignalEst >= divide){
  					orignalEst = orignalEst - divide;
  				}else{
  					orignalEst = 0
  				}
  				var obs = {};
  				obs.c = [];
  				obs.c.push({"v": $filter('date')(dd,"MM/dd/yy")})
  				obs.c.push({"v":orignalEst});
  				obj.rows.push(obs);

  			}

  			console.log(obj);
  			//alert("Sami test call 1"+JSON.stringify(obj));

  			//console.log(orghrs, remainingEst)
  			IterationHours
  			.getHoursWithIterationName(res.id, res['iteration_path'])
  			.then(function(result){

  				if(result.length < 1 || result === undefined || typeof result === undefined){
  					//alert("Sami test call 2 if Undefined"+JSON.stringify(result));
  					var star_date = $filter('date')(res.start_date,"MMM-d-yyyy", "UTC");
  					var obj_add = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:orghrs, rDate:star_date};
  					IterationHours.addRemainingHours(obj_add).then(function(){

  									var star_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
  						var obj_add = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:remainingEst, rDate:star_date};
  						IterationHours.addRemainingHours(obj_add).then(function(){
  							IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
  								sumAllHours(reslt, obj).then(function(c_obj){q.resolve(c_obj);});

  							});
  						});
  					});

  				 }else{
  					// alert("Sami test call 2 else"+JSON.stringify(result));
  						var a = result[result.length-1];
  						var star_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
  						if(star_date == a.rDate){
  							  IterationHours.updateRemainingHours(remainingEst,a.id).then(function(){
  									IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
  										sumAllHours(reslt, obj).then(function(c_obj){q.resolve(c_obj);});

  									  });
  							  });
  						}else{
  						   var new_date = $filter('date')(new Date,"MMM-d-yyyy", "UTC");
  						   var obj_add = {projectID:res.id,iteration_path:res['iteration_path'], remainingHours:remainingEst, rDate:new_date};
  						   IterationHours.addRemainingHours(obj_add).then(function(){
  							   IterationHours.getHoursWithIterationName(res.id, res['iteration_path']).then(function(reslt){
  									sumAllHours(reslt, obj).then(function(c_obj){q.resolve(c_obj);});

  							   });
  						   });
  					   }
  					}
  				});

  		}

  		catch(err) {
  			//alert("Sami debug log error first function"+JSON.stringify(err));
  		}
  		return q.promise;
  	};



  	function sumAllHours(rest, obj){
  		var remaing;
  		var q = $q.defer();
  		for (var i=0; i<rest.length; i++){
  			var today  = new Date(rest[i].rDate);
  			var findDate = $filter('date')(today,"MM/dd/yy")
  			var e = getIndex(obj.rows, findDate);
  			remaing = parseInt(rest[i].remainingHours)
  			if(e == "nf"){
  				var obs = {};
  				obs.c = [];
  				obs.c.push({"v": $filter('date')(today,"MM/dd/yy")})
  				obs.c.push({"v":null});
  				obs.c.push({"v":parseInt(rest[i].remainingHours)});
  				obj.rows.push(obs);
  			}else{
  				
  				try{
  					if(remaing){
  						obj.rows[i].c.push({"v":parseInt(rest[i].remainingHours)});
  					}else{
  						if(remaing == 0){
  						 // console.log("undefined 0")
  						}
  					}
  				}catch(err){
  					console.log("exception"+err);

  				}
  			}
  		}

  		

  		for (i=0; i<obj.rows.length; i++){
  			//console.log(obj.rows[i]["c"][2]);
  			if(obj.rows[i]["c"].length == 2){
				try{
  				   var ii  = i-1;
  					//console.log(i, ii);
  					//console.log(obj.rows[i]["c"][1]["v"]);
  				obj.rows[i].c.push({"v":obj.rows[ii]["c"][2]["v"]});
				}catch(err){
  					console.log("exception in adding value of last "+err);

  				}
			}
  		

  		}



  		q.resolve(obj);
  		return q.promise;

  	};
  	function getIndex(ar, findDate){
  		//console.log(findDate);
  		for (i=0; i<ar.length; i++){
  			 if(ar[i]["c"][0]["v"] == findDate)
  			 return i;
  		}

  		return "nf";
  	}


  	self.sortState = function (success) {
  		    success = underscore.reject(success, function(num){
                
                return (num['data']['fields']["System.WorkItemType"] === "Task" || num['data']['fields']["System.WorkItemType"] === "Bug"); });
  			   
  				var res = underscore.filter(success, function(num){
  				return num['data']['fields']["System.State"] === "Resolved"; });
  				

  				var Resolvedrel = underscore.filter(res, function(num){
  				return num.hasOwnProperty("rel"); });
  				

  				Resolvedrel.sort(compare);
  				var finalResolve =underscore.union(Resolvedrel, res);
  			
                  // active
          var active = underscore.filter(success, function(num){
             
              return num['data']['fields']["System.State"] === "Active"; });
         

          var activeRel = underscore.filter(active, function(num){
              return num.hasOwnProperty("rel"); });
        
          activeRel.sort(compare);
          var finalActive =underscore.union(activeRel, active);
        
                  // New State
  				var newState = underscore.filter(success, function(num){
  				return num['data']['fields']["System.State"] === "New"; });

  				var newRel = underscore.filter(newState, function(num){
  					return num.hasOwnProperty("rel"); });

  				newRel.sort(compare);
  				var finalNew =underscore.union(newRel, newState);

           // Closed State

          var closed = underscore.filter(success, function(num){
              return num['data']['fields']["System.State"] === "Closed"; });
          //console.log(closed);

          var closesdRel = underscore.filter(closed, function(num){
              return num.hasOwnProperty("rel"); });
         

          closesdRel.sort(compare);
          var finalclosed =underscore.union(closesdRel, closed);
        

  				var s=underscore.union( finalResolve, finalNew, finalActive, finalclosed);
  				//console.log(s);
  	   	return s;
  	};

    
    self.getClosedTasks=function(success, userName){
        var counts= 0
        success.forEach(function(data) {
            if(data.hasOwnProperty("rel") && data["rel"].length > 0){
               data["rel"].forEach(function(obj){
                  if(obj['fields']["System.State"] == "Closed"){
					if(obj["fields"]["System.AssignedTo"])  
						var person =obj["fields"]["System.AssignedTo"]
					else{
						var person = obj["fields"]["Microsoft.VSTS.Common.ClosedBy"]
					}
					
					if(person != undefined){
                      var memName = person.substring(0, person.indexOf("<") - 1);
                      if(memName == userName){
                          //console.log(userName);
                          counts++;
                      }
					}	
				}
				  
				  
               })
            }else{
  			  //console.log(data)
  			  data = data.data;
  				if(data['fields']['System.WorkItemType'] == 'Task'){
  					if(data['fields']["System.State"] == "Closed"){
							if(data["fields"]["System.AssignedTo"]){
							  var person =data["fields"]["System.AssignedTo"]
							}else{
								var person =data["fields"]["Microsoft.VSTS.Common.ClosedBy"]
							}
						if(person != undefined){
							var memName = person.substring(0, person.indexOf("<") - 1);
							if(memName == userName){
								//console.log(userName);
								counts++;
							}
						}	
					}
  					 
  					
  				}

  		  }
        });
        return counts
    };

  self.sortClosedStateTasks = function(success, userName) {
  var counts = 0
  var tasks = [];
  success.forEach(function(data) {
    if (data.hasOwnProperty("rel") && data["rel"].length > 0) {
      data["rel"].forEach(function(obj) {
        if (obj['fields']["System.State"] == "Closed") {
          var closedDate= moment(obj['fields']["Microsoft.VSTS.Common.ClosedDate"]).toISOString();
          closeHours = moment(moment().toISOString()).diff(closedDate, 'hours');
          if(closeHours < 25){ // need to 
            if (obj["fields"]["System.AssignedTo"])
            var person = obj["fields"]["System.AssignedTo"]
            else {
              var person = obj["fields"]["Microsoft.VSTS.Common.ClosedBy"]
            }

          if (person != undefined) {
            var memName = person.substring(person.indexOf("<") + 1, person.indexOf(">"));
            if (memName == userName) {
              counts++;
              obj.closedCounts = counts;
              tasks.push(obj);
            }
          }
          }

          
        }

      })
    } else {
      data = data.data;
      if (data['fields']['System.WorkItemType'] == 'Task') {
        if (data['fields']["System.State"] == "Closed") {
          var closedDate= moment(data['fields']["Microsoft.VSTS.Common.ClosedDate"]).toISOString();
          closeHours = moment(moment().toISOString()).diff(closedDate, 'hours');
        
          if(closeHours < 25){  
            if (data["fields"]["System.AssignedTo"]) {
              var person = data["fields"]["System.AssignedTo"]
            } else {
              var person = data["fields"]["Microsoft.VSTS.Common.ClosedBy"];
            }
         
            if (person != undefined) {
              var memName = person.substring(person.indexOf("<") + 1, person.indexOf(">"));
              if (memName == userName) {
                counts ++;  
                data.closedCounts = counts;
                tasks.push(data);
              }
            }
          }  
        }

      }

    }
  });
  return tasks
};
	  return self;
}])
.factory('chartService', ['$ionicLoading', function ($ionicLoading) {
    return {
        loaderShow: function(){
            $ionicLoading.show({
                template: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 100
            });
        },

        sp2options: function(title){
            var opt ={
                    options: {
                        bulletChart: {
                            chart: {
                                type: 'bulletChart',
                                transitionDuration: 500,
                                height: 50

                            },valueFormat: function(d){
                                //console.log(d);
                                return d3.format(',.0d')(d);
                            },
                            xAxis:{

                                tickFormat:function(d){
                                   // console.log(d);
                                    return d3.format('d')(d);
                                }
                            },
                            yAxis:{
                                tickFormat:function(d){
                                    console.log(d);
                                    return d3.format('d')(d);
                                }
                            },
                            title: {
                                enable: true,
                                text: title,
                                css:{'text-align': 'center',
                                    'font-size': '12px'}
                            }
                        }
                    }
                };


            return opt;
        },

        loaderHide: function(){
            $ionicLoading.hide();
        },

		googleBulletStack : function(title){
			return {
				"type": "BarChart",
				"options": {
					title: title,
					chartArea: {width: '100vx', height:35},
					'isStacked': 'percent',
					legend: { position: "none"},
					annotations: {
						alwaysOutside: true,
						textStyle: {
						fontSize: 12,
						auraColor: 'none',
						color: '#555'
						},

					},
					vAxis: {
					  minValue: 1,
					},
					colors: ['#3366CC','#FCEBE7']
				}


			}
		},

		googleBurnDownChart:function(){
			return {
				"type": "LineChart",
				"displayed": false,
				"options": {
					"isStacked": "true",
					"fill": 20,
					"displayExactValues": true,
					"legend": { "position": 'top' },
					hAxis: {
						"title":"Days",
						direction: 1,
						slantedText: true,
						slantedTextAngle: 65 // here you can even use 180
					},
					vAxis:{
						"title":"Work Hours"
					},
					colors: ['#3366CC','#91E500'],
					"title":""
				}
			}
		},

        burnDownChartOptions: function(){
            return {
                options: {
                    "chart": {
                        "type": "lineChart",
                        "height": 300,
                        "margin": {
                            "top": 20,
                            "right": 28,
                            "bottom": 80,
                            "left": 59
                        },
                        x: function(d){
                          //  console.log(d);
                            return d.x; },
                        y: function(d){ return d.y; },
                        xAxis: {
							             rotateLabels: -45,
                            axisLabel: 'Days',
                            tickFormat:function(d){
                               // console.log(d);
                                return d3.time.format("%m/%d/%y")(new Date(d))
                            },
							          ticks:5
                        },
                        yAxis: {
                            axisLabel: 'Work Hours',
                            tickFormat: function(d) {
                                return d3.format('d')(d);
                            }
                        }

                    },
                    "title": {
                        "enable": false,
                        "text": "Burn Down Chart"
                    }
                }
            }
        },



        options: function(title, state){
            state = this.getColor(state);
            var opt = {
                options: {
                    chart: {
                        type: 'bulletChart',
                        transitionDuration: 500,
                        height: 50
                    },
                    tickFormat: function(d){
                       // console.log(d);
                        return d3.format(',.0d')(d);
                    },
                    xAxis:{

                      tickFormat:function(d){
                          //console.log(d);
                          return d3.format('d')(d);
                      }
                    },
                    yAxis:{
                        tickFormat:function(d){
                            console.log(d);
                            return d3.format('d')(d);
                        }
                    },
                    reduceXTicks:false,
                    title: {
                        enable: true,
                        text: title,
                        css:{'text-align': 'center',
                            'font-size': '12px', 'color':state}
                    }
                }
            };

            return opt;
        },
        getColor:function(state){
            var col;
            if(state === "Resolved"){
                col = '#387ef5'; // blue
            }else if(state === "Closed"){
                col='#444444'; // back
            }else if(state === "New" || state === "Active"){
                col = '#33cd5f';  // green
            }
            return col;
        }
    };
}])
.factory('pushService',['WorkItems', 'Projects', '$q', 'VSTSTeams','CurrentVSTSUser', 'SCRUMSOUP_API', 'performCRUDService', 'basicAuthorizationService', '$rootScope', '$timeout', '$state', 'SyncVSOWorkItems', 'VSTSTeamRefreshService', 'VSTSTeamMembers', 'underscore', 'DBA', 'CHECK_ENV' ,  function(WorkItems,Projects, $q, VSTSTeams, CurrentVSTSUser, SCRUMSOUP_API, performCRUDService, basicAuthorizationService, $rootScope, $timeout, $state, SyncVSOWorkItems, VSTSTeamRefreshService, VSTSTeamMembers, underscore, DBA, CHECK_ENV){
  var self = this;
  //counts
	self.getCountsForPushAndUpdatePrj = function(iterationPathProjectID) {
      	  WorkItems
      		.getWorkItemProjectIDandVSOState(iterationPathProjectID, "Closed")
      		.then(function(item) {

      			  Projects
      				.updateCloseTaskofProjects(iterationPathProjectID, item.count)
      				.then(function() {
      					  // for testing paste code here
      					  WorkItems
      						.getWorkItemCloseMemberCounts(iterationPathProjectID, "Closed")
      						.then(function(items) {
      							//console.log(JSON.stringify(items));
								if(items.length >=1){
									if(items.length == 1){
										console.log("one of one");

										if(items[0].total == 1){
				
										}
									}else{

										var items = _.sortBy( items, function( item ) { return -item.total; } )
										console.log(items[0].total, items[1].total);
										//console.log(items);
										if(items[0].total > items[1].total){
											   console.log("greater");
											   diff = items[0].total - items[1].total;
											   if(diff == 1){
												    console.log(diff);
													console.log(" diff 1 notiication can be send")
												//	self.getTeamnotifications(iterationPathProjectID);
												}else{
													console.log("greater diff");

												}
										}else{
											console.log("less");
										}
									}
								}

      						});

      				});
      		});
	};
	
	
	self.getCountsForPushNotiAndGetCurrentUser = function(iterationPathProjectID, currentUser, iterationPath, prevCountsObject) {
      	
	  // for testing paste code here
		WorkItems
		.getWorkItemCloseMemberCounts(iterationPathProjectID, "Closed")
		.then(function(items) {
			if(items.length >=1){
				if(items.length == 1){
			
					if(items[0].total == 1){
					
					}
				}else{
					if(prevCountsObject.length >=1 ){
						prevCountsObject = _.sortBy( prevCountsObject, function( item ) { return -item.total; });
						var items = _.sortBy( items, function( item ) { return -item.total; } )
						//console.log(prevCountsObject[0].workItemAssignedTo, currentUser, items[0].workItemAssignedTo);
						if(prevCountsObject[0].workItemAssignedTo == currentUser && items[0].workItemAssignedTo == currentUser){
							if(items[0].total > prevCountsObject[0].total){  //change to > orignal
								console.log(items[0].total, items[1].total);
								if(items[0].total > items[1].total){
									   //console.log("greater");
										diff = items[0].total - items[1].total;
										//console.log(diff);
										//console.log(" diff 1 notiication can be send");
										if(CHECK_ENV.runningInDevice){
											self.getTeamnotifications(iterationPathProjectID);
										}
										
										
								}else{
									//console.log("less");
								}
							}else{
								//console.log("count equal or lesss", items[0].total,prevCountsObject[0].total);
							}
							
						}else{
							//console.log("current user does not match");
						}		
					}
					
					
					
				}
			}

		});

	};

	self.initializedPushObj = function(){
		var initializedObj = {
			android: {
				 senderID: "46154117151",
				 forceShow: true
			},
			ios: {
				alert: "true",
				badge: false,
				sound: "true"
			},
			windows: {}
		};

		return initializedObj;
	};

	self.onNotificationHandler = function(data){
    //alert(JSON.stringify(data));
		if(data["additionalData"]["foreground"]){
     // alert(data["additionalData"]["coldstart"]);
		}else{
      //alert(JSON.stringify(data["additionalData"]));
      if(data["additionalData"]["notiType"] == "leaderboard"){
       self.getProjectIdAndName(data["additionalData"]["projectId"]); 
      }else if(data["additionalData"]["notiType"] == "personal"){
        self.getProjectIdForChat(data["additionalData"]["projectId"]);
          // redirection to personal chat
          //  vsts projectId data["additionalData"]["projectId"]
          // vsts teamId =  data["additionalData"]["teamId"]
          // accounttile =  data["additionalData"]["accountTitle"]
      }else{
       if(data["additionalData"]["notiType"] == "team"){
         self.getProjectIdForChat(data["additionalData"]["projectId"]);
          // redirection to team Chat  chat
       } 
      }
			 
		}

		try{
			$rootScope.pushObj.finish(function() {
				//console.log("processing of push data is finished");
			}, function() {
			}, data["additionalData"]["noteId"]);

		}catch(e){
			//console.log("log error")
			//alert("tc AA:  " + e);
		}

		$rootScope.pushObj.clearAllNotifications(function() {
			//console.log('success');
		}, function() {
			console.log('error');
		});
	};


	self.initializeTokenAndSave = function(data, time){
		   var q = $q.defer();
			$timeout(function () {
			//console.log("after 3 seconds")
			if(data.registrationId != null && data.registrationId != undefined){
				//alert(data.registrationId);
				Projects.getAutoQueryBacklogTime(1).then(function(res){
					if(res != undefined && res != null){
						console.log(JSON.stringify(res));
						Projects
							  .updateTime(res.backlogTime, res.notification_recv, res.notification_send, data.registrationId ,1)
							  .then(function(res){
									q.resolve("success");
								//	alert("resolve")
							

						  });
					}else{
						
						//Projects.addAutoQueryBacklogTime(time, notification_recv , notification_send, data.registrationId).then(function(r){alert("new added");});
					}

				});
			}else{
				//alert("nulll");
			}
			},time);

		return q.promise;
	};


	self.getVsoCountsForPushAndUpdatePrj = function(projectID, memName){
		//console.log(memName)
		Projects
        .getVSTSProjectCredentialsViaProjectID(projectID)
        .then(function(vstsProject){
			var test = vstsProject['iteration_path'].split("+");
			if (test.length == 2) {
					vstsProject['iteration_path'] = test[1];
			}
		  VSTSTeams
			.getVSTSTeamByProjectID(vstsProject.id)
			.then(function(res) {
				if (res.length <= 0) {
					alert("No VSTS Team found, please add one to continue");
					return;
				} else {
					var vstsTeam = res;
					//$scope.vstsTeam = vstsTeam;
					VSTSTeamRefreshService
						.refreshTeamMembers(vstsTeam)
						.then(function() {
							//first get the team members for this project
							VSTSTeamMembers
							.getVSTSTeamMemberByVSTSTeamID(res.vstsTeamID)
							.then(function(vstsTeamMembers) {
								SyncVSOWorkItems
								.reportSync(vstsProject.vstsInstanceName, vstsProject.id, vstsProject.name, vstsProject.vstsToken, vstsProject['iteration_path'], vstsProject.area_path)
								.then(function(success) {
									//console.log(success)
									var totalCount = 0;
									if (success.length > 0 && success != 404) {
										var sortedObjects = SyncVSOWorkItems.sortState(success);
										 vstsTeamMembers.forEach(function(teamMember) {
											teamMember.closedWorkItemsCount = SyncVSOWorkItems.getClosedTasks(success, teamMember.displayName);
											totalCount += teamMember.closedWorkItemsCount;

										});

										var vstsTeams = underscore.sortBy(vstsTeamMembers, 'closedWorkItemsCount').reverse();
										console.log(vstsTeams[0]['closedWorkItemsCount'], vstsTeams[1]['closedWorkItemsCount'])
										console.log(vstsTeams[0], vstsTeams[1]['closedWorkItemsCount'])
										if(vstsTeams.length >1){
											if(vstsTeams[0]['closedWorkItemsCount'] > vstsTeams[1]['closedWorkItemsCount']){
												var diff = parseInt(vstsTeams[0]['closedWorkItemsCount']) - parseInt(vstsTeams[1]['closedWorkItemsCount']);
												if(diff == 1){
													if(vstsTeams[0]['uniqueName'] == memName){
														console.log(" diff 1 with another team member notiication can be send")
														self.getTeamnotifications(projectID);
													}else{
														console.log("top user"+vstsTeams[0]['uniqueName']+ "and current user is not same"+memName)
													}

												}else{
													console.log("diff greater than or equal "+ diff)

												}

											}else{
												console.log("Both are equal")
											}
										}else{

											console.log("one member")

											if(vstsTeams[0]['closedWorkItemsCount'] == 1){
												self.getTeamnotifications(projectID);
											}else{
												console.log(vstsTeams[0]['closedWorkItemsCount'])
											}
										}
									}
								})
							});
					});
				}
			});

		});

	};

	self.getTeamnotifications = function(projectID){
		Projects
        .getVSTSProjectCredentialsViaProjectID(projectID)
        .then(function(res){
			var test = res['iteration_path'].split("+");
			if (test.length == 2) {
					res['iteration_path'] = test[1];
			}

			CurrentVSTSUser
			.getCurrentVSTSUserByAreaPathNodeName(res.areaPathNodeName)
			.then(function(resCurrentUser){
				VSTSTeams
				.getVSTSTeamByProjectID (projectID)
				.then(function(vstsTeam){
					//console.log(vstsTeam)
					var storeNotificationTeam = {
					  acc_title:res.vstsInstanceName,
					  project_name:res.vstsProjectID,
					  team_id: vstsTeam.vstsTeamID,
					  current_member: resCurrentUser[0].userName,
					  iteration_path: res['iteration_path'],
					  vsts_project_name:res['name']
					};
					performCRUDService
						.simpleCreate(SCRUMSOUP_API.push+"/getAllUIds",
						"POST",
						storeNotificationTeam,
						basicAuthorizationService.basicConfig(SCRUMSOUP_API.key),
						function(data, status) {
						//	console.log(data);
						},function(error){});
				});
			});
		});

	};

	self.getProjectIdAndName = function(vstsId){
		Projects.getProjectByVSTSID(vstsId)
		.then(function(project){
			if(project){
				Projects
				.getVSTSProjectCredentialsViaProjectID(project.id)
				.then(function(res){
					  $state.go("tab.reportsLeader", {projectID: res.id});
				});
			}
		})
	};

  self.getProjectIdForChat = function(vstsId){
    $state.go("tab.team");
    /*VSTSTeams
      .allVSTSTeams()
      .then(function(res){});

    Projects.getProjectByVSTSID(vstsId)
      .then(function(project){
        if(project){
          Projects
            .getVSTSProjectCredentialsViaProjectID(project.id)
            .then(function(res){
              $state.go("tab.reportsLeader", {projectID: res.id});
            });
        }
      })*/
  };

	function uploadNotificationRedId(storeNotificationTeam){
		performCRUDService
		.simpleCreate(SCRUMSOUP_API.push+"/subscribe",
			"POST",
			storeNotificationTeam,
			basicAuthorizationService.basicConfig(SCRUMSOUP_API.key),
			function(data, status) {
				
				q.resolve(data);

			},function(error){
			alert("error");
			q.resolve(error);});
	};

	self.uploadNotificationRec = function(projectID, device_os){
		var q = $q.defer();
		Projects
        .getVSTSProjectCredentialsViaProjectID(projectID)
        .then(function(res){
		   //get the current user
		   // console.log(res);

			CurrentVSTSUser
			.getCurrentVSTSUserByAreaPathNodeName(res.areaPathNodeName)
			.then(function(resCurrentUser){
			
			//alert(JSON.stringify(resCurrentUser));
			VSTSTeams
				  .getVSTSTeamByProjectID (projectID)
				  .then(function(vstsTeam){

            VSTSTeamMembers
                .getVSTSTeamMemberByVSTSTeamID(vstsTeam.vstsTeamID)
                .then(function(vstsTeamMembers) {
                  console.log(vstsTeamMembers);
                  var vstsTeamMems = [];
                   if(vstsTeamMembers && vstsTeamMembers.length >0){
                      for(i = 0; i<vstsTeamMembers.length; i++){
                        vstsTeamMems.push(vstsTeamMembers[i].displayName + " <" + vstsTeamMembers[i].uniqueName + ">"); 
                      } 
                      console.log(vstsTeamMems) 
                   }
                   Projects.getAutoQueryBacklogTime(1).then(function(appSettings){
                
                    //alert(appSettings.notification_uuid);
                    if(appSettings.notification_uuid){
                      //alert(appSettings.notification_uuid)
                      //alert(vstsTeam.vstsTeamID);
                      //alert(JSON.stringify(resCurrentUser));
                      var storeNotificationTeam = {uuid:appSettings.notification_uuid,
                        acc_title:res.vstsInstanceName,
                        project_name:res.vstsProjectID,
                        team_id: vstsTeam.vstsTeamID,
                        team_mem_name:resCurrentUser[0].userName,
                        device_os:device_os,
                        team_members:vstsTeamMems
                      };
                      //storeNotificationTeam.uuid = "123abc";
                      uploadNotificationRedId(storeNotificationTeam);
                      
                    }else{
                      if($rootScope.notificationRegId){
                        var storeNotificationTeam = {uuid:$rootScope.notificationRegId,
                          acc_title:res.vstsInstanceName,
                          project_name:res.vstsProjectID,
                          team_id: vstsTeam.vstsTeamID,
                          team_mem_name:resCurrentUser[0].userName,
                          device_os:device_os,
                          team_members:vstsTeamMems
                        };
                        //storeNotificationTeam.uuid = "123abc";
                        //console.log(storeNotificationTeam);
                        //alert(JSON.stringify(storeNotificationTeam));
                        uploadNotificationRedId(storeNotificationTeam); 
                      }
                      
                    }
                  }); 

                  
                  
                });
					  
						
					});

			});

		});
		return q.promise;
	};

	

	self.deleteNotificationRec =function(projectID){
		Projects
        .getVSTSProjectCredentialsViaProjectID(projectID)
        .then(function(res){
			VSTSTeams
			.getVSTSTeamByProjectID (projectID)
			.then(function(vstsTeam){
				//console.log(vstsTeam)
				Projects.getAutoQueryBacklogTime(1).then(function(appSettings){
						var storeNotificationTeam = {uuid:appSettings.notification_uuid,
						  acc_title:res.vstsInstanceName,
						  project_name:res.vstsProjectID,
						  team_id: vstsTeam.vstsTeamID
						};
						performCRUDService
							.simpleCreate(SCRUMSOUP_API.push+"/deleteUuid",
							"POST",
							storeNotificationTeam,
							basicAuthorizationService.basicConfig(SCRUMSOUP_API.key),
							function(data, status) {
								//console.log(data);
							},function(error){});
				});
			});

		});

	};
	
	self.isNotificationSend=function(projectID, todayDate){
		var parameters = [projectID];
		return DBA.query("SELECT * FROM push_notificaton_rec WHERE projectID = (?)", parameters)
        .then(function(result) {
          return DBA.getById(result);
        });
	};
	
	self.addNotificationRec=function(projectID, iterationPath, notiCount, sendDate){
		var parameters = [projectID,iterationPath, notiCount , moment.now()];
		return DBA.query("INSERT INTO push_notificaton_rec (projectID, iterationPath,notiCount, sendDate ) VALUES (?,?,?,?)", parameters);
	}
	
	self.updateNotificationRecCount = function(projectID, notiCount){
		var parameters = [notiCount, projectID];
		return DBA.query("UPDATE push_notificaton_rec SET notiCount = (?) WHERE projectID = (?)", parameters);
  
	}
	
	self.updateNotificationRecIterationPath = function(){
		
	}
	
	self.deleteNotificationRec=function(projectID){
		var parameters = [projectID];
		return DBA.query("DELETE FROM push_notificaton_rec WHERE projectID = (?)", parameters);
	}
	
    return self;
}])


.factory('LocalNotificationService',['WorkItems', 'Projects', '$q', 'VSTSTeams','CurrentVSTSUser', 'SCRUMSOUP_API', 'performCRUDService', 'basicAuthorizationService', '$rootScope', '$timeout', '$state', 'SyncVSOWorkItems', 'VSTSTeamRefreshService', 'VSTSTeamMembers', 'underscore','$ionicModal',function(WorkItems,Projects, $q, VSTSTeams, CurrentVSTSUser, SCRUMSOUP_API, performCRUDService, basicAuthorizationService, $rootScope, $timeout, $state, SyncVSOWorkItems, VSTSTeamRefreshService, VSTSTeamMembers, underscore, $ionicModal){
	var self = this;
	self.showLocalNotificationToUser = function(projectIds){
		var notifications = [];
		var cc = 0;
		Projects
          .getAllVSTSProjectCredentials()
          .then(function(allProjects){
				//console.log(allProjects)
				if (allProjects.length>0) {
					for(var i = 0; i < allProjects.length; i++){
						async.waterfall([//iterate through the vsts projects updating the work items
							function(cb){
							 // console.log(allProjects);
							  var projectName = allProjects[i].name;
							  var projectID = allProjects[i].id;
							  var areaPathNodeName = allProjects[i].areaPathNodeName;
							  var iterationPath = allProjects[i]['iteration_path'].split("+");
								if(iterationPath.length == 2){
									iterationPath = iterationPath[iterationPath.length -1];

								}else{
									iterationPath = iterationPath[0]
								}
								CurrentVSTSUser
									.getCurrentVSTSUserByAreaPathNodeName(areaPathNodeName)
									.then(function(resCurrentUser){
										var currentUser = "";
										if(resCurrentUser[0] !== undefined){
											 currentUser = resCurrentUser[0].userName;
											// console.log(currentUser, projectID)
											 cb(null,projectName,projectID,currentUser, iterationPath);

										}
									});

							},function(projectName,projectID,currentUser,iterationPath,cb){
							  //then sync them sequentially

								WorkItems.getWorkItemsOfTodayAndTomorrowBuckets(projectID,currentUser).then(function(tasks){
									//console.log(tasks)
									cc++;
									if(tasks.length == 0){
										WorkItems.getWorkItemsByProjectIDAndAssignedMemberForTodayAndTomorrow(projectID,currentUser ).then(function(results){
											console.log(JSON.stringify(results));
											if(results.length >=1){
												//console.log(results)
												var all_VsoIDS = results.map(function(elem){
													return elem.workItemVSOID;
												}).join(",");

												notifications.push({
													title: projectName,
													message: 'In Sprint'+  iterationPath+ ' you have the following work items assigned  to you: '+all_VsoIDS+ '. Get started and place active tasks in Today / Tomorrow buckets',
													items:results
												})
												if(cc === allProjects.length){
													
													$ionicModal
													.fromTemplateUrl('templates/popups/notification-intro.html', {
														  scope: $rootScope })
													.then(function (modal) {
														 // show the Subscription Intro Modal
														$rootScope.notificationsIntroModal = modal;
														$rootScope.notificationsIntroModal.show();
														$rootScope.notificationsItems = notifications;
													});

													cordova.plugins.notification.local.cancelAll(function() {
												  
													}, this);

												}

											}else{
												if(cc === allProjects.length){
													
													cordova.plugins.notification.local.cancelAll(function() {
														//alert("done");
													}, this);

												}
											}

										})

									}else{

										if(cc === allProjects.length){
											//alert(JSON.stringify(notifications));

										}

									}


								})


						}],function (error) {
							if (error) {
								console.log(error);
							}

						});
					}
				}

		});

		$rootScope.notificationsIntroModalHide = function(){
			$rootScope.notificationsIntroModal.hide();
            $rootScope.notificationsIntroModal.remove();


		};



	};




	return self;
}])


.factory('SyncReportingService',['SyncVSOWorkItems', 'Projects', '$q', 'VSTSTeams' , 'VSTSTeamRefreshService', 'VSTSTeamMembers', function(SyncVSOWorkItems,Projects, $q, VSTSTeams, VSTSTeamRefreshService, VSTSTeamMembers ){
	var self = this;

	// Get VSTS story Objects it call report Sync Feature object
	self.getVsTsObjects = function(res, prId, typeId) {
		var q = $q.defer()
		SyncVSOWorkItems
			.reportSync(res.vstsInstanceName, prId, res.name, res.vstsToken, typeId, res.area_path)
			.then(function(success) {
				if (success.length > 0 && success != 404) {
					var sortedObjects = SyncVSOWorkItems.sortState(success);
					q.resolve(sortedObjects);
				} else {
					q.resolve([]);
				}
			});
		return q.promise;
	};

	// Get VSTS Project Feature Objects it call report Sync Feature object
	self.getVsTsFeatureObjects=function(res, prId, typeId) {
		var q = $q.defer()
		SyncVSOWorkItems
			.reportFeatureSync(res.vstsInstanceName, prId, res.name, res.vstsToken, typeId, res.area_path)
			.then(function(success) {
				if (success.length > 0 && success != 404) {
					q.resolve(success);
				} else {
					q.resolve([]);
				}
			});
		return q.promise;
	};

	self.getProjectTeamMembers = function(vstsProject) {
		var q = $q.defer()
		var vstsProject = vstsProject;
		//check if a VSTS team exists and use to to generate the report
		VSTSTeams
			.getVSTSTeamByProjectID(vstsProject.id)
			.then(function(res) {
				if (res.length <= 0) {
					alert("No VSTS Team found, please add one to continue");
					return;
				} else {
					var vstsTeam = res;
					VSTSTeamRefreshService
						.refreshTeamMembers(vstsTeam)
						.then(function() {
							//first get the team members for this project
							VSTSTeamMembers
								.getVSTSTeamMemberByVSTSTeamID(res.vstsTeamID)
								.then(function(vstsTeamMembers) {
									//console.log(vstsTeamMembers);
									q.resolve(vstsTeamMembers);
								});
						});
				}
			});

		return q.promise;
    };

   return self;
}])


.factory("SyncProgressService",['$rootScope', '$ionicModal', function($rootScope,$ionicModal){

    var self = this;

    //hide the progress bar
    self.hideProgressBar = function(){
      if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
          $rootScope.syncingProgressModal.hide();
         $rootScope.syncingProgressModal = null;
          // and reset the progress bar vars
          $rootScope.currentWorkItemsSynced = 0;
          $rootScope.maxWorkItemsToBeSynced = 0;
          $rootScope.attachmentBeingSyncedName = "";
          $rootScope.attachmentBeingSyncedWorkItemID = "";
          $rootScope.maxAttachmentsToBeSynced = 0;
          $rootScope.currentAttachmentBeingSynced = 0;
          $rootScope.workItemIDBeingSynced = "";
      }

    };

    self.showProgressBar = function(){
          // show the syncing progress modal
        if($rootScope.syncingProgressModal===null
           || $rootScope.syncingProgressModal===undefined){

            //init the progress bar vars
            $rootScope.showFetchingMessage = true;

            $ionicModal
            .fromTemplateUrl('templates/popups/syncing-progress-popup.html', {
                scope: $rootScope
            }).then(function (modal) {
                $rootScope.syncingProgressModal = modal;
                $rootScope.syncingProgressModal.show(); // show the synicng progress
            });
        }
        else{

            $rootScope.syncingProgressModal.show(); // show the synicng progress
        }
    };

    self.setWorkItemSyncProgressMaxVar = function(maxWorkItemsToBeSynced){

        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){

          $rootScope.maxWorkItemsToBeSynced = maxWorkItemsToBeSynced;
        }
    };

    self.setWorkItemSyncProgressCurrentVar = function(currentWorkItemsSynced){

        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
          $rootScope.currentWorkItemsSynced = currentWorkItemsSynced;

        }
    };


    self.setWorkItemAttachmentSyncProgressMaxVar = function(maxAttachmentsToBeSynced){
        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
            $rootScope.maxAttachmentsToBeSynced = maxAttachmentsToBeSynced;

        }

    };

    self.setWorkItemAttachmentSyncProgressCurrentVar = function(currentAttachmentBeingSynced){
        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
            $rootScope.currentAttachmentBeingSynced = currentAttachmentBeingSynced;
        }

    };

    self.showFetchingMessage = function(show){
        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
             $rootScope.showFetchingMessage = show;
        }

    };

    self.setAttachmentDetails = function(attachmentBeingSyncedName,attachmentBeingSyncedWorkItemID){

      if($rootScope.syncingProgressModal!==null
      && $rootScope.syncingProgressModal !==undefined){
         $rootScope.attachmentBeingSyncedName = attachmentBeingSyncedWorkItemID;
         $rootScope.attachmentBeingSyncedWorkItemID = attachmentBeingSyncedWorkItemID;

              //console.log($rootScope.attachmentBeingSyncedName );
             // console.log($rootScope.attachmentBeingSyncedWorkItemID);
      }

    };

    self.setWorkItemDetails = function(workItemIDBeingSynced){
        if($rootScope.syncingProgressModal!==null
        && $rootScope.syncingProgressModal !==undefined){
          $rootScope.workItemIDBeingSynced = workItemIDBeingSynced;
        }
    };



    return self;


}])
.factory("VSTSTeamRefreshService",['WorkItems', '$q', 'CHECK_ENV', 'SyncVSTSTeamMembers', 'VSTSTeamMembers', 'Projects', 'performCRUDService', 'rootURLService', 'basicAuthorizationService', 'VSTSTeams', function(WorkItems,$q,CHECK_ENV,SyncVSTSTeamMembers,VSTSTeamMembers,Projects,performCRUDService,rootURLService,basicAuthorizationService, VSTSTeams){
    var self = this;

    //array that contains all the today and tomorrow info for all the teams and all the members

    var vstsTeamMemberTodayTomorrowInfo = null;

    self.initTeamMemberTodayTomorrowInfoArray = function(){
           vstsTeamMemberTodayTomorrowInfo = [];
    };

    self.getTeamMemberTodayTomorrowInfoArray = function(){

          return vstsTeamMemberTodayTomorrowInfo;
    };


    self.getTeamMemberTodayTomorrowInfo = function(projectID,bucketID,assignedTo,uniqueName){
        var q = $q.defer();
        WorkItems
        .getWorkItemsByBucketIDAndProjectIDAndAssignedMember(projectID,bucketID,assignedTo)
        .then(function(res){
            var result = {};
            if(bucketID===1&&res.length>0){
              result = {today:uniqueName,todayWorkItems:res,projectID:projectID};

            }
            if(bucketID===2&&res.length>0){
              result = {tomorrow:uniqueName,tomorrowWorkItems:res,projectID:projectID};
            }

             q.resolve(result);
        });
        return q.promise;

    };

    self.refreshTeamMemberslocal = function (vstsTeam) {
        var q = $q.defer();
        //remove any team members if they exist

        //re get the team members again
        //1) first of all get the project details
        Projects
            .getVSTSProjectCredentialsViaProjectID(vstsTeam.projectID)
            .then(function (res) {
                VSTSTeamMembers.getAllTeamMembersByProjectID(vstsTeam.projectID).then(function (_members) {
                  if(_members.length === 0){
                    q.resolve();
                  }
                    var vstsTeamMembers = _members;
                    var teamMembersSyncedCount = 0;
                    vstsTeamMembers
                        .forEach(function(vstsTeamMember,index){

                            var assignedTo = vstsTeamMember.displayName + " <" + vstsTeamMember.uniqueName + ">";
                            //first of all get the today tomorrow for each team member
                            //get info for today bucket first
                            self
                                .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,1,assignedTo, vstsTeamMember.uniqueName)
                                .then(function(resToday){
                                    if(resToday.today!==undefined && vstsTeamMemberTodayTomorrowInfo!==null ){
                                        vstsTeamMemberTodayTomorrowInfo.push(resToday);
                                    }

                                    //then tomorrow bucket
                                    self
                                        .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,2,assignedTo,vstsTeamMember.uniqueName)
                                        .then(function(resTomorrow){
                                            if(resTomorrow.tomorrow!==undefined && vstsTeamMemberTodayTomorrowInfo!==null){

                                                vstsTeamMemberTodayTomorrowInfo.push(resTomorrow);
                                            }
                                            //then continue with member adding
                                            //set the VSTS team id
                                            vstsTeamMember.vstsTeamID = vstsTeam.vstsTeamID;
                                            vstsTeamMember.projectID = vstsTeam.projectID;
                                            q.resolve();
                                        });
                                });
                        });
                });
            });
        return q.promise;
    };

    self.refreshTeamMembers = function(vstsTeam){
        var q = $q.defer();

        //remove any team members if they exist
        VSTSTeamMembers
        .removeVSTSMembersByVSTSTeamID(vstsTeam.vstsTeamID)
        .then(function(){
              //re get the team members again
              //1) first of all get the project details
              Projects
              .getVSTSProjectCredentialsViaProjectID(vstsTeam.projectID)
              .then(function(res){

                    //get all the members of this project and save them to disk
                    performCRUDService
                    .simpleGet(rootURLService.baseURL(res.vstsInstanceName) + "_apis/projects/" + vstsTeam.vstsProjectID + "/teams/" + vstsTeam.vstsTeamID + "/members/?" + rootURLService.apiVersion2_2,
                    basicAuthorizationService.basicConfig(res.vstsToken),
                    function(data, status) {

                       var vstsTeamMembers = data.value;

                            var teamMembersSyncedCount = 0;
                           //sync the team members
                           vstsTeamMembers
                           .forEach(function(vstsTeamMember,index){

                                var assignedTo = vstsTeamMember.displayName + " <" + vstsTeamMember.uniqueName + ">";
                              //first of all get the today tomorrow for each team member
                               //get info for today bucket first
                                self
                                .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,1,assignedTo, vstsTeamMember.uniqueName)
                                .then(function(resToday){
                                  if(resToday.today!==undefined && vstsTeamMemberTodayTomorrowInfo!==null ){
                                      vstsTeamMemberTodayTomorrowInfo.push(resToday);
                                  }

                                  //then tomorrow bucket
                                    self
                                    .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,2,assignedTo,vstsTeamMember.uniqueName)
                                    .then(function(resTomorrow){
                                      if(resTomorrow.tomorrow!==undefined && vstsTeamMemberTodayTomorrowInfo!==null){

                                        vstsTeamMemberTodayTomorrowInfo.push(resTomorrow);
                                      }
                                      //then continue with member adding
                                        if(CHECK_ENV.runningInDevice){
                                           //save each team member details to the db
                                            SyncVSTSTeamMembers
                                            .getVSTSTeamMemberAvatarAndSaveToDisk(vstsTeamMember,vstsTeam.vstsTeamID,res.vstsToken,vstsTeam.projectID)
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
                                        }
                                        else{
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
                                });


                           });


                    },
                    function(error, status) {
                        q.reject({error:error,status:status});

                    });



              });
        });

      return q.promise;

    };

  self.refreshTeamMembersUpd = function(vstsTeam){
    var q = $q.defer();
    VSTSTeamMembers.getVSTSTeamMemberByVSTSTeamID(vstsTeam.vstsTeamID)
      .then(function(vstsTeamMembers) {
        var teamMembersSyncedCount = 0;
        //sync the team members
        vstsTeamMembers
          .forEach(function(vstsTeamMember,index){
            var assignedTo = vstsTeamMember.displayName + " <" + vstsTeamMember.uniqueName + ">";
            //first of all get the today tomorrow for each team member
            //get info for today bucket first
            self
              .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,1,assignedTo, vstsTeamMember.uniqueName)
              .then(function(resToday){
                if(resToday.today!==undefined && vstsTeamMemberTodayTomorrowInfo!==null ){
                  vstsTeamMemberTodayTomorrowInfo.push(resToday);
                }
                //then tomorrow bucket
                self
                  .getTeamMemberTodayTomorrowInfo(vstsTeam.projectID,2,assignedTo,vstsTeamMember.uniqueName)
                  .then(function(resTomorrow){
                    if(resTomorrow.tomorrow!==undefined && vstsTeamMemberTodayTomorrowInfo!==null){
                      vstsTeamMemberTodayTomorrowInfo.push(resTomorrow);
                    }
                    teamMembersSyncedCount++;
                    // complete call back
                    if(teamMembersSyncedCount=== vstsTeamMembers.length){
                      //return the result
                      q.resolve();
                    }
                  });
              });
          });
      });
    return q.promise;
  };


    return self;

}])
/* factory for firebase operations */
.factory('fireService', ['DBA', '$firebaseObject', '$firebaseArray', '$firebaseAuth', '$firebaseStorage', function(DBA, $firebaseObject, $firebaseArray, $firebaseAuth, $firebaseStorage){
    var self = this;

    self.checkMainRoom = function (projectID, cb) {
        var ref = firebase.database().ref();
        var list = $firebaseArray(ref);
        list.$loaded().then(function (x) {
            cb(x.$indexFor(projectID));
        }).catch(function (error) {
            console.log("Error:", error);
        });
    };

    self.createMainRoom = function (projectID, memberObj, cb) {
        var mObj = {
            uniqueName: memberObj.uniqueName,
            imgUrl: memberObj.imageUrl,
            name: memberObj.displayName,
            token: -1
        };
        // firebase.database().ref().child(projectID).set(obj, addMem());
        var ref = firebase.database().ref().child(projectID + '/members/');
        var list = $firebaseArray(ref);
        list.$add(mObj).then(function(ref) {
            console.log("added record with id");
            cb(ref);
        });
    };

    self.sendTeamMsg = function (projectID, chatObj, cb) {
        var ref = firebase.database().ref().child(projectID + '/groupChat/');
        var list = $firebaseArray(ref);
        list.$add(chatObj).then(function(ref) {
            cb(true, '');
        }).catch(function (err) {
            cb(false, JSON.stringify(err));
        });
    };

    self.sendPersonalMsg = function (projectID, chatObj, cb) {
        var ref = firebase.database().ref().child(projectID + '/personalChat/');
        var list = $firebaseArray(ref);
        list.$add(chatObj).then(function(ref) {
            cb(true, '');
        }).catch(function (err) {
            cb(false, JSON.stringify(err));
        });
    };

    self.addMemberInMainRoom = function (projectID, memberObj, cb) {
        var ref = firebase.database().ref().child(projectID + '/members/');
        var list = $firebaseArray(ref);
        list.$loaded().then(function (x) {
            var found = false;
            for(var i = 0;i < x.length;i++){
                if(x[i].uniqueName === memberObj.uniqueName){
                    found = true;
                }
            }
            if(found) {
                // do nothig
                cb('already added');
            } else {
                var mObj = {
                    uniqueName: memberObj.uniqueName,
                    imgUrl: memberObj.imageUrl,
                    name: memberObj.displayName,
                    token: -1
                };
                list.$add(mObj).then(function(ref) {
                    cb('added new member');
                });
            }
        }).catch(function (error) {
            console.log("Error:", error);
        });
    };

    self.editMessage = function (refID, msg, cb) {
        firebase.database().ref().child(refID + '/msg').set(msg, markEdit(refID));
        function markEdit() {
            firebase.database().ref().child(refID + '/edited').set(1, cb(refID));
        }

    };

    self.deleteMessage = function (refID, cb) {
        firebase.database().ref().child(refID).set({}, cb(refID));
    };

    self.sendImg = function (b64, cb) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (var i=0; i < 20; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
        // cerate ref
        var storageRef = firebase.storage().ref("chatImages/" + text);
        var storage = $firebaseStorage(storageRef);
        // put base64 to upload
        var uploadTask = storage.$putString(b64, "base64", { contentType: "image/gif" });
      // get the progress
      uploadTask.$progress(function(snapshot) {
        var percentUploaded = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(percentUploaded);
      });
      uploadTask.$complete(function(snapshot) {
        cb(snapshot.downloadURL);
      });
    };

    self.getGroupLastMsgId = function (pid, cb) {
        var ref = firebase.database().ref().child(pid + '/groupChat/').limitToLast(1);
        var obj = $firebaseArray(ref);
        obj.$loaded(
            function(data) {
                cb(data);
            }, function(error) {
                console.error("Error:", error);
                cb('');
            }
        );
    };

    self.getMembersByPID = function (pid, cb) {
        var ref = firebase.database().ref().child(pid + '/members');
        var obj = $firebaseArray(ref);
        obj.$loaded(
            function(data) {
                cb(data);
            }, function(error) {
                console.error("Error:", error);
                cb('');
            }
        );
    };

    self.getPersonalLastMsgId = function (pid, room, cb) {
        var ref = firebase.database().ref().child(pid + '/personalChat/').limitToLast(1).orderByChild('personalRoom').equalTo(room);
        var obj = $firebaseArray(ref);
        obj.$loaded(
            function(data) {
                cb(data);
            }, function(error) {
                console.error("Error:", error);
                cb('');
            }
        );
    };

    self.addDateTime = function (pid, mid, data, cb) {
        firebase.database().ref().child(pid + '/members/' + mid + '/datetime').set(JSON.stringify(data), addMem(mid));
        function addMem(mid) {
         cb(mid);
        }
    };

    self.addGrpChatLastId = function(pid, mid) {
        var parameters = [mid ,pid, 'group'];
        return DBA.query("UPDATE chatcount SET mid = (?) WHERE pid = (?) AND type = (?)", parameters);
    };


    self.getPersonalLastMID = function(pid, roomid) {
        var parameters = [pid, roomid];
        return DBA.query("SELECT * FROM chatcount WHERE pid = (?) AND roomid = (?)", parameters)
            .then(function(result){
                return DBA.getAll(result);
            });
    };

    self.insertPersLastMID = function(pid, roomid, mid) {
        var parameters = [pid, 'personal', roomid, mid];
        return DBA.query("INSERT INTO chatcount (pid,type,roomid, mid) VALUES (?,?,?,?)", parameters)
    };

    self.getGrpLastMID = function(pid) {
        var parameters = [pid, 'group'];
        return DBA.query("SELECT * FROM chatcount WHERE pid = (?) AND type = (?)", parameters)
            .then(function(result){
            return DBA.getAll(result);
        });
    };

    self.insertGrpLastMID = function(pid, mid) {
        var parameters = [pid, 'group', '', mid];
        return DBA.query("INSERT INTO chatcount (pid,type,roomid, mid) VALUES (?,?,?,?)", parameters)
    };

    self.addPersonalChatLastId = function(pid, mid, roomId) {
        var parameters = [mid ,pid, roomId];
        return DBA.query("UPDATE chatcount SET mid = (?) WHERE pid = (?) AND roomid = (?)", parameters).then(function(result) {
            return DBA.getAll(result);
        });
    };

  self.removeChatsByPID = function(pid) {
    var parameters = [pid];
    return DBA.query("DELETE FROM chatcount WHERE pid = (?)", parameters);
  };

    return self;
}])


.factory('YesterdaySummaryService',['SyncVSOWorkItems', 'Projects', '$q', 'VSTSTeams' , 'VSTSTeamRefreshService', 'VSTSTeamMembers', '$cordovaToast', 'CurrentVSTSUser', 'moment', '$rootScope', 'fireService', 
  function(SyncVSOWorkItems,Projects, $q, VSTSTeams, VSTSTeamRefreshService, VSTSTeamMembers, $cordovaToast, CurrentVSTSUser, moment, $rootScope, fireService){
  var self = this;

  // Get VSTS story Objects it call report Sync Feature object

  self.endOfDaySummaryReport = function(delReq, popupReq) {
    if (!$rootScope.internetDisconnected) {
          Projects
            .getAllVSTSProjectCredentials()
            .then(function(allProjects) {
              if (allProjects.length > 0) {
                var j = 0;
                var totalCount = 0;
                for (var i = 0; i < allProjects.length; i++) {
                      async.waterfall([ //iterate through the vsts projects updating the work items
                        function(cb) {
                          var projectName = allProjects[i].name;
                          var projectID = allProjects[i].id;
                          var instanceName = allProjects[i].vstsInstanceName;
                          var credential = allProjects[i].vstsToken;
                          var areaPathNodeName = allProjects[i].areaPathNodeName;
                          var vstsProjectID =  allProjects[i].vstsProjectID;
                          var summaryDate = allProjects[i].summaryDate;
                          console.log(summaryDate)
                          if(!summaryDate){
                            Projects.updateProjectSummaryDate(projectID);
                            console.log("need to update");
                          }else{
                            var remHours = returnSummaryHours(summaryDate);
                            console.log(remHours);
                            if(remHours > 24){  //change
                              var iterationPath = allProjects[i]['iteration_path'].split("+");
                            var config = {};
                            if (iterationPath.length == 1) {
                              config = {
                                root: false,
                                selectedIteration: iterationPath[iterationPath.length - 1],
                                selectedArea: allProjects[i].area_path
                              };
                            } else if (iterationPath.length > 1) {
                               config = {
                                root: true,
                                selectedIteration: iterationPath[iterationPath.length - 1],
                                selectedArea: allProjects[i].area_path
                              };
                            }
                          
                                CurrentVSTSUser
                                .getCurrentVSTSUserByAreaPathNodeName(areaPathNodeName)
                                .then(function(resCurrentUser) {
                                  var currentUser = "";
                                  if (resCurrentUser[0] !== undefined) {
                                    currentUser = resCurrentUser[0].userName;
                                    var memEmail = currentUser.substring(currentUser.indexOf("<") + 1, currentUser.indexOf(">"));
                                    var memName = currentUser.substring(0, currentUser.indexOf("<") - 1);
                                      console.log(memName)
                                      VSTSTeams
                                .getVSTSTeamByProjectID(projectID)
                                    .then(function(res) {
                                        if (res.length <= 0) {
                                            //alert("No VSTS Team found, please add one to continue");
                                            //return;
                                        } else {
                                            var vstsTeam = res;
                                            var teamName = res.name;
                                            VSTSTeamRefreshService
                                                .refreshTeamMembers(vstsTeam)
                                                .then(function() {
                                                    //first get the team members for this project
                                                    VSTSTeamMembers
                                                        .getVSTSTeamMemberByVSTSTeamID(res.vstsTeamID)
                                                        .then(function(vstsTeamMembers) {
                                                            //
                                                            console.log(vstsTeamMembers)
                                                              cb(null, projectName, projectID, instanceName, credential, config, currentUser,summaryDate, vstsProjectID, vstsTeamMembers, teamName);
                                                          })
                                                  })
                                           }
                                        })              
                                        
                                        
                                    
                                  } 
                                }); 
                    
                            }
                             
                          }
                        },
                        function(projectName, projectID, instanceName, credential, config, currentUser, summaryDate , vstsProjectID, vstsTeamMembers, teamName ,cb) {
                          //then sync them sequentially
                          var closedItems = [];
                           SyncVSOWorkItems
                            .reportSync(instanceName, projectID, projectName, credential, config.selectedIteration, config.selectedArea)
                            .then(function(success) {
                              j++;
                              totalCount = 0;
                              if (success.length > 0 && success != 404) {
                                console.log(success);
                                  vstsTeamMembers.forEach(function(teamMember, index, object) {
                                    teamMember.closeTasks = SyncVSOWorkItems.sortClosedStateTasks(success, teamMember.uniqueName);
                                    if(teamMember.closeTasks.length > 0){
                                      closedItems.push(teamMember);
                                    }
                                    
                                  }); 
                              var totalCounts = closedItems.reduce(function(prev, cur) {
                                return prev + cur.closeTasks.length;
                              }, 0);

                              closedItems.totalCounts = totalCounts; 
                              console.log(closedItems);
                              console.log(totalCounts);
                                 
                              //var closeTasks = SyncVSOWorkItems.sortClosedStateTasks(success, currentUser);
                               if(summaryDate){
                                  
                                   getChatObjectAndSendToUser(vstsProjectID, projectID, closedItems,currentUser,projectName, teamName);
                                     
                                }
                              }    
                            }, function(error) {
                              j++;
                               if(summaryDate){
                                    // getChatObjectAndSendToUser(vstsProjectID, projectID, closeTasks,currentUser,projectName);  
                                    }
                            });
                        }
                      ], function(error) {
                        if (error) {
                          console.log(error);
                        }
                      });
                    
                }
              }

            });

        } else {
          $cordovaToast.show('Internet disconnected', 'long', 'bottom')
            .then(function(success) {
              // success
            }, function(error) {
              // error
            });
        }
      
  };




      function returnSummaryHours(givenDate){
        var closedDate = moment(givenDate).toISOString();            
        var current = moment().toISOString(); 
        return moment(current).diff(closedDate, 'hours'); 
      }

      function getChatObjectAndSendToUser(vstsProjectID, projectID, closeItems, currentUser, projectName, teamName){
         var message = "";
         if(closeItems.totalCounts == 0){
           message = "There were no items closed yesterday.";
         }


        var memEmail = currentUser.substring(currentUser.indexOf("<") + 1, currentUser.indexOf(">"));
        var memName = currentUser.substring(0, currentUser.indexOf("<") - 1);
        var chatObj = {
            msgType: 'txt',
            msg: message,
            from: memEmail,
            fromName: memName,
            imgUrl: '',
            time: moment.now(),
            to :memEmail,
            personalRoom : memEmail+ '-' + memEmail
        };
        VSTSTeamMembers.getTeamMembersByUniqeDisplayAndProjectId(projectID, memEmail, memName).then(function(res){
           console.log(res); // send Chat 
           chatObj.imageUrl = res.imageUrl;
           message = "Yesterday "+teamName+ " closed "+closeItems.totalCounts+ " item(s). \n";
           if(closeItems && closeItems.length > 0){
               for(var tm = 0; tm<closeItems.length; tm++){
                    message += closeItems[tm].displayName +" closed the following: ";
                 for(var ts=0; ts<closeItems[tm].closeTasks.length; ts++){
                    message += closeItems[tm].closeTasks[ts]["id"]+"-"+closeItems[tm].closeTasks[ts]['fields']['System.Title'] +". ";
                 }
                 message += "\n ";
               }
          
            console.log(message); 
            chatObj.msg = message;  
         //   chatObj.msg = "You closed vsts Tasks "+tasks+ " of Project "+projectName+" of last 24 hours";
           }
          //console.log(chatObj);
            fireService.sendPersonalMsg(vstsProjectID, chatObj, function (succ, info) {
               Projects.updateProjectSummaryDate(projectID);
              console.log(succ, info);
            });
        });
      }   

  

   return self;
}]);
