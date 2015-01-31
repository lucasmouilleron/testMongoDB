/////////////////////////////////////////////////////////////////////
controllers.controller("appController", function($scope, miscsService, APIService) {   

    $scope.logout = function() {
        APIService.logout();
        miscsService.goWithoutHistory("app.home");
    };

});

/////////////////////////////////////////////////////////////////////
controllers.controller("homeController", function($scope, $ionicModal, growl, $state, miscsService, APIService) {

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
            miscsService.loadingBar();
            APIService.login($scope.loginData.url, $scope.loginData.username, $scope.loginData.password).then(function(token) {
                miscsService.hideLoadingBar();
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
controllers.controller("mapController", function($scope, $ionicModal, $timeout, $q, growl, APIService, leafletEvents, miscsService, locationService) {

    $scope.init = function() {

        $scope.me = {};
        $scope.me.centerLat = config.DEFAULT_LAT;
        $scope.me.centerLng = config.DEFAULT_LNG;
        $scope.marketsMap = {};

        miscsService.hideLoadingBar();
        $scope.map = {
            zoom: config.DEFAULT_ZOOM,
            defaults: {tileLayer: config.MAP_TILE_URL, maxZoom: config.MAX_ZOOM, minZoom: config.MIN_ZOOM, zoomControlPosition: "bottomleft", zoomControl:false},
            events: {
                map: {enable:  ["moveend", "zoomend", "contextmenu"], logic: "emit"},
                markers: {enable: ["click"]}
            },
            center: {lat: $scope.me.centerLat, lng: $scope.me.centerLng, zoom: config.DEFAULT_ZOOM},
            markers: []
        };
        $scope.mapDetail = {
            zoom: config.DEFAULT_DETAIL_ZOOM,
            defaults: {tileLayer: config.MAP_TILE_URL, dragging: false, maxZoom: config.MAX_ZOOM, zoomControlPosition: "bottomleft", zoomControl:false}
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
                $scope.me.widthInMeters = geolib.getDistance({latitude: $scope.me.SWLat, longitude: $scope.me.SWLng}, {latitude: $scope.me.NELat, longitude: $scope.me.NELng});
                $scope.getShops($scope.me.centerLat,$scope.me.centerLng,$scope.me.widthInMeters);
            });
        }
    });
    //
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

    $scope.getShops = function(lat, lng, distanceInMeters) {
        miscsService.loadingBar();
        APIService.get("/shops/"+lat+"/"+lng+"/"+distanceInMeters).then(function(shops) {
            if(config.DEBUG_MODE) growl.info(shops.length + " shops loaded for "+lat+" and "+lng+" and distance "+distanceInMeters);
            for (var i = 0; i < shops.length; i++) {
                if(!$scope.marketsMap[shops[i]._id.$id]) {
                    $scope.marketsMap[shops[i]._id.$id] = shops[i];
                    var marker = {shop: shops[i], bounceOnAdd:true, bounceOnAddOptions: {duration: 500, height: 20}, lat: shops[i].loc.coordinates[0], lng: shops[i].loc.coordinates[1]};
                    $scope.map.markers.push(marker);
                }
            }
        }).catch(function(error) {
            growl.error("Error : "+error);
        }).finally(function() {
            miscsService.hideLoadingBar();
        });
    };

    $scope.init();

});

/////////////////////////////////////////////////////////////////////
controllers.controller("manageController", function($scope, $ionicScrollDelegate, $state, $stateParams, $rootScope, $ionicHistory, growl, APIService, miscsService) {

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
                miscsService.hideLoadingBar();
                $scope.loading = false;
            });
        }
    };

    $scope.doAction = function(shop) {
        $state.go("app.editShop", {shopID: shop._id.$id});
    };

    $scope.doAdd = function() {
        $state.go("app.addShop");
    };

    $scope.doFilter = function() {
        miscsService.loadingBar();
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

    $rootScope.$on("shouldTestReloads", function(scope, state) {
        if(state.stateName == $state.current.name && miscsService.needsReload($state.current.name)) {
            miscsService.didReload($state.current.name);
            $scope.doFilter();
        }
    });

    $scope.doFilter();

});

