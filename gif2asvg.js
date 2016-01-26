'use strict';
var gif2asvg = {};

var omggif = require('omggif');
var ImageInfo = require('./image-info');

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

gif2asvg.smilSvgAnimationFromBase64Gif = function(base64ImageData) {
    console.log(base64ImageData);
};

gif2asvg.smilSvgAnimationFromImageDataGif = function (imageData) {
    var gr = new omggif.GifReader(imageData);
    var imageInfo = ImageInfo.fromGifReader(gr);

    console.log(gr);
};

function testRun() {
    var fs = require('fs');
    var data = fs.readFileSync('./convert/overlay6.gif');
    var svg = gif2asvg.smilSvgAnimationFromImageDataGif(data);
}

testRun();

