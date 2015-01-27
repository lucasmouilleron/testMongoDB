<?php

/////////////////////////////////////////////////////////////
require __DIR__."/vendor/autoload.php";

class Tools
{

    /////////////////////////////////////////////////////////////
    static function loginCallback($login, $password) {
        return $login == ADMIN_LOGIN && $password == ADMIN_PASSWORD;
    }

    /////////////////////////////////////////////////////////////
    static function getAPIURL()
    {
        return Tools::getBaseUrl()."api";
    }

    /////////////////////////////////////////////////////////////
    static function getBaseUrl() {
        $absPath = str_replace("\\", "/", dirname(__FILE__)) . "/";
        $tempPath1 = explode("/", str_replace("\\", "/", dirname($_SERVER["SCRIPT_FILENAME"])));
        $tempPath2 = explode("/", substr($absPath, 0, -1));
        $tempPath3 = explode("/", str_replace("\\", "/", dirname($_SERVER["PHP_SELF"])));

        for ($i = count($tempPath2); $i < count($tempPath1); $i++) {
            array_pop ($tempPath3);
        }

        $urladdr = $_SERVER["HTTP_HOST"] . implode("/", $tempPath3);
        $protocol = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off" || $_SERVER["SERVER_PORT"] == 443) ? "https://" : "http://";

        if ($urladdr{strlen($urladdr) - 1}== "/")
            return $protocol.$urladdr;
        else
            return $protocol.$urladdr . "/";
    }

    /////////////////////////////////////////////////////////////
    static function getDB() {
        $con = new MongoClient("mongodb://".DB_HOST.":".DB_PORT, array("username" => DB_USER, "password" => DB_PASSWORD));
        return $con->selectDB(DB_BASE);
    }

    /////////////////////////////////////////////////////////////
    static function generateRandomString($length = 10) {
        $characters = ' 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    /////////////////////////////////////////////////////////////
    static function generateRandomPoint($lat, $long, $radius) {

        $centre = [$lat, $long];
        $radius_earth = 3959; //miles

        //Pick random distance within $distance;
        $distance = lcg_value()*$radius;

        //Convert degrees to radians.
        $centre_rads = array_map( 'deg2rad', $centre );

        //First suppose our point is the north pole.
        //Find a random point $distance miles away
        $lat_rads = (pi()/2) -  $distance/$radius_earth;
        $lng_rads = lcg_value()*2*pi();


        //($lat_rads,$lng_rads) is a point on the circle which is
        //$distance miles from the north pole. Convert to Cartesian
        $x1 = cos( $lat_rads ) * sin( $lng_rads );
        $y1 = cos( $lat_rads ) * cos( $lng_rads );
        $z1 = sin( $lat_rads );


        //Rotate that sphere so that the north pole is now at $centre.

        //Rotate in x axis by $rot = (pi()/2) - $centre_rads[0];
        $rot = (pi()/2) - $centre_rads[0];
        $x2 = $x1;
        $y2 = $y1 * cos( $rot ) + $z1 * sin( $rot );
        $z2 = -$y1 * sin( $rot ) + $z1 * cos( $rot );

        //Rotate in z axis by $rot = $centre_rads[1]
        $rot = $centre_rads[1];
        $x3 = $x2 * cos( $rot ) + $y2 * sin( $rot );
        $y3 = -$x2 * sin( $rot ) + $y2 * cos( $rot );
        $z3 = $z2;


        //Finally convert this point to polar co-ords
        $lng_rads = atan2( $x3, $y3 );
        $lat_rads = asin( $z3 );

        return array_map( 'rad2deg', array( $lat_rads, $lng_rads ) );
    }

}


?>