exports.JWTService = JWTService;

function JWTService(ls, log){
   
   var self = this
   ,   jwt = require('jsonwebtoken')
   ,   _ = require('lodash')
   ,   config = null;
   ;

    function configure(cb){
        config = ls.getAppConfig().services.JWTService;
        cb(null, true);
    }

    function sign(data, cb){
        jwt.sign(data, config.secret, { expiresIn : '10h' }, function(err, token){
            if(err){
               log.error(err);
               log.error('error while signing jwt token');
               cb(null, null);
               return;
            }  
            //console.log(token);
            cb(null, token);
        });
    }

    function verify(token, cb){
        //console.log(token, config.secret);
        jwt.verify(token, config.secret, function(error, decoded) {
            if(error){
                log.error(error);
                log.error('error while verify');
                cb({message : "Authorization Failed"}, null);
                return;
            }  
            //console.log(decoded);
            if(!decoded){
                cb({message : "Authorization Failed Due To Token Expired"}, null);
                return; 
            }
            cb(null, decoded);
        });
    }

    this.configure = configure;
    this.sign = sign;
    this.verify = verify;
}