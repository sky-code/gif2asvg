(function(global) {
    'use strict';

    var gif2asvg;
    if (global.isNode) {
        gif2asvg = require('./dist/gif2asvg');
    } else {
        gif2asvg = global.gif2asvg;
    }

    gif2asvg.prototype.wrapInSvgHeader = function(svgMarkup, svgWidth, svgHeight) {
        var q = this.q;
        var svgOpen = '<svg id="ts0000000000000000" xmlns=' + q + 'http://www.w3.org/2000/svg' + q + ' xmlns:A=' + q + 'http://www.w3.org/1999/xlink' + q + ' width=' + q + svgWidth + q + ' height=' + q + svgHeight + q + '>';
        var svgClose = '</svg>';
        return svgOpen + svgMarkup + svgClose;
    };

})(typeof window === 'undefined' ? global : window);