'use strict';
var gif2asvg = {};

var omggif = require('omggif');
var ImageInfo = require('./image-info');

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

gif2asvg._encodeImageDataToPngNodeJs = function (binaryArray, width, height) {
    // ReSharper disable once InconsistentNaming
    var PNG = require('pngjs').PNG;
    
    // ReSharper disable once InconsistentNaming
    var png = new PNG();
    png.width = width;
    png.height = height;
    
    // ReSharper disable once UndeclaredGlobalVariableUsing
    png.data = new Buffer(binaryArray);
    var pngImageData = PNG.sync.write(png);
    return pngImageData;
};

gif2asvg.encodeImageDataToPng = function (binaryArray, width, height) {
    var g = global || window;
    if (!g.document) {
        return gif2asvg._encodeImageDataToPngNodeJs(binaryArray, width, height);
    }
    // canvas impelemtation
    return;
};

gif2asvg.generateImageId = function (imageData, imageIndex) {
    return 'F' + imageIndex;
};

gif2asvg.generateAnimationId = function (imageData, imageIndex) {
    return 'A' + imageIndex;
};


gif2asvg.smilSvgAnimationFromImageDataFramesGif = function (imageData) {
    var svg = '';
    var setTags = '';
    for (var i = 0; i < imageData.frames.length; i++) {
        var frame = imageData.frames[i];

        var pngImageData = gif2asvg.encodeImageDataToPng(frame.data, frame.width, frame.height);
        var imageDataBase64 = gif2asvg.convertBinaryToBase64(pngImageData);
        
        var imageId = gif2asvg.generateImageId(imageData, i);
        var imgTag = '<image id="' + imageId + '" height="100%" width="0" A:href="data:image/png;base64,' + imageDataBase64 + '"/>';

        var setTagId = gif2asvg.generateAnimationId(imageData, i);
        var begin = '';
        if (i === 0) {
            begin += gif2asvg.generateAnimationId(imageData, imageData.frames.length - 1) + '.end; 0s';
        } else {
            begin += gif2asvg.generateAnimationId(imageData, i - 1) + '.end;';
        }

        var setTag = '<set id="' + setTagId + '" A:href="#' + imageId + '" attributeName="width" to="100%" dur="' + frame.delay + 'ms" begin="' + begin + '"/>';
        setTags += setTag;
        svg += imgTag;
    }

    svg += setTags;

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

