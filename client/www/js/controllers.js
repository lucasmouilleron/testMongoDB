/////////////////////////////////////////////////////////////////////
controllers.controller("appController", function($scope, miscsService, APIService) {   

    $scope.logout = function() {
        APIService.logout();
        miscsService.goWithoutHistory("app.home");
    };

});

/////////////////////////////////////////////////////////////////////
controllers.controller("homeController", function($scope, $ionicModal, growl, $ionicLoading, $state, miscsService, APIService) {

    if (!APIService.isAuthentificated() && config.ADMIN_MODE) {

        $scope.buttonText = "Log in";

        $scope.loginData = {
            url:"http://"+config.API_HOST+"/"+config.API_URL,
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
            miscsService.loading("Working");
            APIService.login($scope.loginData.url, $scope.loginData.username, $scope.loginData.password).then(function(token) {
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
        $scope.me.centerLat = config.DEFAULT_LAT;
        $scope.me.centerLng = config.DEFAULT_LNG;
        $scope.marketsMap = new HashMap();

        miscsService.hideLoading();
        $scope.map = {
            zoom: config.DEFAULT_ZOOM,
            defaults: {tileLayer: config.MAP_TILE_URL, maxZoom: 18, minZoom: 15, zoomControlPosition: "bottomleft"},
            events: {
                map: {enable:  ["moveend", "zoomend", "contextmenu"], logic: "emit"},
                markers: {enable: ["click"]}
            },
            center: {lat: $scope.me.centerLat, lng: $scope.me.centerLng, zoom: config.DEFAULT_ZOOM},
            markers: []
        };
        $scope.mapDetail = {
            zoom: config.DEFAULT_DETAIL_ZOOM,
            defaults: {tileLayer: config.MAP_TILE_URL, dragging: false, maxZoom: 18, zoomControlPosition: "bottomleft", zoomControl:false}
        };
        $scope.locate();
    };

    $scope.locate = function() {
        var lat, lng;
        miscsService.loading("Acquiring location", "fa-location-arrow","faa-ring");
        locationService.getLocation().then(function(position) {
            lat = position.lat;
            lng = position.lng;
        }).finally(function() {
            if(lat == undefined || lng == undefined) {
                lat = config.DEFAULT_LAT;
                lng = config.DEFAULT_LNG;
                growl.error("Can't locate !");
            }
            miscsService.hideLoading();
            $scope.map.center = {lat : lat, lng : lng, zoom: $scope.map.zoom};
            
        });
    };

    $scope.$on("leafletDirectiveMap.moveend", function(event, moveEvent){
        var mapID = moveEvent.leafletEvent.target._container.id;
        if(mapID == "map" && $scope.me.centerLat != $scope.map.center.lat && $scope.me.centerLng != $scope.map.center.lng && $scope.map.bounds) {
            $timeout(function() {
                $scope.me.SWLat = $scope.map.bounds.southWest.lat;
                $scope.me.SWLng = $scope.map.bounds.southWest.lng;
                $scope.me.NELat = $scope.map.bounds.northEast.lat;
                $scope.me.NELng = $scope.map.bounds.northEast.lng;
                $scope.me.centerLat = $scope.map.center.lat;
                $scope.me.centerLng = $scope.map.center.lng;
                $scope.getShops($scope.me.SWLat, $scope.me.SWLng, $scope.me.NELat, $scope.me.NELng);
            });
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
        miscsService.loading("Working");
        APIService.get("/shops/"+SWLat+"/"+SWLng+"/"+NELat+"/"+NELng).then(function(shops) {
            if(config.DEBUG_MODE) growl.info(shops.length + " shops loaded for "+SWLat+" and "+SWLng+" and "+NELat+" and "+NELng);
            for (var i = 0; i < shops.length; i++) {
                if(!$scope.marketsMap.has(shops[i]._id.$id)) {
                    $scope.marketsMap.set(shops[i]._id.$id, shops[i]);
                    var marker = {shop: shops[i], bounceOnAdd:true, bounceOnAddOptions: {duration: 500, height: 20}, lat: shops[i].loc.coordinates[0], lng: shops[i].loc.coordinates[1]};
                        //var marker = {shop: shops[i], lat: shops[i].loc.coordinates[0], lng: shops[i].loc.coordinates[1]};
                        $scope.map.markers.push(marker);
                    }
                }
            }).catch(function(error) {
                growl.error("Error : "+error);
            }).finally(function() {
                miscsService.hideLoading();
            });
        };

        $scope.init();

    });

/////////////////////////////////////////////////////////////////////
controllers.controller("manageController", function($scope, $ionicLoading, $ionicModal, $timeout, $ionicScrollDelegate, growl, APIService, miscsService) {

    $scope.dataFetched = false;
    $scope.loading = false;
    $scope.filter = {};
    $scope.filter.name = "";
    $scope.page = -1;
    $scope.shops = [];
    $scope.end = false;

    $scope.shortcuts = {
        "ctrl+up": function() {$ionicScrollDelegate.scrollTop()},
        "ctrl+down": function() {$ionicScrollDelegate.scrollBottom()}
    };

    $scope.getShops = function() {
        if(!$scope.loading) {
            $scope.loading = true;
            $scope.page++;
            var route = "/shops/last/"+$scope.page;
            if($scope.filter.name != "") {
                route = "/shops/search/"+$scope.filter.name+"/"+$scope.page;
            }
            APIService.get(route).then(function(shops) {
                if(shops.length) {
                    $scope.dataFetched = true;
                    if(config.DEBUG_MODE) growl.info(shops.length + " shops loaded for page "+$scope.page+" and name "+$scope.filter.name);
                    Array.prototype.push.apply($scope.shops, shops);
                }
                else {
                    $scope.end = true;
                }
            }).catch(function(error) {
                growl.error("Error : "+error);
            }).finally(function() {
                $scope.$broadcast("scroll.refreshComplete");
                $scope.$broadcast("scroll.infiniteScrollComplete");
                miscsService.hideLoading();
                $scope.loading = false;
            });
        }
    };

    $scope.scrollTop = function() {

    };

    // ON CLICK EDIT
    // AND ADD

    $scope.doFilter = function() {
        miscsService.loading("Working");
        $scope.shops = [];
        $scope.page = -1;
        $scope.end = false;
        $scope.getShops();
    }

    $scope.doRefreshBottom = function() {
        $scope.getShops();
    }

    $scope.doRefreshPull = function() {
        $scope.shops = [];
        $scope.page = -1;
        $scope.end = false;
        $scope.getShops();
    };

    miscsService.loading("Working");
    $scope.getShops();

});