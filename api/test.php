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

/*$faker = Faker\Factory::create();
for ($i=0; $i < 3; $i++) { 
	$point = Tools::generateRandomPoint(DEFAULT_LAT, DEFAULT_LNG, 100);
	$request = Requests::post(Tools::getBaseURL()."/shop/edit", array("token"=> $token), array("name"=>$faker->company, "street"=> $faker->streetAddress, "city"=>$faker->city, "zip"=>$faker->postcode, "lat"=>$point[0], "lng"=>$point[1]));
    var_dump($request->body);
}*/

/*$request = Requests::delete(Tools::getBaseURL()."/shop/54ca379e76635393b90041ac", array("token" => $token));
var_dump($request->body);*/

/*$faker = Faker\Factory::create();
$point = Tools::generateRandomPoint(DEFAULT_LAT, DEFAULT_LNG, 100);
$request = Requests::post(Tools::getBaseURL()."/shop/edit", array("token"=> $token), array("id"=>"54ca36c4766353b5ba0041ab", "name"=>$faker->company, "street"=> $faker->streetAddress, "city"=>$faker->city, "zip"=>$faker->postcode, "lat"=>$point[0], "lng"=>$point[1]));
var_dump($request->body);*/

//$request = Requests::get(Tools::getAPIURL()."/shops/".TEST_LAT."/".TEST_LNG);
//var_dump($request->body);

?>