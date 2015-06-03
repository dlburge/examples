"use strict";

//This file contains any scripts necessary for adapting the layout of the application
//Uses jquery
//Stores references to layout elements (elems list)
TraceOne.layout = (function($){
    
    //PRIVATE VARIABLES
    var elems = {
        layout: null,
        header : null,
        main: null,
        mainContent: null,
        sidebar : null,
        menuToggle : null
    },
    scrollableClass,
    autoCompleteClass,
    columnMargin = 50,
    scrollPadding = 25,
    menuIsVisibleClass,
    $headerMenuItems,
    $currentMenu;
    
    //PRIVATE FUNCTIONS
    var setScrollableWidth = function(){
        var contentWidth = getWidthForElem(elems.mainContent);
        //var sidebarWidth = elems.layout.hasClass(menuIsVisibleClass) ? getWidthForElem(elems.sidebar) : 0;
        //var scrollableWidth = (contentWidth - sidebarWidth) - columnMargin - scrollPadding;
        var scrollableWidth = contentWidth - columnMargin - scrollPadding;
        $("."+scrollableClass).width(scrollableWidth);
    };
    
    //get height element height => helper
    var getWidthForElem = function(elem){
        if(elem){
            return elem.outerWidth(); 
            ///TODO : test other methods, IE7 doesn't count the margins in the height ... 
        }
    };
    
    var closeAutoComplete = function() {
        $("." + autoCompleteClass).hide();
    };
    
    //EVENT HANDLERS
    var setEventHandlers = function(){
        
        //reset width of scrollable divs
        $(window).smartresize(function () {
            setScrollableWidth();
        });
        
        //on page scroll, hide open autocomplete(s)
        elems.main.on("scroll", function () {
            closeAutoComplete();
        });
        
        //show/hide menu when we click on the menuToggle link
        elems.menuToggle.click(function(e){
            e.preventDefault();
            elems.layout.toggleClass(menuIsVisibleClass);
            //trigger resize event so that Kendo widgets will adjust to fit
            elems.main.resize();
        });
        
    };
    
    var setUpHeaderMenu = function(headerMenuItemClass){
        
        $headerMenuItems = elems.header.find(headerMenuItemClass);
        
        
        
        //toggle header navigation
        $headerMenuItems.click(function(e){
            
            
            
            var menuItem = $(e.target).closest("li");
            
            if(menuItem.hasClass("nav-bar-item")){
                
                //get current menu
                var $menu = menuItem.find(".nav-bar-menu");
                
                //toggle 
                if($menu.is(":visible")){
                    $menu.hide();
                    $currentMenu = null;
                } else {
                    
                    if($currentMenu){
                        $currentMenu.hide();
                    }
                    
                    $menu.show();
                    $currentMenu = $menu;
                }
                e.stopPropagation();
            }
            
        });
        
    };
    
    //INITIALISATION
	var init = function(options) {
        
        if(!options || !options.elems)
        {
            return false;
        }
        
        //store all references
        if(options.elems.layout){
            elems.layout = $(options.elems.layout);
        }
        
        if(options.elems.header){
            elems.header = $(options.elems.header);
        }
        
        if(options.elems.main){
            elems.main = $(options.elems.main);
        }
        
        if(options.elems.mainContent){
            elems.mainContent = $(options.elems.mainContent);
        }
                        
        if(options.elems.sidebar){
            elems.sidebar = $(options.elems.sidebar);
        }
        
        if(options.elems.menuToggle){
            elems.menuToggle = $(options.elems.menuToggle);
        }
        
        if(options.menuIsVisibleClass){
            menuIsVisibleClass = options.menuIsVisibleClass;
        }
        
        if (options.autoCompleteClass) {
            autoCompleteClass = options.autoCompleteClass;
        }
        
        if (options.scrollableClass) {
            //scrollables
            scrollableClass = options.scrollableClass;
        }
        
        //navbar menu items
        if(options.headerMenuItemClass){
            setUpHeaderMenu(options.headerMenuItemClass);
        }
        
        //setup handlers
        setEventHandlers();
        
        //call methods for first time
        setScrollableWidth();
        
    };
    
    //PUBLIC
    return {
        init : init,
        setScrollableWidth : setScrollableWidth
    };
    
}(jQuery));