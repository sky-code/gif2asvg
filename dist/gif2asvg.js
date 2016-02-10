'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global) {
    'use strict';

    var SuperGif = global.SuperGif;
    var btoa = global.btoa;
    if (global.__isNode) {
        SuperGif = require('../libgif');
        btoa = require('btoa');
    }

    var gif2asvg = function () {
        function gif2asvg() {
            _classCallCheck(this, gif2asvg);

            this.isNode = typeof window === 'undefined';
            this.q = '"';
        }

        _createClass(gif2asvg, [{
            key: 'convertDataURIToBinary',
            value: function convertDataURIToBinary(dataUri) {
                var base64Marker = ';base64,';

                var base64Index = dataUri.indexOf(base64Marker) + base64Marker.length;
                var base64 = dataUri.substring(base64Index);
                var raw = window.atob(base64);
                var rawLength = raw.length;
                var array = new Uint8Array(new ArrayBuffer(rawLength));

                for (var i = 0; i < rawLength; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                return array;
            }
        }, {
            key: 'convertBinaryToBase64',
            value: function convertBinaryToBase64(binaryData) {
                var CHUNK_SIZE = 0x8000; //arbitrary number
                var index = 0;
                var length = binaryData.length;
                var result = '';
                var slice;
                while (index < length) {
                    slice = binaryData.subarray(index, Math.min(index + CHUNK_SIZE, length));
                    result += String.fromCharCode.apply(null, slice);
                    index += CHUNK_SIZE;
                }
                return btoa(result);
            }
        }, {
            key: 'encodeSvgAsBase64',
            value: function encodeSvgAsBase64(svg) {
                return 'data:image/svg+xml;base64,' + btoa(svg);
            }
        }, {
            key: 'wrapInSvgHeader',
            value: function wrapInSvgHeader(svgMarkup, svgWidth, svgHeight) {
                var q = this.q;
                var svgOpen = '<svg xmlns=' + q + 'http://www.w3.org/2000/svg' + q + ' xmlns:A=' + q + 'http://www.w3.org/1999/xlink' + q + ' width=' + q + svgWidth + q + ' height=' + q + svgHeight + q + '>';
                var svgClose = '</svg>';
                return svgOpen + svgMarkup + svgClose;
            }
        }, {
            key: '_getWebFrames',
            value: function _getWebFrames(imageData) {
                var fakeImgParent = document.createElement('div');
                var fakeImg = document.createElement('img');
                fakeImgParent.appendChild(fakeImg);
                var superGif = SuperGif({
                    gif: fakeImg,
                    auto_play: false,
                    draw_while_loading: false,
                    show_progress_bar: false
                });
                var p = new Promise(function (resolve) {
                    superGif.load_raw(imageData, function () {
                        var canvas = superGif.get_canvas();
                        var frames = superGif.get_frames();
                        var webFrames = [];
                        webFrames.width = canvas.width;
                        webFrames.height = canvas.height;
                        webFrames.duration = 0;

                        for (var i = 0; i < frames.length; i++) {
                            var frame = frames[i];
                            superGif.move_to(i);
                            var imageDataUrl = canvas.toDataURL('image/png');
                            var delay = frame.delay;
                            if (delay) {
                                delay = delay * 10; // bugfix
                            }
                            webFrames.duration += delay;
                            webFrames.push({
                                imageDataUrl: imageDataUrl,
                                delay: delay
                            });
                        }
                        resolve(webFrames);
                    });
                });
                return p;
            }
        }, {
            key: 'smilSvgAnimationFromBase64Gif',
            value: function smilSvgAnimationFromBase64Gif(base64ImageData) {
                return this.smilSvgAnimationFromImageDataGif(this.convertDataURIToBinary(base64ImageData));
            }
        }, {
            key: 'smilSvgAnimationFromImageDataGif',
            value: function smilSvgAnimationFromImageDataGif(imageData) {
                var self = this;
                var p = new Promise(function (resolve) {
                    self._getWebFrames(imageData).then(function (webFrames) {
                        var svg = self.smilSvgAnimationFromWebFrames(webFrames);
                        resolve(svg);
                    });
                });
                return p;
            }
        }, {
            key: 'cssSvgAnimationFromBase64Gif',
            value: function cssSvgAnimationFromBase64Gif(base64ImageData) {
                return this.cssSvgAnimationFromImageDataGif(this.convertDataURIToBinary(base64ImageData));
            }
        }, {
            key: 'cssSvgAnimationFromImageDataGif',
            value: function cssSvgAnimationFromImageDataGif(imageData) {
                var self = this;
                var p = new Promise(function (resolve) {
                    self._getWebFrames(imageData).then(function (webFrames) {
                        var svg = self.cssSvgAnimationFromWebFrames(webFrames);
                        resolve(svg);
                    });
                });
                return p;
            }
        }, {
            key: 'generateImageId',
            value: function generateImageId(imageData, imageIndex) {
                return 'F' + imageIndex;
            }
        }, {
            key: 'generateAnimationId',
            value: function generateAnimationId(imageData, imageIndex) {
                return 'A' + imageIndex;
            }
        }, {
            key: '_normalizeKeyFramePercentage',
            value: function _normalizeKeyFramePercentage(percentage) {
                if (percentage.toString() > 5) {
                    return percentage.toPrecision(4);
                }
                return percentage.toPrecision(3);
            }
        }, {
            key: 'cssSvgAnimationFromWebFrames',
            value: function cssSvgAnimationFromWebFrames(webFrames) {
                var q = this.q;
                var keyFrame = 0;
                var svg = '';
                var style = '<style type="text/css"><![CDATA[';
                var animationDuration = webFrames.duration;
                var prevAnimationsDuration = 0;
                for (var i = 0; i < webFrames.length; i++) {
                    var frame = webFrames[i];

                    var imageDataUrl = frame.imageDataUrl;
                    var animationId = this.generateAnimationId(frame, i);
                    var imgId = this.generateImageId(frame, i);
                    var imgVisibility = 'hidden';
                    if (i === keyFrame) {
                        imgVisibility = 'visible';
                    }

                    var imgTag = '<image id=' + q + imgId + q + ' height=' + q + webFrames.height + q + ' width=' + q + webFrames.width + q + ' style=' + q + 'visibility: ' + imgVisibility + ';animation:' + animationId + ' ' + animationDuration + 'ms linear 0s infinite;-webkit-animation:' + animationId + ' ' + animationDuration + 'ms linear 0s infinite;' + q + ' A:href=' + q + imageDataUrl + q + '/>';

                    var keyframeStyle = '@keyframes ' + animationId + ' { ';
                    if (i === 0) {
                        keyframeStyle += '0% {visibility: visible;}';
                    } else {
                        keyframeStyle += '0% {visibility: hidden;}';
                        var beginPercent = prevAnimationsDuration / animationDuration * 100;
                        var beginPercentPreventAnimation = beginPercent - 0.01;
                        beginPercentPreventAnimation = this._normalizeKeyFramePercentage(beginPercentPreventAnimation);
                        beginPercent = this._normalizeKeyFramePercentage(beginPercent);
                        keyframeStyle += beginPercentPreventAnimation + '% {visibility: hidden;}';
                        keyframeStyle += beginPercent + '% {visibility: visible;}';
                    }
                    prevAnimationsDuration += frame.delay;

                    if (i !== webFrames.length - 1) {
                        var endPercent = prevAnimationsDuration / animationDuration * 100;
                        var endPercentPreventAnimation = endPercent - 0.01;

                        endPercent = this._normalizeKeyFramePercentage(endPercent);
                        endPercentPreventAnimation = this._normalizeKeyFramePercentage(endPercentPreventAnimation);
                        keyframeStyle += endPercentPreventAnimation + '% {visibility: visible;}';

                        keyframeStyle += endPercent + '% {visibility: hidden;}';
                    }
                    keyframeStyle += '100% {visibility: hidden;}';

                    keyframeStyle += ' }';
                    style += '\n';
                    style += keyframeStyle;
                    style += '\n';
                    style += '@-webkit-keyframes' + keyframeStyle.slice(10);

                    svg += imgTag;
                }
                style += '\n]]></style>';
                svg = style + svg;

                svg = this.wrapInSvgHeader(svg, webFrames.width, webFrames.height);
                return svg;
            }
        }, {
            key: 'smilSvgAnimationFromWebFrames',
            value: function smilSvgAnimationFromWebFrames(webFrames) {
                var q = this.q;
                var svg = '';
                var setTags = '';
                for (var i = 0; i < webFrames.length; i++) {
                    var frame = webFrames[i];

                    var imageDataUrl = frame.imageDataUrl;
                    var imageId = this.generateImageId(frame, i);
                    var imgTag = '<image id=' + q + imageId + q + ' height=' + q + '100%' + q + ' width=' + q + '0' + q + ' A:href=' + q + imageDataUrl + q + '/>';

                    var setTagId = this.generateAnimationId(frame, i);
                    var begin = '';
                    if (i === 0) {
                        begin += this.generateAnimationId(frame, webFrames.length - 1) + '.end; 0s';
                    } else {
                        begin += this.generateAnimationId(frame, i - 1) + '.end;';
                    }

                    var setTag = '<set id=' + q + setTagId + q + ' A:href=' + q + '#' + imageId + q + ' attributeName=' + q + 'width' + q + ' to=' + q + '100%' + q + ' dur=' + q + frame.delay + 'ms' + q + ' begin=' + q + begin + q + '/>';
                    setTags += setTag;
                    svg += imgTag;
                }

                svg += setTags;

                svg = this.wrapInSvgHeader(svg, webFrames.width, webFrames.height);
                return svg;
            }
        }]);

        return gif2asvg;
    }();

    // ReSharper disable once JsUnreachableCode

    if (global.__isNode) {
        module.exports = gif2asvg;
    } else {
        global.gif2asvg = gif2asvg;
    }
})(typeof window === 'undefined' ? global : window);
//# sourceMappingURL=gif2asvg.js.map
