/**
 *  Module
 * dropbox
 * Description
 */
angular.module('gr_directive', [])
    .directive('dropbox', ['$http', '$window',
        function($http, $window) {
            // Runs during compile
            return {
                // name: '',
                // priority: 1,
                // terminal: true,
                scope: {
                    'dropsucc': '&',
                    'dropfail': '&',
                    'dropprogress': '&'

                }, // {} = isolate, true = child, false/undefined = no change
                //controller: function($scope, $element, $attrs, $transclude) {},
                // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
                restrict: 'AE', // E = Element, A = Attribute, C = Class, M = Comment
                // template: '',
                templateUrl: 'partials/directive/dropbox.html',
                // replace: true,
                // transclude: true,
                // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
                link: function($scope, iElm, iAttrs, controller) {
                    $scope.errMsg = null;
                    $scope.isUploading = false;
                    $scope.isErr = false;
                    var drage_area = iElm.children().children().eq(0);
                    drage_area.bind('dragenter', function(e) {
                        e.preventDefault();
                        // e.stopPropagation();
                        if (e.target == drage_area[0] && !$scope.isUploading) {
                            drage_area.addClass("dragenter");
                        }

                    });
                    drage_area.bind('dragleave', function(e) {
                        //e.stopPropagation();
                        e.preventDefault();
                        if (e.target == drage_area[0] && !$scope.isUploading) {
                            drage_area.removeClass("dragenter");
                        }
                    });
                    drage_area.bind('drop', function(e) {
                        // e.stopPropagation();
                        e.preventDefault();
                        if (!$scope.isUploading) {
                            drage_area.removeClass("dragenter");
                            uploadFile(e.dataTransfer.files);
                        }

                    });
                    drage_area.bind('dragover', function(e) {
                        e.preventDefault();
                    })
                    $window.addEventListener('dragover', function(e) {
                        e.preventDefault();
                    })
                    $window.addEventListener('drop', function(e) {
                        e.preventDefault();
                    })
                    $window.addEventListener('dragenter', function(e) {
                        e.preventDefault();
                    })
                    $window.addEventListener('dragleave', function(e) {
                        e.preventDefault();
                    })


                    function uploadFile(files) {
                        if (files.length > 1) {
                            $scope.$apply(function() {
                                $scope.errMsg = "一次只能上传一张头像";
                            })

                            return false;
                        }
                        if (files.length < 0) {
                            return false;
                        }
                        file = files[0];
                        if (file.type.indexOf('image') === -1) {
                            $scope.$apply(function() {
                                $scope.errMsg = "请检查你上传的图片格式";
                            })

                            return false;
                        }
                        var fd = new FormData();
                        fd.append('head', file);
                        $http.post('/uploadhead', fd, {
                                transformRequest: angular.identity,
                                headers: {
                                    'Content-Type': undefined
                                }
                            })
                            .success(function(data) {
                                if ($scope.dropsucc) {
                                    $scope.dropsucc({
                                        'url': data.head
                                    });
                                }
                            })
                            .error(function() {
                                $scope.isUploading = false;
                                $scope.isErr = true;
                                $scope.errMsg = "上传失败，请检查你的网络";
                                if ($scope.dropfail) {
                                    $scope.dropfail();
                                }
                            });
                        //切换样式
                        $scope.isUploading = true;
                        $scope.errMsg = null;

                    }
                }
            };
        }
    ])
    .directive('flexibleborder', [function() {
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            // scope: {}, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
            // template: '',
            // templateUrl: '',
            // replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, iElm, iAttrs, controller) {
                var wrapper = iElm.parent();
                var startX = null;
                var defaultWidth = wrapper[0].clientWidth;
                iElm.bind("mousedown", function(e) {
                    e.preventDefault();
                    startX = e.clientX;
                    defaultWidth = wrapper[0].clientWidth;
                    document.addEventListener("mousemove", moveHandler, true);
                    document.addEventListener("mouseup", upHandler, true);
                })

                function moveHandler(e) {
                    e.preventDefault();
                    var offsiteX = startX - e.clientX;
                    wrapper.css("width", defaultWidth + offsiteX + "px");
                }

                function upHandler(e) {
                    e.preventDefault();
                    document.removeEventListener("mousemove", moveHandler, true);
                    document.removeEventListener("mouseup", upHandler, true);


                }
            }
        };
    }])
    .directive('avatar', ['$http',function($http) {
        // Runs during compile
        return {
            // name: '',
            // priority: 1,
            // terminal: true,
            scope: {
                'avatarsrc': '=',
                'succfunc' : '&',
                'errfunc' : '&'
            }, // {} = isolate, true = child, false/undefined = no change
            // controller: function($scope, $element, $attrs, $transclude) {},
            // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
            // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
            //template: '<a>tttt</a>',
            templateUrl: 'partials/directive/avatarCanvas.html',
            // replace: true,
            // transclude: true,
            // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
            link: function($scope, iElm, iAttrs, controller) {

                var canvas = document.getElementById("avatarModifyer");
                var context = canvas.getContext("2d");
                var outer_selector = document.getElementById("outer_selector");
                var innerSelector = document.getElementById("inner_selector");
                var imgObj = new Image();
                var canvasHeight = null;
                var canvasWidth = null;
                var originData = null;
                var shortEdge = null;
                var rec = {
                    x: 0,
                    y: 0,
                    height: null,
                    width: null
                };
                imgObj.onload = function() {
                    var imgWidth = imgObj.width;
                    var imgHeight = imgObj.height;
                    if (imgWidth > imgHeight) {
                        canvasWidth = 400;
                        canvasHeight = Math.floor(imgHeight / imgWidth * 400);
                    } else {
                        canvasHeight = 400;
                        canvasWidth = Math.floor(imgWidth / imgHeight * 400);
                    }
                    shortEdge = (canvasWidth > canvasHeight ? canvasHeight : canvasWidth);
                    // resize the canvas
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    document.getElementById("canvas_wrapper").style.width = canvasWidth + "px";
                    context.drawImage(imgObj, 0, 0, canvasWidth, canvasHeight);
                    outer_selector.style.width = shortEdge + "px";
                    outer_selector.style.height = shortEdge + "px";
                    rec.height = shortEdge;
                    rec.width = shortEdge;
                    originData = context.getImageData(0, 0, canvasWidth, canvasHeight);
                    drawShadow();

                }
                imgObj.src = $scope.avatarsrc;

                var move = false;
                var startX = null;
                var startY = null;
                var tempX = 0;
                var tempY = 0;
                var tempH = null;
                var tempW = null;
                inner_selector.addEventListener("mousedown", function(e) {
                    e.stopPropagation();
                    move = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    tempX = rec.x;
                    tempY = rec.y;
                    //move the rec
                    document.addEventListener("mousemove", recMove, true);
                    document.addEventListener("mouseup", recMoveEnd, true);
                })
                outer_selector.addEventListener("mousedown", function(e) {
                    e.stopPropagation();
                    move = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    tempH = rec.height;
                    tempW = rec.width;
                    //resize the rec
                    document.addEventListener("mousemove", recResize, true);
                    document.addEventListener("mouseup", recResizeEnd, true);
                })

                function recMove(e) {
                    e.preventDefault();
                    moveX = e.clientX - startX;
                    moveY = e.clientY - startY;

                    newX = tempX + moveX;
                    newY = tempY + moveY;
                    if (newX < 0) {
                        newX = 0;
                    }
                    if (newX + rec.width > canvasWidth) {
                        newX = canvasWidth - rec.width;
                    }
                    if (newY < 0) {
                        newY = 0;
                    }
                    if (newY + rec.height > canvasHeight) {
                        newY = canvasHeight - rec.height;
                    }
                    rec.x = newX;
                    rec.y = newY;

                    //already get the new point of rec
                    outer_selector.style.top = rec.y + "px";
                    outer_selector.style.left = rec.x + "px";
                    drawShadow();
                }

                function recMoveEnd(e) {
                    e.preventDefault();
                    document.removeEventListener("mousemove", recMove, true);
                    document.removeEventListener("mouseup", recMoveEnd, true);
                }

                function recResize(e) {
                    e.preventDefault();
                    moveX = e.clientX - startX;
                    moveY = e.clientY - startY;

                    newH = tempH + moveY;
                    newW = tempW + moveX;


                    if (newH < 100 && newW < 100) {
                        newW = 100;
                        newH = 100;
                    }

                    if (newW > newH) {
                        newH = newW;
                    } else {
                        newW = newH;
                    }

                    if (newH > canvasHeight - rec.y || newW > canvasWidth - rec.x) {

                        newH = canvasHeight - rec.y;
                        newW = canvasWidth - rec.x;
                        if (newW < newH) {
                            newH = newW;
                        } else {
                            newW = newH;
                        }

                    }

                    rec.width = newW;
                    rec.height = newH;
                    //already get the new point of rec
                    outer_selector.style.height = rec.height + "px";
                    outer_selector.style.width = rec.width + "px";
                    drawShadow();

                }

                function recResizeEnd(e) {
                    e.preventDefault();
                    document.removeEventListener("mousemove", recResize, true);
                    document.removeEventListener("mouseup", recResizeEnd, true);
                }



                function drawShadow() {
                    context.putImageData(originData, 0, 0)
                    context.beginPath();
                    context.rect(0, 0, canvasWidth, canvasHeight); //outer path
                    context.moveTo(rec.x, rec.y);
                    context.lineTo(rec.x, rec.y + rec.height);
                    context.lineTo(rec.x + rec.width, rec.y + rec.height);
                    context.lineTo(rec.x + rec.width, rec.y);
                    context.closePath();
                    context.fillStyle = "rgba(0,0,0,0.44)";
                    context.fill();
                }

                $scope.submit = function() {
                    var uploadData = context.getImageData(rec.x, rec.y, rec.width, rec.height);
                    var uploadCanvas = document.getElementById("uploadCanvas");
                    var uploadContext = uploadCanvas.getContext("2d");
                    uploadCanvas.width = uploadData.width;
                    uploadCanvas.height = uploadData.height;
                    uploadContext.putImageData(uploadData, 0, 0);
                    var dataurl = uploadCanvas.toDataURL("image/jpeg");
                    var blob = dataURItoBlob(dataurl);
                    var fd = new FormData();
                    fd.append('head', blob);
                    $http.post('/uploadhead', fd, {
                            transformRequest: angular.identity,
                            headers: {
                                'Content-Type': undefined
                            }
                        })
                        .success(function(data) {
                            if($scope.succfunc){
                                $scope.succfunc({
                                    'url':data.head
                                });
                            }
                        })
                        .error(function() {
                            if($scope.errfunc){
                                $scope.errfunc();
                            }
                        })
                }

                function dataURItoBlob(dataURI) {
                    // convert base64/URLEncoded data component to raw binary data held in a string
                    var byteString;
                    if (dataURI.split(',')[0].indexOf('base64') >= 0)
                        byteString = atob(dataURI.split(',')[1]);
                    else
                        byteString = unescape(dataURI.split(',')[1]);

                    // separate out the mime component
                    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

                    // write the bytes of the string to a typed array
                    var ia = new Uint8Array(byteString.length);
                    for (var i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    return new Blob([ia], {
                        type: mimeString
                    });
                }
            }
        };
    }]);