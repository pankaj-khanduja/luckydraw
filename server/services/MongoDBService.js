exports.MongoDBService = MongoDBService;

function MongoDBService(ls, log){

	var self = this
	,   mongo = require('mongodb').MongoClient
  ,   _     = require('lodash')
  ,   ObjectID = mongo.ObjectID
  ,   connectionCache = {}
  ,   urlToMap = {}
  ,   config = null
	;

	function configure(cb){
      config = ls.getAppConfig().services.MongoDBService;
      createDBConnection(function(err,res){
    	    if(err){
    	  	  cb(err,null);
    	  	  return;
    	    }
    	    log.info(config.name+' service started');
    	    cb(null,true);
      });
	}

	function set(key,value){
    	self[key] = value;
  }

  function get(key){
    	return self[key] ? self[key] : null;
  }

	function createDBConnection(onComplete){
		getConnectionFromServerInfo(config.connectionJSON,function(connection){
        if(connection){
        	set('indexedDBConnection',connection);
        	onComplete(null,true);
        	return;
        }else{
          onComplete({'error':'error while getting getIndexDBConnection : '},null);
          return;
        }
	  });
	}

	function getConnectionFromServerInfo(dbServerInfo,cb){
     var obj = dbServerInfo.connectionJSON || {}
     ,   config = _.extend(dbServerInfo,obj)
     ,   url = generateMongoUrl(config)
     ,   connection
     ;

     if(urlToMap[url+config.database] && urlToMap[url+config.database]._state == 2){
         connection = urlToMap[url];
         cb(connection);
     }else{
     	   getMongoDBConnectionObjFromUrl(url,config.database,function(db){
     	   	  connectionCache[config.database] = db;
            cb(db); 
         });
     }
  }

  function connectToDB(url,dbName,cb){
      mongo.connect(url, { useUnifiedTopology: true, useNewUrlParser: true },function(err, db) {
          if(err){
            log.error(err);
            log.error('error while creating db connection');
            log.error('you may have to install mongo db or start mongod deamon');
            return;
          };
          self['currentMongoConnection'] = db;
          log.info('connection created on url : %s ,db : %s',url,dbName);
          var dbo = db.db(dbName);
          cb(dbo);
      });
  }

  function connectionInstance(){
    return self['currentMongoConnection'];
  }

  function generateMongoUrl(info){
      var str = 'mongodb://'+info.ip+':'+info.port+'/';
      return str;
  }

  function getMongoDBConnectionObjFromUrl(url,database,cb){
      connectToDB(url,database,function(db){
          urlToMap[url+database] = db;
          cb(db);
      });
  }

  function getConnection(key,cb){
  	if(connectionCache[key]){
  	  	cb(null,connectionCache[key]);
  	  	return;
  	}
  }

  function afterQueryExecution(meta,cb,dberr,dbRes){
      if(dberr){
        log.error('DBERROR in for '+meta.identifier);
       	cb(dberr,dbRes);
       	return;
      }
      cb(null,dbRes);
  }

  function find(identifier,collection,query,option,cb){
      getConnection(identifier,function(err,db){
          var meta = {'identifier':identifier,timeStamp:new Date()};
          if(err){
              log.error('%s ERROR '+err+','+JSON.stringify(meta));
              cb(err,null);
              return; 
          }
          var instance = db.collection(collection).find(query);
          if(option.sort){
            instance.sort(option.sort);
            delete option.sort;
          }
          if(option['limit']){
            instance.limit(option['limit']); 
            delete option['limit'];  
          }
          instance.project(option).toArray(afterQueryExecution.bind(self,meta,cb));
      });
  }

  function findOne(identifier,collection,query,option,cb){
	 	getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).findOne(query,option,afterQueryExecution.bind(self,meta,cb));
    });
	}

  function save(identifier,collection,data,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).insertOne(data,afterQueryExecution.bind(self,meta,cb));
    });
	}

  function insertMany(identifier,collection,data,option,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).insertMany(data,option,afterQueryExecution.bind(self,meta,cb));
    });
  }

	function update(identifier,collection,query,field,option,cb){
	 	getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).updateOne(query,field,option,afterQueryExecution.bind(self,meta,cb));
    });
  }
  
  function updateMany(identifier,collection,query,field,option,cb){
    getConnection(identifier,function(err,db){
       var meta = {'identifier':identifier,timeStamp:new Date()};
       if(err){
           log.error('%s ERROR '+err+','+JSON.stringify(meta));
           cb(err,null);
           return; 
       }
       db.collection(collection).updateMany(query,field,option,afterQueryExecution.bind(self,meta,cb));
   });
 }

  function findOneAndUpdate(identifier,collection,query,field,option,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).findOneAndUpdate(query,field,option,afterQueryExecution.bind(self,meta,cb));
    });
  }

  function deleteMany(identifier,collection,query,option,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).deleteMany(query,option,afterQueryExecution.bind(self,meta,cb));
    });
  }

  function dropCollection(identifier,collection,cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).drop(afterQueryExecution.bind(self,meta,cb));
    });
  }

  function distinct(identifier,collection, key, query, cb){
    getConnection(identifier,function(err,db){
        var meta = {'identifier':identifier,timeStamp:new Date()};
        if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
            cb(err,null);
            return; 
        }
        db.collection(collection).distinct(key, query, afterQueryExecution.bind(self,meta,cb));
    });
  }

	function createTextIndex(identifier,collection,field,cb){
		getConnection(identifier,function(err,db){
	      var meta = {'identifier':identifier,timeStamp:new Date()};
	      if(err){
            log.error('%s ERROR '+err+','+JSON.stringify(meta));
	          cb(err,null);
	          return; 
	      }
	      db.collection(collection).createIndex(field,afterQueryExecution.bind(self,meta,cb));
    });
  }
  

  this.find = find;
  this.save = save;
  this.distinct = distinct;
  this.update = update;
  this.findOne = findOne;
  this.insertMany = insertMany;
	this.deleteMany = deleteMany;
	this.configure = configure;
	this.createTextIndex = createTextIndex;
  this.findOneAndUpdate = findOneAndUpdate;
  this.getConnection = getConnection;
  this.updateMany = updateMany;
  this.dropCollection = dropCollection;
}