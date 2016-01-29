(function(global) {
    'use strict';

    var q = '"';

    var gif2asvg = {};
    gif2asvg.isNode = typeof window === 'undefined';
    
    if (gif2asvg.isNode) {
        var omggif = require('omggif');
        var ImageInfo = require('./image-info');
        module.exports = gif2asvg;
    } else {
        var omggif = { GifWriter: global.GifWriter, GifReader: global.GifReader };
        var ImageInfo = global.ImageInfo;
        global.gif2asvg = gif2asvg;
    }

    if (gif2asvg.isNode && typeof btoa === 'undefined') {
        global.btoa = function(str) {
            var buffer;

            if (str instanceof Buffer) {
                buffer = str;
            } else {
                buffer = new Buffer(str.toString(), 'binary');
            }

            return buffer.toString('base64');
        }
    }

    gif2asvg.convertDataURIToBinary = function(dataURI) {
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
    };

    gif2asvg.convertBinaryToBase64 = function(binaryData) {
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
    };

    gif2asvg.encodeSvgAsBase64 = function(svg) {
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    gif2asvg.wrapInSvgHeader = function(svgMarkup, svgWidth, svgHeight) {
        var svgOpen = '<svg xmlns=' + q + 'http://www.w3.org/2000/svg' + q + ' xmlns:A=' + q + 'http://www.w3.org/1999/xlink' + q + ' width=' + q + svgWidth + q + ' height=' + q + svgHeight + q + '>';
        var svgClose = '</svg>';
        return svgOpen + svgMarkup + svgClose;
    };

    gif2asvg.smilSvgAnimationFromBase64Gif = function(base64ImageData) {
        return gif2asvg.smilSvgAnimationFromImageDataGif(gif2asvg.convertDataURIToBinary(base64ImageData));
    };

    gif2asvg.smilSvgAnimationFromImageDataGif = function(imageData) {
        var gr = new omggif.GifReader(imageData);
        var imageInfo = ImageInfo.fromGifReader(gr);
        return gif2asvg.smilSvgAnimationFromImageDataFramesGif(imageInfo);
    };

    gif2asvg._encodeImageDataToPngCanvas = function(imageData) {
        var canvas = window.document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        var ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    };

    gif2asvg._encodeImageDataToPngNodeJs = function(imageData) {
        var PNG = require('pngjs').PNG;

        var png = new PNG();
        png.width = imageData.width;
        png.height = imageData.height;

        png.data = new Buffer(imageData.data);
        var pngImageData = PNG.sync.write(png);
        var pngDataUri = 'data:image/png;base64,' + gif2asvg.convertBinaryToBase64(pngImageData);
        return pngDataUri;
    };

    gif2asvg.encodeImageDataToPng = function(imageData) {
        if (gif2asvg.isNode) {
            return gif2asvg._encodeImageDataToPngNodeJs(imageData);
        }
        return gif2asvg._encodeImageDataToPngCanvas(imageData);
    };

    gif2asvg.generateImageId = function(imageData, imageIndex) {
        return 'F' + imageIndex;
    };

    gif2asvg.generateAnimationId = function(imageData, imageIndex) {
        return 'A' + imageIndex;
    };


    gif2asvg.smilSvgAnimationFromImageDataFramesGif = function(imageData) {
        var svg = '';
        var setTags = '';
        for (var i = 0; i < imageData.frames.length; i++) {
            var frame = imageData.frames[i];

            var pngImageDataUri = gif2asvg.encodeImageDataToPng(frame);

            var imageId = gif2asvg.generateImageId(imageData, i);
            var imgTag = '<image id=' + q + imageId + q + ' height=' + q + '100%' + q + ' width=' + q + '0' + q + ' A:href=' + q + pngImageDataUri + q + '/>';

            var setTagId = gif2asvg.generateAnimationId(imageData, i);
            var begin = '';
            if (i === 0) {
                begin += gif2asvg.generateAnimationId(imageData, imageData.frames.length - 1) + '.end; 0s';
            } else {
                begin += gif2asvg.generateAnimationId(imageData, i - 1) + '.end;';
            }

            var setTag = '<set id=' + q + setTagId + q + ' A:href=' + q + '#' + imageId + q + ' attributeName=' + q + 'width' + q + ' to=' + q + '100%' + q + ' dur=' + q + frame.delay + 'ms' + q + ' begin=' + q + begin + q + '/>';
            setTags += setTag;
            svg += imgTag;
        }

        svg += setTags;

        svg = gif2asvg.wrapInSvgHeader(svg, imageData.width, imageData.height);
        return svg;
    };
})(typeof window === 'undefined' ? global : window);