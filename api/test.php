<?php

/////////////////////////////////////////////////////////////////
require_once __DIR__."/libs/tools.php";
require_once __DIR__."/config/config.php";
require_once __DIR__."/libs/vendor/autoload.php";

/////////////////////////////////////////////////////////////////
$token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXh0cmEiOiJ5ZWFoICEifQ.vukIsXTlaGTdInYJ8YgPmR59BH-RC6pMKL2Fb8Ka0wU";

/////////////////////////////////////////////////////////////////
// login (post)
//$request = Requests::post(Tools::getAPIURL()."/login", array(), array("username"=>"admin", "password"=>"theadmin"));
//var_dump($request->body);

//$request = Requests::get(getAPIURL()."/login/test/test2");

// private content
//$request = Requests::get(getAPIURL()."/private/lucas/mouilleron");
//$request = Requests::get(getAPIURL()."/private");
//$request = Requests::get(getAPIURL()."/private/lucas", array("token" => $token));

/*for ($i=0; $i < 10000; $i++) { 
	$point = Tools::generateRandomPoint(DEFAULT_LAT, DEFAULT_LNG, 100);
	$request = Requests::post(Tools::getBaseURL()."/shop/edit", array("token"=> $token), array("name"=>Tools::generateRandomString(), "street"=> Tools::generateRandomString(40), "city"=>Tools::generateRandomString(), "zip"=>Tools::generateRandomString(5), "lat"=>$point[0], "lng"=>$point[1]));
}*/

//$request = Requests::get(Tools::getAPIURL()."/shops/".TEST_LAT."/".TEST_LNG);
var_dump($request->body);

?>