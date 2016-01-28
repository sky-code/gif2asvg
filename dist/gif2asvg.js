'use strict';

var ImageInfo = {};
ImageInfo.isNode = typeof window === 'undefined';
ImageInfo.createImageData = function(width, height) {
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

if (ImageInfo.isNode) {
    module.exports = ImageInfo;
}

'use strict';
var gif2asvg = {};

gif2asvg.isNode = typeof window === 'undefined';

if (gif2asvg.isNode) {
    var omggif = require('omggif');
    var ImageInfo = require('./image-info');
} else {
    window.omggif = {
        GifWriter: GifWriter,
        GifReader: GifReader    
    };
}


if (gif2asvg.isNode && typeof btoa === 'undefined') {
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

gif2asvg.encodeSvgAsBase64 = function(svg) {
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

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

gif2asvg._encodeImageDataToPngCanvas = function (imageData) {
    var canvas = window.document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    var ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

gif2asvg._encodeImageDataToPngNodeJs = function (imageData) {
    // ReSharper disable once InconsistentNaming
    var PNG = require('pngjs').PNG;
    
    // ReSharper disable once InconsistentNaming
    var png = new PNG();
    png.width = imageData.width;
    png.height = imageData.height;
    
    // ReSharper disable once UndeclaredGlobalVariableUsing
    png.data = new Buffer(imageData.data);
    var pngImageData = PNG.sync.write(png);
    var pngDataUri = 'data:image/png;base64,' + gif2asvg.convertBinaryToBase64(pngImageData);
    return pngDataUri;
};

gif2asvg.encodeImageDataToPng = function (imageData) {
    if (gif2asvg.isNode) {
        return gif2asvg._encodeImageDataToPngNodeJs(imageData);
    }
    return gif2asvg._encodeImageDataToPngCanvas(imageData);
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
        
        var pngImageDataUri = gif2asvg.encodeImageDataToPng(frame);
        
        var imageId = gif2asvg.generateImageId(imageData, i);
        var imgTag = '<image id="' + imageId + '" height="100%" width="0" A:href="' + pngImageDataUri + '"/>';
        
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
    var file = './convert/overlay12.gif';
    var data = fs.readFileSync(file);
    var svg = gif2asvg.smilSvgAnimationFromImageDataGif(data);
    
    fs.writeFileSync(file + '.svg', svg, 'utf8');
    //fs.writeFileSync(file+'.txt', svg, 'base64');
}

//testRun();
