"use strict";
/*
This file contains a script allowing us to create collapsible "panels" (menus, sections, etc.)
Uses "is-open" and "is-closed" classes to show/hide the content of the menu but these can be overridden
It is possible to pass in a callback function that will be called when an item is collapsed

Parameters :
  targetClass : a class that identifies the element(s) that will be collapsed
  collapsibleClass : a class that identifies the handler

Depends upon :
    - jquery
    - mustache
    - state.css (is-open and is-closed CSS files)
*/
TraceOne.collapsible = (function($){

    //PRIVATE VARIABLES
    //class name for click handler
    //class name for wrapper
    //store class name for hide/show
    var collapsibleClass,
        targetClass,
        editableTable = "editable-table",
        isHiddenClass = "is-hidden",
        isOpenClass = "is-open",
        isClosedClass = "is-closed",
        buttonCollapseAll = ".collapse-all-rows",
        onChangeCallbacks = [],
		flagExpand = true;

    //PRIVATE FUNCTIONS
    var toggle = function(targets, handler){

        //toggle states
        targets.toggleClass(isHiddenClass);

        //TODO : need to determine if this is a div, row or other type, the display value to show it will be different
        handler.toggleClass(isOpenClass).toggleClass(isClosedClass);

        //call callback method(s)
        //TODO : stop being lazy, use a for OR convert your array earlier...
        $(onChangeCallbacks).each(function(i,callback){
            callback();
        });

    };

    var toggleAll = function (targets, rootLevels) {
        if (flagExpand) {
            targets.removeClass(isOpenClass);
            targets.addClass(isHiddenClass);

            rootLevels.removeClass(isOpenClass);
            rootLevels.addClass(isClosedClass);
            flagExpand = false;
        }
        else {
            targets.removeClass(isHiddenClass);

            rootLevels.removeClass(isClosedClass);
            rootLevels.addClass(isOpenClass);
            flagExpand = true;
        }
    };

    //EVENT HANDLERS
    var setupHandlers = function(){

        //attach click event for each, en delegate
        $(".l-layout").on("click", "." + collapsibleClass, function(e) {

            e.preventDefault();

            //store handler
            var $handler = $(this);

            //get target(s)
            //check for matching MULTIPLE siblings first (table row use-case)
            var $targets = $handler.nextUntil(":not(."+targetClass+")");

            //if not found, look for single sibling
            if($targets.length === 0){
                $targets = $handler.nextAll("."+targetClass);
            }

            //if not found, look for descendant
            if($targets.length === 0){
                $targets = $handler.find("."+targetClass);
            }

            //if not found, look for a descendant in the parent element
            if($targets.length === 0){
                $targets = $handler.parent().nextAll("."+targetClass);
            }

            //no target found, break loop
            if($targets.length === 0){
                return;
            }

            toggle($targets, $handler);
        });

        $(".l-layout").on("click", buttonCollapseAll, function(e) {

            e.preventDefault();

            var $handler = $(this).parents("." + editableTable);

            var $targets = $handler.children("tbody").children("tr").nextUntil(":not(." + targetClass + ")");
            var $rootLevels = $handler.children("tbody").children("." + collapsibleClass);

            if ($targets.length === 0) {
                return;
            }

            toggleAll($targets, $rootLevels);
        });
    };

    //INITIALISATION
	var init = function(options) {

        if(!options || !options.targetClass || !options.collapsibleClass)
        {
            return false;
        }

        //set variables
        if(options.collapsibleClass){
            collapsibleClass = options.collapsibleClass;
        }

        if(options.targetClass){
            targetClass = options.targetClass;
        }

        if(options.onChangeCallbacks){
            onChangeCallbacks = options.onChangeCallbacks;
        }

        setupHandlers();

    };

    //PUBLIC
    return {
        init : init
    };

}(jQuery));
