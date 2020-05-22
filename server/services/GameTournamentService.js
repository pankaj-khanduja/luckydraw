exports.GameTournamentService = GameTournamentService;

function GameTournamentService(ls, log){
   
   var self = this
   ,   mongoDBService = null
   ,   agenda = null
   ,   mongo = require('mongodb')
   ,   moment = require('moment')
   ,   async = require('async')
   ,   _ = require('lodash')
   ,   tournament_ball_map = {}
   ,   transactionService = null
   ,   userService = null
   ,   apiService = ls.getCachedService('API')
   ;

    function configure(cb){

        ls.getService('MongoDBService', function(service){
            if(!service){
                log.error('error while getting MongoDBService');
                cb({error:'error while getting MongoDBService'}, null);
                return;
            } 
            mongoDBService = service;
            ls.getService('AgendaService', function(agendaService){
                if(!service){
                    log.error('error while getting AgendaService');
                    cb({error:'error while getting AgendaService'}, null);
                    return;
                } 
                agenda = agendaService;
                ls.getService('UserService', function(uService){
                    if(!service){
                        log.error('error while getting UserService');
                        cb({error:'error while getting UserService'}, null);
                        return;
                    } 
                    userService = uService;
                    ls.getService('TransactionService', function(tranService){
                        if(!service){
                            log.error('error while getting TransactionService');
                            cb({error:'error while getting TransactionService'}, null);
                            return;
                        } 
                        transactionService = tranService;
                        cb(null, true);
                    });
                });
            }); 
        }); 
    }

    function createGame(){
        log.warn('called new game');
        apiService.publishToAll('ON_NEW_GAME',{});
    }

    this.configure = configure;
    this.createGame = createGame;
}