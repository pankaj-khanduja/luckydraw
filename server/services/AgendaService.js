exports.AgendaService = AgendaService;

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
            var minutes  = date.format('mm');
            var after = getNextInterval(minutes);
            log.info('minutes, after',minutes, after);
            date.add(after.toString(),'minutes');
            date.set({second:0,millisecond:0});
            var endTime  = moment(new Date());
            endTime.set({hour:18, minute:0,second:0,millisecond:0});
            log.info('endTime',endTime.toString());
            log.info('date',date.toString());
            if(date.isAfter(endTime)){
                log.warn('game time is over');
                date.add('1','day');
                date.set({hour:9, minute:0,second:0,millisecond:0});
                log.info('new date',date.toString());
            }
            defineJob('ON_INITIAL_START', {}, async function(job){
                date.add('15','minutes');
                log.warn('on starter called');
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

    function getNextInterval(minute){
        if(minute == 15 || minute == 30 || minute == 45 || minute == 60){
            return 15;
        }
        if(minute == 1 && minute < 15){
            return 15-minute;
        }
        if(minute > 15 && minute < 30){
            return 30-minute;
        }
        if(minute > 30 && minute < 45){
            return 45-minute;
        }
        if(minute > 45 && minute < 60){
            return 60-minute;
        }
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
}