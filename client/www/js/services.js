/////////////////////////////////////////////////////////////////////
services.factory("locationService", function($state, $q, $http, $ionicHistory) {
    return {
        getLocation: function() {
            var deferred = $q.defer();
            try {
                navigator.geolocation.getCurrentPosition(function(position) {
                    //$cordovaGeolocation.getCurrentPosition().then(function (position) 
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
        login: function(host, port, username, password) {
        	this.savePrefs(host, port, username, password);
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
        savePrefs: function(host, port, username, password)
        {
        	localStorage.setItem("password", password);
        	localStorage.setItem("username", username);
        	localStorage.setItem("host", host);
        	localStorage.setItem("port", port);
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
        	localStorage.removeItem("password");
        	localStorage.removeItem("host");
        	localStorage.removeItem("port");
        	localStorage.removeItem("username");
        },

        ////////////////////////////////////////////////////////////////////////////////
        post: function(route, params, successCallback, errorCallback) {
            var url = "http://"+localStorage.getItem("host")+"/"+route;
            $http({
                method: "POST",
                url: url,
                data: tools.serializeData(params),
                headers: {"Content-Type": "application/x-www-form-urlencoded", "token":localStorage.getItem("token")}
            })
            .success(function(data, status) {
                successCallback(data);
            }).
            error(function(data, status) {
                errorCallback(data, status);
            });
        },

        ////////////////////////////////////////////////////////////////////////////////
        get: function(route, successCallback, errorCallback) {
        	var deferred = $q.defer();
            var url = "http://"+localStorage.getItem("host")+"/"+route;
            $http({
                method: "GET",
                url: url,
                headers: {"token":localStorage.getItem("token")}
            })
            .success(function(data, status) {
                deferred.resolve(data);
            }).
            error(function(error, status) {
                deferred.reject(new Error(error));
            });
            return deferred.promise;
        }
    }
});

/////////////////////////////////////////////////////////////////////
services.factory("miscsService", function($state, $ionicHistory, $ionicLoading) {
	return {
		goWithoutHistory: function(newState) {
			$ionicHistory.nextViewOptions({
				disableAnimate: true,
				disableBack: true
			});   
			$state.go(newState, {}, {reload:true});
		},

        loading: function(loadingText, loadingIcon, loadingAnimation) {
            $ionicLoading.show({template: "<i class='icon fa "+loadingIcon+" "+loadingAnimation+" animated'></i> "+loadingText});
        },

        hideLoading: function() {
            $ionicLoading.hide();
        }
	}
});