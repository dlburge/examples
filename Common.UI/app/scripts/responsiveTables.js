"use strict";

// Based upon zurb responsive tables : http://zurb.com/playground/responsive-tables

//TODO : determine if we need to pin the columns or not, depends upon width of table and width of screen

//This class allows us to "pin" the first columns (configurable) of a table and allows us to scroll the rest of the content
TraceOne.responsiveTables = (function($){
    
    //find tables with "responsive" class
        //add wrapper to each table found  => NOTE : Don't think this is necessary
    //get number of columns to "pin"
    //duplicate the table and append it to the original
        //position the "copy" above the original with position absolute
        //hide all columns that shouldn't be pinned
    
    //What happens when we clone the table ? 
    
    //PRIVATE VARIABLES
    var responsiveClass, 
        $tables = []/*, NOT USED YET
        numberPinnedColumns,
        pinnedClass = "pinned",
        isPinnedClass = "is-pinned"*/;
    
    //PRIVATE FUNCTIONS
    var build = function(){
        
        //get tables
        $tables = $("."+responsiveClass);
        
        //loop over each table
        var $copy, $original;
        $tables.each(function(i, table){
            
            $original = $(table);
            
            //add wrapper for the original and the copy
            $original.wrap("<div class=\"responsive-table-wrapper\" />");
            
            //create a copy
            $copy = $original.clone(false);
            
            //insert the copy
            $original.closest("div.responsive-table-wrapper").append($copy);
            
            //wrap the copy so that we may position it
            $copy.wrap("<div class=\"pinned\" />");
            
            //wrap parent in scrollable div
            $original.wrap("<div class=\"scrollable\" />");
            
        });
        
    }; 
    
    //EVENT HANDLERS
    /*var setupHandlers = function(){
        
        //resize window
        $(window).resize(function() {
            //TODO : needed or not ? 
        });
        
    };*/
    
    //INITIALISATION 
	var init = function(options) {
        
        if(!options || !options.responsiveClass)
        {
            return false;
        }
        
        //set variables
        if(options.responsiveClass){
            responsiveClass = options.responsiveClass;
        }
        
        //set it all up
        build();
        
        //TODO : not be needed....
        //setupHandlers();
        
    };
    
    //PUBLIC
    return {
        init : init
    };

    
}(jQuery));
