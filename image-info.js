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