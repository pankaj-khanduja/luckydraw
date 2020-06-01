module.exports = function (ls, express, config, log){
    
    var self = this
	,   path = require('path')
	,   _ = require('lodash')
    ,   moment = require('moment')
    ,   apiService = ls.getCachedService('API')
    ;
    
    express.use(function(req, res, next){
        log.warn(req.path);
        next();
    });

    express.post('/getNumberByDate', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.getNumberByDate(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
	});
	express.post('/isGateOpen', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.isGateOpen(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
	});
	
	express.post('/nextRoundTime', function(req, res){
        ls.getService('AgendaService', function(service){
          if(!service){
            console.log('error while getting AgendaService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.nextRoundTime(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
    });

    express.post('/updateNumber', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.updateNumber(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
	});

	express.post('/updateAdminNumber', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.updateAdminNumber(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
	});
	
	express.post('/getAdminNumber', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.getAdminNumber(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
	});
	
	express.post('/getNumber', function(req, res){
        ls.getService('GameTournamentService', function(service){
          if(!service){
            console.log('error while getting GameTournamentService');
            res.status(404).json({'message':'something went wrong'});
            return;
          } 
          service.getNumber(req.body, function(error, result){
              if(error){
                console.log(error); 
                res.status(404).json(error);
                return;
              } 
              res.status(200).json(result);
          });
      });
    });

    express.get('/getServerTime', function(req, res){
        var date  = moment(new Date());
        var month = date.format('M');
        var day   = date.format('D');
        var year  = date.format('YYYY');
        var hours  = date.format('HH');
        var minutes  = date.format('mm');
        var seconds  = date.format('ss');
        res.status(200).json({month : month, day : day, year : year, hours : hours, minutes : minutes, seconds : seconds}); 
    });

    function isAuthenticated(req, res, next){
        if(!req.headers.authorization){
            res.status(400).json({message : 'Authorization Failed'});
            return;
        }
        var token = req.headers.authorization;
        log.warn('requested token',token);
        ls.getService('UserService', function(service){
            if(!service){
                res.status(400).json({message : 'Something Went Wrong'});
                return;
            } 
            service.validateToken(token, function(error, tokenStatus){
                if(error){
                    res.status(400).json(error);
                    return;
                }
                next();
            });
        });
    }
}
