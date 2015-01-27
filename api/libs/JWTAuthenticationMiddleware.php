<?php

/////////////////////////////////////////////////////////////////
namespace SlimMidllewares;
require __DIR__."/vendor/autoload.php";

class JWTAuthenticationMiddleware extends \Slim\Middleware
{

    /////////////////////////////////////////////////////////////////
    protected $JWTSignature;
    protected $protectedResources = array();
    public $loginCallback = null;

    /////////////////////////////////////////////////////////////////
    public function __call($closure, $args)
    {
        return call_user_func_array($this->$closure, $args);
    }

    /////////////////////////////////////////////////////////////////
    //public function __construct($JWTSignature, $protectedResources, $loginCallback)
    public function __construct($JWTSignature, $protectedResources)
    {
        $this->JWTSignature = $JWTSignature;
        $this->protectedResources = $protectedResources;
    }

    /////////////////////////////////////////////////////////////////
    public function call()
    {
        $app = $this->app;
        if($this->isProtected($app->request->getPathInfo())) 
        {
            try 
            {
                global $token;
                $token = $this->getToken($app->environment);
                global $tokenDecoded;
                $tokenDecoded = \JWT::decode($token, $this->JWTSignature);
                $this->next->call();
            } 
            catch(\Exception $e)
            {
                if ($e instanceof \DomainException OR $e instanceof \UnexpectedValueException) 
                {
                    $app->response->body("Forbidden");
                    $app->response->setStatus("403");
                }
                else 
                {
                    throw $e;
                }
            }        
        }
        else 
        {
            $this->next->call();
        }
    }

    /////////////////////////////////////////////////////////////////
    public function login($username, $password) 
    {
        //TODO AUTHENTICATE AGAINST DB OR WHATEVER
        $auth = false;
        if($this->loginCallback != null) {
            $auth = $this->loginCallback($username, $password);
        }

        if($auth) 
        {
            $data = array(
                "username" => $username,
                "extra" => "yeah !"
                );
            return \JWT::encode($data, $this->JWTSignature);
        }
        else {
            return false;
        }
    }

    /////////////////////////////////////////////////////////////////
    protected function isProtected($pathInfo) 
    {
        foreach ($this->protectedResources as $protectedResource) 
        {
            $protectedResource = "@^/".$protectedResource."$@";
            if (preg_match($protectedResource, $pathInfo) == 1) 
            {
                return true;
            }
        }
        return false;
    }

    /////////////////////////////////////////////////////////////////
    protected function getToken($env) 
    {
        $token = null;
        $extraParams = array();
        parse_str($env->offsetGet("QUERY_STRING"), $extraParams);
        if($env->offsetGet("HTTP_TOKEN") != null ) 
        {
            $token = $env->offsetGet("HTTP_TOKEN");
        }
        else if (array_key_exists("token",$extraParams)) {
            $token = $extraParams["token"];
        }
        return $token;
    }
}

?>