/////////////////////////////////////////////////////////////////////
controllers.controller("editController", function($scope, $stateParams, $ionicPopup, $ionicHistory, $rootScope, growl, locationService, APIService, miscsService, leafletEvents, geocoderService) {

    $scope.shopID = $stateParams.shopID;

    $scope.getShop = function() {
        miscsService.loadingBar();
        APIService.get("/shop/"+$scope.shopID).then(function(shop) {
            $scope.shop = shop;
            if($scope.shop == false) {
                growl.error("Shop "+$scope.shopID+" does not exist");
                miscsService.goWithoutHistory("app.manageShops");
            }
            else {
                $scope.shopLat = $scope.shop.loc.coordinates[0];
                $scope.shopLat = $scope.shop.loc.coordinates[1];
                $scope.initMap();    
            }
        }).catch(function(error) {
            growl.error("Error : "+error);
        }).finally(function() {
            miscsService.hideLoadingBar();
        });
    };

    $scope.doEdit = function() {
        confirmPopup = $ionicPopup.confirm({
            title: "Confirm",
            template: "Do you want to save ?"
        }).then(function(res) {
            if(res) {
                miscsService.loadingBar();
                var data = {name:$scope.shop.name, street:$scope.shop.address.street, city:$scope.shop.address.city, zip:$scope.shop.address.zip, lat:$scope.shop.loc.coordinates[0], lng:$scope.shop.loc.coordinates[1]};
                if($scope.shopID) {
                    data.id = $scope.shopID;
                }
                APIService.post("/shop/edit", data).then(function(shop) {
                    growl.info("Shop saved "+shop);
                    miscsService.shouldReload("app.manageShops");
                }).catch(function(error) {
                    growl.error("Error : "+error);
                }).finally(function() {
                    miscsService.hideLoadingBar();
                });
            }
        });
    };

    $scope.doDelete = function() {
        confirmPopup = $ionicPopup.confirm({
            title: "Confirm",
            template: "Do you want to delete ?"
        }).then(function(res) {
            if(res) {
                APIService.delete("/shop/"+$scope.shopID).then(function(deleted) {
                    if(!deleted) {
                        growl.error("Can't delete shop "+$scope.shopID);
                    }
                    else {
                        growl.info("Shop "+$scope.shopID+" deleted");
                        miscsService.shouldReload("app.manageShops");
                        miscsService.goWithoutHistory("app.manageShops");
                    }
                }).catch(function(error) {
                    growl.error("Error : "+error);
                }).finally(function() {
                    miscsService.hideLoading();
                });
            }
        });
    };

    $scope.doLocalizeCurrentPosition = function() {
        var lat, lng;
        miscsService.loading("Acquiring location", "fa-location-arrow","faa-ring");
        locationService.getLocation().then(function(position) {
            lat = position.lat;
            lng = position.lng;
        }).finally(function() {
            if(lat == undefined || lng == undefined) {
                growl.error("Can't locate !");
            }
            else {
                $scope.shop.loc.coordinates[0] = lat;
                $scope.shop.loc.coordinates[1] = lng;
                growl.info("Current position geocoded !");
            }
            miscsService.hideLoading();
        });
    };

    $scope.doLocalizeAddress = function() {
        miscsService.loadingBar();
        $scope.address = $scope.shop.address.street+" "+$scope.shop.address.city+" "+$scope.shop.address.zip+" france";
        geocoderService.getLatLong($scope.address).then(function(latlng){
            $scope.shop.loc.coordinates[0] = latlng.lat();
            $scope.shop.loc.coordinates[1] = latlng.lng();
            growl.info("Address "+$scope.address+" geocoded !");
        }).catch(function(error) {
            growl.error("Can't localize address "+$scope.address);
        }).finally(function() {
            miscsService.hideLoadingBar();
        });
    };

    $scope.$on("leafletDirectiveMarker.drag", function(event, dragEvent){
        $scope.shop.loc.coordinates[0] = dragEvent.leafletEvent.target._latlng.lat;
        $scope.shop.loc.coordinates[1] = dragEvent.leafletEvent.target._latlng.lng;
    });

    $scope.initMap = function() {
        $scope.mapEdit = {
            zoom: config.DEFAULT_DETAIL_ZOOM,
            defaults: {tileLayer: config.MAP_TILE_URL, dragging: true, maxZoom: config.MAX_ZOOM, zoomControlPosition: "bottomleft", zoomControl:false},
            center: {lat: config.DEFAULT_LAT, lng: config.DEFAULT_LNG, zoom: config.DEFAULT_ZOOM},
            events: {
                markers: {enable: ["drag"]}
            },
        };
        $scope.updateMarker();
    };

    $scope.updateMarker = function() {
        var lat = parseFloat($scope.shop.loc.coordinates[0]) || 0;
        var lng = parseFloat($scope.shop.loc.coordinates[1]) || 0;
        if($scope.mapEdit) {
            $scope.mapEdit.markers = [{"shop": $scope.shop, "lat": lat, "lng": lng, draggable: true}];
            $scope.mapEdit.center = {lat: lat, lng: lng, zoom: $scope.mapEdit.center.zoom};
        }
    };

    $scope.$watch("shop.loc.coordinates", function() {
        $scope.updateMarker();
    }, true);

    $scope.shop = {};
    $scope.shop.loc = {};
    $scope.shop.loc.coordinates = [0, 0];
    $scope.shop.address = {};

    if($scope.shopID) {
        $scope.getShop();
    }
    else {
        $scope.initMap();
    }

});