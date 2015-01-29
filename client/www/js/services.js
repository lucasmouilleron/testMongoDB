/////////////////////////////////////////////////////////////////////
services.factory("locationService", function($state, $q, $http, $ionicHistory) {
    return {
        getLocation: function() {
            var deferred = $q.defer();
            try {
                navigator.geolocation.getCurrentPosition(function(position) {
                    
                        deferred.resolve({lat: position.coords.latitude, lng: position.coords.longitude});
                    }, function(err) {
                        deferred.reject(new Error("can't retrieve location"));
                    });
            }
            catch(e) {
                deferred.reject(new Error("can't retrieve location : "+e));
            }
            return deferred.promise;
        }
    }
});

/////////////////////////////////////////////////////////////////////
services.factory("APIService", function($state, $q, $http, $ionicHistory) {
	return {

        ////////////////////////////////////////////////////////////////////////////////
        login: function(url, username, password) {
        	this.savePrefs(url, username, password);
        	var deferred = $q.defer();
        	try {
        		var that = this;
        		this.post(
                    "/login",
                    {"username":username, "password":password},
                    function(result) {
                        if(result.token !== false) {
                            that.authentificate(result.token);
                        }
                        deferred.resolve(result.token);
                    },
                    function(result) {
                        deferred.resolve(false);
                    }
                    );
        	}
        	catch (e) {
                deferred.resolve(false);
            }
            return deferred.promise;
        },

        ////////////////////////////////////////////////////////////////////////////////
        isAuthentificated: function()
        {
            return (localStorage.getItem("authentificated") === "true");
        },

        ////////////////////////////////////////////////////////////////////////////////
        savePrefs: function(url, username, password)
        {
        	localStorage.setItem("password", password);
        	localStorage.setItem("username", username);
        	localStorage.setItem("url", url);
        },

        ////////////////////////////////////////////////////////////////////////////////
        authentificate: function(token)
        {
        	localStorage.setItem("authentificated", "true");
            localStorage.setItem("token", token);
        },

        ////////////////////////////////////////////////////////////////////////////////
        logout: function()
        {
        	localStorage.removeItem("authentificated");
            localStorage.removeItem("url");
            localStorage.removeItem("password");
            localStorage.removeItem("username");
            localStorage.removeItem("token");
        },

        ////////////////////////////////////////////////////////////////////////////////
        post: function(route, params) {
            var deferred = $q.defer();
            $http({
                method: "POST",
                url: this.getURL(route),
                data: tools.serializeData(params),
                headers: {"Content-Type": "application/x-www-form-urlencoded", "token":localStorage.getItem("token")}
            })
            .success(function(data, status) {
                deferred.resolve(data);
            }).
            error(function(error, status) {
                deferred.reject(new Error(error));
            });
            return deferred.promise;
        },

        ////////////////////////////////////////////////////////////////////////////////
        delete: function(route) {
            var deferred = $q.defer();
            $http({
                method: "DELETE",
                url: this.getURL(route),
                headers: {"token":localStorage.getItem("token")}
            })
            .success(function(data, status) {
                deferred.resolve(data);
            }).
            error(function(error, status) {
                deferred.reject(new Error(error));
            });
            return deferred.promise;
        },

        ////////////////////////////////////////////////////////////////////////////////
        get: function(route) {
        	var deferred = $q.defer();
            $http({
                method: "GET",
                url: this.getURL(route),
                headers: {"token":localStorage.getItem("token")}
            })
            .success(function(data, status) {
                deferred.resolve(data);
            }).
            error(function(error, status) {
                deferred.reject(new Error(error));
            });
            return deferred.promise;
        },

        ////////////////////////////////////////////////////////////////////////////////
        getURL: function(route) {
            var url = "http://"+config.API_HOST+"/"+config.API_URL;
            if(localStorage.getItem("url")) {
                url = localStorage.getItem("url");
            }
            return url+"/"+route;
        }
    }
});

/////////////////////////////////////////////////////////////////////
services.factory("miscsService", function($state, $ionicHistory, $rootScope, $interval, $ionicLoading, $timeout) {
	
    return {
        loaderCount: 0,
        lastShow: 0,
        minDuration: 400,
        reloads: new HashMap(),

        initReloads: function() {
            $rootScope.$on("$ionicView.enter", function(scope, state) {
                if(state.fromCache) {
                    $rootScope.$broadcast("shouldTestReloads", state);
                }
            });
        },

        shouldReload: function(state) {
            this.reloads.set(state, true);
        },

        didReload: function(state) {
            this.reloads.remove(state);
        },

        needsReload: function(state) {
            return this.reloads.has(state, true);
        },

        goWithoutHistory: function(newState) {
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
            });
            $state.transitionTo(newState, {});
        },

        loading: function(loadingText, loadingIcon, loadingAnimation) {
            this.lastShow = Date.now();
            this.loaderCount++;
            if(!loadingIcon) {
                loadingIcon = "fa-cloud";
            }
            if(!loadingAnimation) {
                loadingAnimation = "faa-flash";
            }
            $ionicLoading.show({perso:"lucas", template: "<i class='icon fa "+loadingIcon+" "+loadingAnimation+" animated'></i> "+loadingText});
        },

        hideLoading: function() {
            this.loaderCount--;
            if(this.loaderCount < 0) {
                this.loaderCount = 0;
            }
            var that = this;
            var ivl = $interval(function() {
                if(Date.now() - that.lastShow > that.minDuration && that.loaderCount <= 0) {
                    $interval.cancel(ivl);
                    $ionicLoading.hide();
                }
            }, 100);

        }
    }
});