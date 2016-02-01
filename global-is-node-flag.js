(function(global) {
    'use strict';
    global.__isNode = typeof window === 'undefined';

})(typeof window === 'undefined' ? global : window);
