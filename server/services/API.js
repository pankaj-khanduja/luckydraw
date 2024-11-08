exports.API = API;

function API(ls, log){

	var self = this
	,   express
	,   app
    ,   io = null
    ,   server
    ,   socketMap = {}
    ,   bodyParser = require('body-parser')
    ,   config = null
	;

	function configure(cb){
        
        config = ls.getAppConfig().services.API;
        ls.events.on('START', start);

        function step1(){
        	initiliaseExpress(function(err, result){
        		if(err){
        		   cb(err, null);
        		   return;
        		}
        		onComplete();
        	});
        }

        function onComplete(){
            cb(null, true);
        }

        step1();
	}

	function initiliaseExpress(cb){
		express = require('express');
        app = express();
        var cors = require('cors');
        var corsOptions = {
          "origin": "*",
          "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
          "preflightContinue": false,
          "optionsSuccessStatus": 204
        }
        server = require('http').Server(app);
        io = require('socket.io')(server);

        io.on('connection', function(socket){
            socket.connected = true;
            addSocket(socket, function(authentication){
                if(!authentication){
                    log.error('Authorization Failed while connecting to socket');
                    socket.emit("ON_SERVER_DISCONNECTED", {message : "Authorization Failed while connecting to socket"});
                    socket.removeAllListeners();
                    socket.disconnect();
                    return;
                }
                log.info('valid socket connection');
            });
            socket.on('disconnect',function(){
                removeSocket(socket, function(authentication){});
            });
            socket.on('disconnect',function(){
                removeSocket(socket, function(authentication){});
            });
            socket.on('error',function(error){
                log.error('error',error);
            });
            socket.on('reconnect',function(error){
                log.error('reconnect',error);
            });
            socket.on('reconnect_attempt',function(error){
                log.error('reconnect_attempt',error);
            });
            socket.on('reconnecting',function(error){
                log.error('reconnecting',error);
            });
            socket.on('reconnect_error',function(error){
                log.error('reconnect_error',error);
            });
            socket.on('reconnect_error',function(error){
                log.error('reconnect_error',error);
            });
        });

        app.use(cors(corsOptions));
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(bodyParser.json());
        cb(null,true);
	}

	function getWebServer(){
		return app;
    }
    
    function publishToAll(event,data,maxTrigger){
        log.info('publishing to channel %s, event : %s',event,data);
        if(!maxTrigger || maxTrigger == 1){
            io.emit(event,data);
            return;
        }
        var args = arguments;
        n(event,data);
        voilateEvent(n, maxTrigger, args);

        function n(e, d){
            log.info('publishing to channel %s, event : %s',e,d);
            io.emit(e,d);
        }
    }
    
    function publishToChannel(channelName,event,data, maxTrigger){
        log.info('publishing to channel %s, event : %s',channelName,event);
        if(!maxTrigger || maxTrigger == 1){
            io.sockets.to(channelName).emit(event,data);
            return;
        }
        var args = arguments;
        n(channelName,event,data);
        voilateEvent(n, maxTrigger, args);

        function n(c, e, d){
            log.info('publishing to channel %s, event : %s',c,e);
            io.sockets.to(c).emit(e,d);
        }
    }

    function voilateEvent(fun, maxTrigger, args){
        var count = 1
        ,   live
        ;
        live = setInterval(function(){
            if(count == maxTrigger){
                clearInterval(live);
            }else{
                fun.apply(this, args);
                count++;
            }
        }, 1000);
    }
    
    function addSocket(socket, cb){
        log.info('addSocket',socket.handshake);
        var socketId = getSocketId(socket)
        ,   token = getToken(socket)
        ,   map = {}
        ;
        // if(!token){
        //     log.error('token not found');
        //     cb(false);
        //     return;
        // }
        // ls.getService('UserService', function(service){
        //     if(!service){
        //         log.error('error while getting userservice');
        //         cb(false);
        //         return;
        //     } 
        //     service.validateToken(token, function(error, tokenStatus){
        //         if(error){
        //             log.error(error);
        //             cb(false);
        //             return;
        //         }
                map[socketId] = socketId;
                socketMap[socketId] = socket;
                addSubscriptionChannel(socket, map);
                ls.events.emit('LISTION_FOR_EVENTS', socket);
                cb(true);
        //     });
        // });
    }

    function removeSocket(socket, cb){
        log.info('removeSocket',socket.handshake);
        var socketId = getSocketId(socket)
        ,   map = {}
        ;

        function next(){
            map[socketId] = socketId;
            removeSubscriptionChannel(socket, map);
            if(socket){
                socket.emit("ON_SERVER_DISCONNECTED", {message : "Connection Closed From Client"});
                socket.removeAllListeners();
                socket.disconnect();
                delete socketMap[socketId];
            }
            cb(true);
        }

        next();
    }

    function disconnectUserConnection(userMeta){
        log.warn('inside disconnectuserconnecton',userMeta);
        if(socketMap[userMeta.userID]){
            log.info('got connected socket');
            socketMap[userMeta.userID].emit("ON_SERVER_DISCONNECTED", {message : "Multiple Login Found"});
            socketMap[userMeta.userID].removeAllListeners();
            socketMap[userMeta.userID].disconnect();
            delete socketMap[userMeta.userID];
            return;
        }
        log.info('socket not found');
    }

    function joinRoom(room, userIds){
        var map = {};
        map[room] = room;
        userIds.forEach(function(userId){
            var conn = socketMap[userId];
            if(conn){
               log.warn('join Room %s, user : %s',room,userId);
               addSubscriptionChannel(conn, map);
               return;
            }
            log.warn('socket not found for user : %s',userId);
        });
    }

    function leaveRoom(room, userIds){
        var map = {};
        map[room] = room;
        userIds.forEach(function(userId){
            var conn = socketMap[userId];
            if(conn){
               log.warn('leave Room %s, user : %s',room,userId);
               removeSubscriptionChannel(conn, map);
            }
        });
    }

    function addSubscriptionChannel(socket,map){
        if(map){
            for(var key in map){
                socket.join(map[key]);
            }
        }
    }

    function removeSubscriptionChannel(socket,map){
        if(map){
            for(var key in map){
                socket.leave(map[key]);
            }
        }
    }

    function getSocketId(socket){
        var handshake = socket.handshake;
        if(handshake['query'] && handshake['query']['userId']){
        	return handshake['query']['userId'];
        }
        return socket.id;
    }
    
    function getToken(socket){
        var handshake = socket.handshake;
        if(handshake['query'] && handshake['query']['token']){
        	return handshake['query']['token'];
        }
        return null;
	}

	function start(){
		server.listen(config.port, function(){
            log.info('API Service Started');
            log.info(`App Is Running on :`+config.port);
		});
	}

    this.configure = configure;
    this.joinRoom = joinRoom;
    this.leaveRoom = leaveRoom;
    this.getWebServer = getWebServer;
    this.publishToAll = publishToAll;
    this.publishToChannel = publishToChannel;
    this.addSubscriptionChannel = addSubscriptionChannel;
    this.disconnectUserConnection = disconnectUserConnection;
    this.removeSubscriptionChannel = removeSubscriptionChannel;
}