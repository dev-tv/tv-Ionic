angular.module('go-plan-do-db-upgrade.services', ['ngCordova'])
	.factory('GoPlanDoMigrationDatabaseService', ['$rootScope', '$ionicPlatform', '$ionicLoading', '$cordovaSQLite', 'LoggingService', '$q',
		function($rootScope, $ionicPlatform, $ionicLoading, $cordovaSQLite, LoggingService, $q) {

			var executeInChain = function(queries) {
				var promise = queries.reduce(function(previous, query) {
					LoggingService.log("chaining " + query);
					return previous.then(function() {
						LoggingService.log("executing " + query);
						return $cordovaSQLite.execute(db, query, [])
							.then(function(result) {
								LoggingService.log(" done " + JSON.stringify(query));
								return $q.when(query);
							});
					});
				}, $q.when());
				return promise;
			};

			var selectCurrentVersion = function() {
				var query = "SELECT MAX(versionNumber) AS maxVersion FROM version_history";
				var promise = $cordovaSQLite.execute(db, query)
					.then(function(res) {
						var maxVersion = res.rows.item(0).maxVersion;
						$rootScope.currentDBVersion = maxVersion;
						LoggingService.log("Current version is " + maxVersion);
						return maxVersion;
					});
				return promise;
			};

			var storeVersionInHistoryTable = function(versionNumber) {
				var query = "INSERT INTO version_history (versionNumber, migratedAt) VALUES (?, ?)";
				var promise = $cordovaSQLite.execute(db, query, [versionNumber, new Date()])
					.then(function(res) {
						LoggingService.log("Stored version in history table: " + versionNumber);
						return versionNumber;
					});
				return promise;
			};

			var createVersionHistoryTable = function() {
				var query = "CREATE TABLE IF NOT EXISTS version_history(versionNumber INTEGER PRIMARY KEY NOT NULL, migratedAt DATE)";
				var promise = $cordovaSQLite.execute(db, query, [])
					.then(function() {
						var versionNumber = 0;
						return versionNumber;
					});
				return promise;
			};

			this.migrate = function() {

				$ionicLoading.show({
					template: 'Getting things ready...',
					delay: 500
				});

				var q = $q.defer();

				$ionicPlatform.ready(function() {

					var initialSteps = [
						createVersionHistoryTable,
						selectCurrentVersion
					];

					var version1 = {
						versionNumber: 1,
						queries: [
							"CREATE TABLE IF NOT EXISTS buckets(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS appSettings(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  backlogTime INTEGER NOT NULL, notification_recv INTEGER NOT NULL, notification_send INTEGER NOT NULL, notification_uuid TEXT)",
							"CREATE TABLE IF NOT EXISTS emailProviders(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  name TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS triageEmailSettings(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  projectID INTEGER NOT NULL, emailProviderID INTEGER NOT NULL, triageInboxAddress TEXT NOT NULL, deviceUUID TEXT, " +
							"  UNIQUE(projectID,emailProviderID,triageInboxAddress) ON CONFLICT REPLACE)",
							"CREATE TABLE IF NOT EXISTS emailProviders(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  name TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS collapsedBuckets(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  projectID INTEGER,bucketID INTEGER)",
							"CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" name TEXT NOT NULL, areaPathNodeName TEXT NOT NULL, vstsProjectID TEXT NOT NULL, vstsInstanceName TEXT NOT NULL, " +
							" iteration_path TEXT NOT NULL, iteration_id TEXT, " +
							" start_date TEXT, finish_date TEXT, area_path TEXT, closeTask INTEGER DEFAULT 0)",
							"CREATE TABLE IF NOT EXISTS workItems(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" bucketID INTEGER NOT NULL, projectID INTEGER NOT NULL,  alarmNotificationDate TEXT, " +
							" workItemPriority INTEGER,description TEXT, iterationPath TEXT, originalEstimate INTEGER, " +
							" remainingWork INTEGER,completedWork INTEGER, workItemTypeID INTEGER NOT NULL, workItemDeleted NUMERIC DEFAULT 0, " +
							" name TEXT NOT NULL, workItemVSOID INTEGER DEFAULT 0 , workItemVSOState TEXT, workItemClosedBy TEXT, " +
							" workItemClosedDate TEXT, sort INTEGER,vstsTagID TEXT, workItemAssignedTo TEXT DEFAULT '',bucketIDTag INTEGER NOT NULL DEFAULT 0," +
							" UNIQUE(name,workItemVSOID,projectID) ON CONFLICT REPLACE)",
							"CREATE TABLE IF NOT EXISTS workItemTypes(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" name TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS vstsCredentials(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" vstsToken TEXT NOT NULL, vstsInstanceName TEXT NOT NULL, areaPathNodeName TEXT NOT NULL,projectID INTEGER NOT NULL)",
							"CREATE TABLE IF NOT EXISTS vstsUser(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" userName TEXT NOT NULL, areaPathNodeName TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS vstsTeamMembers(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"  displayName TEXT, uniqueName TEXT, vstsTeamID INTEGER NOT NULL DEFAULT 0, projectID INTEGER NOT NULL," +
							" imageUrl TEXT, UNIQUE(vstsTeamID,uniqueName,projectID) ON CONFLICT REPLACE)",
							"CREATE TABLE IF NOT EXISTS vstsTeams(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" name TEXT NOT NULL, url TEXT NOT NULL, vstsTeamID TEXT, description TEXT," +
							" identityUrl TEXT,vstsProjectID TEXT NOT NULL, projectID INTEGER NOT NULL)",
							"CREATE TABLE IF NOT EXISTS images(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" workItemID INTEGER DEFAULT 0, memberID INTEGER DEFAULT 0, " +
							" imagePath TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS scrumHrs(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"projectID INTEGER NOT NULL, iteration_path TEXT NOT NULL, remainingHours TEXT NOT NULL , rDate TEXT NOT NULL)",
							"CREATE TABLE IF NOT EXISTS appTours(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" tourComplete INTEGER NOT NULL DEFAULT 0)",
							"CREATE TABLE IF NOT EXISTS subscriptions(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"userSubscribed INTEGER NOT NULL DEFAULT 0, dateUserFirstOpenedApp TEXT NOT NULL , " +
							"dateUserSubscribedToApp TEXT)",
							"CREATE TABLE IF NOT EXISTS calendarEvents(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							" calendarEventID TEXT NOT NULL , workItemVSOID INTEGER, vstsProjectID INTEGER, vstsAreaPathNodeName TEXT, " +
							" eventDate TEXT)",
							//init the necessary tables
							// the buckets table
							"INSERT INTO buckets (title) VALUES ('Today')",
							"INSERT INTO buckets (title) VALUES ('Tomorrow')",
							"INSERT INTO buckets (title) VALUES ('Backlog')",
							"INSERT INTO buckets (title) VALUES ('Completed')",
							"INSERT INTO buckets (title) VALUES ('Triage')",
							// workItemTypes table
							"INSERT INTO workItemTypes (name) VALUES ('Bug')",
							"INSERT INTO workItemTypes (name) VALUES ('Epic')",
							"INSERT INTO workItemTypes (name) VALUES ('Feature')",
							"INSERT INTO workItemTypes (name) VALUES ('Issue')",
							"INSERT INTO workItemTypes (name) VALUES ('Task')",
							"INSERT INTO workItemTypes (name) VALUES ('Test Case')",
							"INSERT INTO workItemTypes (name) VALUES ('User Story')",
							// emailProviders table
							"INSERT INTO emailProviders (name) VALUES ('Gmail')",
							//projects table
							"INSERT INTO projects (name,areaPathNodeName,vstsProjectID, " +
							" vstsInstanceName,iteration_path,iteration_id,start_date,finish_date, area_path) " +
							" VALUES ('Personal','Personal','001','001','personal','personal','personal','personal','personal')",
						]
					};

					var version2 = {
						versionNumber: 2,
						queries: [
							"ALTER TABLE subscriptions ADD userFields TEXT"
						]
					};

					var version3 = {
						versionNumber: 3,
						queries: [
							"ALTER TABLE workItems ADD parentWorkItemID INTEGER NOT NULL DEFAULT 0"
						]
					};

					var version4 = {
						versionNumber: 4,
						queries: [
							"CREATE TABLE IF NOT EXISTS videoPopups(id INTEGER PRIMARY KEY AUTOINCREMENT," +
							" showVideoAlertOnStart INTEGER NOT NULL DEFAULT 0, dateAdded TEXT, dateModified TEXT)",

							"CREATE TABLE IF NOT EXISTS workItemsSortingTempTable(workItemVSOID INTEGER DEFAULT 0, sort INTEGER," +
							" projectID INTEGER NOT NULL DEFAULT 0)",

							"CREATE TABLE IF NOT EXISTS workItemsAlignedTempTable(id INTEGER NOT NULL DEFAULT 0, " +
							" bucketID INTEGER NOT NULL DEFAULT 0, projectID INTEGER NOT NULL DEFAULT 0,  alarmNotificationDate TEXT, " +
							" workItemPriority INTEGER,description TEXT, iterationPath TEXT, originalEstimate INTEGER, " +
							" remainingWork INTEGER,completedWork INTEGER, workItemTypeID INTEGER NOT NULL DEFAULT 0, " +
							" workItemDeleted NUMERIC DEFAULT 0, " +
							" name TEXT NOT NULL, workItemVSOID INTEGER DEFAULT 0 , workItemVSOState TEXT, workItemClosedBy TEXT, " +
							" workItemClosedDate TEXT, sort INTEGER,vstsTagID TEXT, workItemAssignedTo TEXT DEFAULT ''," +
							" bucketIDTag INTEGER NOT NULL DEFAULT 0, parentWorkItemID INTEGER NOT NULL DEFAULT 0)",
							//init the default popup values
							"INSERT INTO videoPopups (showVideoAlertOnStart,dateAdded,dateModified) VALUES (1,'" + String(moment().format()) + "','" + String(moment().format()) + "')"
						]
					};

					var version5 = {
						versionNumber: 5,
						queries: [
							"CREATE TABLE IF NOT EXISTS repeatSchedules(id INTEGER PRIMARY KEY AUTOINCREMENT," +
							" vstsWorkItemID INTEGER NOT NULL DEFAULT 0, " +
							" projectAreaPathNodeName TEXT NOT NULL ," +
							" repeatInfo TEXT, repeatMonthDayInfo TEXT, repeatCycleDone INTEGER NOT NULL DEFAULT 0, repeatedDate TEXT)"

						]

					};

					var version6 = {
						versionNumber: 6,
						queries: [
							"ALTER TABLE images ADD projectID INTEGER NOT NULL DEFAULT 0",
							"ALTER TABLE images ADD workItemVSOID INTEGER NOT NULL DEFAULT 0",
							"ALTER TABLE images ADD isSync INTEGER NOT NULL DEFAULT 0",
							"ALTER TABLE images ADD isDeleted INTEGER NOT NULL DEFAULT 0"
						]
					};

					var version7 = {
						versionNumber: 7,
						queries: [
							"CREATE TABLE IF NOT EXISTS repeatScheduleDate(id INTEGER PRIMARY KEY AUTOINCREMENT," +
							" repeatedDate TEXT NOT NULL)"

						]

					};

					var version8 = {
						versionNumber: 8,
						queries: [
							"ALTER TABLE workItems ADD workItemHasRepeatSchedule INTEGER NOT NULL DEFAULT 0"

						]

					};
					
					var version12 = {
						versionNumber: 12,
						queries: [
							"ALTER TABLE repeatSchedules ADD repeatedmonths TEXT "

						]

					};

					var version11 = {
						versionNumber: 11,
						queries: [
							"ALTER TABLE repeatSchedules ADD vchseletedates TEXT "
						]
					};

					var version13 = {
						versionNumber: 13,
						queries: [
							"ALTER TABLE repeatSchedules ADD stoprepeatingdate TEXT "

						]

					};

					var version14 = {
						versionNumber: 14,
						queries: [
							"ALTER TABLE repeatSchedules ADD lastrepeatdate TEXT "
						]
					};

      var version15 = {
        versionNumber: 15,
        queries: [
          "ALTER TABLE repeatSchedules ADD clones TEXT "
        ]
      };


					var version16 = {
						versionNumber: 16,
						queries: [
							"CREATE TABLE IF NOT EXISTS push_notificaton_rec(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
							"projectID INTEGER NOT NULL default 0, iterationPath TEXT NOT NULL default 0,notiCount INTEGER NOT NULL default 0, sendDate TEXT NOT NULL, UNIQUE(projectID,iterationPath) ON CONFLICT REPLACE)"
						]

					};

          var version17 = {
            versionNumber: 17,
            queries: [
              "ALTER TABLE images ADD name TEXT "
            ]
          };

                    var version18 = {
                        versionNumber: 18,
                        queries: [
                            "CREATE TABLE IF NOT EXISTS chatcount(id INTEGER PRIMARY KEY AUTOINCREMENT,pid TEXT NOT NULL,type TEXT NOT NULL,roomid TEXT NOT NULL,mid TEXT NOT NULL)"
                        ]
                    };

                    var version19 = {
                        versionNumber: 19,
                        queries: [
                            "ALTER TABLE vstsUser ADD projectID INTEGER "
                        ]
					};

					 var version20 = {
                        versionNumber: 20,
                        queries: [
                            "ALTER TABLE projects ADD summaryDate TEXT NULL"
                        ]
					};

                    var version21 = {
                        versionNumber: 21,
                        queries: [
                            "ALTER TABLE workItems ADD acceptanceCriteria TEXT"
                        ]
                    };
                    var version22 = {
                        versionNumber: 22,
                        queries: [
                            "ALTER TABLE workItemsAlignedTempTable ADD acceptanceCriteria TEXT"
                        ]
                    };

                    var version23 = {
                        versionNumber: 23,
                        queries: [
                            "ALTER TABLE workItems ADD tags TEXT",
                            "ALTER TABLE workItemsAlignedTempTable ADD tags TEXT"
                        ]
                    };
                    var version24 = {
                        versionNumber: 24,
                        queries: [
                            "ALTER TABLE appSettings ADD remainingHrs TEXT"
                        ]
                    };

                    var version25 = {
                        versionNumber: 25,
                        queries: [
                            "ALTER TABLE workItems ADD workItemCreatedDate TEXT",
                            "ALTER TABLE workItemsAlignedTempTable ADD workItemCreatedDate TEXT"
                        ]
                    };


					var versions = [
						version1,
						version2,
						version3,
						version4,
						version5,
						version6,
						version7,
						version8,
						version11,
						version12,
						version13,
						version14,
            			version15,
						version16,
            			version17,
						version18,
						version19,
						version20,
                        version21,
                        version22,
                        version23,
                        version24,
                        version25
					];

					var migrationSteps = versions.map(function(version) {
						return function(currentVersion) {
							if (currentVersion >= version.versionNumber)
								return $q.when(currentVersion);

							var promise = executeInChain(version.queries).then(function() {

									LoggingService.log("Version " + version.versionNumber + " migration executed");
									return version.versionNumber;
								})
								.then(storeVersionInHistoryTable);

							return promise;
						};
					});

					var steps = initialSteps.concat(migrationSteps);
					steps.reduce(function(current, next) {
							return current.then(next);
						}, $q.when())
						.then(function() {

							LoggingService.log("All migrations executed");
							$ionicLoading.hide();
							q.resolve();
						})
						.catch(function(error) {
							console.log(error);
							LoggingService.log("Error: " + JSON.stringify(error));
							$ionicLoading.hide();
							q.reject(error);
						});
				});
				return q.promise;
			};

			return this;
		}
	]);