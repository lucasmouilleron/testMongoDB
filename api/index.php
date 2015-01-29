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
$protectedRoutes = array("private/.+", "private","shop/edit.+","shop/edit/.+");

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
$app->error(function ($e) use ($app) {
    $app->halt(500, "Server error");
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
    try {
        $name = filter_var($app->request->post("name"), FILTER_SANITIZE_STRING);
        $city = filter_var($app->request->post("city"), FILTER_SANITIZE_STRING);
        $zip = filter_var($app->request->post("zip"), FILTER_SANITIZE_STRING);
        $street = filter_var($app->request->post("street"), FILTER_SANITIZE_STRING);
        $lat = floatval($app->request->post("lat"));
        $lng = floatval($app->request->post("lng"));
        $date = time()*1000;
        $id = filter_var($app->request->post("id"), FILTER_SANITIZE_STRING);
        $document = array("name" => $name, "date"=> $date, "address" => array("street" => $street, "zip" => $zip, "city" => $city), "loc" => array("type" => "Point", "coordinates" => array($lat, $lng)));
        $shopsDB = Tools::getDB()->shops;
        if($id) {
            $result = $shopsDB->update(array("_id" => new MongoId($id)), $document);
            if($result["nModified"] < 1) throw new Exception("non modified");
        }
        else {
            $result = $shopsDB->insert($document);
            $id = $document["_id"]->{'$id'};
        }
        echo json_encode($id);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode(false);
    }
});


/////////////////////////////////////////////////////////////////
$app->delete("/shop/:shopID", function ($shopID) use ($app) {
    $shopID = filter_var($shopID, FILTER_SANITIZE_STRING);
    $shopsDB = Tools::getDB()->shops;
    try {
        $result = $shopsDB->remove(array("_id" => new MongoId($shopID)));
        if($result["n"] < 1) throw new Exception("non deleted");
        echo json_encode(true);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode(false);
    }
});


/////////////////////////////////////////////////////////////////
$app->get("/shop/:shopID", function ($shopID) use ($app) {
    $shopID = filter_var($shopID, FILTER_SANITIZE_STRING);
    $shopsDB = Tools::getDB()->shops;
    try {
        $shop = $shopsDB->findOne(array("_id" => new MongoId($shopID)));
        if($shop == null) $shop = false;
        echo json_encode($shop);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode(false);
    }
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/search/:name/:page", function ($name, $page) use ($app) {
    try {
        $shops = [];
        $shopsDB = Tools::getDB()->shops;
        $step = MAX_STORES;
        $results = $shopsDB->find(array("name"=> new MongoRegex("/".$name."/i")))->sort(array("date" => -1))->limit($step)->skip($page*$step);
        foreach($results as $result) {
            $shops[] = $result;
        }
        echo json_encode($shops);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode([]);
    }
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/last/:page", function ($page) use ($app) {
    try {
        $shops = [];
        $shopsDB = Tools::getDB()->shops;
        $step = MAX_STORES;
        $results = $shopsDB->find()->sort(array("date" => -1))->limit($step)->skip($page*$step);
        foreach($results as $result) {
            $shops[] = $result;
        }
        echo json_encode($shops);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode([]);   
    }
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/:lat/:lng/:distanceInMeters", function ($lat, $lng, $distanceInMeters) use ($app) {
    try {
        $lat = floatval($lat);
        $lng = floatval($lng);
        $distanceInMeters = intval($distanceInMeters);
        $shops = [];
        $shopsDB = Tools::getDB()->shops;
        $results = $shopsDB->find(array("loc" => array('$near' => array("type" => "Point", "coordinates" => array($lat, $lng)), '$maxDistance' => $distanceInMeters)))->limit(MAX_STORES);
        foreach($results as $result) {
            $shops[] = $result;
        }
        echo json_encode($shops);
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode([]);   
    }
});

/////////////////////////////////////////////////////////////////
$app->get("/shops/:SWLat/:SWLng/:NELat/:NELng", function ($SWLat, $SWLng, $NELat, $NELng) use ($app) {
    try {
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
    } catch(Exception $e) {
        if(DEBUG) throw $e;
        echo json_encode([]);   
    }
});

/////////////////////////////////////////////////////////////////
$app->run();

?>