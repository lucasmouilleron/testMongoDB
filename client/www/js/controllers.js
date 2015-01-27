/////////////////////////////////////////////////////////////////////
controllers.controller("appController", function($scope, miscsService, APIService) {   

    $scope.logout = function() {
        APIService.logout();
        miscsService.goWithoutHistory("app.home");
    };

});

/////////////////////////////////////////////////////////////////////
controllers.controller("homeController", function($scope, $ionicModal, growl, $ionicLoading, $state, miscsService, APIService) {

    if (!APIService.isAuthentificated()) {

        $scope.buttonText = "Log in";

        $scope.loginData = {
            host:config.API_HOST+"/"+config.API_URL,
            port:config.API_PORT,
            username:"",
            password:""
        };

        $ionicModal.fromTemplateUrl("templates/login.html", {
            scope: $scope,
            backdropClickToClose: false
        }).then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });

        $scope.doLogin = function() {
            miscsService.loading("Working", "fa-cloud","faa-flash");
            APIService.login($scope.loginData.host, $scope.loginData.port, $scope.loginData.username, $scope.loginData.password).then(function(token) {
                miscsService.hideLoading();
                if(APIService.isAuthentificated()) {
                    $scope.modal.hide();
                }
                else {
                    growl.error("Can't log in !");
                }
            });
        };
    }

});

/////////////////////////////////////////////////////////////////////
controllers.controller("mapController", function($scope, $ionicLoading, $ionicModal, $timeout, $q, growl, APIService, leafletEvents, miscsService, locationService) {

    $scope.init = function() {

        $scope.me = {};
        $scope.me.centerLat = config.TEST_LAT;
        $scope.me.centerLng = config.TEST_LNG;
        miscsService.hideLoading();
        $scope.map = {
            zoom: config.DEFAULT_ZOOM,
            defaults: {tileLayer: "http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png", maxZoom: 18, minZoom: 15, zoomControlPosition: "bottomleft"},
            events: {
                map: {enable:  ["moveend", "zoomend", "contextmenu"], logic: "emit"},
                markers: {enable: ["click"]}
            },
            center: {lat: $scope.me.centerLat, lng: $scope.me.centerLng, zoom: config.DEFAULT_ZOOM}
        };
        $scope.mapDetail = {
            zoom: config.DEFAULT_DETAIL_ZOOM,
            defaults: {tileLayer: "http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png", dragging: false, maxZoom: 18, zoomControlPosition: "bottomleft", zoomControl:false}
        };
        $scope.locate();
    };

    $scope.locate = function() {
        var lat = config.TEST_LAT;
        var lng = config.TEST_LNG;
        miscsService.loading("Acquiring location", "fa-location-arrow","faa-ring");
        locationService.getLocation().then(function(position) {
            lat = position.lat;
            lng= position.lng;
        }).finally(function() {
            miscsService.hideLoading();
            $scope.map.center = {lat : lat, lng : lng, zoom: $scope.map.zoom};
        });
    };

    $scope.$on("leafletDirectiveMap.moveend", function(event, moveEvent){
        var mapID = moveEvent.leafletEvent.target._container.id;
        if(mapID == "map" && $scope.me.centerLat != $scope.map.center.lat && $scope.me.centerLng != $scope.map.center.lng) {
            $scope.me.SWLat = $scope.map.bounds.southWest.lat;
            $scope.me.SWLng = $scope.map.bounds.southWest.lng;
            $scope.me.NELat = $scope.map.bounds.northEast.lat;
            $scope.me.NELng = $scope.map.bounds.northEast.lng;
            $scope.me.centerLat = $scope.map.center.lat;
            $scope.me.centerLng = $scope.map.center.lng;
            $scope.getShops($scope.me.SWLat, $scope.me.SWLng, $scope.me.NELat, $scope.me.NELng);
        }
    });

    $scope.$on("leafletDirectiveMarker.click", function(event, locationEvent){
        $scope.shopDetail = locationEvent.leafletEvent.target.options.shop;
        $scope.mapDetail.center = {lat: $scope.shopDetail.loc.coordinates[0], lng: $scope.shopDetail.loc.coordinates[1], zoom: $scope.mapDetail.zoom};
        $scope.mapDetail.markers = [{"shop": $scope.shopDetail, "lat": $scope.shopDetail.loc.coordinates[0], "lng": $scope.shopDetail.loc.coordinates[1]}];
        $ionicModal.fromTemplateUrl("templates/shop.html", {
            backdropClickToClose: false,
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });
    });

    $scope.$on("leafletDirectiveMap.zoomend", function(event, zoomEvent){
        var mapID = zoomEvent.leafletEvent.target._container.id;
        if(mapID == "map") {
            $scope.map.zoom = zoomEvent.leafletEvent.target.getZoom();  
        }
    });

    $scope.closeShop = function() {
        $scope.modal.remove();
    };

    $scope.getShops = function(SWLat, SWLng, NELat, NELng) {
        miscsService.loading("Working", "fa-cloud","faa-flash");
        APIService.get("/shops/"+$scope.me.SWLat+"/"+$scope.me.SWLng+"/"+$scope.me.NELat+"/"+$scope.me.NELng).then(function(shops) {
            growl.info("Shops loaded for "+SWLat+" and "+SWLng+" and "+NELat+" and "+NELng);
            $scope.map.markers = [];
            $timeout(function() {
                for (var i = 0; i < shops.length; i++) {
                    var marker = {"shop": shops[i], "lat": shops[i].loc.coordinates[0], "lng": shops[i].loc.coordinates[1]};
                    $scope.map.markers.push(marker);
                }
            });
        }).catch(function(error) {
            growl.error("Error : "+error);
        }).finally(function() {
            miscsService.hideLoading();
        });
    };

    $scope.init();

});

/////////////////////////////////////////////////////////////////////
controllers.controller("shopsController", function($scope, $ionicLoading, $ionicModal, growl, APIService, miscsService) {

    $scope.dataFetched = false;
    $scope.filter = {};

    $scope.getShops = function() {
        APIService.get("/shops/"+config.TEST_LAT+"/"+config.TEST_LNG).then(function(shops) {
            $scope.dataFetched = true;
            $scope.shops = shops;
            $scope.$broadcast("scroll.refreshComplete");
        }).catch(function(error) {
            growl.error("Error : "+error);
            $scope.$broadcast("scroll.refreshComplete");
        }).finally(function() {
            miscsService.hideLoading();
        });
    };

    $scope.doRefresh = function() {
        miscsService.loading("Working", "fa-cloud","faa-flash");
        $scope.getShops();
    };

    $scope.doRefreshPull = function() {
        $scope.getShops();
    };

    $scope.doRefresh();

});