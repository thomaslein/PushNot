var PushNotApp = PushNotApp || {};

PushNotApp.main = (function() {

  var server = 'http://thomasl.apt-domain.as:3000',

  showAlert = function(message, title) {
    if(navigator.notification) {
      navigator.notification.alert(message, null, title, 'Close');
      navigator.notification.vibrate(1000);
    }else{
      alert(title ? (title + ": " + message) : message);
    }
  },

  addCallback = function(key, callback) {
      if(window.callbacks === undefined) {
          window.callbacks = {};
      }
      window.callbacks[key] = callback;
  },

  addNotification = function(notificationTxt) {
    console.log('notification added to DOM');
    var el = document.getElementById('notification');
    el.innerHTML += notificationTxt;
  },

  registerDevice = function(token) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', server + '/registerDevice', true);
    xhr.onload = function(evt) {
      if (this.status == 200) {
          console.log('device saved to database');
      }
    }
    var txt = JSON.stringify({ 
          _id: device.uuid,
          token: token, 
          name: device.name,
          platform: device.platform,
          version: device.version
      })
    xhr.send(txt);
  },

  registrationSuccessHandler = function(token) {
    console.log('successful registration with token: ' + token);
    registerDevice(token.toString(16));
    addCallback('notificationHandler', notificationHandler);
  },

  registrationFailedHandler = function(error) {
    showAlert(error, "Error");
  },

  notificationHandler = function(evt) {
    console.log("received a notification: " + evt.body);
    if(evt.body) {
      addNotification(evt.body);
    }
    if(evt.payload1){
       addNotification("<br>Payload1: " + evt.payload1);
    }
    if(evt.payload2){
       addNotification("<br>Payload2: " + evt.payload2);
    }
    if(evt.sound){
      var snd = new Media(evt.sound);
      snd.setVolume('1.0');
      snd.play();
    }
  },

  pushNotification = window.plugins.pushNotification,

  deviceReady = function() {
    console.log('Device is ready');
    if(parseFloat(device.version) === 7.0) {
         document.body.style.marginTop = "20px";
    }
    pushNotification.register(registrationSuccessHandler, 
                              registrationFailedHandler, {
                                "badge":"true",
                                "sound":"true",
                                "alert":"true",
                                "ecb":"callbacks.notificationHandler"
                              }); 

  },

  initialize = function(){
    document.addEventListener("deviceready", deviceReady, false);
  }

  return {
    initialize:initialize
  }

}());

PushNotApp.main.initialize();

