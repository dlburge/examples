"use strict";

TraceOne.tagList = (function($){

    //PRIVATE VARIABLES
    //class name for container
    var tagContainerClass, tagClass, tagSuffix = "Values";
    var template = "<span class=\"tag\"><label for=\"{{id}}\">{{text}} <mark>&nbsp;</mark></label><input type=\"checkbox\" value=\"{{value}}\" name=\"{{name}}\" id=\"{{id}}\" checked></span>";

    //PRIVATE FUNCTIONS
    var deleteTag = function(e, elem){
        $(elem).remove();
        e.preventDefault();
        e.stopPropagation();

    };

    //EVENT HANDLERS
    var setupHandlers = function(){
        //get all tags and attach delete handler
        $("."+tagContainerClass).off("click", "."+tagClass).on("click", "."+tagClass, function(e){
            deleteTag(e, this);
        });
    };

    //PUBLIC FUNCTIONS
    var addTag = function(event, data){

        //find the field
        var $field = $(event.target);

        //clear the field value
        $field.val("");

        var fieldName = $field.attr("name");

        //find the output element
        var $output = $field.next("."+tagContainerClass);

        //generate a NAME and UNIQUE ID for the checkbox
        var index = $output.find("."+tagClass).length;

        var checkboxName = fieldName + tagSuffix;
        var checkboxId = checkboxName + "[" + index + "]";

        //build data object for mustache template
        var tagData = {
            id : checkboxId,
            name : checkboxName,
            value : data.item.value,
            text : data.item.label
        };

        //generate checkbox HTML
        /*jshint camelcase: false */
        var checkboxHtml = Mustache.to_html(template, tagData);

        //insert it
        $output.append(checkboxHtml);

        //stop the field from updating
        event.preventDefault();
        return false;

    };

    //INITIALISATION
	var init = function(options) {

        if(!options || !options.tagContainerClass || !options.tagClass)
        {
            return false;
        }

        //set variables
        if(options.tagContainerClass){
            tagContainerClass = options.tagContainerClass;
        }

        if(options.tagClass){
            tagClass = options.tagClass;
        }

        setupHandlers();

    };

    //PUBLIC
    return {
        init : init,
        addTag : addTag,
        resetTagDeleteHandler: setupHandlers
    };

}(jQuery));
