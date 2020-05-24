exports.GameTournamentService = GameTournamentService;

function GameTournamentService(ls, log){
   
   var self = this
   ,   mongoDBService = null
   ,   agenda = null
   ,   mongo = require('mongodb')
   ,   moment = require('moment')
   ,   async = require('async')
   ,	gen = require('random-seed')
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
		var date  = moment(new Date());
		date.add('30','seconds');
		log.info('new date');
		agenda.defineJob('On_Entry_Closed', {}, async function(job){
			apiService.publishToAll('ON_Entry_Closed',{});
			date.add('30','seconds');
			log.info('next new date');
			agenda.startScheduler(date, 'On_Draw_Number',{});
			if(job){
				await job.remove();
			}
		});

		agenda.defineJob('On_Draw_Number', {}, async function(job){
            var hours  = date.format('HH')
            ,   minutes  = date.format('mm')
            ,   h = (parseInt(hours)*60)
            ,   gameNumber = (parseInt(h)+parseInt(minutes))/2
            ;
            //log.info(date.toString());
            var formatedDate = moment(date).format('YYYY-MM-DD')
            ,   finalId = formatedDate.replace(/\-/g,'')
            ;
            var gameId = finalId+parseInt(gameNumber);
            console.log(gameId);
			var seed = (date.year().toString()+ date.dayOfYear().toString() + date.day().toString() + date.hour().toString()+ date.minute().toString()  + '7814567680');
			log.info(seed);
			var rand5 = new gen(seed);
			var number = (rand5(10));
			seed = (date.year().toString()+ date.dayOfYear().toString() + date.day().toString() + date.hour().toString()+ date.minute().toString()  + '9914677107');
			rand5 = new gen(seed);
            number = number.toString() + (rand5(10));
            mongoDBService.findOne('luckyDrawDB', 'adminNumbers', {gameId : gameId}, {}, async function(error, info){
                if(info){
                    number = info.gameId;
                }
                saveNumber(number);
                apiService.publishToAll('On_Draw_Number',{number});
                if(job){
                    await job.remove();
                }
            });
		});
		agenda.startScheduler(date, 'On_Entry_Closed',{});
    }
    
    function saveNumber(number){
        mongoDBService.save('luckyDrawDB', "numbers", {number : number, createdAt : new Date()}, function(e, r){
            console.log('number saved');
        });
    }

    function getNumberByDate(data, cb){
        var query = {};
        query = {createdAt : {$gte : new Date(moment(new Date(data.from))), $lte:new Date(moment(new Date(data.to)))}};
        log.info(query);
        mongoDBService.find('luckyDrawDB', 'numbers', query, {}, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            cb(null, result);
        });
    }

    function updateNumber(data, cb){
        mongoDBService.save('luckyDrawDB', 'adminNumbers', data, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            cb(null, result);
        });
    }

    this.configure = configure;
    this.createGame = createGame;
    this.updateNumber = updateNumber;
    this.getNumberByDate = getNumberByDate;
}