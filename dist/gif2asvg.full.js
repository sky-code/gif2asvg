'use strict';

(function (global) {
    'use strict';

    var ImageInfo = {};
    ImageInfo.isNode = typeof window === 'undefined';

    if (ImageInfo.isNode) {
        module.exports = ImageInfo;
    } else {
        global.ImageInfo = ImageInfo;
    }

    ImageInfo.createImageData = function (width, height) {
        if (ImageInfo.isNode) {
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

    global.isNode = typeof window === 'undefined';

    if (global.isNode) {
        var omggif = require('omggif');
        var ImageInfo = require('./image-info');
    } else {
        var omggif = { GifWriter: global.GifWriter, GifReader: global.GifReader };
        var ImageInfo = global.ImageInfo;
    }

    if (global.isNode && typeof btoa === 'undefined') {
        global.btoa = function (str) {
            var buffer;

            if (str instanceof Buffer) {
                buffer = str;
            } else {
                buffer = new Buffer(str.toString(), 'binary');
            }

            return buffer.toString('base64');
        };
    }

    var q = '"';

    var gif2asvg = function () {
        function gif2asvg() {
            _classCallCheck(this, gif2asvg);

            this.isNode = typeof window === 'undefined';
        }

        _createClass(gif2asvg, [{
            key: 'convertDataURIToBinary',
            value: function convertDataURIToBinary(dataURI) {
                var BASE64_MARKER = ';base64,';

                var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
                var base64 = dataURI.substring(base64Index);
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
                var svgOpen = '<svg id="ts0000000000000000" xmlns=' + q + 'http://www.w3.org/2000/svg' + q + ' xmlns:A=' + q + 'http://www.w3.org/1999/xlink' + q + ' width=' + q + svgWidth + q + ' height=' + q + svgHeight + q + '>';
                // TODO move to override method
                var svgClose = '</svg>';
                return svgOpen + svgMarkup + svgClose;
            }
        }, {
            key: 'smilSvgAnimationFromBase64Gif',
            value: function smilSvgAnimationFromBase64Gif(base64ImageData) {
                return this.smilSvgAnimationFromImageDataGif(this.convertDataURIToBinary(base64ImageData));
            }
        }, {
            key: 'smilSvgAnimationFromImageDataGif',
            value: function smilSvgAnimationFromImageDataGif(imageData) {
                var gr = new omggif.GifReader(imageData);
                var imageInfo = ImageInfo.fromGifReader(gr);
                return this.smilSvgAnimationFromImageDataFramesGif(imageInfo);
            }
        }, {
            key: 'encodeImageDataToPngCanvas',
            value: function encodeImageDataToPngCanvas(imageData) {
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
                if (global.isNode) {
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
            key: 'smilSvgAnimationFromImageDataFramesGif',
            value: function smilSvgAnimationFromImageDataFramesGif(imageData) {
                var svg = '';
                var setTags = '';
                for (var i = 0; i < imageData.frames.length; i++) {
                    var frame = imageData.frames[i];

                    var pngImageDataUri = this.encodeImageDataToPng(frame);

                    var imageId = this.generateImageId(imageData, i);
                    var imgTag = '<image id=' + q + imageId + q + ' height=' + q + '100%' + q + ' width=' + q + '0' + q + ' A:href=' + q + pngImageDataUri + q + '/>';

                    var setTagId = this.generateAnimationId(imageData, i);
                    var begin = '';
                    if (i === 0) {
                        begin += this.generateAnimationId(imageData, imageData.frames.length - 1) + '.end; 0s';
                    } else {
                        begin += this.generateAnimationId(imageData, i - 1) + '.end;';
                    }

                    var setTag = '<set id=' + q + setTagId + q + ' A:href=' + q + '#' + imageId + q + ' attributeName=' + q + 'width' + q + ' to=' + q + '100%' + q + ' dur=' + q + frame.delay + 'ms' + q + ' begin=' + q + begin + q + '/>';
                    setTags += setTag;
                    svg += imgTag;
                }

                svg += setTags;

                svg = this.wrapInSvgHeader(svg, imageData.width, imageData.height);
                return svg;
            }
        }]);

        return gif2asvg;
    }();

    if (global.isNode) {
        module.exports = gif2asvg;
    } else {
        global.gif2asvg = gif2asvg;
    }
})(typeof window === 'undefined' ? global : window);
//# sourceMappingURL=gif2asvg.js.map
