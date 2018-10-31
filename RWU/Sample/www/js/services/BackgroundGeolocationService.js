/**
 * Created by Eduardo on 05/09/15.
 * cordova-background-geolocation-lt define
 */

app.factory('BackgroundGeolocationService', function (AuthService, API_CONFIG, $rootScope){

  var bgGeo;
  var latitude;
  var longitude;
  var ride_id;

  var url_base;

  //var callbackFn = function(location, taskId) {
  //  var coords = location.coords;
  //  latitude = coords.latitude;
  //  longitude = coords.longitude;
  //
  //  //console.log('- Location: ', JSON.stringify(location));
  //  console.log('- Lat: ', latitude );
  //  console.log('- Lng: ', longitude);
  //
  //  // Must signal completion of your callbackFn.
  //  bgGeo.finish(taskId);
  //};

  //var failureFn = function(errorCode) {
  //  console.warn('- BackgroundGeoLocation error: ', errorCode);
  //};

  var initialize = function () {
    if (AuthService.isUserAuthenticated()) {
      if (AuthService.getUserData().user_role == 'taxi_driver') {

        url_base = API_CONFIG.url_base + API_CONFIG.url_api;
        bgGeo = window.BackgroundGeolocation;
        app.bgGeo = bgGeo;

        // Listen to location events & errors.
        //bgGeo.on('location', callbackFn, failureFn);
        // Fired whenever state changes from moving->stationary or vice-versa.
        bgGeo.on('motionchange', function (isMoving) {
          console.log('- onMotionChange: ', isMoving);
        });
        // Fired whenever a geofence transition occurs.
        //bgGeo.on('geofence', function(geofence) {
        //  console.log('- onGeofence: ', geofence.identifier, geofence.location);
        //});
        // Fired whenever an HTTP response is received from your server.
        bgGeo.on('http', function (response) {
          console.log('http success: ');
          console.log(response);
        }, function (response) {
          console.log('http failure: ', response.status);
          console.log(response);

        });

        //BackgroundGeoLocation is highly configurable.
        bgGeo.configure({
          // Geolocation config
          foregroundService: true,
          notificationPriority: BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN,
          notificationText: 'Capturando su ubicación',
          desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH, //(value = -1)

          stationaryRadius: 1,

          stopTimeout: 5,
          // Application config
          debug: true,  // <-- Debug sounds & notifications.
          stopOnTerminate: false,
          startOnBoot: true,
          // HTTP / SQLite config
          url: url_base + 'drivers/update_driver_position.json',
          method: "PUT",
          autoSync: true,
          maxDaysToPersist: 3,
          httpRootProperty: 'user',
          locationTemplate: '{ "u_latitude":<%= latitude %>, "u_longitude":<%= longitude %>, "isBackground":true }',
          distanceFilter: 1,
          fastestLocationUpdateInterval: 5000,
          allowIdenticalLocations: true,
          activityRecognitionInterval: 0,
          disableStopDetection: true,
          disableElasticity: true,
          // Set user token
          headers: {  // <-- Optional HTTP headers
            "Authorization": 'Token token=' + AuthService.getApiToken()
          }
        }, function (state) {
          console.log("BackgroundGeolocation ready: ", state);
          bgGeo.start();
        });
      }
    }
  };

  var start = function() {
    console.log("BackgroundGeolocation started");
    bgGeo.start();
  };

  var stop = function() {
    console.log("BackgroundGeolocation stopped");
    bgGeo.stop();
  };

  var set_ride_id = function (ride_id) {
    bgGeo.setConfig({
      params: {
        ride_id: ride_id
      }
    }, function() {
      console.log('set ride_id success in bg geolocation');
    }, function() {
      console.log('failed to set ride_id in bg geolocation');
    });
  };

  var set_stage = function (stage) {
    bgGeo.setConfig({
      params: {
        stage: stage
      }
    }, function() {
      console.log('set stage success in bg geolocation');
    }, function() {
      console.log('failed stage in bg geolocation');
    });
  };

  var set_token = function (token) {
    console.log('Setting token; ', token);

    bgGeo.setConfig({
      headers: {  // <-- Optional HTTP headers
        "Authorization": 'Token token=' + token
      }
    }, function() {
      console.log('set token success in bg geolocation');
    }, function() {
      console.log('failed to set token in bg geolocation');
    });

  };

  return {
    initialize: initialize,
    start: start,
    stop: stop,
    set_ride_id: set_ride_id,
    set_stage: set_stage,
    set_token: set_token
  }
});
