var appConfig = require('./appConfig.json');

function start(config){
    
	this.inheritFrom = require('./MainApplication').MainApplication;
	this.inheritFrom(config);

    var self = this;
    self.setSharedData('appConfig',appConfig);
    self.configure(function(err,result){
      log = self.getLogger();
    	if(err){
    		log.error(err);
    		return;
    	}
      self.getService('API', function(service){
          if(!service){
              log.error('error while getting API');
              return;
          }
          var express = service.getWebServer();
          require('./APIURLHandler')(self, express, appConfig, log);
          require('./paytmRoutes')(self, express, appConfig, log);
      });
      self.start();
      console.log('application configured');
    });
}

var config = {
	'name' : "API",
  "baseAppDir" : __dirname,
	"serviceLocations" : __dirname+'/server/services/',
	"services" : {
      "API" : {
          "name" : 'API',
          'port' : appConfig.port
      },
      "MongoDBService":{
          "name":"MongoDBService",
          "connectionJSON":{
            "ip":'127.0.0.1',
            "port":'27017',
            'database':'luckyDrawDB'
          }
      },
      "FirebaseCloudDatabase" : {
        "name" : "FirebaseCloudDatabase",
        "path" : __dirname+'/tambola-2d7b0-firebase-adminsdk-p7mwf-6cdb587c42.json'
      },
      "AgendaService" : {
        "name" : "AgendaService",
        'database':'luckyDrawDB'
      },
      "StaticTemplateLoaderService" : {
        "name":"StaticTemplateLoaderService",
        "path":__dirname+"/templates/"
      },
      "JWTService" : {
        "name":"JWTService",
        "secret":"76v7r476r59cb982bc8cb9c8y7t7t8bt67vr67c5r65ex"
      },
      "GameTournamentService" : {
        "name" : "GameTournamentService"
      }
	}
}

new start(config);
