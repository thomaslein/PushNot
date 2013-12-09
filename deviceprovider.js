var MongoClient = require('mongodb').MongoClient;
var _db;

DeviceProvider = function(config, callback){
  MongoClient.connect('mongodb://' + config.host + ':' + config.port + '/' + config.db, function(error, db) {
    if(error){
      throw error;
      callback(error, false);
    }else{
       _db = db;
       callback(null, true);
    }
  });
}
 
DeviceProvider.prototype.getCollection = function(collection_name, callback) {
    var collection = _db.collection(collection_name);
    callback(collection);
}

DeviceProvider.prototype.setIndex = function(collection_name, index, callback){
  this.getCollection(collection_name, function(collection){
    collection.ensureIndex(index, function(error, index){
      if(error){
        callback(error)
      }else{
        callback(null, index);
      }
    });
  });
}

DeviceProvider.prototype.findAll = function(collection_name, callback){
  this.getCollection(collection_name, function(collection){
    collection.find().each(function(error, num) {
      if(error){
        callback(error)
      }else{
        callback(null, num);
      } 
    });
  });
}

DeviceProvider.prototype.save = function(collection_name, device, callback){
  this.getCollection(collection_name, function(collection){
    device.timestamp = new Date();
    collection.save(device, function(error,num){
      if(error){
        callback(error)
      }else{
        callback(null, num)
      } 
    });
  });
}

exports.DeviceProvider = DeviceProvider;
