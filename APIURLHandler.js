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

    express.post('/createTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            req.body.timestamp = getMomentTime(req.body.date, req.body.time);
            req.body.createdAt = new Date();
            service.createTournament(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/deleteTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            console.log('req.body',req.body);
            service.deleteTournament(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    function getMomentTime(date, time){
        var isoTime = new Date(moment(new Date(date+' '+time)));
        console.log(isoTime);
        return isoTime;
    }

    express.post('/getAllTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getAllTournament(req.body || {}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.get('/getAllTournamentWithoutQuestion', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getAllTournamentWithoutQuestion(req.body || {}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.get('/getNextTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getNextTournament(req.body || {}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/getNextTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getNextTournament(req.body || {}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.get('/getNextTournamentTime', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getNextTournament(req.body || {}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                if(!result){
                    res.status(203).json({message : 'no tournament found'});
                    return;
                }
                var time = moment(result.timestamp).diff(moment(new Date()),'seconds');
                res.status(200).json({time : time, tournamentId : result._id});
            });
        });
    });

    express.post('/joinTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.joinTournament(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/isUserJoinedTournament', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.isUserJoinedTournament(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/getTournamentById', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getTournamentById(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/getTournamentResultById', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getTournamentResultById(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/createUser', function(req, res){
        ls.getService('UserService', function(service){
            if(!service){
                console.log('error while getting UserService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.createUser(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.get('/getAllUser', function(req, res){
        ls.getService('UserService', function(service){
            if(!service){
                console.log('error while getting UserService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getAllUser(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/updateUser', function(req, res){
        ls.getService('UserService', function(service){
            if(!service){
                console.log('error while getting UserService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.updateUser(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/updateSettings', function(req, res){
        ls.getService('MongoDBService',function(mongoDBService){
            if(!mongoDBService){
              log.error('error while getting mongoDBService');
              res.json({success:false});
              return;
            }
            var body = req.body;
            mongoDBService.update('tambolaDB', "settings", {type : 'settings'}, {$set:{settings :body}},{upsert:true} , function(error, result){
                res.status(404).json({message:'settings changed'});
            });
        });
    });

    express.get('/getSettings', function(req, res){
        ls.getService('MongoDBService',function(mongoDBService){
            if(!mongoDBService){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            mongoDBService.findOne('tambolaDB', "settings", {type : 'settings'}, {}, function(error, result){
                res.status(200).json(result.settings);
            });
        });
    });

    express.post('/getUserTransaction', function(req, res){
        ls.getService('TransactionService',function(service){
            if(!service){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            var body = req.body;
            if(!body.user_id){
                res.status(404).json({message:'requested api data is not valid'});
                return;
            }
            service.getUserTransaction(body, function(error, result){
                if(error){
                    res.status(404).json({message:'error while find', error : error});
                    return;
                }
                res.status(200).json(result);
            })
        });
    });

    express.post('/getUserBalance', function(req, res){
        ls.getService('TransactionService',function(service){
            if(!service){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            var body = req.body;
            if(!body.user_id){
                res.status(404).json({message:'requested api data is not valid'});
                return;
            }
            service.getUserLastTransaction(body, function(error, result){
                if(error){
                    res.status(404).json({message:'error while find', error : error});
                    return;
                }
                res.status(200).json({balance : result.balance});
            });
        });
    });

    express.post('/getTournamentJoinedUserCountById', function(req, res){
        ls.getService('GameTournamentService', function(service){
            if(!service){
                console.log('error while getting GameTournamentService');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            service.getTournamentJoinedUserCountById(req.body, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/pushNotification', function(req, res){
        ls.getService('FirebaseCloudDatabase', function(service){
            if(!service){
                console.log('error while getting FirebaseCloudDatabase');
                res.status(404).json({'message':'something went wrong'});
                return;
            } 
            var devices = req.body['token'];
            if(req.body['token']){
                delete req.body['token'];
            }
            service.sendNotificationToDevices(devices, {notification : req.body}, function(error, result){
                if(error){
                    console.log(error); 
                    res.status(404).json(error);
                    return;
                } 
                res.status(200).json(result);
            });
        });
    });

    express.post('/addBalanceToUser', function(req, res){
        ls.getService('TransactionService',function(service){
            if(!service){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            var body = req.body;
            if(!body.credit || !body.user_id){
                res.status(404).json({message:'requested api data is not valid'});
                return;
            }
            service.addBalanceToUser(body, function(error, result){
                if(error){
                    res.status(404).json({message:'error while find', error : error});
                    return;
                }
                res.status(200).json(result);
            })
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
