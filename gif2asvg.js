(function (global) {
    'use strict';

    var SuperGif = global.SuperGif;
    var btoa = global.btoa;
    if (global.__isNode) {
        SuperGif = require('../libgif');
        btoa = require('btoa');
    }

    class gif2asvg {
        constructor() {
            this.isNode = typeof window === 'undefined';
            this.q = '"';
        }

        convertDataURIToBinary(dataUri) {
            const base64Marker = ';base64,';

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

        convertBinaryToBase64(binaryData) {
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

        encodeSvgAsBase64(svg) {
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        }

        wrapInSvgHeader(svgMarkup, svgWidth, svgHeight) {
            var q = this.q;
            var svgOpen = `<svg xmlns=${q}http://www.w3.org/2000/svg${q} xmlns:A=${q}http://www.w3.org/1999/xlink${q} width=${q}${svgWidth}${q} height=${q}${svgHeight}${q}>`;
            var svgClose = '</svg>';
            return svgOpen + svgMarkup + svgClose;
        }

        smilSvgAnimationFromBase64Gif(base64ImageData, cb) {
            return this.smilSvgAnimationFromImageDataGif(this.convertDataURIToBinary(base64ImageData), cb);
        }

        smilSvgAnimationFromImageDataGif(imageData, cb) {
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
            });

            return '';
            //var gr = new omggif.GifReader(imageData);
            //var imageInfo = ImageInfo.fromGifReader(gr);
            //return this.smilSvgAnimationFromWebFrames(imageInfo);
        }

        cssSvgAnimationFromImageDataGif(imageData) {
            var gr = new omggif.GifReader(imageData);
            var imageInfo = ImageInfo.fromGifReader(gr);
            return this.cssSvgAnimationFromImageDataFramesGif(imageInfo);
}

        _encodeImageDataToPngCanvas(imageData) {
            var canvas = window.document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            var ctx = canvas.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
            return canvas.toDataURL('image/png');
        }

        _encodeImageDataToPngNodeJs(imageData) {
            var PNG = require('pngjs').PNG;

            var png = new PNG();
            png.width = imageData.width;
            png.height = imageData.height;

            png.data = new Buffer(imageData.data);
            var pngImageData = PNG.sync.write(png);
            var pngDataUri = `data:image/png;base64,${this.convertBinaryToBase64(pngImageData)}`;
            return pngDataUri;
        }

        encodeImageDataToPng(imageData) {
            if (global.__isNode) {
                return this._encodeImageDataToPngNodeJs(imageData);
            }
            return this._encodeImageDataToPngCanvas(imageData);
        }

        generateImageId (imageData, imageIndex) {
            return `F${imageIndex}`;
        }

        generateAnimationId(imageData, imageIndex) {
            return `A${imageIndex}`;
}

        cssSvgAnimationFromImageDataFramesGif(webFrames) {
            var q = this.q;
            var svg = '';
            var svgStyle = '@keyframes _smil14{0%{visibility:hidden}}';
            var setTags = '';
            for (var i = 0; i < webFrames.length; i++) {
                var frame = webFrames[i];

                var imageDataUrl = frame.imageDataUrl;
                var imageId = this.generateImageId(frame, i);
                var imgTag = `<image id=${q}${imageId}${q} height=${q}100%${q} width=${q}0${q} A:href=${q}${imageDataUrl}${q}/>`;

                var setTagId = this.generateAnimationId(frame, i);
                var begin = '';
                if (i === 0) {
                    begin += `${this.generateAnimationId(frame, webFrames.length - 1)}.end; 0s`;
                } else {
                    begin += `${this.generateAnimationId(frame, i - 1)}.end;`;
                }

                var setTag = `<set id=${q}${setTagId}${q} A:href=${q}#${imageId}${q} attributeName=${q}width${q} to=${q}100%${q} dur=${q}${frame.delay}ms${q} begin=${q}${begin}${q}/>`;
                setTags += setTag;
                svg += imgTag;
            }

            svg += setTags;

            svg = this.wrapInSvgHeader(svg, webFrames.width, webFrames.height);
            return svg;
}

        smilSvgAnimationFromWebFrames(webFrames) {
            var q = this.q;
            var svg = '';
            var setTags = '';
            for (var i = 0; i < webFrames.length; i++) {
                var frame = webFrames[i];

                var imageDataUrl = frame.imageDataUrl;
                var imageId = this.generateImageId(frame, i);
                var imgTag = `<image id=${q}${imageId}${q} height=${q}100%${q} width=${q}0${q} A:href=${q}${imageDataUrl}${q}/>`;

                var setTagId = this.generateAnimationId(frame, i);
                var begin = '';
                if (i === 0) {
                    begin += `${this.generateAnimationId(frame, webFrames.length - 1)}.end; 0s`;
                } else {
                    begin += `${this.generateAnimationId(frame, i - 1)}.end;`;
                }

                var setTag = `<set id=${q}${setTagId}${q} A:href=${q}#${imageId}${q} attributeName=${q}width${q} to=${q}100%${q} dur=${q}${frame.delay}ms${q} begin=${q}${begin}${q}/>`;
                setTags += setTag;
                svg += imgTag;
            }

            svg += setTags;

            svg = this.wrapInSvgHeader(svg, webFrames.width, webFrames.height);
            return svg;
        }
    }

// ReSharper disable once JsUnreachableCode
    if (global.__isNode) {
        module.exports = gif2asvg;

    } else {
        global.gif2asvg = gif2asvg;
    }

})(typeof window === 'undefined' ? global : window);