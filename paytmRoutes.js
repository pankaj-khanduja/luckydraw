module.exports = function (ls, express, config, log){
    
    var self = this
	,   path = require('path')
	,   _ = require('lodash')
    ,   moment = require('moment')
    ,   templates = ls.getCachedService('StaticTemplateLoaderService')
    ;

    express.post('/initiatePaymentViaPaytm', function(req, res){
        ls.getService('PaytmGatewayService',function(service){
            if(!service){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            var body = req.body;
            if(!body.amount || !body.userId){
                res.status(404).json({message:'requested api data is not valid'});
                return;
            }
            service.initiatePayment(body, function(error, result){
                if(error){
                   res.status(404).json({message:'error while deleteByPath', error : error});
                   return;
                }
                res.status(200).json(result); 
            });
        });
    });
    
    express.post('/initiateWithdrawalViaPaytm', function(req, res){
        ls.getService('PaytmGatewayService',function(service){
            if(!service){
              log.error('error while getting service');
              res.json({success:false});
              return;
            }
            var body = req.body;
            if(!body.amount || !body.phone || !body.userId){
                res.status(404).json({message:'requested api data is not valid'});
                return;
            }
            service.initiateWithdrawalViaPaytm(body, function(error, result){
                if(error){
                   res.status(404).json({message:'error while deleteByPath', error : error});
                   return;
                }
                res.status(200).json(result); 
            });
        });
    });

    express.get('/onPaytmGatewayResponse', function(req, res){
        var html = templates.getTemplate('completedPaytmPayment', {});
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(html);
        res.end();
    });

    express.post('/onPaytmGatewayResponse', function(req, res){
        console.log('inside status',req.body);
        ls.getService('TransactionService',function(service){
            if(!service){
              log.error('error while getting service');
              res.status(404).json({success:false});
              return;
            }
            if(!req.body.ORDERID){
                res.status(200).send();
                return;
            }
            service.updateResponceTransaction({orderId : req.body.ORDERID}, req.body, function(error, result){
                if(error){
                    res.status(404).json({message:'error while updateResponceTransaction', error : error});
                    return;
                }
                var html = templates.getTemplate('completedPaytmPayment', {});
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(html);
                res.end();
            });
        });
    });
    
    express.get('/redirectToTransaction/:orderId', function(req, res){
        if(req.params && !req.params['orderId']){
            res.status(404).json({success:false});
            return;
        }
        ls.getService('TransactionService',function(service){
            if(!service){
              log.error('error while getting service');
              res.status(404).json({success:false});
              return;
            }
            service.getTransactionByQuery({orderId : req.params['orderId']}, function(error, result){
                if(error){
                    res.status(404).json({message:'error while getTransactionByQuery', error : error});
                    return;
                }
                var html = templates.getTemplate('initiatePaytmPayment', _.merge({},result, config.paytm));
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(html);
                res.end();
            });
        });
    });
}