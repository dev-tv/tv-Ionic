/**
 * Created on 09/07/15.
 * Servicio de captura de eventos en tiempo real
 * Socket.io es conectado al servidor node.js
 */

app.factory('socket',function(socketFactory, AuthService, WEBSOCKETS){
  var myIoSocket = io.connect(WEBSOCKETS.url_base);

    var mySocket = socketFactory({
      ioSocket: myIoSocket
    });

  // If user unAuthenticated then disconnect socket
  if (!AuthService.isUserAuthenticated()) {
    console.log('No está autenticado');
    mySocket.disconnect();
  }

  return mySocket;
});
