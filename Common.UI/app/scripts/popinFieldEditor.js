"use strict";

/*
    STEPS
    - Attach to container : OK
    - Store container : OK
    - Find and store text output, fields and labels (labels could be params) 
        - need to get values (int and unit if available) : OK
        - need to get formatting rules (maybe in a second time) : NOK
        - use default labels for the fields that may be overridden : OK
    - Generate a popin div : OK
    - Clone the fields and insert them into the popin : OK
        - don't forget values : OK
        - need to get formatting rules : NOK
    - Add handler on text output for showing/hiding the popin : OK
    - Add handlers for updating hidden fields when the clone is modified : OK
        - link onchange events between the two : OK
    - Add handler for updating AND formatting the text output : OK
    - Add handler for close, cancel, (submit ?) events : OK
    
    TODO
        - handle that only one is visible at a time : OK
        - close any open editor when a textoutput recieves focus or is clicked : OK
    
    QUESTIONS
        - Do we need to rollback changes if they cancel ? (not really possible)
    */

//TODO : documentation
//-------------------------
//
//-------------------------

TraceOne.popinFieldEditor = (function($){
    
    //PRIVATE VARIABLES
    var $containers, editors=[], unitRefList, fieldIdSuffix = "_Editor", currentEditor, arrowHeight = 10, $appendPoint, imgBaseUrl;
    
    //labels : labels will be chosen depending upon the variable isPercentage (false by default)
    var labels = {
        number : {
            "qty" : "Quantity", 
            "min" : "Min",
            "max" : "Max",
            "unit" : "Unit"
        },
        percentage : {
            "qty" : "%",
            "min" : "Min",
            "max" : "Max"
        }
    };
    
    //template (partial !) for "unit" select list
    var partials = {
        unitSelectList : "<select class=\"small\" name=\"unit-{{id}}\" id=\"unit-{{id}}\">" +
                "<option value=\"0\"></option>" +
                "{{#unitList}}<option{{#selected}} selected{{/selected}} value=\"{{value}}\">{{label}}</option>{{/unitList}}" +                    
            "</select>"
    };
    
    //template for "number" popin
    var numberTemplate = "<div class=\"popinEditor is-hidden formulaPopin\">" +
        "<img class=\"arrow\" src=\"{{url}}ico-arrow-popin.png\">" +
        "<fieldset>" +
            "{{#fieldData}}" +
            "<p class=\"field\">" +
                "<label for=\"{{id}}\">{{label}}</label>" +
                "<input type=\"text\" name=\"{{id}}\" value=\"{{value}}\" id=\"{{id}}\" class=\"decimal\">" +
            "</p>" +
            "{{/fieldData}}" +
            "<p class=\"field\">" +
                "<label for=\"{{id}}\">{{unitLabel}}</label>" +
                "{{>unitSelectList}}" +
            "</p>" +
            "<p class=\"actions\">" +
                "<button type=\"submit\">Ok</button>" +
                "<button type=\"reset\">Close</button>" +
            "</p>" +
        "</fieldset>" +
    "</div>";
    
    //template for "percentage" popin
    var percentageTemplate = "<div class=\"popinEditor is-hidden formulaPopin\">" +
        "<img class=\"arrow\" src=\"{{url}}ico-arrow-popin.png\">" +
        "<fieldset>" +
            "{{#fieldData}}" +
            "<p class=\"field\">" +
                "<label for=\"{{id}}\">{{label}}</label>" +
                "<input type=\"text\" name=\"{{id}}\" value=\"{{value}}\" id=\"{{id}}\" class=\"decimal\">" +
            "</p>" +
            "{{/fieldData}}" +
            "<p class=\"actions\">" +
                "<button type=\"submit\">Ok</button>" +
                "<button type=\"reset\">Close</button>" +
            "</p>" +
        "</fieldset>" +
    "</div>";
    
    var outputTextValueTemplate = "{{target}} ({{min}}-{{max}})";
    
    //PRIVATE FUNCTIONS
    var findValueUnit = function(unitValue){
        return $.grep(unitRefList, function(item){
            if(item.value === parseInt(unitValue, 10) || item.value === unitValue){
                return item;
            }
        });
    };
    
    var parseContainerContent = function() {
        
        var $container, $textOutput, $fields, fieldData, unitIdField, unitValue, isPercentage=false, valueUnit, unitList, unitLabel = "";
        
        $containers.each(function(i, container){
            
            $container = $(container);
            
            //get textoutput, sibling
            $textOutput = $container.siblings(".qty-value");
            
            //get input fields, children
            $fields = $container.find("input, select");
            
            //determine if values are percentages or numbers
            unitIdField = $fields.filter("input[name*='Unit']");
            unitValue = unitIdField.val();
            
            if(unitValue === ""){
                isPercentage = true;
            } else {
                var u = findValueUnit(unitValue);
                valueUnit = (u) ? u[0] : "";
                isPercentage = false;
                unitLabel = labels.number.unit;
            }
            
            //copy unitRefList and select unit in new list
            unitList = $.map(unitRefList, function (unit) {
                return {
                    selected: valueUnit && (unit.value === valueUnit.value),
                    label: unit.label,
                    value: unit.value
                };
            });
            
            /**
            loop over fields and 
                - get values
                - get ids and generate new  unique ones
                - get the appropriate label from labels array
                - build JSON data object for mustache template
            **/
            
            var $f, tmpId, tmpValue, tmpLabel, tmpLabels;
            tmpLabels = (isPercentage) ? labels.percentage : labels.number;
            
            fieldData = $.map($fields, function (field){
                
                $f = $(field);
                
                tmpId = $f.attr("id") + fieldIdSuffix;
                
                //only keep value fields
                if (tmpId.indexOf("Unit") !== -1) {
                    return;
                }
                
                tmpValue = $f.val();
                
                //use quantity label by default
                tmpLabel = tmpLabels.qty;
                //min label
                if (tmpId.indexOf("QuantityMin") !== -1 || tmpId.indexOf("PercentageMin") !== -1) {
                    tmpLabel = tmpLabels.min;
                }
                //max label
                if (tmpId.indexOf("QuantityMax") !== -1 || tmpId.indexOf("PercentageMax") !== -1) {
                    tmpLabel = tmpLabels.max;
                }
                
                return {
                    id : tmpId,
                    value : tmpValue,
                    label : tmpLabel
                };
                
            });
            
            //prepare data for mustache
            //generate a unique ID for the editor element
            var editorData = {
                $container : $container,
                $textOutput : $textOutput,
                fieldData : fieldData,
                $parentFields : $fields,
                unitList : unitList,
                currentUnit : valueUnit,
                unitLabel : unitLabel,
                isPercentage : isPercentage,
                url : imgBaseUrl,
                id : i + "_" + (Math.floor(Math.random() * 9999999) + 1) + "_" + (Math.floor(Math.random() * 9999999) + 1) + "_" + (valueUnit ? valueUnit.value : "")
            };
            
            editors.push(editorData);
            
        });
    };
    
    var build = function(){
        
        //loop over editor data, build and insert HTML
        var editor, template, html;
        for(var i=0; i<editors.length; i++){
            
            editor = editors[i];
            
            //choose appropriate template
            template = (editor.isPercentage) ? percentageTemplate : numberTemplate;       
            
            //create html
            /*jshint camelcase: false */
            html = Mustache.to_html(template, editor, partials);
            
            //Insert it in the section and store the div
            editor.$editorDiv = $appendPoint.append(html).find(".formulaPopin").last();
            
            //store cancel button
            editor.$cancel = editor.$editorDiv.find("button[type=reset]");
            
            //store save button
            editor.$save = editor.$editorDiv.find("button[type=submit]");
            
            //store editor fields
            editor.$editorFields = editor.$editorDiv.find("input, select");
            
            setupEditorHandlers(editor);
        }
        
    };
    
    var position = function(editorData){
        
        var editor = editorData.$editorDiv, 
            textOutput = editorData.$textOutput;
        
        //get the width and offset of the editor div
        var editorWidth = editor.outerWidth();
        
        //get the width, height and position of the textOutput link
        var textOutputWidth = textOutput.outerWidth();
        var textOutputHeight = textOutput.outerHeight();
        var textOutputOffset = textOutput.offset();
        
        //center the div under the field, calculate new position
        var top = textOutputOffset.top + textOutputHeight + arrowHeight;
        var left = textOutputOffset.left - (editorWidth/2) + (textOutputWidth/2);
        
        //apply to the editor div
        editor.offset({ top: top, left: left });
        
    };
    
    //toggle visibility 
    var toggle = function(editorData){
        
        //hide currentEditor if necessary
        if(currentEditor && currentEditor.id !== editorData.id){
            currentEditor.$editorDiv.addClass("is-hidden");
        }
        
        //set currentEditor
        currentEditor = editorData;
        
        if(editorData.$editorDiv.is(":visible")){
            editorData.$editorDiv.addClass("is-hidden");
        } else {
            editorData.$editorDiv.removeClass("is-hidden");
            //focus first field
            editorData.$editorFields.first("input").focus();
            //position the popin
            position(editorData);
        }
        
    };
    
    //hide current editor
    var hideCurrentEditor = function(){
        if(currentEditor){
            currentEditor.$editorDiv.addClass("is-hidden");
        }
    };
    
    //sets the text of the parent field
    var updateParentFieldText = function (editor) {

        //get all values from editor

        //target field value, name contains "Target"
        var targetValue = editor.$editorFields.filter("[name*='QuantityTarget'],[name*='PercentageTarget']").val();

        //min field value, name contains "min"
        var minValue = editor.$editorFields.filter("[name*='QuantityMin'],[name*='PercentageMin']").val();

        //max field value, name contains "max"
        var maxValue = editor.$editorFields.filter("[name*='QuantityMax'],[name*='PercentageMax']").val();

        //unit field value
        var unitValue = editor.$editorFields.filter("[name^='unit']").val();

        //get unit label that will be used in the output string
        var unit = findValueUnit(unitValue);
        var unitLabel = unit.length > 0 ? unit[0].label : "%";

        //build data object 
        var values = {
            target: targetValue + unitLabel,
            min: minValue + unitLabel,
            max: maxValue + unitLabel
        };


        //generate new string
        /*jshint camelcase: false */
        var html = Mustache.to_html(outputTextValueTemplate, values);

        //insert new string in textOutput
        editor.$textOutput.html(html);
    };

    //copies data from editor to parent fields
    var updateParentFieldValues = function (editor) {

        editor.$editorFields.each(function () {

            //get new value
            var newValue = this.value;

            //find corresponding parent field
            var parentFieldId = this.id.replace(fieldIdSuffix, "");
            var parentField = editor.$parentFields.filter("#" + parentFieldId);

            //if the parentField wasn't found, then it must be a unit field
            if (parentField.length === 0) {
                parentField = editor.$parentFields.filter("input[name*='Unit']");
            }

            //copy new value to parent field
            parentField.val(newValue);
        });
    };

    //copies data from parent fields to editor
    var resetEditorFields = function (editor) {

        editor.$editorFields.each(function () {

            //find corresponding parent field
            var parentFieldId = this.id.replace(fieldIdSuffix, "");
            var parentField = editor.$parentFields.filter("#" + parentFieldId);

            //if the parentField wasn't found, then it must be a unit field
            if (parentField.length === 0) {
                parentField = editor.$parentFields.filter("input[name*='Unit']");
            }

            //copy new value to parent field and trigger the update event
            this.value = parentField.val();
        });
    };
    
    //EVENT HANDLERS
    var setupEditorHandlers = function(editor){
        
        editor.$textOutput.on("click", {editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            toggle(editor);
        });
        
        /* TODO : bug in IE and FF
            - the click triggers focus, which means both events are being called FF and IE. In chrome the click does not trigger focus... 
            - if we can find how to determine if the first one (focus is called first) was already called we could stop the second from executing
        
        editor.$textOutput.on("focusin", {editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            toggle(editor);
        });
        */
        
        //close/hide
        //TODO : do we need to rollback changes ?
        editor.$cancel.click({editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            resetEditorFields(editor);
            toggle(editor);
        });
        
        //close/hide
        editor.$save.click({editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            updateParentFieldValues(editor);
            updateParentFieldText(editor);
            toggle(editor);
        });
        
        //update parent fields
        editor.$editorFields.change({editor:editor}, function(e){
            e.preventDefault();
            e.stopPropagation();
            
            var isUnitField = $(this).is("select");
            if (isUnitField) {
                //must update all editor unit fields to read the same (TODO : maybe one field would be better ?)
                editor.$editorFields.filter("select").val(this.value);
            }
            
        });
        
        
        //do nothing when we click in the div
        editor.$editorDiv.click(function(e){
            e.preventDefault();
            e.stopPropagation();
        });
        
        //TODO
        //validation functions
            //control that values are numeric
            //error handling ?
            //resize
        
    }; 
    
    var setupSectionHandler = function(){
        
        //on window resize, hide current popin
        $(window).resize(function() {
            hideCurrentEditor();            
        });
        
        //on section scroll, hide current popin
        $(".scrollable, .l-layout", $appendPoint).on("scroll", function(){
            hideCurrentEditor();
        });
        
    };
    
    //INITIALISATION 
	var init = function(options) {
        
        if(!options || !options.container || !options.unitRefList)
        {
            return false;
        }
        
        //prevent creating multiple instances of the popin
        for (var i = 0; i < editors.length; i++) {
            editors[i].$editorDiv.remove();
        }
        editors = [];
        
        //store container
        if(options.container)
        {
            $containers = $(options.container);
        }
        
        //store unit ref list
        if(options.unitRefList)
        {
            unitRefList = options.unitRefList;
        }
        
        //set append point
        if(options.appendPointClass){
            $appendPoint = $(options.appendPointClass);
        }
        
        //set base url for images
        if(options.imgBaseUrl){
            imgBaseUrl = options.imgBaseUrl;
        }
        
        //find and store elements
        parseContainerContent();
        
        //create popin
        build();
        
        //setup handlers for the section 
        setupSectionHandler();
        
    };
    
    //PUBLIC
    return {
        init : init
    };
    
}(jQuery));