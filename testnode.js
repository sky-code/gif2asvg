var gif2asvg = require('./gif2asvg');

function testRun() {
    var fs = require('fs');
    var file = './convert/overlay13.gif';
    var data = fs.readFileSync(file);
    var svg = gif2asvg.smilSvgAnimationFromImageDataGif(data);
    
    fs.writeFileSync(file + '.svg', svg, 'utf8');
        //fs.writeFileSync(file+'.txt', svg, 'base64');
}

testRun();