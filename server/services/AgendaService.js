exports.AgendaService = AgendaService;
var startingTimeInMinutes = 539;
var endingTimeInMinutes =  1259;
var intervalBetweenGamesInMinutes = 15; 
var nextRoundStartingTimeInMinutes;
function AgendaService(ls, log){

    var self = this
    ,   Agenda = require('agenda')
    ,   agenda = null
    ,   maintainGameFlow = false
    ,   moment = require('moment')
    ,   gameService = null
    ,   mongoService = null
    ,   config = null
    ;

    async function configure(cb){
        
        config = ls.getAppConfig().services.AgendaService;

        function getMongo(){
            ls.getService('MongoDBService', function(service){
                if(!service){
                    cb(true, null);
                    return;
                }
                mongoService = service;
                service.getConnection(config.database, function(error, db){
                    next(db); 
                });
            });
        }

        function next(db){
			
			

            agenda = new Agenda({processEvery: '8 seconds', mongo : db, collection: 'jobs'});
            agenda.on('ready',async job => {
                log.info('agenda db connection created');
                await agenda.start();
                mongoService.dropCollection(config.database, 'agendaJobs', function(e, r){
                    agendaInitialSetup();
                    cb(null, true);
                });
            });
        }

        async function agendaInitialSetup(){
			var date  = moment(new Date());
			var seed = (date.year().toString()+ date.dayOfYear().toString() + date.day().toString() + date.hour().toString()+ date.minute().toString()  + '7814567680');
			log.info(seed);
			date.set({second:0,millisecond:0});
			var minutes  = (date.hours() * 60 + date.minutes());
			if(minutes > (endingTimeInMinutes)){
                log.warn('game time is over');
				date.add('1','day');
                date.set({hour:8, minute:59,second:0,millisecond:0});
				log.info('new date',date.toString());
				nextRoundStartingTimeInMinutes = startingTimeInMinutes;
            }else if(minutes <= startingTimeInMinutes){
				var customHour = startingTimeInMinutes/60;
				var customMin = startingTimeInMinutes%60;
				
				log.info("hh  ",customHour ,"  sec   "+customMin);
				date.set({hour:customHour, minute:customMin,second:0,millisecond:0});
				nextRoundStartingTimeInMinutes = startingTimeInMinutes;
				log.warn('before starting ');
			}else{
				var minuteElapsed = minutes % 15;
				delay = intervalBetweenGamesInMinutes - minuteElapsed;
				log.warn('Inbetween ',delay);
				date.add(delay,'minutes');
				nextRoundStartingTimeInMinutes = (date.hours() * 60 + date.minutes());
			} 
			
			log.info("next  "+nextRoundStartingTimeInMinutes);
            defineJob('ON_INITIAL_START', {}, async function(job){
				
				date.add('15','minutes');
				var newMinutes  = (date.hours() * 60 + date.minutes());
				if(newMinutes > (endingTimeInMinutes)){
					log.warn('game time is over');
					date.add('1','day');
					date.set({hour:8, minute:59,second:0,millisecond:0});
					log.info('new date',date.toString());
				}
				log.warn('on starter called');
				nextRoundStartingTimeInMinutes = (date.hours() * 60 + date.minutes());
                startScheduler(date, 'ON_INITIAL_START',{});
                onEveryNewGame();
                if(job){
                    await job.remove();
                }
            });
            startScheduler(date, 'ON_INITIAL_START',{});
        }

        function onEveryNewGame(job){
            if(gameService){
                gameService.createGame();
                return;
            }
            ls.getService('GameTournamentService', function(service){
                if(!service){
                    log.error('error while getting RouletteGameService');
                    return;
                }
                gameService = service;
                gameService.createGame();
            });
        }

        getMongo();
	}
	
	function nextRoundTime(data, cb){
		log.info("nextRound  "+nextRoundStartingTimeInMinutes);
		cb(null, nextRoundStartingTimeInMinutes);
	}

    function defineJob(event, opts, handler){
        agenda.define(event, opts, handler);
        agenda.on('fail:'+event, async (err, job) => {
           log.error(`Job failed with error: ${err.message}`);
           job.fail(new Error(err.message));
           await job.save();
        });
    }
    
    function startScheduler(time, event, data){
        (async function() {
            await agenda.start();
            await agenda.schedule(time, event, data);
        })();
    }
    
    function startEveryScheduler(time, event, data){
      (async function() {
        await agenda.start();
            await agenda.every(time, event, data);
        })();
    }
    
    function cancelAgenda(query, callback){
        (async function() {
            const numRemoved = await agenda.cancel(query);
            log.info('cancelAgenda for %s',numRemoved);
            callback(numRemoved);
      })();
    }
    
    async function graceful(){
      log.info('agenda graceful exit');	
      if(agenda){
        await agenda.stop();
      }
      process.exit(0);
    }
    
    process.on('SIGTERM', graceful);
    process.on('SIGINT' , graceful);

    this.configure = configure;
    this.defineJob = defineJob;
    this.startScheduler = startScheduler;
    this.startEveryScheduler = startEveryScheduler;
	this.cancelAgenda = cancelAgenda;
	this.nextRoundTime = nextRoundTime;
}