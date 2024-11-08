exports.TransactionService = TransactionService;

function TransactionService(ls, log){
   
   var self = this
   ,   _ = require('lodash')
   ,   moment = require('moment')
   ,   mongoDBService = null
   ,   agenda = null
   ,   apiService = null
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
                ls.getService('API', function(service){
                    if(!service){
                        log.error('error while getting API');
                        cb({error:'error while getting API'}, null);
                        return;
                    }
                    apiService = service;
                    cb(null, true);
                }); 
            }); 
        }); 
    }

    function createTransaction(data, cb){
        getUserLastTransaction(data, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            log.info('old balance',result['balance']);
            data['balance'] = result['balance'];
            mongoDBService.save('tambolaDB', "user_transactions", data, function(e, r){
                if(e){
                    log.error(e);
                    cb({message:'error while addBalanceToUser', error : e}, null);
                    return;
                }
                log.warn('transaction created',JSON.stringify(data, null, 2));
                cb(null, r);
            });
        });
    }

    function getTransactionByQuery(query, cb){
        mongoDBService.findOne('tambolaDB', "user_transactions", query, {}, function(e, r){
            if(e){
                log.error(e);
                cb({message:'error while getTransactionByQuery', error : e}, null);
                return;
            }
            cb(null, r);
        });
    }

    function updateResponceTransaction(query, data, cb){
        mongoDBService.findOne('tambolaDB', "user_transactions", query, {}, function(error, transaction){
            if(error || !transaction){
                log.error(error);
                log.error('transaction not found');
                return;
            }
            if(data.STATUS == 'TXN_SUCCESS'){
                transaction['balance'] += transaction['uncleared'];
                transaction['credit'] = transaction['uncleared'];
            }else{
                transaction['credit'] = 0;
            }
            _.extend(transaction, data);
            mongoDBService.findOneAndUpdate('tambolaDB', "user_transactions", query, {$set:transaction}, {returnOriginal: false, returnNewDocument: true}, function(e, r){
                if(e){
                    log.error(e);
                    cb({message:'error while getTransactionByQuery', error : e}, null);
                    return;
                }
                var user_id = r.value['userId'].toString();
                log.warn('transaction updated',JSON.stringify(transaction, null, 2));
                apiService.publishToChannel(user_id, 'ON_USER_TRANSACTION_HISTORY_CHANGE', transaction);
                cb(null, r);
            });
        });
    }

    function addBalanceToUser(body, cb){
        getUserLastTransaction(body, function(error, result){
            if(error){
                cb(error, null);
                return;
            }
            log.error('last balance addBalanceToUser',result);
            if(body['credit'] == 0){
                result['balance'] -= body['debit']; 
            }
            if(body['debit'] == 0){
                result['balance'] += body['credit'];
            }
            var userTransaction = _.merge({}, body);
            userTransaction['balance'] = result['balance'];
            userTransaction.transaction_time = moment().add(5,'hours').add(30,'minutes').format('YYYY-MM-DD HH:mm:ss');
            userTransaction['transaction_id'] = body['owner_id'];
            mongoDBService.save('tambolaDB', "user_transactions", userTransaction, function(error, result){
                if(error){
                    cb({message:'error while addBalanceToUser', error : error}, null);
                    return;
                }
                log.warn('user transaction updated :',userTransaction);
                apiService.publishToChannel(userTransaction.user_id, 'ON_USER_TRANSACTION_HISTORY_CHANGE', userTransaction);
                if(body['owner_id']){
                    updateOwnerTransaction();
                    return;
                }
                cb(null, result);
            });
        });

        function updateOwnerTransaction(){
            getUserLastTransaction({user_id : body['owner_id']}, function(error, result){
                if(error){
                    cb(error, null);
                    return;
                }
                var ownerTransaction = _.merge({}, body);
                if(body['credit'] == 0){
                    result['balance'] += body['debit'];
                    ownerTransaction['credit'] = body['debit'];
                    ownerTransaction['debit'] = 0;
                    
                }
                if(body['debit'] == 0){
                    result['balance'] -= body['credit']; 
                    ownerTransaction['debit'] = body['credit'];
                    ownerTransaction['credit'] = 0;
                }
                ownerTransaction['user_id'] = body['owner_id']
                ownerTransaction['balance'] = result['balance'];
                ownerTransaction.transaction_time = moment().add(5,'hours').add(30,'minutes').format('YYYY-MM-DD HH:mm:ss');
                ownerTransaction['transaction_id'] = body['user_id'];
                mongoDBService.save('tambolaDB', "user_transactions", ownerTransaction, function(error, result){
                    if(error){
                        cb({message:'error while addBalanceToUser', error : error}, null);
                        return;
                    }
                    log.warn('owner transaction updated : %s',ownerTransaction);
                    apiService.publishToChannel(ownerTransaction.user_id, 'ON_USER_TRANSACTION_HISTORY_CHANGE', ownerTransaction);
                    cb(null, result);
                });
            });
        }
    }

    function getUserTransaction(body, cb){
        var query = {user_id : body.user_id};
        if(body.from && body.to){
            query['transaction_time'] = {$gte : new Date(moment(new Date(body.from)).subtract(5, 'hours').subtract(30, 'minutes')), $lte:new Date(moment(new Date(body.to)).set({hours : 23, minutes : 60}))};
        }
        if(body.transaction_type){
            query['transaction_type'] = body.transaction_type;
        }
        console.log(query);
        mongoDBService.find('tambolaDB', "user_transactions", query, {sort:{transaction_time : -1}}, function(error, result){
            if(error){
                cb({message:'error while getUserTransaction', error : error}, null);
                return;
            }
            cb(null, result);
        });
    }

    function isUserHasSufficientBalanceForBet(body, cb){
        getUserLastTransaction(body, function(error, result){
            if(error){
                log.error(error);
                cb(error, null);
                return;
            }
            log.error('last balance isUserHasSufficientBalanceForBet',result);
            if(body['current_betAmount'] === 0){
                log.warn('bet amount is zero',body['current_betAmount']);
                cb({'message' : 'bet amount is zero', current_betAmount : body['current_betAmount'], balance : result['balance']}, null);
                return;
            }
            var remainingCredit = result['balance'] - body['current_betAmount'];
            if(remainingCredit < 0){
                log.warn('low balance',remainingCredit);
                cb({'message' : 'inSufficient Balance', current_betAmount : body['current_betAmount'], balance : result['balance']}, null);
                return;
            }
            var finalAmount = {};
            _.extend(finalAmount, body);
            finalAmount['balance'] = remainingCredit;
            finalAmount['credit'] = 0;
            finalAmount['debit'] = body['current_betAmount'];
            if(result['id']){
                delete result['id'];
            }
            if(result['transaction_time']){
                delete result['transaction_time'];
            }
            finalAmount['transaction_type'] = body['transaction_type'];
            finalAmount['transaction_id'] = body['transaction_id'];
            finalAmount.transaction_time = moment().add(5,'hours').add(30,'minutes').format('YYYY-MM-DD HH:mm:ss');
            mongoDBService.save('tambolaDB', "user_transactions", finalAmount, function(e, r){
                if(e){
                    log.error(e);
                    cb({message:'error while addBalanceToUser', error : e}, null);
                    return;
                }
                apiService.publishToChannel(body.user_id, 'ON_USER_TRANSACTION_HISTORY_CHANGE', finalAmount);
                cb(null, result);
            });
        });
    }

    function updateBetTransaction(body, cb){
        getUserLastTransaction(body, function(error, result){
            if(error){
                log.error(error);
                cb && cb(error, null);
                return;
            }
            result['balance'] += body['bet_ammount'];
            result['credit'] = body['bet_ammount'];
            result['debit'] = 0;
            if(result['id']){
                delete result['id'];
            }
            if(result['transaction_time']){
                delete result['transaction_time'];
            }
            result['transaction_type'] = body['transaction_type'];
            result['transaction_id'] = body['transaction_id'];
            result['user_id'] = body['user_id'];
            result['payer_id'] = '0';
            var configInfo = _.merge({}, result);
            configInfo.transaction_time = moment().add(5,'hours').add(30,'minutes').format('YYYY-MM-DD HH:mm:ss');
            mongoDBService.save('tambolaDB', "user_transactions", configInfo, function(e, r){
                if(e){
                    log.error(e);
                    cb && cb({message:'error while addBalanceToUser', error : e}, null);
                    return;
                }
                apiService.publishToChannel(body.user_id, 'ON_USER_TRANSACTION_HISTORY_CHANGE', result);
                cb && cb(null, result);
            });
        });
    }

    function getUserLastTransaction(body,cb){
        var query = {user_id : body.user_id};
        mongoDBService.find('tambolaDB', "user_transactions", query, {sort:{transaction_time : -1}, limit : 1}, function(error, result){
            if(error){
                cb({message:'error while getUserLastTransaction', error : error}, null);
                return;
            }
            result = result && result[0] || {};
            if(_.size(result) == 0){
                result['balance'] = 0;
            }
            if(result._id){
                delete result._id;
            }
            cb(null, result);
        });
    }

    this.configure = configure;
    this.createTransaction = createTransaction;
    this.getTransactionByQuery = getTransactionByQuery;
    this.updateResponceTransaction = updateResponceTransaction;
    this.addBalanceToUser = addBalanceToUser;
    this.getUserTransaction = getUserTransaction;
    this.getUserLastTransaction = getUserLastTransaction;
    this.updateBetTransaction   = updateBetTransaction;
    this.isUserHasSufficientBalanceForBet = isUserHasSufficientBalanceForBet;
}