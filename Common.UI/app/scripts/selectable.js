"use strict";

TraceOne.selectable = (function ($) {
    
    var selectableClass, selectables, onChangeCallbacks;

    var init = function (options) {
        
        if (!options || !options.selectableClass) {
            return;
        }
        
        selectableClass = options.selectableClass;
        
        if(options.onChangeCallbacks){
            onChangeCallbacks = options.onChangeCallbacks;
        }
        
        setupHandlers();
        
    };

    var setupHandlers = function () {
        
        selectables = $(selectableClass);
        
        $(".l-layout").on("click", selectableClass, function ( e ) {
            selectables.removeClass("selected");
            $(this).addClass("selected");
            
            //call callback method(s)
            //TODO : stop being lazy, use a "for" OR convert your array earlier...
            $(onChangeCallbacks).each(function(i, callback){
                callback(e);
            });
            
        });
        
    };

    return {
        init: init
    };
    
}(jQuery));