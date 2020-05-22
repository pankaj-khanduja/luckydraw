exports.FirebaseCloudDatabase = FirebaseCloudDatabase;

function FirebaseCloudDatabase(ls, log){
    
    var self = this
    ,   db = null
    ,   mongo = require('mongodb')
    ,   async = require('async')
    ,   _ = require('lodash')
    ,   auth = null
    ,   admin = null
    ,   config = null
    ;

    function configure(cb){
        config = ls.getAppConfig().services.FirebaseCloudDatabase;
        admin = require('firebase-admin');

    		let serviceAccount = require(config.path);

    		admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://tambola-2d7b0.firebaseio.com"
    		});
        
        const firebaseConfig = {
            apiKey: "AIzaSyDs2qufqFpUZvE-ijnCRrYR8WwWybystAs",
            authDomain: "tambola-2d7b0.firebaseapp.com",
            databaseURL: "https://tambola-2d7b0.firebaseio.com",
            projectId: "tambola-2d7b0",
            storageBucket: "tambola-2d7b0.appspot.com",
            messagingSenderId: "169359547786",
            appId: "1:169359547786:web:25f8e7878c3c30bf1ffc73"
        };
        var firebase = require("firebase");
        firebase.initializeApp(firebaseConfig);
        
        db = admin.database();
        auth = firebase.auth();
    		cb(null,true);
    }

    function authenticateFirebase(email, password, callback){
        log.warn(email, password);
        auth.signInWithEmailAndPassword(email, password).then(function(result){
           callback(null, _.extend({message : 'success'}, result));
        }).catch(function(error){
          var errorCode = error.code;
          var errorMessage = error.message;
          log.error('authenticate error',error);
          callback(null, {message : 'fail',errorCode:errorCode,errorMessage:errorMessage});
        });
    }

    function sendPasswordResetEmail(email, callback){
        log.warn(email);
        auth.sendPasswordResetEmail(email).then(function(result){
           callback(null, {result : result});
        }).catch(function(error){
          callback(null, {error : error});
        });
    }

    function findByPath(path, callback){
        var usersRef = db.ref(path);
        usersRef.on("value", onHandler ,function (error) {
          log.error('error',error);
          usersRef.off('value', onHandler);
          callback(error, null);
        });

        function onHandler(snapshot){
          usersRef.off('value', onHandler);
          callback(null, snapshot.val());
        }
    }

    function updateByPath(path, data, callback){
        var usersRef = db.ref(path);
        usersRef.update(data, function(error, result){
           callback(error, result);
        });
    }

    function deleteByPath(path, callback){
        var usersRef = db.ref(path);
        usersRef.remove(function(error, result){
           callback(error, result);
        });   
    }

    function sendNotificationToDevices(devices,msgInfo,cb){
          log.warn(devices,msgInfo);
          var options = {
            priority: 'high',
            timeToLive: 60 * 10
          };

          var payload = {};
          if(msgInfo.payload){
            payload.data = msgInfo.payload;
          }
          if(msgInfo.notification){
            payload.notification = msgInfo.notification;
          }

          // Send a message to the device corresponding to the provided
          // registration token with the provided options.
          admin.messaging().sendToDevice(devices, payload, options).then(function(response) {
              log.info('Successfully sent message:', response);
              cb(null,true);
          }).catch(function(error) {
              log.error('Error sending message:', error);
              cb(null,null);
          });
    }
 
    this.configure = configure;
    this.findByPath = findByPath; 
    this.updateByPath = updateByPath; 
    this.deleteByPath = deleteByPath; 
    this.authenticateFirebase = authenticateFirebase;
    this.sendPasswordResetEmail = sendPasswordResetEmail;
    this.sendNotificationToDevices = sendNotificationToDevices;
}