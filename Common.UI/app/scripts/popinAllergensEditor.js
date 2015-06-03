"use strict";

/*

popinAllergensEditor

    open popup when user clicks on ingredients in table 
    store in the popin which element was clicked on so that we may update it after the save
    call URL and load the returned html in the popin (project ID, controller and action to call must be passed to popin)
    
    clicking on any ingredient text will close the current editor and open the new one (if different)
    
    all save is done in popin via ajax
    on success update the parent with the new "ingredients" text
    
    buttons : save and close

*/

TraceOne.popinAllergensEditor = (function($){
    
    //PRIVATE VARIABLES//
    var $containers, editors=[], currentEditor, arrowHeight=10, $appendPoint, imgBaseUrl, baseUrls, ingredientClassNames, customMessages;
    
    //template for popin
    var template = "<div class=\"popinEditor is-hidden allergensPopin\">" +
        "<img class=\"arrow\" src=\"{{imgUrl}}ico-arrow-popin.png\">" +
        "<form>" +
        "<fieldset>" +
            "<p class=\"actions\">" +
                "<button type=\"submit\">Ok</button>" +
                "<button type=\"reset\">Close</button>" +
            "</p>" +
        "</fieldset>" +
        "</form>" +
    "</div>";
    
    //template for ingredient text in page
    var ingredientTemplate = "{{#.}}" +
        "{{#species}}" +
        "    <span class=\"value{{^isPublished}} not-published{{/isPublished}}\"><strong>{{species}}</strong> ({{ingredient}})</span>" +
        "{{/species}}" +
        "{{^species}}" +
        "    <span class=\"value{{^isPublished}} not-published{{/isPublished}}\">{{ingredient}}</span>" +
        "{{/species}}" +
    "{{/.}}";
    
    //default text messages (should be overridden by an option passed to the init method) and class used to style it
    var messages = {
        "info" : {
            "message" : "Information message",
            "class" : "info-message"
        },
        "success" : {
            "message" : "Success",
            "class" : "success-message"
        },
        "warning" : {
            "message" : "Warning",
            "class" : "warning-message"
        },
        "error" : {
            "message" : "An error has occurred",
            "class" : "error-message"
        }
    };
    
    var errorTemplate = "<div class=\"message {{class}}\">{{message}}" + 
        "<ul>" + 
        "{{#businessExceptionMessages}}" + 
            "<li>{{.}}</li>" + 
        "{{/businessExceptionMessages}}" + 
        "</ul>" + 
    "</div>";
    
    
    //PRIVATE FUNCTIONS

    var validateSpeciesAndIngredients = function (editor) {
        // we don't have any rule on ingredients without "specie" column
        if (!editor.withSpecies) {
            return true;
        }

        // - the user cannot save without specifying at least one couple (specie, ingredient name)
        // - ensure that all species must be selected & matched with value from autocomplete menu
        // - if the user does not make a selection for the species and they press OK then they should see an error message

        //get the content of the popin
        var $rows = editor.$editorDiv.find("tbody tr:visible");
        var isSpecifiedOneCouple = false, isSelectedSpecie, isProvidedIngredient;
        $rows.each(function (i, row) {
            isSelectedSpecie = ($("input[id$=SpecieIdentity]", row).val() !== "00000000-0000-0000-0000-000000000000");
            isProvidedIngredient = ($("input[name$=Ingredient]", row).val() !== "");
            if (isSelectedSpecie && isProvidedIngredient) {
                isSpecifiedOneCouple = true;
                return false;   // exits the loop
            }
        });
        if (!isSpecifiedOneCouple) {
            showMessage(null, "error", null, editor, customMessages.validateOneCoupleSpecieIngredient);
            return false;
        }

        var notSelectedFromMenuSpecies = $("input[id$=SpecieIdentity][data-from-menu=false]", $rows).length;
        if (notSelectedFromMenuSpecies > 0) {
            showMessage(null, "error", null, editor, customMessages.mustSelectSpecies);
            return false;
        }

        var emptySpecies = $("input[id$=SpecieIdentity][value='00000000-0000-0000-0000-000000000000']", $rows).length;
        if (emptySpecies > 0) {
            showMessage(null, "error", null, editor, customMessages.mustSelectSpecies);
            return false;
        }

        return true;
    };
    
    var showMessage = function (request, status, error, editor, customMessage) {
        
        //switch case based on status
        var messageToShow;

        //these are the status sent back by Jquery Ajax calls
            //"success", "notmodified", => success
            //"error", "timeout", "abort", or "parsererror" => error

        //depending upon "status" determine default message and appropriate CSS class
        switch(status)
        {
            case "success":
            case "notmodified":
                messageToShow = messages.success;
                break;
            case "error":
            case "timeout":
            case "abort":
            case "parsererror":
                messageToShow = messages.error;
                break;
        }
        
        //set custom message if one was passed in
        if(customMessage){
            messageToShow.message = customMessage;
        }
        
        //get the business exception messages
        var responseJSON, businessExceptionMessages = [], errors;
        if (request) {
            responseJSON = request.responseJSON;
        }
        if (responseJSON && responseJSON.length > 0) {
            errors = responseJSON[0].errors;
            for (var i = 0, len = errors.length; i < len; i++) {
                businessExceptionMessages.push(errors[i]);
            }
        }

        //Store the business messages
        if (businessExceptionMessages.length > 0) {
            messageToShow.businessExceptionMessages = businessExceptionMessages;
        }

        //build the html for the message
        /*jshint camelcase: false */
        var errorHtml = Mustache.to_html(errorTemplate, messageToShow);
        
        //remove any old messages
        editor.$editorDiv.find(".message").remove();
        
        //show new messge
        editor.$editorDiv.find("fieldset").prepend(errorHtml);

    };
    
    //get the data needed for each individual popin
    var parseContainerContent = function() {
        
        var $textOutput, $table, $row, loadUrl, saveUrl, 
            $ingredientIdField, //hidden field containing the ID of the ingredient
            ingredientId, //id of the associated ingredient
            $ingredientStatusCheckbox, //checkbox associated with ingredient, is definately checked 
            $ingredientStatusColumn,
            ingredientStatus; //id of the status associated with the checkbox (and ingredient), present, not present, etc.
        
        $containers.each(function(i, container){
            
            //get the value container
            $textOutput = $(container);
            
            //get the ingredient row
            $row = $textOutput.closest("tr");
            
            //get the parent table
            $table = $textOutput.closest("table.allergens");
            
            //get the urls
            loadUrl = baseUrls.get;
            saveUrl = baseUrls.save;
            
            //get the hidden field that holds the ID of the ingredient
            //input with id containing ingredient_id
            $ingredientIdField = $row.find("input[name*='ingredient_id']");
            ingredientId = $ingredientIdField.val();
            
            //get the checkbox for the column
            $ingredientStatusCheckbox = $textOutput.siblings("input[type='checkbox']");

            $ingredientStatusColumn = $textOutput.siblings("input[data-role='ingredient_column']");
            ingredientStatus = $ingredientStatusColumn.val();
            
            //append ids to urls
            loadUrl += "?ingredientId=" + ingredientId + "&ingredientStatus=" + ingredientStatus;
            saveUrl += "?ingredientId=" + ingredientId + "&ingredientStatus=" + ingredientStatus;
            
            
            //prepare data for mustache
            //generate a unique ID for the editor element
            var editorData = {
                $textOutput : $textOutput,
                $checkbox : $ingredientStatusCheckbox,
                loadUrl : loadUrl,
                saveUrl : saveUrl,
                imgUrl : imgBaseUrl,
                isContentUpToDate : false,
                id : i + "_" + (Math.floor(Math.random() * 9999999) + 1) + "_" + (Math.floor(Math.random() * 9999999) + 1) + "_" + ingredientId + "_" + ingredientStatus
            };
            
            editors.push(editorData);
            
        });
        
    };
    
    //build and insert a popin for each line
    var build = function(){
        
        //loop over editor data, build and insert HTML
        var editor, html;
        for(var i=0; i<editors.length; i++){
            
            editor = editors[i];
            
            //create html
            /*jshint camelcase: false */
            html = Mustache.to_html(template, editor);
            
            //Insert it in the section and store the div
            editor.$editorDiv = $appendPoint.append(html).find(".allergensPopin").last();
            
            //position the popin
            position(editor);
            
            //save the form
            editor.$editorForm = editor.$editorDiv.find("form");
            
            //store close button
            editor.$close = editor.$editorDiv.find("button[type=reset]");
            
            //store save button
            editor.$save = editor.$editorDiv.find("button[type=submit]");
            
            //add handlers for the buttons
            setupEditorHandlers(editor);
        }
        
    };
    
    //load the content
    var load = function(editor){
        
        //get content if needed, first load or after save
        if(!editor.isContentUpToDate){
            
            //TODO : remove the mock ajax calls
            $.mockjax({
                //ingredients/save/{projectId}/{ingredient name or id}/{column name or id}
                url: "/ingredients/load/*",
                proxy: "popin.html",
                status : 200 //put 500 here to simulate an error
            });
            
            //get content for popin
            var getContent = $.get(editor.loadUrl);

                //handle when done, insert content in popin
            getContent.done(function(data){

                //clean old content
                editor.$editorDiv.find("table").remove();

                //insert the returned HTML in the popin
                editor.$editorDiv.find("fieldset").prepend(data);

                //position the popin
                position(editor);

                //reset content up-to-date flag, content won't be loaded unless the flag is set to false
                editor.isContentUpToDate = true;

                // the editor contains specie column or not
                var $withSpecies = $("input[id='WithSpecies']", editor.$editorDiv);
                editor.withSpecies = ($withSpecies.val() === "True");
            });
            
            //handle on error
            getContent.fail(function(request, status, error){
                var customMessage;
                if(customMessages && customMessages.load){
                    customMessage = customMessages.load;
                }
                showMessage(request, status, error, editor, customMessage);

                request.hasBeenHandled = true;
            });
            
        }
        
        //remove any old error messages
        editor.$editorDiv.find(".message").remove();
        
    };
    
    //save content
    var save = function(editor){
        
        //TODO : remove the mock ajax calls
        $.mockjax({
            //ingredients/save/{projectId}/{ingredient name or id}/{column name or id}
            url: "/ingredients/save/*",
            status: 200 //put 500 here to simulate an error
        });

        if (!validateSpeciesAndIngredients(editor)) {
            return;
        }

        //get the data to post
        var data = editor.$editorForm.serialize();
        
        //post the data
        var postData = $.post(editor.saveUrl, data);
        
        //handle when done, update parent "text" and close popin
        postData.done(function(){
            
            //set flag to false so that it will be reloaded on next opening
            editor.isContentUpToDate = false;
            
            //update parent text
            updateParent(editor);
            
            //close the editor
            toggle(editor);
            
        });
        
        //handle on error
        postData.fail(function(request, status, error){
            var customMessage;
            if(customMessages && customMessages.save){
                customMessage = customMessages.save;
            }
            showMessage(request, status, error, editor, customMessage);
            
            request.hasBeenHandled = true;
        });
        
    };
    
    //toggle visibility, must call load before showing (to be certain that the data is up-to-date)
    var toggle = function(editor){
        
        //hide currentEditor if necessary
        if(currentEditor && currentEditor.id !== editor.id){
            currentEditor.$editorDiv.addClass("is-hidden");
        }
        
        //set currentEditor
        currentEditor = editor;
        
        if(editor.$editorDiv.hasClass("is-hidden")){
            
            //load data for currentEditor
            load(editor);
            
            //show the popin
            editor.$editorDiv.removeClass("is-hidden");
            
            //focus first field
            editor.$editorDiv.find("input[type='text']:first").focus();
            
            position(editor);
            
        } else {
            
            editor.$editorDiv.addClass("is-hidden");
            
        }
        
    };
    
    var toggleIngredients = function(editor){
        
        //hide currentEditor if necessary
        if(currentEditor && currentEditor.id === editor.id){
            currentEditor.$editorDiv.addClass("is-hidden");
        }
        
        //hide or show the ingredient values
        if(editor.$textOutput.hasClass("is-hidden")){
            editor.$textOutput.removeClass("is-hidden");
        } else {
            editor.$textOutput.addClass("is-hidden");
        }
        
    };
    
    //hide current editor
    var hideCurrentEditor = function(){
        if(currentEditor){
            currentEditor.$editorDiv.addClass("is-hidden");
        }
    };
    
    //position the popin
    var position = function(editor){
        
        var editorDiv = editor.$editorDiv, 
            textOutput = editor.$textOutput;

        //get the width and offset of the editor div
        var editorWidth = editorDiv.outerWidth();

        //get the width, height and position of the textOutput link
        var textOutputWidth = textOutput.outerWidth();
        var textOutputHeight = textOutput.outerHeight();
        var textOutputOffset = textOutput.offset();

        //center the div under the field, calculate new position
        var top = textOutputOffset.top + textOutputHeight + arrowHeight;
        var left = textOutputOffset.left - (editorWidth/2) + (textOutputWidth/2);

        //apply to the editor div
        editorDiv.offset({ top: top, left: left });

    };
    
    var getColumnValue = function($column){
        
        var $tmpInput, $tmpCheckbox, result = "";
        
        $tmpInput = $column.find("input[type='text']");
        $tmpCheckbox = $column.find("input[type='checkbox']");
        
        //test if the column contains an input, checkbox or a text value
        if($tmpInput.length > 0) {
            result = $tmpInput.val();
        } else if($tmpCheckbox.length > 0) {
            result = $tmpCheckbox.is(":checked");
        } else {
            result = $column.text();
        }
        
        return result;
    };
    
    var updateParent = function(editor){
        
        //get each row
        //get the column values for each row
        //store them in a data object
        //pass the data to a mustache template

        var rows, $tmpRow, $tmpColumn, items=[];
        
        //get the content of the popin
        rows = editor.$editorDiv.find("tbody tr:visible");
        
        // build an object with a flag for published, an ingredient and a species
        rows.each(function(i, row){
            
            $tmpRow = $(row);
            
            var item = {};
            
            //get species, not always present
            $tmpColumn = $tmpRow.find("."+ingredientClassNames.species);
            if($tmpColumn.length > 0){
                item.species = getColumnValue($tmpColumn);
            }
            
            //get ingredient
            $tmpColumn = $tmpRow.find("."+ingredientClassNames.ingredient);
            item.ingredient = getColumnValue($tmpColumn);

            //get is published
            $tmpColumn = $tmpRow.find("."+ingredientClassNames.isPublished);
            item.isPublished = getColumnValue($tmpColumn);
            
            items.push(item);
            
        });
        
        //generate the new text
        /*jshint camelcase: false */
        var html = Mustache.to_html(ingredientTemplate, items);
        
        //insert it parent table
        editor.$textOutput.html(html);
        
    };
    
    //EVENT HANDLERS//
    
    //popin handlers
    var setupEditorHandlers = function(editor){
        
        //users clicks on an ingredient in the section : toggle visibility of associated editor
        editor.$textOutput.on("click", {editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            toggle(editor);
        });
        
        //user clicks on the checkbox associated with an ingredient : toggle visibility of ingredient values
        editor.$checkbox.on("change", {editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            toggleIngredients(editor);
        });
        
        //cancel event : just close the editor
        editor.$close.click({editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            toggle(editor);
        });
        
        //save event : post to server and close if successfull
        editor.$save.click({editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            save(editor);
        });
        
        //TODO : validation, errors, etc.
        //validation functions
            //control that values are text
            //error handling ?
    };
        
    //section handlers
    var setupSectionHandler = function(){
        
        //on window resize, hide current popin
        $(window).resize(function() {
            hideCurrentEditor();
        });

        //on section scroll, hide current popin
        $(".scrollable, .l-content-inner", $appendPoint).on("scroll", function(){
            hideCurrentEditor();
        });
        
    };
    
    
    //INITIALISATION 
	var init = function(options) {
        
        //all options are manadatory, fail if they are missing
        if(!options || 
           !options.container ||  
           !options.urls || !options.imgBaseUrl || 
           !options.appendPointClass || !options.ingredientClassNames)
        {
            return false;
        }
        
        //store container
        if(options.container)
        {
            $containers = $(options.container);
        }
        
        //set base url for images
        if(options.imgBaseUrl){
            imgBaseUrl = options.imgBaseUrl;
        }
        
        //set append point
        if(options.appendPointClass){
            $appendPoint = $(options.appendPointClass);
        }
        
        //base urls for each type of ingredient : 
        //  - could be generated with "url" helpers ? 
        //  - The projectId should be included
        //  - will just need to append the "ingredient" name or id
        //  - is the checkbox/column necessary ?
        if(options.urls){
            baseUrls = options.urls;
        }
        
        //class names used to identify the columns in the popin that contain the values that we need to update in the page
        if(options.ingredientClassNames){
            ingredientClassNames = options.ingredientClassNames;
        }
        
        //store any custom messages
        if(options.customMessages){
            customMessages = options.customMessages;
        }
        
        //prevent creating multiple instances of the popin
        for (var i = 0; i < editors.length; i++) {
            editors[i].$editorDiv.remove();
        }
        editors = [];
        
        //find and store elements
        parseContainerContent();
        
        //create popins
        build();
        
        //setup handlers for the section 
        setupSectionHandler();
        
    };
    
    
    //PUBLIC
    return {
        init : init
    };
    
}(jQuery));
