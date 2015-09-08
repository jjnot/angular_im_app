(function() {
    'use strict';

    var GRchat = angular.module('GRchat', ['ngMaterial', 'ui.router', 'sys_wel_module', 'home_module', 'luegg.directives','gr_directive',])
        .config(function($mdThemingProvider, $stateProvider, $urlRouterProvider,$httpProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('cyan')
                .accentPalette('pink');

            $urlRouterProvider.otherwise("/welcome");
            $stateProvider
                .state('welcome', {
                    url: "/welcome",
                    templateUrl: "partials/welcome.html",
                    controller: "wel_ctrl"
                })
                .state('welcome.login', {
                    url: '/login',
                    templateUrl: 'partials/login.html',
                    controller: "login_ctrl"
                })
                .state('welcome.register', {
                    url: '/register',
                    templateUrl: 'partials/register.html',
                    controller: "register_ctrl"
                })
                .state("home", {
                    url: '/home',
                    views: {
                        '': {
                            templateUrl: 'partials/home.html',
                            controller: "home_ctrl"
                        },
                        "navigation_bar@home": {
                            templateUrl: "partials/navigation_bar.html",
                            controller: "nav_ctrl"
                        },
                        "video_view@home": {
                            templateUrl: "partials/video_window.html",
                            controller: "video_ctrl"
                        }

                    }
                })
                .state("home.chat", {
                    url: "/chat/:username",
                    views: {
                        "chat_window@home": {
                            templateUrl: "partials/chat_window.html",
                            controller: "chat_window_ctrl"
                        }
                    }
                })


            //设置http为jq格式
            $httpProvider.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded';
            $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

            // Override $http service's default transformRequest
            $httpProvider.defaults.transformRequest = [function(data) {
                /**
                 * The workhorse; converts an object to x-www-form-urlencoded serialization.
                 * @param {Object} obj
                 * @return {String}
                 */
                var param = function(obj) {
                    var query = '';
                    var name, value, fullSubName, subName, subValue, innerObj, i;

                    for (name in obj) {
                        value = obj[name];

                        if (value instanceof Array) {
                            for (i = 0; i < value.length; ++i) {
                                subValue = value[i];
                                fullSubName = name + '[' + i + ']';
                                innerObj = {};
                                innerObj[fullSubName] = subValue;
                                query += param(innerObj) + '&';
                            }
                        } else if (value instanceof Object) {
                            for (subName in value) {
                                subValue = value[subName];
                                fullSubName = name + '[' + subName + ']';
                                innerObj = {};
                                innerObj[fullSubName] = subValue;
                                query += param(innerObj) + '&';
                            }
                        } else if (value !== undefined && value !== null) {
                            query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                        }
                    }

                    return query.length ? query.substr(0, query.length - 1) : query;
                };

                return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
            }];


        })

    //mock数据时使用
    //Mock.mockjax(GRchat);
    GRchat.run(function($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    })





})();