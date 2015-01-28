/////////////////////////////////////////////////////////////////////
directives.directive("ionSearch", function() {
    return {
        restrict: "E",
        replace: true,
        scope: {
            getData: "&source",
            model: "=?",
            search: "=?filter"
        },
        link: function(scope, element, attrs) {

            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || "";
            scope.search = {value: ""};

            if (attrs.class)
                element.addClass(attrs.class);

            scope.clearSearch = function() {
                scope.search.value = "";
            };
        },
        template: "<div class=\"item-input-wrapper\">" +
        "<i class=\"icon ion-android-search\"></i>" +
        "<input type=\"search\" placeholder=\"{{placeholder}}\" ng-model=\"search.value\">" +
        "<i ng-if=\"search.value.length > 0\" ng-click=\"clearSearch()\" class=\"icon ion-close\"></i>" +
        "</div>"
    };
});

/////////////////////////////////////////////////////////////////////
directives.directive("whenScrolled", ["$window", "$timeout", function($window, $timeout) {
    return function(scope, elm, attr) {
        var theWindow = angular.element($window);
        var raw = elm;
        var busy = false;
        var defaultOffset = -100;
        $timeout(function() {
            theWindow.bind("scroll", function() {
                if (!busy && $(this).height() + $(this).scrollTop() >= $(raw).outerHeight() + $(raw).offset().top + defaultOffset) {
                    busy = true;
                    scope.$apply(attr.whenScrolled);
                    $timeout(function() {
                        busy = false;
                    }, 1000);
                }
            });
        }, 1000);
        
    };
}]);

/////////////////////////////////////////////////////////////////////
var INTEGER_REGEXP = /^\-?\d+$/;
directives.directive("integer", function() {
    return {
        require: "ngModel",
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$validators.integer = function(modelValue, viewValue) {
                if (ctrl.$isEmpty(modelValue)) {
                    return true;
                }
                if (INTEGER_REGEXP.test(viewValue)) {
                    return true;
                }
                return false;
            };
        }
    };
});

/////////////////////////////////////////////////////////////////////
directives.directive("capitalize", function() {
    return {
        require: "ngModel",
        link: function(scope, element, attrs, modelCtrl) {
            var capitalize = function(inputValue) {
                if(inputValue == undefined) inputValue = "";
                var capitalized = inputValue.toUpperCase();
                if(capitalized !== inputValue) {
                    modelCtrl.$setViewValue(capitalized);
                    modelCtrl.$render();
                }         
                return capitalized;
            }
            modelCtrl.$parsers.push(capitalize);
            capitalize(scope[attrs.ngModel]);
        }
    };
});