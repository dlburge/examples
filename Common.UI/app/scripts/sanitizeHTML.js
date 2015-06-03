//Reference : http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/

"use strict";
/*jshint quotmark: false */

TraceOne.sanitizeHTML = (function ($) {

    var MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    //Encodes certains characters in a string
    var encode = function (s, boolTestAttributes) {
        return s.replace(boolTestAttributes ? /[&<>'"]/g : /[&<>]/g, function (char) {
            return MAP[char];
        });
    };

    //http://css-tricks.com/snippets/javascript/strip-html-tags-in-javascript/
    //Remove tags from a string
    var clean = function (s) {
        return s.replace(/(<([^>]+)>)/ig, "");
    };

    //PUBLIC
    return {
        encode: encode,
        clean: clean
    };

}(jQuery));