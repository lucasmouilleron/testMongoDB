<?php

/////////////////////////////////////////////////////////////////
// SETUP
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
require_once __DIR__."/libs/vendor/autoload.php";
require_once __DIR__."/libs/JWTAuthenticationMiddleware.php";
require_once __DIR__."/libs/tools.php";
require_once __DIR__."/config/config.php";
require_once __DIR__."/libs/vendor/palanik/corsslim/CorsSlim.php";

/////////////////////////////////////////////////////////////////
$protectedRoutes = array("private/.+", "private","shop/edit.+","shop/edit/.+", "shops");

//<?php $cursor = $shops->find()->sort(array("_id"=>-1))->limit($limit)->skip($skip);

/////////////////////////////////////////////////////////////////
// SLIM CONFIG AND MIDDLEWARES
/////////////////////////////////////////////////////////////////
$app = new \Slim\Slim(array("debug" => DEBUG));
$app->add(new \CorsSlim\CorsSlim());
$app->response->headers->set("Content-Type", "application/json");
$JWTAuthenticationMiddleware = new \SlimMidllewares\JWTAuthenticationMiddleware(JWT_PRIVATE_KEY, $protectedRoutes);
$JWTAuthenticationMiddleware->loginCallback = function($username, $password) {return Tools::loginCallback($username, $password);};
$app->add($JWTAuthenticationMiddleware);

/////////////////////////////////////////////////////////////////
// ERRORS
/////////////////////////////////////////////////////////////////
$app->error(function (\Exception $e) use ($app) {
    $app->halt(500, json_encode("Server error"));
});
$app->notFound(function () use ($app) {
    $app->halt(404, json_encode("Not found"));
});

/////////////////////////////////////////////////////////////////
// ROUTES
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
$app->post("/login", function () use ($app, $JWTAuthenticationMiddleware) {
    $token = $JWTAuthenticationMiddleware->login($app->request->post("username"), $app->request->post("password"));
    echo json_encode(array("token"=>$token));
});

/////////////////////////////////////////////////////////////////
$app->get("/login/:username/:password", function ($username, $password) use ($app, $JWTAuthenticationMiddleware) {
    $token = $JWTAuthenticationMiddleware->login($username, $password);
    echo json_encode(array("token"=>$token));
});

/////////////////////////////////////////////////////////////////
$app->post("/shop/edit", function () use ($app) {
    $name = filter_var($app->request->post("name"), FILTER_SANITIZE_STRING);
    $city = filter_var($app->request->post("city"), FILTER_SANITIZE_STRING);
    $zip = filter_var($app->request->post("zip"), FILTER_SANITIZE_STRING);
    $street = filter_var($app->request->post("street"), FILTER_SANITIZE_STRING);
    $lat = floatval($app->request->post("lat"));
    $lng = floatval($app->request->post("lng"));
    $document = array("name" => $name, "address" => array("street" => $street, "zip" => $zip, "city" => $city), "loc" => array("type" => "Point", "coordinates" => array($lat, $lng)));
    try {
        $shopsDB = Tools::getDB()->shops;
        $result = $shopsDB->insert($document);
        echo json_encode($document["_id"]->{'$id'});
    } catch(Exception $e) {
        echo json_encode(0);
    }
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/:lat/:lng", function ($lat, $lng) use ($app) {
    $lat = floatval($lat);
    $lng = floatval($lng);
    $shops = [];
    $shopsDB = Tools::getDB()->shops;
    $results = $shopsDB->find(array("loc" => array('$near' => array("type" => "Point", "coordinates" => array($lat, $lng)))))->limit(MAX_STORES);
    foreach($results as $result) {
        $shops[] = $result;
    }
    echo json_encode($shops);
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/:SWLat/:SWLng/:NELat/:NELng", function ($SWLat, $SWLng, $NELat, $NELng) use ($app) {
    $NELat = floatval($NELat);
    $NELng = floatval($NELng);
    $SWLat = floatval($SWLat);
    $SWLng = floatval($SWLng);
    $shops = [];
    $shopsDB = Tools::getDB()->shops;
    $results = $shopsDB->find(array("loc" => array('$within' => array('$box' => array(array($SWLat, $SWLng), array($NELat, $NELng))))))->limit(MAX_STORES);
    foreach($results as $result) {
        $shops[] = $result;
    }
    echo json_encode($shops);
});

/////////////////////////////////////////////////////////////////
$app->run();

?>