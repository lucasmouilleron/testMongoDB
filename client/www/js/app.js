/////////////////////////////////////////////////////////////////////
var app = angular.module("app", ["ionic", "app.controllers", "app.services", "app.directives", "app.filters", "angular-growl", "leaflet-directive", "mousetrap", "geocoder-service", "cfp.loadingBar", "ngAnimate"]);
var controllers = angular.module("app.controllers", []);
var directives = angular.module("app.directives", []);
var services = angular.module("app.services", []);
var filters = angular.module("app.filters", []);

/////////////////////////////////////////////////////////////////////
app.run(function($ionicPlatform, $rootScope, $state, APIService, miscsService) {

    config.app = ionic.Platform.isWebView();
    config.device = ionic.Platform.isIOS() || ionic.Platform.isAndroid();
    $rootScope.tools = tools;
    $rootScope.config = config;

    miscsService.initReloads();

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
        if(toState.name != "app.home" && !APIService.isAuthentificated() && config.ADMIN_MODE) {
            if(toState.name != "app.home") {
                event.preventDefault();
                $state.go("app.home");
            }
        }
    });

    $ionicPlatform.ready(function() {
    });

});

/////////////////////////////////////////////////////////////////////
app.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider.state("app", {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: "appController"
    });

    $stateProvider.state("app.home", {
        cache: false,
        url: "/home",
        views: {
            "menuContent": {
                controller: "homeController",
                templateUrl: "templates/home.html"
            }
        }
    });

    $stateProvider.state("app.manageShops", {
        url: "/shops/manage",
        views: {
            "menuContent": {
                templateUrl: "templates/manage.html",
                controller: "manageController"
            }
        }
    });

    $stateProvider.state("app.editShop", {
        cache: false,
        url: "/shop/edit/:shopID",
        views: {
            "menuContent": {
                templateUrl: "templates/edit.html",
                controller: "editController"
            }
        }
    });

    $stateProvider.state("app.addShop", {
        cache: false,
        url: "/shop/add",
        views: {
            "menuContent": {
                templateUrl: "templates/edit.html",
                controller: "editController"
            }
        }
    });

    $stateProvider.state("app.map", {
        cache: false,
        url: "/map",
        views: {
            "menuContent": {
                templateUrl: "templates/map.html",
                controller: "mapController"
            }
        }
    }); 

    $urlRouterProvider.otherwise("/app/home");
});

/////////////////////////////////////////////////////////////////////
app.config(["$compileProvider", function ($compileProvider) {
  $compileProvider.debugInfoEnabled(config.DEBUG_MODE);
}]);

/////////////////////////////////////////////////////////////////////
app.config(["cfpLoadingBarProvider", function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.latencyThreshold = 1;
}])

/////////////////////////////////////////////////////////////////////
app.config(["growlProvider", function(growlProvider) {
    growlProvider.globalTimeToLive(5000);
    growlProvider.globalDisableCountDown(true);
    growlProvider.globalPosition("bottom-right");
    growlProvider.onlyUniqueMessages(false);
}]);