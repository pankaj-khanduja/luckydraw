exports.MainApplication = MainApplication;

function MainApplication(config){

	var self = this
	,   async = require('async')
  ,   pathLib = require('path')
  ,   EventEmitter = require("events").EventEmitter
	,   coreServicesMap = {}
  ,   sharedDataMap = {}
  ,   serviceCallBackMap = {}
  ,   logger   = null
  ,   winston  = require('winston')
	;

  self.events = new EventEmitter();

	function configure(cb){
       
      function configureLogger(){
          logger = new winston.Logger({
              transports: [
                new (winston.transports.Console)({
                    colorize:'all',
                    timestamp:true
                })
              ]
          });
          step1();
      }

      function step1(){
          configureServices(function(err,result){
              if(err){
                cb(err,null);
                return;
              }
              onConplete();
          }); 
      }

      function onConplete(){
        cb(null,true);
      }

      configureLogger();
	}

	function configureServices(cb){
        async.mapSeries(config.services,configureCoreService,function(err,result){
            if(err){
           	  cb(err,null);
           	  return;
            }
            cb(null,true);
	    }); 
	}

	function configureCoreService(service,done){
        //logger.info(service);
        if(coreServicesMap[service.name]){
          return done(null,true);
        }
        var path = getServicePath(service.name)
        ,   sClass
        ,   sClassInstance
        ;
        try{
          //console.log(path)
          sClass = require(path);
        	sClassInstance = new sClass[service.name](self, logger);
        	sClassInstance.configure(function(err,result){
        		if(err){
        		   done({reason:err},null);
        		   return;
        		}
        		coreServicesMap[service.name] = sClassInstance;
        		done(null,true);
        	});
        }catch(e){
        	logger.error(e);
          logger.error('error while configuring service');
        	done({reason:"error while configuring service"},null);
        }
	} 

	function getServicePath(serviceName){
    return pathLib.resolve(config.serviceLocations+serviceName+'.js');
	}

	function getService(serviceName, cb){
		if(coreServicesMap[serviceName]){
			return cb(coreServicesMap[serviceName]);
    }
    var serviceInfo = serviceCallBackMap[serviceName];
    if(!serviceInfo){
      serviceInfo = {};
      serviceInfo.pendingCbs = [];
      serviceInfo.state = 'start';
    }
    serviceInfo.pendingCbs.push(cb);
    if(serviceInfo.state == 'start'){
      serviceInfo.state = 'running';
      configureCoreService({name:serviceName},function(error, result){
          if(error){
            serviceInfo.pendingCbs.forEach(function(done){
               done.call(serviceInfo, null);
            });
            return;
          }
          serviceInfo.pendingCbs.forEach(function(done){
              done.call(serviceInfo, coreServicesMap[serviceName]);
          });
      });
    }
  }
  
  function getCachedService(serviceName){
     return coreServicesMap[serviceName];
  }

  function getAppConfig(){
    return config;
  }

  function getLogger(){
    return logger;
  }

  function setSharedData(key, value){
    sharedDataMap[key] = value;
  }

  function getSharedData(key){
    return sharedDataMap[key];
  }

  function start(){
    self.events.emit('START', true); 
  }

  this.start     = start;
  this.getLogger = getLogger;
	this.configure = configure;
	this.getService = getService;
  this.getAppConfig = getAppConfig;
  this.setSharedData = setSharedData;
  this.getSharedData = getSharedData;
  this.getCachedService = getCachedService;
	return this;
}