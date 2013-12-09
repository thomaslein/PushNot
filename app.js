var http = require('http'),
  url = require('url'),
  fs = require('fs'),
  util = require('util'),
  apns = require('apn'),
  DeviceProvider = require('./deviceprovider').DeviceProvider,
  notificationText,
  
  server_config = {
    host:'localhost',
    port:'27017',
    db:'pushnotdb'
  },

device_provider = new DeviceProvider(server_config , function(error, connected){
  if(error) throw error
  device_provider.setIndex('tokens', {_id:1}, function(error, index){
    console.log('successfully set index on collection, index: ' + index)
  })
}),

apns_options = {
    cert: 'assets/PushNotCert.pem',       
    key:  'assets/PushNotKey.pem', 
    passphrase: 'aptan',
    gateway: 'gateway.sandbox.push.apple.com',
    port: 2195,
    rejectUnauthorized: true,
    enhanced: true,
    cacheLength: 100,
    autoAdjustCache: true,
    connectionTimeout: 0
},

apns_connection = new apns.Connection(apns_options);

http.createServer(function (request, response) {
  request.setEncoding('utf8');
  var parsed_url = url.parse(request.url);
  route(parsed_url.href, request, response);

}).listen(3000);

console.log('Server running at http://localhost:3000');

function route(url, request, response){
  switch(url) {
    case "/":
      renderAdmin(response);
      break;
    case "/setNotification":
      setNotification(request, response);
      break;
    case "/registerDevice":
      registerDevice(request, response);
      break;
    }
}

function renderAdmin(response) {
  fs.readFile('admin.html', function (error, html) {
    if(error) throw error
    response.writeHeader(200, {'Content-Type':'text/html', 'Content-Lenght':html.length});  
    response.write(html);  
    response.end();
  });
}

function registerDevice(request, response) {
  request.on('data', function(data) {
    var device = JSON.parse(data);
    device_provider.save('tokens', device, function(error, doc){
        if(error) throw error
        console.log('successfully saved to database: ' + doc);
    })
  })
  response.writeHeader(200, {'Content-Type': 'application/json'} );
  response.write(JSON.stringify({success:true}));
  response.end();
}

function setNotification(request, response) {
  request.on('data', function(data) {
    var form_data = JSON.parse(data);
    console.log('request data: ', util.inspect(form_data));
    notifyDevices(form_data);
  })
  response.writeHeader(200, {'Content-Type': 'application/json'} );
  response.write(JSON.stringify({success:true}));
  response.end();
}

function notifyDevices(data) {
  var payload = {};
  for(var key in data){
    if(data.hasOwnProperty(key) && !key.indexOf('payload')) {
      payload[key] = data[key];
    }
  }
  var expire = parseInt(data.expire);
  device_provider.findAll('tokens', function(error, doc){
    if(error) throw error
    if(doc != null){
      console.log(doc);
      var token = doc.token;
      var device = new apns.Device(doc.token);
      var notification = new apns.Notification();
      notification.expiry = Math.floor((Date.now()/1000) + 3600 * parseInt(data.expire));
      notification.badge = data.badge;
      notification.payload = payload;
      notification.alert = {'body': data.message, 'action-loc-key': data.key, 'launch-image': data.image};
      notification.device = device;
      notification.sound = "sounds/" + data.sound;
      apns_connection.sendNotification(notification);
    }
  })
}

apns_connection.on('error', function(error) {
  console.log('apn error: ' + error);
});

apns_connection.on('transmitted', function(notification, device) {
  console.log('following notification is transmitted, notification:' + notification + ' device: ' + device);
});

apns_connection.on('connected', function(openSockets) {
  console.log('connected to apn: ' + openSockets);
});

apns_connection.on('disconnected', function(openSockets) {
  console.log('disconnected from apn');
});

apns_connection.on('transmissionError', function(errorCode, notification, device) {
  console.log('transmision error, error code: ' + errorCode + ' notification: ' + notification + ' device: ' + device);
});

