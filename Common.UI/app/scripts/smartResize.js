"use strict";

/**
Debounce function for the window resize event 

http://www.paulirish.com/2009/throttled-smartresize-jquery-event-handler/
http://unscriptable.com/2009/03/20/debouncing-javascript-methods/

    //Classic window resize handler
    $(window).resize(function () {
        $('#allhits').html($('#allhits').html() + '\n event fired:' + new Date());
    })

    //Window resize handler with smartresize
    $(window).smartresize(function () {
        $('#debouncedhits').html($('#debouncedhits').html() + '\n event fired:' + new Date());
    })
    
**/
(function ($, sr) {
    
    var debounce = function (func, threshold, execAsap) {
        
        var timeout;
        
        return function debounced() {
            
            var obj = this, args = arguments;

            function delayed() {
                if (!execAsap){
                    func.apply(obj, args);
                }
                timeout = null;
            }
            
            if (timeout) {
                clearTimeout(timeout);
            } else if (execAsap) {
                func.apply(obj, args);
            }
            
            timeout = setTimeout(delayed, threshold || 100);
        };
    };
    
    jQuery.fn[sr] = function (fn) {
        return fn ? this.bind("resize", debounce(fn)) : this.trigger(sr);
    };
    
})(jQuery, "smartresize");