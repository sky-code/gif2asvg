(function(global) {
    'use strict';
    global.__isNode = typeof window === 'undefined';

})(typeof window === 'undefined' ? global : window);

'use strict';

(function (global) {
    'use strict';

    var ImageInfo = {};
    if (global.__isNode) {
        module.exports = ImageInfo;
    } else {
        global.ImageInfo = ImageInfo;
    }

    ImageInfo.createImageData = function (width, height) {
        if (global.__isNode) {
            // ReSharper disable once InconsistentNaming
            var U8A = Uint8ClampedArray || Uint8Array;
            var imageData = { width: width, height: height };
            imageData.data = new U8A(width * height * 4);
            return imageData;
        }

        var ctx = window.document.createElement('canvas').getContext('2d');
        return ctx.createImageData(width, height);
    };

    ImageInfo.fromGifReader = function (gifReader) {
        var imageData = ImageInfo.createImageData(gifReader.width, gifReader.height);

        imageData.frames = [];

        for (var i = 0; i < gifReader.numFrames(); i++) {
            var frameInfo = gifReader.frameInfo(i);

            var width = frameInfo.width;
            var height = frameInfo.height;
            var frame = ImageInfo.createImageData(width, height);

            frame.data_length = frameInfo.data_length;
            frame.data_offset = frameInfo.data_offset;
            frame.delay = frameInfo.delay;
            frame.disposal = frameInfo.disposal;
            frame.has_local_palette = frameInfo.has_local_palette;
            frame.interlaced = frameInfo.interlaced;
            frame.palette_offset = frameInfo.palette_offset;
            frame.transparent_index = frameInfo.transparent_index;
            frame.x = frameInfo.x;
            frame.y = frameInfo.y;
            gifReader.decodeAndBlitFrameRGBA(i, frame.data);
            imageData.frames[i] = frame;

            if (frame.delay) {
                frame.delay = frame.delay * 10; // bugfix
            }
        }

        imageData.loopCount = gifReader.loopCount();
        if (!imageData.loopCount) {
            imageData.loopCount = -1;
        }

        return imageData;
    };
})(typeof window === 'undefined' ? global : window);
//# sourceMappingURL=image-info.js.map

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global) {
    'use strict';

    var omggif;
    var ImageInfo;
    var btoa = global.btoa;
    if (global.__isNode) {
        omggif = require('omggif');
        ImageInfo = require('./image-info');
        btoa = require('btoa');
    } else {
        omggif = { GifWriter: global.GifWriter, GifReader: global.GifReader };
        ImageInfo = global.ImageInfo;
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
            key: 'smilSvgAnimationFromBase64Gif',
            value: function smilSvgAnimationFromBase64Gif(base64ImageData, cb) {
                return this.smilSvgAnimationFromImageDataGif(this.convertDataURIToBinary(base64ImageData), cb);
            }
        }, {
            key: 'smilSvgAnimationFromImageDataGif',
            value: function smilSvgAnimationFromImageDataGif(imageData, cb) {
                var self = this;
                var fakeImgParent = document.createElement('div');
                var fakeImg = document.createElement('img');
                fakeImgParent.appendChild(fakeImg);
                var superGif = SuperGif({
                    gif: fakeImg,
                    auto_play: false,
                    draw_while_loading: false,
                    show_progress_bar: false
                });
                superGif.load_raw(imageData, function () {
                    var canvas = superGif.get_canvas();
                    var frames = superGif.get_frames();
                    var webFrames = [];
                    webFrames.width = canvas.width;
                    webFrames.height = canvas.height;

                    for (var i = 0; i < frames.length; i++) {
                        var frame = frames[i];
                        superGif.move_to(i);
                        var imageDataUrl = canvas.toDataURL('image/png');
                        var delay = frame.delay;
                        if (delay) {
                            delay = delay * 10; // bugfix
                        }
                        webFrames.push({
                            imageDataUrl: imageDataUrl,
                            delay: delay
                        });
                    }
                    var svg = self.smilSvgAnimationFromWebFrames(webFrames);
                    if (cb) {
                        cb(svg);
                    }
                    console.log('get_playing: ' + superGif.get_playing());
                    console.log('get_canvas: ' + superGif.get_canvas());
                    console.log('get_canvas_scale: ' + superGif.get_canvas_scale());
                    console.log('get_loading: ' + superGif.get_loading());
                    console.log('get_auto_play: ' + superGif.get_auto_play());
                    console.log('get_length: ' + superGif.get_length());
                    console.log('get_current_frame: ' + superGif.get_current_frame());
                    alert('loaded');
                });

                return '';
                //var gr = new omggif.GifReader(imageData);
                //var imageInfo = ImageInfo.fromGifReader(gr);
                //return this.smilSvgAnimationFromWebFrames(imageInfo);
            }
        }, {
            key: 'cssSvgAnimationFromImageDataGif',
            value: function cssSvgAnimationFromImageDataGif(imageData) {
                var gr = new omggif.GifReader(imageData);
                var imageInfo = ImageInfo.fromGifReader(gr);
                return this.cssSvgAnimationFromImageDataFramesGif(imageInfo);
            }
        }, {
            key: '_encodeImageDataToPngCanvas',
            value: function _encodeImageDataToPngCanvas(imageData) {
                var canvas = window.document.createElement('canvas');
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                var ctx = canvas.getContext('2d');
                ctx.putImageData(imageData, 0, 0);
                return canvas.toDataURL('image/png');
            }
        }, {
            key: '_encodeImageDataToPngNodeJs',
            value: function _encodeImageDataToPngNodeJs(imageData) {
                var PNG = require('pngjs').PNG;

                var png = new PNG();
                png.width = imageData.width;
                png.height = imageData.height;

                png.data = new Buffer(imageData.data);
                var pngImageData = PNG.sync.write(png);
                var pngDataUri = 'data:image/png;base64,' + this.convertBinaryToBase64(pngImageData);
                return pngDataUri;
            }
        }, {
            key: 'encodeImageDataToPng',
            value: function encodeImageDataToPng(imageData) {
                if (global.__isNode) {
                    return this._encodeImageDataToPngNodeJs(imageData);
                }
                return this._encodeImageDataToPngCanvas(imageData);
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
            key: 'cssSvgAnimationFromImageDataFramesGif',
            value: function cssSvgAnimationFromImageDataFramesGif(imageData) {
                var q = this.q;
                var svg = '';
                var svgStyle = '@keyframes _smil14{0%{visibility:hidden}}';
                var setTags = '';
                for (var i = 0; i < imageData.frames.length; i++) {
                    var frame = imageData.frames[i];

                    var pngImageDataUri = this.encodeImageDataToPng(frame);

                    var imageId = this.generateImageId(imageData, i);
                    var imgTag = '<image id=$ { q } $ { imageId } $ { q } height = $ { q } 100 % $ { q } width = $ { q } 0$ { q } A: href = $ { q } $ { pngImageDataUri } $ { q }/>';

                    var setTagId = this.generateAnimationId(imageData, i);
                    var begin = '';
                    if (i === 0) {
                        begin += ' $ { this.generateAnimationId(imageData, imageData.frames.length - 1) }.end; 0s';
                    } else {
                        begin += ' $ { this.generateAnimationId(imageData, i - 1) }.end;';
                    }

                    var setTag = '<set id=$ { q } $ { setTagId } $ { q } A: href = $ { q }# $ { imageId } $ { q } attributeName = $ { q } width$ { q } to = $ { q } 100 % $ { q } dur = $ { q } $ { frame.delay } ms$ { q } begin = $ { q } $ { begin } $ { q }/>';
                    setTags += setTag;
                    svg += imgTag;
                }

                svg += setTags;

                svg = this.wrapInSvgHeader(svg, imageData.width, imageData.height);
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

(function(global) {
    'use strict';

    var gif2asvg;
    if (global.__isNode) {
        gif2asvg = require('./dist/gif2asvg');
    } else {
        gif2asvg = global.gif2asvg;
    }

    gif2asvg.prototype.wrapInSvgHeader = function(svgMarkup, svgWidth, svgHeight) {
        var q = this.q;
        var svgOpen = '<svg id="ts0000000000000000" xmlns=' + q + 'http://www.w3.org/2000/svg' + q + ' xmlns:A=' + q + 'http://www.w3.org/1999/xlink' + q + ' width=' + q + svgWidth + q + ' height=' + q + svgHeight + q + '>';
        var svgClose = '</svg>';
        return svgOpen + svgMarkup + svgClose;
    };

})(typeof window === 'undefined' ? global : window);