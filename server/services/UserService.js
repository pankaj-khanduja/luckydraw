exports.UserService = UserService;

function UserService(ls, log){
   
   var self = this
   ,   _ = require('lodash')
   ,   apiService = null
   ,   mongoDBService = null
   ,   jwtService = null
   ,   firebaseService = null
   ,   mongo = require('mongodb')
   ;

    function configure(cb){
        ls.getService('MongoDBService', function(service){
            if(!service){
                log.error('error while getting MongoDBService');
                cb({error:'error while getting MongoDBService'}, null);
                return;
            } 
            mongoDBService = service;
            ls.getService('API', function(service){
                if(!service){
                    log.error('error while getting API');
                    cb({error:'error while getting API'}, null);
                    return;
                }
                apiService = service;
                ls.getService('JWTService', function(s){
                    if(!s){
                        log.error('error while getting JWTService');
                        cb({error:'error while getting JWTService'}, null);
                        return;
                    }
                    jwtService = s;
                    cb(null, true);
                    // ls.getService('FirebaseCloudDatabase', function(fservice){
                    //     if(!fservice){
                    //         log.error('error while getting FirebaseCloudDatabase');
                    //         cb({error:'error while getting FirebaseCloudDatabase'}, null);
                    //         return;
                    //     }
                    //     firebaseService = fservice;
                    //     cb(null, true);
                    // });
                });
            });
        }); 
    }

    function login(body, result, cb){
        if(result && result.Password === body.Password){
            jwtService.sign({userID : body.ID}, function(error, token){
                mongoDBService.update('tambolaDB', "users",{userID : body.ID}, {$set:{token : token}}, {upsert : true}, function(r, r){
                    _.extend(result, {message : 'success', token : token, userID : body.ID});
                    apiService.disconnectUserConnection({userID : body.ID});
                    cb(null, result);
                });
            });
           return;
        }
        cb(null, {message : 'fail'});
    }

    function logout(token, cb){
        jwtService.verify(token, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            mongoDBService.update('tambolaDB', "users", {userID : result.userID}, {$set:{token : null}}, {}, function(r, r){
                apiService.disconnectUserConnection({userID : result.userID});
                cb(null, true);
            });
        });
    }

    function createUser(data, cb){
        var query = {mobileNumber : data.mobileNumber};
        log.info(query);
        mongoDBService.findOneAndUpdate('tambolaDB', 'users', query, {$set:data}, {returnOriginal: false, upsert:true, returnNewDocument: true}, function(error, result){
            if(error){
                cb(error, null);
                return;
            } 
            if(!result){
                cb({message : 'credentials not found'}, null);
                return;
            }
            var updateObj = {}
            ,   keys = Object.keys(result['value'])
            ,   count = 0
            ;
            //console.log(keys);
            while(count < keys.length){
                updateObj[keys[count]] = result['value'][keys[count]];
                count++;
            }
            var userId = result['value']['_id'];
            updateObj['userId'] = userId.toString();
            //log.info(JSON.stringify(updateObj,null,2));
            cb(null, updateObj);
        });
    }

    function getAllUser(data, cb){
        mongoDBService.find('tambolaDB', 'users', {}, {}, function(error, result){
            if(error){
                cb(error, null);
                return;
            } 
            cb(null, result);
        });
    } 

    function getUserById(data, cb){
        var query = {_id : mongo.ObjectID.createFromHexString(data.userId)};
        mongoDBService.findOne('tambolaDB', 'users', query, {}, function(error, result){
            if(error){
                cb(error, null);
                return;
            } 
            cb(null, result);
        });
    }

    function updateUser(data, cb){
        var query = {_id : mongo.ObjectID.createFromHexString(data.userId)};
        if(data.userId){
            delete data.userId;
        }
        mongoDBService.findOneAndUpdate('tambolaDB', 'users', query, {$set:data}, {returnOriginal: false, upsert:true, returnNewDocument: true}, function(error, result){
            if(error){
                cb(error, null);
                return;
            } 
            cb(null, result);
        });
    }

    function publishPushNotificationToAllUser(msgBody, cb){
        mongoDBService.distinct('tambolaDB', 'users', 'userToken', {}, function(error, devices){
            if(error){
                log.error(error);
                cb(error, null);
                return;
            } 
            devices = _.compact(devices);
            if(!devices || (devices && devices.length == 0)){
                log.warn('no device found in publishPushNotificationToAllUser');
                cb(null, true);
                return;
            }
            firebaseService.sendNotificationToDevices(devices, {notification : msgBody}, function(error, result){
                if(error){
                    log.error(error); 
                    cb(error, null);
                    return;
                } 
                cb(null, result);
            });
        });
    }

    function validateToken(token, cb){
        jwtService.verify(token, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            mongoDBService.find('tambolaDB', "users", {userID : result.userID, token : token}, {}, function(error, result){
                if(error){
                    log.error(error);
                    cb({message : 'Authentication Failed'}, null);
                    return;
                }
                result = result && result[0] || null;
                if(!result){
                    cb({message : 'Authentication Failed'}, null);
                    return;
                }
                cb(null, true);
            });
        });
    }

    this.login = login;
    this.logout = logout;
    this.getUserById = getUserById;
    this.createUser = createUser;
    this.getAllUser = getAllUser;
    this.updateUser = updateUser;
    this.configure = configure;
    this.validateToken = validateToken;
    this.publishPushNotificationToAllUser = publishPushNotificationToAllUser;
}