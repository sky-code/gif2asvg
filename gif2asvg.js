'use strict';
var gif2asvg = {};

var omggif = require('omggif');
var ImageInfo = require('./image-info');
var PNG = require('pngjs').PNG;

if (global && !global.btoa) {
    global.btoa = function (str) {
        var buffer;
        
        if (str instanceof Buffer) {
            buffer = str;
        } else {
            buffer = new Buffer(str.toString(), 'binary');
        }
        
        return buffer.toString('base64');
    }
}

gif2asvg.convertDataURIToBinary = function (dataURI) {
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

gif2asvg.convertBinaryToBase64 = function (binaryData) {
    // ReSharper disable once InconsistentNaming
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

gif2asvg.wrapInSvgHeader = function (svgMarkup, svgWidth, svgHeight) {
    var svgOpen = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:A="http://www.w3.org/1999/xlink" width="' + svgWidth + '" height="' + svgHeight + '">';
    var svgClose = '</svg>';
    return svgOpen + svgMarkup + svgClose;
};

gif2asvg.smilSvgAnimationFromBase64Gif = function (base64ImageData) {
    return gif2asvg.smilSvgAnimationFromImageDataGif(gif2asvg.convertDataURIToBinary(base64ImageData));
};

gif2asvg.smilSvgAnimationFromImageDataGif = function (imageData) {
    var gr = new omggif.GifReader(imageData);
    var imageInfo = ImageInfo.fromGifReader(gr);
    return gif2asvg.smilSvgAnimationFromImageDataFramesGif(imageInfo);
};

gif2asvg.smilSvgAnimationFromImageDataFramesGif = function (imageData) {
    var svg = '';
    var begin = 0;
    for (var i = 0; i < imageData.frames.length; i++) {
        var frame = imageData.frames[i];

        var png = new PNG();
        png.width = frame.width;
        png.height = frame.height;
        png.data = new Buffer(frame.data);
        //png.pack();
        var buffer = PNG.sync.write(png);

        var imageDataBase64 = gif2asvg.convertBinaryToBase64(buffer);
        var imgTag = '<image height="100%" width="0" A:href="data:image/png;base64,' + imageDataBase64 + '">';
        var setTag = '<set attributeName="width" repeatCount="indefinite" fill="remove" to="100%" dur="' + frame.delay + 'ms" begin="' + begin + 'ms"/>';
        imgTag += setTag;
        imgTag += '</image>';
        svg += imgTag;
        begin += frame.delay;
    }
    
    svg = gif2asvg.wrapInSvgHeader(svg, imageData.width, imageData.height);
    return svg;
};


function testRun() {
    var fs = require('fs');
    var data = fs.readFileSync('./convert/overlay6.gif');
    var svg = gif2asvg.smilSvgAnimationFromImageDataGif(data);
    
    fs.writeFileSync('./result.svg', svg, 'utf8');
}

testRun();

