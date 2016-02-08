require('./global-is-node-flag');
var gif2asvg = require('./dist/gif2asvg');
require('./gif2asvg-overrides');
var btoa = require('btoa');

function testRun() {
    var fs = require('fs');
    // 2, 7, 9, 13
    var file = './convert/overlay11.gif';
    var data = fs.readFileSync(file);

    var converter = new gif2asvg();

    //var svg = converter.cssSvgAnimationFromImageDataGif(data);
    var svg = converter.smilSvgAnimationFromImageDataGif(data);
    
    fs.writeFileSync(file + '.svg', svg, 'utf8');

    var base64svg = btoa(svg);
    fs.writeFileSync(file + '.svg.b64.txt', base64svg, 'utf8');

    //fs.writeFileSync(file+'.txt', svg, 'base64');
}

testRun();