exports.PaytmGatewayService = PaytmGatewayService;

function PaytmGatewayService(ls, log){

	var self = this
    ,   _     = require('lodash')
    ,   config = null
    ,   mongo = require('mongodb')
    ,   https = require('https')
    ,   checksum_lib = require('../gateways/paytm/checksum')
    ,   transactionService = null
    ,   appConfig = ls.getSharedData('appConfig')
    ,   lsConfig = ls.getAppConfig()
    ,   execPhp = require('exec-php')
	;

	function configure(cb){
        config = appConfig;
        ls.getService('TransactionService', function(s){
            if(!s){
                log.error('error while getting TransactionService');
                cb({error:'error while getting TransactionService'}, null);
                return;
            }
            transactionService = s;
            cb(null, true);
        });
    }

    function initiatePayment(body, cb){
        var orderId = new mongo.ObjectID().toString()
        ,   paytmParams = {}
        ;
        paytmParams.body = {
            "requestType" : "Payment",
            "mid" : config.paytm.MID,
            "websiteName" : config.paytm.Website,
            "orderId" : orderId,
            "callbackUrl" : appConfig.APIURL+"/onPaytmGatewayResponse",
            "txnAmount" : {
                "value" : body.amount,
                "currency" : "INR",
            },
            "userInfo" : {
                "custId" : body.userId
            }
        };
        checksum_lib.genchecksumbystring(JSON.stringify(paytmParams.body), config.paytm.Merchant_KEY, function(err, checksum){
            paytmParams.head = {
                "signature"	: checksum
            };
            var post_data = JSON.stringify(paytmParams);
            var options = {
                hostname: config.paytm.hostname,
                /* for Production */
                //hostname: 'securegw.paytm.in',
                port: 443,
                path: `/theia/api/v1/initiateTransaction?mid=${config.paytm.MID}&orderId=${orderId}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };
            var response = "";
            var post_req = https.request(options, function(post_res){
                post_res.on('data', function (chunk){
                    response += chunk;
                });

                post_res.on('error', function(error){
                    log.error('error: ', error);
                    cb({message : 'error while initiating payment',error : error}, null);
                });

                post_res.on('end', function(){
                    //log.info('Response: ', response);
                    _.extend(paytmParams.body, body, {user_id : body.userId, type : 'transfer', transaction_type : 1, credit : 0, uncleared : body.amount, debit : 0, transaction_time : new Date()});
                    updateTransaction(paytmParams.body, JSON.parse(response), function(error, result){
                        if(error){
                            cb(error, null);
                            return;
                        }
                        var gatewayUrl = getGatewayUrl(orderId);
                        log.warn('gateurl',gatewayUrl);
                        cb(null, gatewayUrl);
                    });
                });
            });
            post_req.write(post_data);
            post_req.end();
        });
    }

    function initiateWithdrawalViaPaytm(body, cb){
        var orderId = new mongo.ObjectID().toString();
        var path = lsConfig.baseAppDir+'/server/gateways/paytm_sales2_user/paytm_response.php';
        log.warn('php path',path);
        execPhp(path, function(errorp, php, outprint){
            if(errorp){
                log.error(errorp);
                cb({message : 'something went wrong!'}, null);
                return;
            }
            //console.log(php);
            php.initiatewithdrawalviapaytm(body.phone, body.amount, orderId, function(error, result){
                console.log(error, result);
                if(error){
                    log.error(error);
                    log.error('error while initiateWithdrawalViaPaytm');
                    cb({message : 'error while initiateWithdrawalViaPaytm', error : error}, null);
                    return;
                }
                if(result && result.status == 'SUCCESS'){
                    _.extend(result, {type : 'withdrawal', user_id : body.userId, credit : 0, debit : body.amount, transaction_type : 1});
                }else{
                    _.extend(result, {type : 'withdrawal', user_id : body.userId, credit : 0, debit : 0, transaction_type : 1});
                }
                transactionService.addBalanceToUser(result, function(e, r){
                    if(e){
                        log.error(e);
                        log.error('error while addBalanceToUser');
                        cb({message : 'error while addBalanceToUser', error : e}, null);
                        return;
                    }
                    log.info(r);
                    cb(null, {message : 'balance withdraw successfully'});
                });
            });
        });
    }

    function updateTransaction(body, response, cb){
        var updateObj = {};
        response.body = response.body || {};
        _.extend(updateObj, response, body, {userId : body.userId, txnAmount : body.txnAmount, orderId : body.orderId, txnToken : response.body.txnToken});
        log.warn(JSON.stringify(updateObj));
        transactionService.createTransaction(updateObj, function(error, result){
            if(error){
                log.error(error);
                cb(error, null);
                return;
            }
            cb(null, result);
        });
    }

    function getGatewayUrl(orderId){
        return appConfig.APIURL+'/redirectToTransaction/'+orderId;
    }

    this.configure = configure;
    this.initiatePayment = initiatePayment;
    this.initiateWithdrawalViaPaytm = initiateWithdrawalViaPaytm;
}