/**
 *  service for the project
 **/

(function() {

    /**
     * Config Module
     * provide config parameter
     */
    angular.module('config_service', [])
        .factory('getConfig',
            function($location) {
                var _CONFIG = {
                    AccountKey: "account",
                    MsgKey: "message",
                    FriendKey: "firend",
                    URL: "",
                    WsUrl: "ws://" + $location.host() + "/ws",
                }
                return _CONFIG;
            }
        )

    /**
     * sessionService Module
     */
    angular.module('sessionService', [])
        .factory('setToLoginStatus', function() {
            return function() {
                window.sessionStorage.setItem("status","login");
            };
        })
        .factory('setToLogoutStatus', function() {
            return function() {
                window.sessionStorage.removeItem("status");
            };
        })
        .factory('getSessionStatus', function() {
            return function() {
                var status = window.sessionStorage.getItem("status");
                if(!status){
                    return false;
                }else{
                    return true;
                }

            };
        })


    /**
     * account Module
     * localstorage,check&ajax for account 
     **/

    var ac_service = angular.module('ac_service', ['config_service'])
        .factory('checkInfo', function() {
            var serviceInstance = {};
            serviceInstance.checkUsername = function(username, error) {
                if (username == "") {
                    error.usernameErr = "用户名不可以为空";
                    return false;
                }
                if (!/\w{4,}/.test(username)) {
                    error.usernameErr = "用户名由数字字母下划线组成,不少于5位";
                    return false;
                }
                return true;
            }
            serviceInstance.checkPass = function(password, error) {
                if (password.length < 6) {
                    if (error) {
                        error.passwordErr = "密码不可少于6位";
                    }
                    return false;
                }
                return true;
            }
            serviceInstance.checkNick = function(nick, error) {
                if (nick.length < 2) {
                    error.nickErr = "昵称不能少于两位字符";
                    return false;
                }
                return true;
            }
            serviceInstance.checkRepeat = function(info, error) {
                if (info.password != info.passRepeat) {
                    error.repeatErr = "两次输入的密码不一致";
                    return false;
                }
                return true;
            }
            return serviceInstance;
        })
        .factory('accountStorage', function(getConfig, $window) {
            var account = null;
            var accountStorage = {
                saveAccount: function(Info) {
                    if (Info) {
                        var t_account = {
                            username: Info.username,
                            nick: Info.nick,
                            head: Info.head+'?t='+Math.random()*100000000000000000
                        }
                        $window.localStorage.setItem(getConfig.AccountKey, $window.JSON.stringify(t_account));
                        account = t_account;
                        return true;
                    } else {
                        return false;
                    }
                },
                getAccount: function() {
                    if (account !== null) {
                        return account;
                    } else {
                        var accountStr = $window.localStorage.getItem(getConfig.AccountKey);
                        if (accountStr) {
                            account = $window.JSON.parse(accountStr);
                            return account;
                        }
                    }
                    return false;
                },
                setNewNick: function(nick) {
                    account.nick = nick;
                    accountStorage.saveAccount(account);
                },
                setNewHead: function(head) {
                    account.head = head +'?t='+Math.random()*100000000000000000;
                    accountStorage.saveAccount(account)
                }
            }
            return accountStorage;
        })
        .factory('requestAccount', ['$http', 'getConfig',
            function($http, getConfig) {
                var doLogin = function(Info) {
                    var data = {
                        username: Info.username,
                        password: Info.password
                    }
                    return $http({
                        method: 'POST',
                        url: getConfig.URL + '/login',
                        data: data
                    });
                }
                var doRegister = function(Info) {
                    var data = {
                        username: Info.username,
                        password: Info.password,
                        nick: Info.nick
                    }
                    return $http({
                        method: 'POST',
                        url: getConfig.URL + '/register',
                        data: data
                    })
                }
                var doLogout = function() {
                    return $http({
                        method: 'POST',
                        url: getConfig.URL + '/logout'
                    })
                }
                return {
                    doLogin: doLogin,
                    doRegister: doRegister,
                    doLogout: doLogout
                }
            }
        ])


    /**
     *  network module
     *  websocket, build,reconnect,disconnect service
     **/
    var nw_service = angular.module('nw_service', ['config_service', 'ac_service'])
        .factory('websocket_build', ['$rootScope', 'getConfig', 'accountStorage', '$timeout',
            function($rootScope, getConfig, accountStorage, $timeout) {
                /**
                 *  build websocket service
                 **/
                var counter = 0;
                return function websocket_build() {
                    var ac_name = accountStorage.getAccount().username;
                    var ws_url = getConfig.WsUrl + "/" + ac_name;

                    $rootScope.ws = new WebSocket(ws_url);

                    $rootScope.ws.onopen = function() {
                        counter = 0;
                        console.log('The websocket to :' + ws_url + ' has been open');
                        //send websocket open msg to all the controllor
                        $rootScope.$broadcast('wsopen');
                    }
                    $rootScope.ws.onmessage = function(data) {
                        var evt = JSON.parse(data.data);
                        var type = evt.action;
                        console.log('The websocket receiveMsg : ' + data.data);
                        // send broadcast msg to all the controllor
                        $rootScope.$broadcast(type, evt);
                    }
                    $rootScope.ws.onerror = function() {
                        if (counter < 5) {
                            console.log("rebuild websocket  , try time : " + ++counter)
                            $timeout(websocket_build, 5000);
                        } else {
                            console.log("try 5 time out, please reconnect manually")
                        }
                    }
                    $rootScope.ws.onclose = function() {
                        //reconnect websocket


                    }
                };
            }
        ])
        .factory('ajax', ['$http', 'getConfig', 'accountStorage',
            function($http, getConfig, accountStorage) {
                /**
                 *  send ajax service
                 *  must login and have local account record first
                 **/
                return function ajax(method, url, data) {
                    var account = accountStorage.getAccount();
                    if (method == "GET" || method == "get") {
                        return $http({
                            method: method,
                            url: getConfig.URL + "/" + account.username + url,
                            data: data
                        })
                    } else {
                        return $http({
                            method: method,
                            url: getConfig.URL + url,
                            data: data
                        })
                    }

                };
            }
        ])
        /**
         * code Module
         * to encode and decode string
         * Description
         */
    angular.module('code', [])
        .factory('encode_8', [function() {
            return function encode_8(originStr) {
                var monyer = new Array();
                var i, s;
                for (i = 0; i < originStr.length; i++) {
                    monyer += "|" + originStr.charCodeAt(i).toString(8);
                }
                return monyer

            };
        }])
        .factory('decode_8', [function() {
            return function decode_8(encodeStr) {
                var monyer = new Array();
                var i;
                var s = encodeStr.split("|");
                for (i = 1; i < s.length; i++)
                    monyer += String.fromCharCode(parseInt(s[i], 8));
                return monyer;
            };
        }])

    /**
     *  msg_manage module
     *  to receive, read msg. And to get msg history
     *  to save,update,delete friend
     *  to get friend delete,add new msg
     */
    angular.module('storage_manage', ['config_service', 'ac_service', 'code'])
        .service('friendStore', ['localsave_friend_list', 'localget_friend_list',
            function(localsave_friend_list, localget_friend_list) {
                var friendStore = {
                    friendList: [],
                    updateFriendList: function(data) {
                        friendStore.friendList = data
                        localsave_friend_list(data);
                    },
                    getFriendList: function() {
                        if (friendStore.friendList) {
                            return friendStore.friendList;
                        } else {
                            return localget_friend_list();
                        }

                    },
                    findFriendData: function(username) {
                        var f_list = friendStore.getFriendList();
                        for (var i = f_list.length - 1; i >= 0; i--) {
                            if (f_list[i].username == username) {
                                return f_list[i];
                            }
                        };
                        return false;
                    },
                    insertFriend: function(data) {
                        friendStore.friendList.unshift(data);
                    }
                }
                return friendStore;
            }
        ])
        .service('msgStore', [
            function() {
                var msgStore = {
                    message: {},
                    receiveNewMsg: function(msg) {
                        var username = msg.username;
                        //build new msg hash
                        if (!msgStore.message[username]) {
                            msgStore.message[username] = {
                                unread: 1,
                                text: [msg]
                            }
                        } else {
                            msgStore.message[username].unread++;
                            msgStore.message[username].text.push(msg);
                        }
                    },
                    readNewMsg: function(username) {
                        if (msgStore.message[username]) {
                            var store = msgStore.message[username];
                            var newNum = store.unread;
                            store.unread = 0;
                            return store.text.slice(store.text.length - unread, unread);
                        } else {
                            return [];
                        }
                    },
                    receiveQuikReadMsg: function(msg) {
                        msgStore.receiveNewMsg(msg);
                        var username = msg.username;
                        msgStore.message[username].unread--;
                    },
                    getAllMsg: function(username) {
                        if (msgStore.message[username]) {
                            var store = msgStore.message[username];
                            store.unread = 0;
                            return store.text;
                        } else {
                            msgStore.message[username] = {
                                unread: 0,
                                text: []
                            }
                            return msgStore.message[username].text;
                        }
                    }
                }
                return msgStore;
            }
        ])
        .factory('friend_msg_store', [
            function() {
                var fri_msg_store = {
                    friend_msg: [],
                    reciveNewMsg: function(msg) {
                        var data = msg.data;
                        data.msgContent = data.nick + "请求添加您为好友";
                        data.msgState = "unread";
                        var list = fri_msg_store.friend_msg;
                        var inList = false;
                        for (var i = list.length - 1; i >= 0; i--) {
                            if (list[i].username == data.username) {
                                inList = true;
                                break;
                            }
                        };
                        if (!inList) {
                            list.unshift(data)
                        }
                    },
                    toggleMsgState: function(username, state) {
                        var list = fri_msg_store.friend_msg;
                        for (var i = list.length - 1; i >= 0; i--) {
                            if (list[i].username == username) {
                                list[i].msgState = state;
                            }
                        };
                    },
                    cleanHandledMsg: function() {
                        var list = fri_msg_store.friend_msg;
                        for (var i = list.length - 1; i >= 0; i--) {
                            if (list[i].msgState == "handled") {
                                list.splice(i, 1);
                            }
                        };
                    },
                    getMsg: function() {
                        fri_msg_store.cleanHandledMsg();
                        var list = fri_msg_store.friend_msg;
                        for (var i = list.length - 1; i >= 0; i--) {
                            list[i].msgState = "read";
                        };
                        return list;
                    },
                    get_unread_num: function() {
                        var list = fri_msg_store.friend_msg;
                        var count = 0;
                        for (var i = list.length - 1; i >= 0; i--) {
                            if (list[i].msgState == "unread") {
                                count++;
                            }
                        };
                        return count;
                    }

                }
                return fri_msg_store;
            }
        ])
        .factory('localget_friend_list', ['$window', 'getConfig', 'accountStorage', 'encode_8',
            function($window, getConfig, accountStorage, encode_8) {
                return function get_friend_list_storage() {
                    var username = accountStorage.getAccount().username;
                    var FriendKey = getConfig.FriendKey;
                    var key = encode_8(username + FriendKey);
                    var friendListStr = $window.localStorage.getItem(key);
                    return JSON.parse(friendListStr);
                };
            }
        ])
        .factory('localsave_friend_list', ['$window', 'getConfig', 'accountStorage', 'encode_8',
            function($window, getConfig, accountStorage, encode_8) {
                return function update_friend_list(friendList) {
                    var username = accountStorage.getAccount().username;
                    var FriendKey = getConfig.FriendKey;
                    var key = encode_8(username + FriendKey);
                    $window.localStorage.setItem(key, $window.JSON.stringify(friendList));
                };
            }
        ])
        .factory('store_friend_msg', ['$window',
            function($window) {
                return function store_friend_msg() {

                };
            }
        ])
        .factory('get_friend_msg', ['$window',
            function($window) {
                return function get_friend_msg() {

                };
            }
        ])

    /**
     * webrtc_service Module
     *
     */
    angular.module('webrtc_service', ['config_service', 'ac_service'])
        .service('mediaStream',
            function() {
                var media = {
                    videoObj: null,
                    audioObj: null,
                    getAudio: function(successCall, errCall) {
                        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                        if (!navigator.getUserMedia) {
                            return false;
                        } else {
                            if (media.audioObj) {
                                return media.audioObj;
                            } else {
                                var success = function(stream) {
                                    media.audioObj = stream;
                                    successCall(stream);
                                }
                                navigator.getUserMedia({
                                    video: false,
                                    audio: true
                                }, success, errCall);
                            }
                        }
                    },
                    getVideo: function(successCall, errCall) {
                        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                        if (!navigator.getUserMedia) {
                            return false;
                        } else {
                            if (media.videoObj) {
                                return media.videoObj;
                            } else {
                                var success = function(stream) {
                                    media.videoObj = stream;
                                    successCall(stream);
                                }
                                navigator.getUserMedia({
                                    video: true,
                                    audio: true
                                }, success, errCall);
                            }
                        }

                    },
                    close: function() {
                        if (media.videoObj) {
                            media.videoObj.stop();
                            media.videoObj = null;
                        }
                        if (media.videoObj) {
                            media.videoObj.stop();
                            media.videoObj = null;
                        }
                    }
                }
                return media;
            }
        )
        .service('rtcPC',
            function($rootScope, mediaStream) {
                var servers = null;
                var rtcPC = {
                    calling: false,
                    role: null,
                    peerConnection: null,
                    target: null,
                    call: function(config, gotRemoteStreamFunc) {
                        // config :{
                        //     role : 'caller'/'callee'  *
                        //     callType : 'video'/'audio'  *  
                        //     target : 'username' * 
                        // }
                        rtcPC.calling = true;
                        rtcPC.target = config.target;
                        rtcPC.role = config.role;
                        rtcPC.peerConnection = new webkitRTCPeerConnection(servers);
                        rtcPC.peerConnection.onicecandidate = gotLocalIceCandidate;
                        rtcPC.peerConnection.onaddstream = gotRemoteStreamFunc;
                        if (config.callType == 'video') {
                            rtcPC.peerConnection.addStream(mediaStream.videoObj);
                        } else {
                            rtcPC.peerConnection.addStream(mediaStream.audioObj);
                        }
                        if (config.role == "caller") {
                            rtcPC.peerConnection.onnegotiationneeded = function() {
                                rtcPC.peerConnection.createOffer(gotLocalDescription);
                            }
                        }
                        $rootScope.$on("candidate", function(event, data) {
                            var msg = data.data;
                            gotRemoteIceCandidate(msg);
                        })
                        $rootScope.$on("sdp", function(event, data) {
                            var msg = data.data;
                            gotRemoteDescription(msg);
                        })

                    },
                    hangup: function() {
                        rtcPC.calling = false;
                        rtcPC.target = null;
                        rtcPC.role = null;
                        rtcPC.peerConnection.close();
                        rtcPC.peerConnection = null;

                    }

                }

                function gotRemoteDescription(msg) {
                    if (rtcPC.role == "caller") {
                        rtcPC.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                    } else {
                        //callee answer
                        rtcPC.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                        rtcPC.peerConnection.createAnswer(gotLocalDescription);
                    }
                }

                function gotRemoteIceCandidate(msg) {
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: msg.label,
                        candidate: msg.candidate
                    });
                    rtcPC.peerConnection.addIceCandidate(candidate);
                }

                function gotLocalIceCandidate(event) {
                    if (event.candidate) {
                        var candidateMsg = {
                            action: "candidate",
                            data: {
                                label: event.candidate.sdpMLineIndex,
                                id: event.candidate.sdpMid,
                                candidate: event.candidate.candidate,
                                username: rtcPC.target
                            }
                        }
                        $rootScope.ws.send(JSON.stringify(candidateMsg));
                    }
                }

                function gotLocalDescription(description) {
                    rtcPC.peerConnection.setLocalDescription(description);
                    var sdpMsg = {
                        action: 'sdp',
                        data: {
                            sdp: description,
                            username: rtcPC.target
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(sdpMsg));
                }
                return rtcPC;

            }
        )


})();