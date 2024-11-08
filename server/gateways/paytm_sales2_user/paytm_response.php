<?php
/**
 * Created by shubham srivastava.
 * Date: 09-04-2020
 */
require 'lib/config_paytm.php';
require 'lib/encdec_paytm.php';

function initiateWithdrawalViaPaytm($phone, $amount, $orderId){
    $data = array("request" => array( "requestType" => null,
                                        "merchantGuid" => PAYTM_MERCHANT_GUID,
                                        "merchantOrderId" => "$orderId",
                                        "salesWalletName"=> null,
                                        "salesWalletGuid"=>PAYTM_SALES_WALLET_GUID,
                                        "payeeEmailId"=>null,
                                        "payeePhoneNumber"=>"$phone",
                                        "payeeSsoId"=>"",
                                        "appliedToNewUsers"=>"Y",
                                        "amount"=>"$amount",
                                        "currencyCode"=>"INR",
                                        "pendingDaysLimit"=>0
                                    ),
                    "metadata"=>"PKTambola",
                    "ipAddress"=>"127.0.0.1",
                    "platformName"=>"PayTM",
                    "operationType"=>"SALES_TO_USER_CREDIT");
    $requestData=json_encode($data);
    $Checksumhash = getChecksumFromString($requestData,PAYTM_MERCHANT_KEY);
    $headerValue = array('Content-Type:application/json','mid:'.PAYTM_MERCHANT_GUID,'checksumhash:'.$Checksumhash);
    $ch = curl_init(PAYTM_GRATIFICATION_URL);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);     
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);   
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headerValue);
    $info = curl_getinfo($ch);
    $result = curl_exec($ch);
    $r = json_decode($result);
    return $r;
}