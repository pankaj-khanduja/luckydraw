const axios = require('axios');
exports.GameTournamentService = GameTournamentService;
var isGateOpenValue = false;
function GameTournamentService(ls, log) {
  var self = this,
    mongoDBService = null,
    agenda = null,
    mongo = require("mongodb"),
    moment = require("moment"),
    async = require("async"),
    gen = require("random-seed"),
    _ = require("lodash"),
    tournament_ball_map = {},
    transactionService = null,
    userService = null,
    apiService = ls.getCachedService("API");
  function configure(cb) {
    ls.getService("MongoDBService", function (service) {
      if (!service) {
        log.error("error while getting MongoDBService");
        cb({ error: "error while getting MongoDBService" }, null);
        return;
      }
      mongoDBService = service;
      ls.getService("AgendaService", function (agendaService) {
        if (!service) {
          log.error("error while getting AgendaService");
          cb({ error: "error while getting AgendaService" }, null);
          return;
        }
        agenda = agendaService;
        ls.getService("UserService", function (uService) {
          if (!service) {
            log.error("error while getting UserService");
            cb({ error: "error while getting UserService" }, null);
            return;
          }
          userService = uService;
          ls.getService("TransactionService", function (tranService) {
            if (!service) {
              log.error("error while getting TransactionService");
              cb({ error: "error while getting TransactionService" }, null);
              return;
            }
            transactionService = tranService;
            cb(null, true);
          });
        });
      });
    });
  }

  function createGame() {
    log.warn("called new game");
    apiService.publishToAll("ON_NEW_GAME", {});
    var date = moment(new Date());
    date.add("50", "seconds");
    isGateOpenValue = true;
    log.info("new date");
    agenda.defineJob("On_Entry_Closed", {}, async function (job) {
      apiService.publishToAll("ON_Entry_Closed", {});
      isGateOpenValue = false;
      date.add("10", "seconds");
      log.info("next new date");
      agenda.startScheduler(date, "On_Game_Start", {});
      agenda.defineJob("On_Game_Start", {}, async function (job) {
        apiService.publishToAll("On_Game_Start", {});
        date.add("20", "seconds");
        agenda.startScheduler(date, "On_Draw_Number", {});
        if (job) {
          await job.remove();
        }
      });
      if (job) {
        await job.remove();
      }
    });

    agenda.defineJob("On_Draw_Number", {}, async function (job) {
      var hours = date.format("HH"),
        minutes = date.format("mm"),
        h = parseInt(hours) * 60,
        gameNumber = parseInt(h) + parseInt(minutes);
     
      var formatedDate = moment(date).format("YYYY-MM-DD"),
        finalId = formatedDate.replace(/\-/g, "");
      var gameId = finalId + parseInt(gameNumber);
      
      var seed =date.year().toString() +date.dayOfYear().toString() +date.day().toString() +date.hour().toString() +date.minute().toString() +"7814567680";
     
      var rand5 = new gen(seed);
      var number = rand5(10);
      seed =date.year().toString() +date.dayOfYear().toString() +date.day().toString() +date.hour().toString() +date.minute().toString() +"9914677107";
      rand5 = new gen(seed);
      number = number.toString() + rand5(10);
      mongoDBService.findOne("luckyDrawDB", "adminNumbers",{ gameId: gameId }, {}, async function (error, info) {
          if (info) {
            number = info.number;
          }
          saveNumber(number,gameId);
          apiService.publishToAll("On_Draw_Number", { number });
          date.add("5", "minutes");
          agenda.startScheduler(date, "On_Game_Exit", {});
          const data = {
            number: number,
            gameID: gameNumber
          };
          axios.post('https://yashapps.xyz/test2/record.php', data, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            console.log('Response:', response.data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          if (job) {
            await job.remove();
          }
        }
      );
      agenda.defineJob("On_Game_Exit", {}, async function (job) {
        apiService.publishToAll("On_Game_Exit", {});
        if (job) {
          await job.remove();
        }
      });
    });
    agenda.startScheduler(date, "On_Entry_Closed", {});
  }

  function saveNumber(number,gameId) {
    mongoDBService.save( "luckyDrawDB","numbers",{ number: number,gameId:gameId, createdAt: new Date() },
      function (e, r) {
        console.log("number saved");
      }
    );
  }

  function getNumberByDate(data, cb) {
    var query = {};
    query = {createdAt: {$gte: new Date(moment(new Date(data.from))),$lte: new Date(moment(new Date(data.to))), }, };
    log.info(query);
    mongoDBService.find("luckyDrawDB", "numbers", query, {}, function (error,result) {
      if (error) {
        cb(error, null);
        return;
      }
      cb(null, result);
    });
  }

  function isGateOpen(data, cb) {
    log.info(isGateOpenValue);
    cb(null, isGateOpenValue);
  }

  function updateNumber(data, cb) {
    if (data && !Array.isArray(data)) {
      data = [data];
    }
    async.mapSeries(data,function (info, done) {
        var query = { gameId: info.gameId };
        info.createdAt = new Date(info.from);
        mongoDBService.update( "luckyDrawDB", "numbers", query, { $set: info }, { upsert: true }, function (error, result) {
            if (error) {
              done(error, null);
              return;
            }
            done(null, "Uploaded");
          }
        );
      },
      function (error, result) {
        if (error) {
          cb(error, null);
          return;
        }
        cb(null, result);
      }
    );
  }

  function updateAdminNumber(data, cb) {
    if (data && !Array.isArray(data)) {
      data = [data];
    }
    async.mapSeries(data,function (info, done) {
        var query = { gameId: info.gameId };
        info.createdAt = new Date(info.from);
        mongoDBService.update( "luckyDrawDB", "adminNumbers", query, { $set: info }, { upsert: true }, function (error, result) {
            if (error) {
              done(error, null);
              return;
            }
            done(null, "Uploaded");
          }
        );
      },
      function (error, result) {
        if (error) {
          cb(error, null);
          return;
        }
        cb(null, result);
      }
    );
  }


  function getAdminNumber(data, cb) {
    var query = {};
    query = {createdAt: { $gte: new Date(moment(new Date(data.from))), $lte: new Date(moment(new Date(data.to))),}, };
    log.info(query);
    mongoDBService.find("luckyDrawDB", "adminNumbers", query, {}, function (error,result) {
      if (error) {
        cb(error, null);
        return;
      }
      cb(null, result);
    });
  }

  function getNumber(data, cb) {
    var query = {};
    query = {createdAt: { $gte: new Date(moment(new Date(data.from))), $lte: new Date(moment(new Date(data.to))),}, };
    log.info(query);
    mongoDBService.find("luckyDrawDB", "numbers", query, {}, function (error,result) {
      if (error) {
        cb(error, null);
        return;
      }
      cb(null, result);
    });
  }

  this.configure = configure;
  this.createGame = createGame;
  this.isGateOpen = isGateOpen;
  this.updateNumber = updateNumber;
  this.updateAdminNumber = updateAdminNumber;
  this.getAdminNumber = getAdminNumber;
  this.getNumberByDate = getNumberByDate;
  this.getNumber = getNumber;
}
