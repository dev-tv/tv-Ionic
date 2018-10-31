/**
 * Created on 09/03/16
 * GCM registration service and capture messages
 */

app.factory('gcm',function(AuthService, $state, NotificationsActions, PLATFORM, API, GCM_SENDER_ID,$window){

  var push;

  // Application Constructor
  var initialize = function() {
    console.log('inicializando GCM');
    bindEvents();
  };

  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  var bindEvents = function() {
    document.addEventListener('deviceready', onDeviceReady, false);
  };

  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  var onDeviceReady = function() {
    // If User is authenticated then register to GCM
    if (AuthService.isUserAuthenticated()) {
      /*var push = PushNotification.createChannel(function () {

      }, function () {

      })*/
      push = PushNotification.init({
        android: {
          senderID: GCM_SENDER_ID,
          clearNotifications: false,
          forceShow: true
        },
        ios: {
          alert: "true",
          badge: "true",
          sound: "true"
        },
        windows: {}
      });

      push.on('registration', function (data) {
        console.log('registrado: ', data);
        var user = {
          device_token: data.registrationId
        };

        API.updateDeviceToken(user)
          .then(function(response) {
            AuthService.setDeviceToken(data.registrationId);
          }, function(response) {
            console.log('Failed to update device token');
          });
      });

      push.on('notification', function (data) {
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
        console.log('notificación >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', data);

        console.log('notificación >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', data.additionalData.notType);
        //console.log('notificación: ', JSON.stringify(data));
        switch (data.additionalData.notType) {
          case 'new_service_request':
            console.log('nueva solicitud de servicio');
            //brings the app into foreground
            //cordova.plugins.backgroundMode.moveToForeground();
            navigator.app.resumeApp(true);
            NotificationsActions.new_service_request(data);
            break;
          case 'driver_rejected_request':
            NotificationsActions.driver_rejected_request();
            break;
          case 'driver_canceled_request':
            /*Make the state as undefined to nevigate to home page */
            $window.localStorage['state']=undefined;
            NotificationsActions.driver_rejected_request();
            break;
          case 'driver_unique_rejected_request':
            NotificationsActions.driver_unique_rejected_request();
            break;
          case 'driver_accepted_request':
            NotificationsActions.driver_accepted_request(data);
            break;
          case 'driver_arrived':
            NotificationsActions.driver_arrived();
            break;
          case 'notify_payment_ticket':
            NotificationsActions.notify_payment_ticket(data);
            break;
          case 'notify_payment_cash':
            NotificationsActions.notify_payment_cash(data);
            break;
          case 'notify_payment_credit_card':
            NotificationsActions.notify_payment_credit_card(data);
            break;
            case 'notify_payment_fund':
            NotificationsActions.notify_payment_fund(data);
            break;
          case 'payment_declined':
            NotificationsActions.payment_declined();
            break;
          case 'payment_confirmed':
            NotificationsActions.payment_confirmed();
            break;
          case 'increase_bid_amount':
            NotificationsActions.show_increase_bid_amount(data);
            break;
          case 'logout_user':
            NotificationsActions.logout_user();
            break;
          case 'simple_logout_user':
            NotificationsActions.simple_logout_user();
            break;
          case 'automatic_rejected_request':
            NotificationsActions.automatic_rejected_request(data);
            break;
          case 'passenger_canceled_request':
            NotificationsActions.passenger_canceled_request();
          break;
          case 'offer_list':
            NotificationsActions.showList_offered_by_driver(data);
            break;
          //default:
          //  break;
        }

        //push.finish(function () {
        //  console.log('finish successfully called');
        //});
      });

      push.on('error', function (e) {
        // e.message
        console.log('error: ', e);
      });
    }
  };

  var clear_notifications = function() {
    push.clearAllNotifications();
  };

  return {
    initialize: initialize,
    clear_notifications: clear_notifications
  };
});
