(function() {
    var sys_wel_module = angular.module('sys_wel_module', ['ac_service', 'sessionService'])
        .controller('wel_ctrl', function($rootScope, getSessionStatus) {
            if (getSessionStatus()) {
                $rootScope.$state.go("home");
            }

        })
        .controller('login_ctrl', ['$scope', '$rootScope', '$window', 'checkInfo', 'requestAccount', 'accountStorage', 'setToLoginStatus',
            function($scope, $rootScope, $window, checkInfo, requestAccount, accountStorage, setToLoginStatus) {
                $scope.userInfo = {
                        username: "",
                        password: ""
                    }
                    //init for account
                var account = accountStorage.getAccount();
                if (account) {
                    $scope.userInfo.username = account.username;
                    //$window.localStorage.clear();
                }

                $scope.submit = function() {
                    $scope.errors = {
                        usernameErr: null,
                        passwordErr: null
                    }
                    if (checkInfo.checkUsername($scope.userInfo.username, $scope.errors) && checkInfo.checkPass($scope.userInfo.password, $scope.errors)) {
                        requestAccount.doLogin($scope.userInfo).
                        success(function(data) {
                            if (data.status) {
                                if (accountStorage.saveAccount(data.data)) {
                                    setToLoginStatus();
                                    $rootScope.$state.go("home");
                                }
                            } else {
                                $scope.errors.passwordErr = data.data;
                            }
                        }).
                        error(function(data) {
                            $scope.errors.passwordErr = "网络链接失败";
                        })
                    }

                }
            }
        ])
        .controller('register_ctrl', ['$scope', '$rootScope', '$window', 'checkInfo', 'accountStorage', 'requestAccount', 'setToLoginStatus',
            function($scope, $rootScope, $window, checkInfo, accountStorage, requestAccount, setToLoginStatus) {
                $scope.userInfo = {
                    username: "",
                    nick: "",
                    password: "",
                    passRepeat: ""
                }
                $scope.submit = function() {
                    $scope.errors = {
                        usernameErr: null,
                        passwordErr: null,
                        nickErr: null,
                        repeatErr: null
                    }
                    if (checkInfo.checkUsername($scope.userInfo.username, $scope.errors) && checkInfo.checkPass($scope.userInfo.password, $scope.errors) &&
                        checkInfo.checkNick($scope.userInfo.nick, $scope.errors) && checkInfo.checkRepeat($scope.userInfo, $scope.errors)) {
                        requestAccount.doRegister($scope.userInfo).
                        success(function(data) {
                            if (data.status) {
                                if (accountStorage.saveAccount(data.data)) {
                                    setToLoginStatus();
                                    $rootScope.$state.go("home");
                                }
                            } else {
                                $scope.errors.repeatErr = data.data;
                            }
                        }).
                        error(function(data) {
                            $scope.errors.repeatErr = "网络链接失败";
                        })
                    }

                }

            }
        ])

    var home_module = angular.module('home_module', ['ngMaterial', 'nw_service', 'storage_manage', 'ac_service', 'webrtc_service', 'sessionService'])
        .controller('home_ctrl', ['$scope', '$rootScope', 'websocket_build', 'msgStore', '$mdSidenav', '$mdUtil', 'accountStorage', '$mdDialog', 'friend_msg_store',
            'friendStore', '$mdToast', '$stateParams', 'ajax', 'getSessionStatus', 'setToLogoutStatus',
            function($scope, $rootScope, websocket_build, msgStore, $mdSidenav, $mdUtil,
                accountStorage, $mdDialog, friend_msg_store, friendStore, $mdToast, $stateParams,
                ajax, getSessionStatus, setToLogoutStatus) {
                if (!getSessionStatus()) {
                    $rootScope.$state.go("welcome");
                } else {
                    websocket_build();
                }
                $scope.$on("text", function(event, data) {
                    var msg = data.data;
                    msg.msgFrom = "other";
                    if ($stateParams.username && ($stateParams.username == msg.username)) {
                        msgStore.receiveQuikReadMsg(msg);
                    } else {
                        msgStore.receiveNewMsg(msg);
                    }

                })
                $scope.account = accountStorage.getAccount();

                $scope.toggleRight = buildToggler('right');

                $scope.friend_rqs_num = 0;

                $scope.$on("addfriend", function(event, data) {
                    $scope.$apply(function() {
                        friend_msg_store.reciveNewMsg(data);
                        $scope.friend_rqs_num = friend_msg_store.get_unread_num();
                    })
                });

                $scope.$on("acceptfriend", function(event, data) {
                    $scope.$apply(function() {
                        friendStore.insertFriend(data.data);
                        $mdToast.show($mdToast.simple().content(data.data.nick + '接受了你的好友请求!'));
                    })
                })
                $scope.$on("refusefriend", function(event, data) {
                    $mdToast.show($mdToast.simple().content(data.data.nick + '拒绝了你的好友请求!'));
                })
                $scope.$on("changeUserInfo", function(event, data) {
                    $scope.account = accountStorage.getAccount();
                })
                $scope.joinGroup = function(ev) {
                    $mdDialog.show({
                        controller: 'joinGroupCtrl',
                        templateUrl: 'partials/dialog/joinGroup.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                    })
                }
                $scope.createGroup = function() {
                    ajax("POST","/newroom",{})
                    .success(function(data){
                        window.open("/group.html?u=" + $scope.account.username+"&id="+data.room);
                    })
                    .error(function(){
                        $mdToast.show($mdToast.simple().content('您已建立过房间'));
                    })

                }




                function buildToggler(navID) {
                    var debounceFn = $mdUtil.debounce(function() {
                        $mdSidenav(navID)
                            .toggle()
                            .then(function() {

                            });
                    }, 300);
                    return debounceFn;
                }
                $scope.showFriendMsgDia = function(ev) {
                    $scope.friend_rqs_num = 0;
                    $mdDialog.show({
                        controller: 'friendMsgCtrl',
                        templateUrl: 'partials/dialog/friendMsgDia.html',
                        targetEvent: ev,
                    })
                }
                $scope.modifyHead = function(ev) {
                    $mdDialog.show({
                        controller: 'headModifyCtrl',
                        templateUrl: 'partials/dialog/headModifyDia.html',
                        targetEvent: ev,
                    })

                }
                $scope.modifyNick = function(ev) {
                    $mdDialog.show({
                        controller: 'nickModifyCtrl',
                        templateUrl: 'partials/dialog/nickModifyDia.html',
                        targetEvent: ev,
                    })
                }
                $scope.modifyPass = function(ev) {
                    $mdDialog.show({
                        controller: 'passModifyCtrl',
                        templateUrl: 'partials/dialog/passModifyDia.html',
                        targetEvent: ev,
                    })
                }

                $scope.logout = function() {
                    ajax("POST", "/logout", {})
                        .success(function() {
                            $rootScope.ws.close();
                            setToLogoutStatus();
                            $rootScope.$state.go("welcome");
                        })
                        .error(function() {
                            //暂时一样的处理。
                            $rootScope.ws.close();
                            $rootScope.$state.go("welcome");
                        })
                }
            }

        ])
        .controller('joinGroupCtrl', function($scope,$mdDialog,accountStorage){
            var account= accountStorage.getAccount();
            $scope.join = function(){
                window.open("/group.html?u=" +account.username+"&id="+$scope.groupID);
                $mdDialog.hide();
            }
            
        })
        .controller('passModifyCtrl', function($scope, checkInfo, ajax) {
            $scope.oldpass = "";
            $scope.newpass = "";
            $scope.submitting = false;
            $scope.submit = function() {
                $scope.oldErr = null;
                $scope.result = null;
                if (!checkInfo.checkPass($scope.oldpass)) {
                    $scope.oldErr = "原密码不可少于6位";
                    return false;
                }
                if (!checkInfo.checkPass($scope.newpass)) {
                    $scope.result = "新密码不可少于6位";
                    return false;
                }
                $scope.submitting = true;
                ajax("POST", "/modifypassword", {
                    oldpassword: $scope.oldpass,
                    newpassword: $scope.newpass
                }).success(function(data) {
                    $scope.submitting = false;
                    if (data.status) {
                        $scope.result = "修改成功";
                    } else {
                        $scope.result = data.data;
                    }
                }).error(function() {
                    $scope.submitting = false;
                    $scope.result = "网络链接失败";
                })
            }


        })
        .controller('headModifyCtrl', function($scope, accountStorage, $rootScope) {
            $scope.status = 1;
            $scope.avatarsrc = null;
            $scope.uploadErr = function() {
                $scope.status = 4;
            }
            $scope.uploadSucc = function(url) {
                $scope.avatarsrc = url + '?t=' + Math.random() * 100000000000000000;
                $scope.status = 2;
            }
            $scope.cutsucc = function(url) {
                accountStorage.setNewHead(url);
                $scope.status = 3;
                $rootScope.$broadcast("changeUserInfo");
            }
            $scope.cuterr = function() {
                $scope.status = 4;
            }

        })
        .controller('nickModifyCtrl', function(accountStorage, ajax, $scope, $rootScope) {
            $scope.nick = accountStorage.getAccount().nick;
            $scope.submitting = false;
            $scope.submit = function() {
                $scope.submitting = true;
                ajax("POST", "/modifynick", {
                    nick: $scope.nick
                }).success(function() {
                    accountStorage.setNewNick($scope.nick);
                    $scope.result = "修改成功！";
                    $rootScope.$broadcast("changeUserInfo");
                    $scope.submitting = false;
                }).error(function() {
                    $scope.result = "网络链接失败"
                    $scope.submitting = false;
                })
            }
        })
        .controller('friendMsgCtrl', function($scope, friend_msg_store, $rootScope, friendStore) {
            $scope.msgs = friend_msg_store.getMsg();
            $scope.acceptfriend = function(target) {
                var msg = {
                    action: "acceptfriend",
                    data: {
                        username: target.username
                    }
                }
                $rootScope.ws.send(JSON.stringify(msg));
                tagMsgHandled(target);
                var data = {
                    username: target.username,
                    nick: target.nick,
                    head: target.head
                }
                friendStore.insertFriend(data);

            }
            $scope.refucefriend = function(target) {
                var msg = {
                    action: "refusefriend",
                    data: {
                        username: target.username
                    }
                }
                $rootScope.ws.send(JSON.stringify(msg));
                tagMsgHandled(target);
            }

            function tagMsgHandled(target) {
                target.msgState = "handled";
            }
        })
        .controller('setting_ctrl', function($scope, $mdSidenav, accountStorage) {
            $scope.account = accountStorage.getAccount();
            $scope.close = function() {
                $mdSidenav('right').close()
                    .then(function() {});
            };
        })
        .controller('chat_window_ctrl', ['$scope', '$rootScope', '$stateParams', 'friendStore', 'msgStore',
            function($scope, $rootScope, $stateParams, friendStore, msgStore) {
                $scope.msgList = msgStore.getAllMsg($stateParams.username);
                $scope.chatTarget = friendStore.findFriendData($stateParams.username);
                if (!$scope.chatTarget) {
                    $rootScope.$state.go("home");
                }

                $scope.sendMsg = function() {
                    var msg = {
                        action: "text",
                        data: {
                            username: $stateParams.username,
                            text: $scope.chat_text.toString()
                        }
                    };
                    $rootScope.ws.send(JSON.stringify(msg));

                    var insertMsg = msg.data;
                    insertMsg.msgFrom = 'self';
                    msgStore.receiveQuikReadMsg(insertMsg);
                    $scope.chat_text = "";
                }

                $scope.startVideoChat = function() {
                    $rootScope.$broadcast("startVideoChat", {
                        username: $stateParams.username
                    });
                }
                $scope.startAudioChat = function() {
                    $rootScope.$broadcast("startAudioChat", {
                        username: $stateParams.username
                    });
                }
            }
        ])
        .controller('nav_ctrl', ['$scope', '$rootScope', 'ajax', '$mdDialog', '$mdToast', 'friendStore', '$stateParams',
            function($scope, $rootScope, ajax, $mdDialog, $mdToast, friendStore, $stateParams) {
                ajax("GET", "/friends")
                    .success(function(data) {
                        //success get friend list
                        $scope.friendList = data;
                        initAlertNum(data);
                        friendStore.updateFriendList(data);
                        $mdToast.show($mdToast.simple().content('好友列表更新完成!'));


                        if ($rootScope.$stateParams.username) {
                            var username = $rootScope.$stateParams.username;
                            for (var i = 0; i < $scope.friendList.length; i++) {
                                if ($scope.friendList[i].username == username) {
                                    $scope.friendList[i].isSelected = true;
                                    findFriendAndPopup(username, $scope.friendList);
                                }
                            }
                        }

                    })
                    .error(function(data) {
                        $mdToast.show($mdToast.simple().content('好友列表更新失败!请检查网络'));
                    })


                $scope.showAddfriend = function(ev) {
                    $mdDialog.show({
                        controller: 'addFriend_ctrl',
                        templateUrl: 'partials/dialog/addfriend.html',
                        targetEvent: ev
                    })
                }

                $scope.selectFriendItem = function(friend) {
                        for (var i = 0; i < $scope.friendList.length; i++) {
                            $scope.friendList[i].isSelected = false;
                        }
                        friend.isSelected = true;
                        friend.alert_num = 0;

                    }
                    //receive new msg
                $scope.$on("text", function(event, data) {
                    $scope.$apply(function() {
                        var list = $scope.friendList;
                        var friend = findFriendAndPopup(data.data.username, list);
                        var msg = data.data;
                        if ($rootScope.$stateParams.username && ($rootScope.$stateParams.username == msg.username)) {} else {
                            friend.alert_num++;
                        }
                    })


                })

                function findFriendAndPopup(username, list) {
                    for (var i = list.length - 1; i >= 0; i--) {
                        if (list[i].username == username) {
                            var target = list.splice(i, 1)[0];
                            list.unshift(target);
                            return target;
                        }
                    }
                    return false;
                }

                function initAlertNum(list) {
                    for (var i = 0; i < list.length; i++) {
                        list[i].alert_num = 0;
                        list[i].isSelected = false;
                    }
                }




            }
        ])
        .controller('addFriend_ctrl', ['$scope', '$rootScope', '$mdDialog', 'ajax', '$mdToast',
            function($scope, $rootScope, $mdDialog, ajax, $mdToast) {
                $scope.info = {
                    username: null,
                    nick: null
                }
                $scope.searchErr = null;
                $scope.status = {
                    isInit: true,
                    isSearching: false,
                    isShowResult: false,
                };


                $scope.search = function() {
                    if (!$scope.info.username && !$scope.info.nick) {
                        $scope.searchErr = "至少输入一项搜索条件";
                    } else {
                        $scope.status = {
                            isInit: false,
                            isSearching: true,
                            isShowResult: false,
                        };
                        var searchData;
                        if ($scope.info.username != null) {
                            searchData = {
                                username: $scope.info.username
                            };
                        } else {
                            searchData = {
                                nick: $scope.info.nick
                            };
                        }
                        ajax("POST", "/search", searchData)
                            .success(function(data) {
                                $scope.status = {
                                    isInit: false,
                                    isSearching: false,
                                    isShowResult: true,
                                };
                                //show the search result 
                                $scope.searchResult = data;

                                if (data.length > 0) {
                                    $scope.isResultErr = false;
                                    for (var i = 0; i < $scope.searchResult.length; i++) {
                                        $scope.searchResult[i].added = false;
                                        $scope.searchResult[i].handle = "添加好友";
                                    }
                                } else {
                                    $scope.isResultErr = true;
                                    $scope.searcheErr = "无搜索结果";

                                }


                            })
                            .error(function() {
                                $scope.status = {
                                    isInit: false,
                                    isSearching: false,
                                    isShowResult: true,
                                };
                                $scope.isResultErr = true;
                                $scope.searcheErr = "无法连接到搜索服务器";
                            })
                    }
                }

                $scope.addfriend = function(target) {
                    target.added = true;
                    target.handle = "已发送请求";
                    $mdToast.show(
                        $mdToast.simple()
                        .content('添加' + target.nick + '的请求已发送')
                        .position("bottom left")
                        .hideDelay(3000)
                    );
                    var msg = {
                        action: "addfriend",
                        data: {
                            username: target.username
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(msg));

                }

                $scope.hide = function() {
                    $mdDialog.hide();
                };

            }
        ])
        .controller('video_ctrl', ['$scope', '$rootScope', 'rtcPC', '$sce', 'friendStore', 'mediaStream', '$mdToast',
            function($scope, $rootScope, rtcPC, $sce, friendStore, mediaStream, $mdToast) {
                $scope.hide = true;
                $scope.status = {
                    isCalling: false,
                    isAnswering: false,
                    isVideoChating: false,
                    isAudioChating: false
                }
                $scope.chatType = null;
                $scope.$on("startVideoChat", function(event, msg) {
                    $scope.chatTarget = msg.username;
                    $scope.callee = friendStore.findFriendData(msg.username);
                    $scope.callee.inform = "正在呼叫" + $scope.callee.nick;
                    var requestVideoMsg = {
                        action: "videorequest",
                        data: {
                            username: msg.username
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(requestVideoMsg));
                    $scope.hide = false;
                    $scope.status.isCalling = true;
                    $scope.$on("videorefuse", function(event, data) {
                        $scope.hide = true;
                        $scope.status.isCalling = false;
                        $mdToast.show($mdToast.simple().content('对方拒绝了你的视频请求!'));
                    })
                    $scope.cancleCall = function() {
                        $scope.hide = true;
                        $scope.status.isCalling = false;
                        var cancleMsg = {
                            action: "videocancel",
                            data: {
                                username: $scope.chatTarget
                            }
                        }
                        $rootScope.ws.send(JSON.stringify(cancleMsg));
                    }

                })

                $scope.$on("videorequest", function(event, data) {
                    var data = data.data;
                    $scope.$apply(function() {
                        $scope.status.isAnswering = true;
                        $scope.hide = false;
                        $scope.caller = data;
                        $scope.caller.inform = $scope.caller.nick + "请求与你视频会话";
                        $scope.chatTarget = data.username;
                        $scope.accept = function() {
                            $scope.status.isAnswering = false;
                            $scope.status.isVideoChating = true;
                            mediaStream.getVideo(getVideoSucc, getVideoErr);

                            function getVideoSucc(stream) {
                                getLocalVideoSucc(stream);
                                var accpetMsg = {
                                    action: "videoaccept",
                                    data: {
                                        username: $scope.chatTarget
                                    }
                                }
                                $rootScope.ws.send(JSON.stringify(accpetMsg));
                            }

                            function getVideoErr() {

                            }
                        }
                        $scope.refuse = function() {
                            var refuseMsg = {
                                action: "videorefuse",
                                data: {
                                    username: $scope.chatTarget
                                }
                            }
                            $rootScope.ws.send(JSON.stringify(refuseMsg));
                            $scope.hide = true;
                            $scope.status.isAnswering = false;
                        }

                    })
                })
                $scope.$on("videoaccept", function(event, data) {
                    //caller only
                    $scope.$apply(function() {
                        $scope.status.isCalling = false;
                        $scope.status.isVideoChating = true;
                    })
                    mediaStream.getVideo(getVideoSucc, getVideoErr);

                    function getVideoSucc(stream) {
                        getLocalVideoSucc(stream);
                        var readyMsg = {
                            action: "videoready",
                            data: {
                                username: $scope.chatTarget
                            }
                        }
                        $rootScope.ws.send(JSON.stringify(readyMsg));

                        //pc start
                        var config = {
                            role: "caller",
                            callType: "video",
                            target: $scope.chatTarget
                        }

                        rtcPC.call(config, getRemoteVideoSucc);
                        $scope.chatType = "video";
                    }

                    function getVideoErr() {

                    }

                })
                $scope.$on("videoready", function(event, data) {
                    //callee ready
                    var config = {
                        role: "callee",
                        callType: "video",
                        target: $scope.chatTarget
                    }
                    rtcPC.call(config, getRemoteVideoSucc);
                    $scope.chatType = "video";
                })

                $scope.hangUpVideo = function() {
                    var hangupMsg = {
                        action: "videoclose",
                        data: {
                            username: $scope.chatTarget
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(hangupMsg));
                    hangup();
                }
                $scope.$on("videoclose", function(event, data) {
                    hangup();
                    $mdToast.show($mdToast.simple().content('对方结束了视频会话!'));
                })

                function hangup() {
                    mediaStream.close();
                    rtcPC.hangup();
                    $scope.hide = true;
                    if ($scope.chatType == "video") {
                        $scope.status.isVideoChating = false;
                        $scope.remoteVideoSrc = null;
                        $scope.localVideoSrc = null;
                    } else {
                        $scope.status.isAudioChating = false;
                        $scope.remoteAudioSrc = null;
                        $scope.localAudioSrc = null;
                    }
                }

                function getRemoteVideoSucc(evt) {
                    $scope.$apply(function() {
                        if (window.URL) {
                            $scope.remoteVideoSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(evt.stream));
                        } else {
                            $scope.remoteVideoSrc = $sce.trustAsResourceUrl(evt.stream);
                        }
                    })

                }

                function getLocalVideoSucc(localStream) {
                    $scope.$apply(function() {
                        if (window.URL) {
                            $scope.localVideoSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(localStream));
                        } else {
                            $scope.localVideoSrc = $sce.trustAsResourceUrl(localStream);
                        }
                    })

                }


                $scope.$on("startAudioChat", function(event, msg) {
                    $scope.chatTarget = msg.username;
                    $scope.callee = friendStore.findFriendData(msg.username);
                    $scope.callee.inform = "正在呼叫" + $scope.callee.nick;
                    var requestAudioMsg = {
                        action: "audiorequest",
                        data: {
                            username: msg.username
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(requestAudioMsg));
                    $scope.hide = false;
                    $scope.status.isCalling = true;
                    $scope.$on("audiorefuse", function(event, data) {
                        $scope.hide = true;
                        $scope.status.isCalling = false;
                        $mdToast.show($mdToast.simple().content('对方拒绝了你的视频请求!'));
                    })
                    $scope.cancleCall = function() {
                        $scope.hide = true;
                        $scope.status.isCalling = false;
                        var cancleMsg = {
                            action: "audiocancel",
                            data: {
                                username: $scope.chatTarget
                            }
                        }
                        $rootScope.ws.send(JSON.stringify(cancleMsg));
                    }
                })
                $scope.$on("audiorequest", function(event, data) {
                    var data = data.data;
                    $scope.$apply(function() {
                        $scope.status.isAnswering = true;
                        $scope.hide = false;
                        $scope.caller = data;
                        $scope.caller.inform = $scope.caller.nick + "请求与你视频会话";
                        $scope.accept = function() {
                            $scope.chatTarget = data.username;
                            $scope.status.isAnswering = false;
                            $scope.status.isAudioChating = true;
                            mediaStream.getAudio(getAudioSucc, getAudioErr);

                            function getAudioSucc(stream) {
                                getLocalAudioSucc(stream);
                                var accpetMsg = {
                                    action: "audioaccept",
                                    data: {
                                        username: $scope.chatTarget
                                    }
                                }
                                $rootScope.ws.send(JSON.stringify(accpetMsg));
                            }

                            function getAudioErr() {

                            }
                        }
                        $scope.refuse = function() {
                            var refuseMsg = {
                                action: "audiorefuse",
                                data: {
                                    username: $scope.chatTarget
                                }
                            }
                            $rootScope.ws.send(JSON.stringify(refuseMsg));
                            $scope.hide = true;
                            $scope.status.isAnswering = false;
                        }

                    })
                })
                $scope.$on("audioaccept", function(event, data) {
                    //caller only
                    $scope.$apply(function() {
                        $scope.status.isCalling = false;
                        $scope.status.isAudioChating = true;
                    })
                    mediaStream.getAudio(getAudioSucc, getAudioErr);

                    function getAudioSucc(stream) {
                        getLocalAudioSucc(stream);
                        var readyMsg = {
                            action: "audioready",
                            data: {
                                username: $scope.chatTarget
                            }
                        }
                        $rootScope.ws.send(JSON.stringify(readyMsg));

                        //pc start
                        var config = {
                            role: "caller",
                            callType: "audio",
                            target: $scope.chatTarget
                        }

                        rtcPC.call(config, getRemoteAudioSucc);
                        $scope.chatType = "audio";
                    }

                    function getAudioErr() {

                    }
                })
                $scope.$on("audioready", function(event, data) {
                    //callee ready
                    var config = {
                        role: "callee",
                        callType: "audio",
                        target: $scope.chatTarget
                    }
                    rtcPC.call(config, getRemoteAudioSucc);
                    $scope.chatType = "audio";
                })
                $scope.hangUpAudio = function() {
                    var hangupMsg = {
                        action: "audioclose",
                        data: {
                            username: $scope.chatTarget
                        }
                    }
                    $rootScope.ws.send(JSON.stringify(hangupMsg));
                    hangup();
                }
                $scope.$on("audioclose", function(event, data) {
                    hangup();
                    $mdToast.show($mdToast.simple().content('对方结束了语音会话!'));
                })

                function getRemoteAudioSucc(evt) {
                    $scope.$apply(function() {
                        if (window.URL) {
                            $scope.remoteAudioSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(evt.stream));
                        } else {
                            $scope.remoteAudioSrc = $sce.trustAsResourceUrl(evt.stream);
                        }
                    })

                }

                function getLocalAudioSucc(localStream) {
                    $scope.$apply(function() {
                        if (window.URL) {
                            $scope.localAudioSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(localStream));
                        } else {
                            $scope.localAudioSrc = $sce.trustAsResourceUrl(localStream);
                        }
                    })

                }
            }
        ])






})();