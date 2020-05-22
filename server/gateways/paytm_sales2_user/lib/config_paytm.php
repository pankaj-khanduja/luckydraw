<?php
/*
- Use PAYTM_ENVIRONMENT as 'PROD' if you wanted to do transaction in production environment else 'TEST' for doing transaction in testing environment.
- Change the value of PAYTM_MERCHANT_KEY constant with details received from Paytm.
- Change the value of PAYTM_MERCHANT_MID constant with details received from Paytm.
- Change the value of PAYTM_MERCHANT_WEBSITE constant with details received from Paytm.
- Above details will be different for testing and production environment.
*/

define('PAYTM_ENVIRONMENT', 'PROD'); // TEST PROD
define('PAYTM_MERCHANT_KEY', 'HNFLjYewgtJLa5VK'); //Change this constant's value with Merchant key downloaded from portal
define('PAYTM_MERCHANT_MID', 'PKTamb84471961355439'); //Change this constant's value with MID (Merchant ID) received from Paytm
define('PAYTM_MERCHANT_GUID', 'c5ee7f96-41d8-4557-b830-f77edce54691'); //Change this constant's value with MGUID (Merchant Guid) received from Paytm
define('PAYTM_SALES_WALLET_GUID', '7672d721-16c8-4e37-87b3-8312e7aa5c57'); //'a452fd48-b359-11e9-8708-fa163e429e83'); 
//Change this constant's value with Sales Wallet Guid received from Paytm

//define('PAYTM_SALES_WALLET_GUID', 'dd48f10c-5605-4da1-b891-254489e4d503'); //Change this constant's value with Sales Wallet Guid received from Paytm
define('PAYTM_MERCHANT_WEBSITE', 'WEBPROD'); // WEBSTAGING WEBPROD DEFAULT //Change this constant's value with Website name received from Paytm

$PAYTM_DOMAIN = "pguat.paytm.com";
$PAYTM_WALLET_DOMAIN = "trust-uat.paytm.in";
if (PAYTM_ENVIRONMENT == 'PROD') 
{
	$PAYTM_DOMAIN = 'secure.paytm.in';
	$PAYTM_WALLET_DOMAIN = "trust.paytm.in";
}

define('PAYTM_REFUND_URL', 'https://'.$PAYTM_DOMAIN.'/oltp/HANDLER_INTERNAL/REFUND');
define('PAYTM_STATUS_QUERY_URL', 'https://'.$PAYTM_DOMAIN.'/oltp/HANDLER_INTERNAL/TXNSTATUS');
define('PAYTM_TXN_URL', 'https://'.$PAYTM_DOMAIN.'/oltp-web/processTransaction');
define('PAYTM_GRATIFICATION_URL', 'https://'.$PAYTM_WALLET_DOMAIN.'/wallet-web/salesToUserCredit');

?>