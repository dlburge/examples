/*
    Move from read mode to edit mode for a row

    - attach click event on each row
    - on click
        - ajax call to load the data for the row (necessary ?), maybe just to make sure its fresh...
        - build the HTML for row in edit mode, need to create a new tbody, which means closing the original



    Add new ingredient
    - inserts an empty row in the table with an aucomplete field
    - when the user selects an item from the autocomplete the new row is added in readonly mode
        - an icon is shown to mark the new item as a "library" ingredient
    - if the user just types a new name, empty fields are inserted for the other columns
        - an icon is shown to mark the new item as a "local" ingredient

    Attach to table
    Apply actions to "add" buttons


    This class allows us to add a new item to a specified table by selecting it from a "menu"
    The menu can be an autocomplete or a select menu
    The newly added item can be configured to be readonly or editable

    Configuration options :
    - field to attach the onchange/autocomplete to
    - url for the autocomplete
    - target table where the item will be added
    - readonly : true/false - once added will the new item be readonly or editable ?
    - template for autocomplete menu items
    - templates for the new item : readonly and editable
    - any reference list that need will appear in the new item if editable (selectboxs)
*/

"use strict";

TraceOne.formula = (function($){

    /*
    TODO : RAF on server side
        - pass in autocomplete urls : reference name, supplier name, supplier country, origin

        - determine how we communicate a deleted object
            - determine format to follow so that they can be mapped on the server

        - localization
    */

    //PRIVATE VARIABLES
    var $formulaTable, baseId, addCount=0, unitRefList, $ingredientEdit, $currentIngredients, baseUrls;

    var isHiddenClass = "is-hidden",
        buttonCollapseAll = ".collapse-all-rows",
		flagExpand = true;

    var partials = {
        gmoOrganismTemplate : "<select class='is-supplier-field' name='' id=''>" +
                "<option value='1'>GMO Organism 1</option>" +
                "<option value='2'>GMO Organism 2</option>" +
            "</select>",
        organicTemplate :  "<select class='is-supplier-field' name='' id=''>" +
                "<option value='1'>Yes</option>" +
                "<option value='0'>No</option>" +
            "</select>"
    };
    var supplierTemplate = "<tr id='{{supplierId}}' class='item-edit-body'>" +
            "<td class='delete-row empty'></td>" +
            "<td class='{{classes}}'></td>" +
            "<td></td>" +
            "<td class='border-left'></td>" +
            "<td class='border-left'></td>" +
            "<td class='border-left'></td>" +
            "<td></td>" +
            "<td class='border-left'></td>" +
            "<td></td>" +
            "<td class='border-left no-wrap'>" +
                "<img class='delete-icon bt-delete-supplier' src='../img/ico/ico-delete.png'>" +
                "<input class='is-supplier-field supplierAutocomplete' type='text' name='' id='' value=''>" +
            "</td>" +
            "<td class='border-left'><input class='is-supplier-field countryAutocomplete' type='text' name='' id='' value=''></td>" +
            "<td class='border-left'>" +
                "<input class='is-supplier-field multipleCountryAutocomplete' type='text' name='' id='' value=''>" +
                "<output class='tag-cloud'></output>" +
            "</td>" +
            "<td>" +
                "{{>gmoOrganismTemplate}}" +
            "</td>" +
            "<td>" +
                "{{>organicTemplate}}" +
            "</td>" +
        "</tr>";

    var ingredientTemplate = "<tbody id='{{itemId}}' class='item-edit'>" +
        "<tr class='item-edit-head'>" +
            "<th class='delete-row empty'></th>" +
            "<th class='row-count {{itemNumber.class}}'></th>" +
            "<th class='highlight-title border-bottom'></th>" +
            "<th class='highlight-title border-bottom'></th>" +
            "<th class='highlight-title border-bottom' colspan='2'>Finished process amount</th>" +
            "<th class='highlight-title border-bottom' colspan='2'>Preprocessing amount</th>" +
            "<th class='highlight-title border-bottom'>Additive function</th>" +
            "<th class='highlight-title border-bottom' colspan='2'>Supplier</th>" +
            "<th></th>" +
            "<th></th>" +
            "<th></th>" +
        "</tr>" +
        "<tr class='item-edit-head'>" +
            "<th class='delete-row empty'></th>" +
            "<th class='row-count {{itemNumber.class}}'></th>" +
            "<th class='border-left'>Ingredient name</th>" +
            "<th class='border-left'>Reference name</th>" +
            "<th class='center-align border-left'>Qty</th>" +
            "<th class='center-align border-left'>%</th>" +
            "<th class='center-align'>Qty</th>" +
            "<th class='center-align border-left'>%</th>" +
            "<th></th>" +
            "<th class='border-left'>Name</th>" +
            "<th class='border-left'>Country</th>" +
            "<th class='border-left'>Origin</th>" +
            "<th>GMO Organism</th>" +
            "<th>Organic</th>" +
        "</tr>" +
        "<tr class='item-edit-body'>" +
            "<td class='delete-row'><img class='bt-delete-ingredient' name='' id='' src='/img/ico/ico-delete.png'></td>" +
            "<td class='row-count {{itemNumber.class}}'>{{itemNumber.value}}</td>" +
            "<td class='border-left ingredient-column'>" +
                "<input type='text' name='' id='' value=''>" +
                "<span title='Local ingredient' class='ingredient-local'>&nbsp;</span>"+
            "</td>" +
            "<td class='border-left'><input class='refNameAutocomplete' type='text' name='' id='' value=''></td>" +
            "<td class='border-left no-wrap'>" +
                "<a href='#' class='qty-value'>--</a>" +
                "<fieldset class='popin-qty-editor'>" +
                    "<input class='x-small' type='hidden' name='QuantityTarget-qty_0' id='QuantityTarget-qty_0' value=''>" +
                    "<input class='x-small' type='hidden' name='QuantityMin-qty_0' id='QuantityMin-qty_0' value=''>" +
                    "<input class='x-small' type='hidden' name='QuantityMax-qty_0' id='QuantityMax-qty_0' value=''>" +
                    "<input class='x-small' type='hidden' name='Unit-qty-id_0' id='Unit-qty-id_0' value='2'>" +
                "</fieldset>" +
            "</td>" +
            "<td class='border-left no-wrap'>" +
                "<a href='#' class='qty-value'>--</a>" +
                "<fieldset class='popin-qty-editor'>" +
                    "<input class='x-small' type='hidden' name='PercentageTarget-qty_1' id='PercentageTarget-qty_1' value=''>" +
                    "<input class='x-small' type='hidden' name='PercentageMin-qty_1' id='PercentageMin-qty_1' value=''>" +
                    "<input class='x-small' type='hidden' name='PercentageMax-qty_1' id='PercentageMax-qty_1' value=''>" +
                    "<input class='x-small' type='hidden' name='Unit-qty-id_1' id='Unit-qty-id_1' value=''>" +
                "</fieldset>" +
            "</td>" +
            "<td class='no-wrap'>" +
                "<a href='#' class='qty-value'>--</a>" +
                "<fieldset class='popin-qty-editor'>" +
                    "<input class='x-small' type='hidden' name='QuantityTarget-qty_2' id='QuantityTarget-qty_2' value=''>" +
                    "<input class='x-small' type='hidden' name='QuantityMin-qty_2' id='QuantityMin-qty_2' value=''>" +
                    "<input class='x-small' type='hidden' name='QuantityMax-qty_2' id='QuantityMax-qty_2' value=''>" +
                    "<input class='x-small' type='hidden' name='Unit-qty-id_2' id='Unit-qty-id_2' value='2'>" +
                "</fieldset>" +
            "</td>" +
            "<td class='border-left no-wrap'>" +
                "<a href='#' class='qty-value'>--</a>" +
                "<fieldset class='popin-qty-editor'>" +
                    "<input class='x-small' type='hidden' name='PercentageTarget-qty_3' id='PercentageTarget-qty_3' value=''>" +
                    "<input class='x-small' type='hidden' name='PercentageMin-qty_3' id='PercentageMin-qty_3' value=''>" +
                    "<input class='x-small' type='hidden' name='PercentageMax-qty_3' id='PercentageMax-qty_3' value=''>" +
                    "<input class='x-small' type='hidden' name='Unit-qty-id_3' id='Unit-qty-id_3' value=''>" +
                "</fieldset>" +
            "</td>" +
            "<td><input type='text' name='' id='' value=''></td>" +
            "<td class='border-left no-wrap'>" +
                "<img class='delete-icon bt-delete-supplier' src='../img/ico/ico-delete.png'>" +
                "<input class='is-supplier-field supplierAutocomplete' type='text' name='' id='' value=''>" +
            "</td>" +
            "<td class='border-left'><input class='is-supplier-field countryAutocomplete' type='text' name='' id='' value=''></td>" +
            "<td class='border-left'>" +
                "<input class='is-supplier-field multipleCountryAutocomplete' type='text' name='' id='' value=''>" +
                "<output class='tag-cloud'></output>" +
            "</td>" +
            "<td>" +
                "{{>gmoOrganismTemplate}}" +
            "</td>" +
            "<td>" +
                "{{>organicTemplate}}" +
            "</td>" +
        "</tr>" +
        "<tr class='item-edit-foot'>" +
            "<td class='delete-row empty'></td>" +
            "<td class='row-count {{itemNumber.class}}'></td>" +
            "<td class='empty actions' colspan='7'>" +
                "<a href='#' class='bt-add-ingredient' title='Add an ingredient'><img src='../img/ico/ico-add-ingredient.png'></a>" +
                "<a href='#' class='bt-add-sub-ingredient' title='Add a sub-ingredient'><img src='../img/ico/ico-add-sub-ingredient.png'></a>" +
            "</td>" +
            "<td class='empty actions' colspan='2'>" +
                "<a href='#' class='bt-add-supplier' title='Add a supplier'><img src='../img/ico/ico-add-supplier.png'></a>" +
            "</td>" +
            "<td class='empty' colspan='3'></td>" +
        "</tr>" +
        "</tbody>";


    //PRIVATE FUNCTIONS

    //setup autocompletes, taglist, etc.

    //setup up autocompletes, etc.
    var setupFieldComponents = function(){

        //setup formula section editors
        TraceOne.popinFieldEditor.init({
            container : ".edit.formula .popin-qty-editor",
            unitRefList : [
                {"value":"1", "label":"mg"},
                {"value":"2", "label":"g"},
                {"value":"3", "label":"l"},
                {"value":"4", "label":"cm"}
            ],
            appendPointClass : ".l-layout",
            imgBaseUrl : "/img/ico/"
        });

        TraceOne.tagList.resetTagDeleteHandler();

        var countries = [
            {"value":1, "label":"USA"},
            {"value":2, "label":"Mexico"},
            {"value":3, "label":"France"},
            {"value":4, "label":"Spain"},
            {"value":5, "label":"Italy"},
            {"value":6, "label":"Argentina"},
            {"value":7, "label":"Bresil"}
        ];

        $formulaTable.find("input.countryAutocomplete").autocomplete({
            source: countries,
            select: function(e, data) {
                var $field = $(e.target);
                var val = data.item.label;
                $field.val(val);
                return false;
            }
        });

        $formulaTable.find("input.multipleCountryAutocomplete").autocomplete({
            source: countries,
            select: function(e, data) {
                TraceOne.tagList.addTag(e, data);
                return false;
            }
        });

        var suppliers = [
            {"value":1, "label":"Supplier 1"},
            {"value":2, "label":"Supplier 2"},
            {"value":3, "label":"Supplier 3"},
            {"value":4, "label":"Supplier 4"},
            {"value":5, "label":"Supplier 5"},
            {"value":6, "label":"Supplier 6"},
            {"value":7, "label":"Supplier 7"}
        ];
        $formulaTable.find("input.supplierAutocomplete").autocomplete({
            source: suppliers,
            select: function(e, data) {
                var $field = $(e.target);
                var val = data.item.label;
                $field.val(val);
                return false;
            }
        });

        var refName = [
            {"value":1, "label":"Reference name 1"},
            {"value":2, "label":"Reference name 2"},
            {"value":3, "label":"Reference name 3"},
            {"value":4, "label":"Reference name 4"},
            {"value":5, "label":"Reference name 5"},
            {"value":6, "label":"Reference name 6"},
            {"value":7, "label":"Reference name 7"}
        ];
        $formulaTable.find("input.refNameAutocomplete").autocomplete({
            source: refName,
            select: function(e, data) {
                var $field = $(e.target);
                var val = data.item.label;
                $field.val(val);
                return false;
            }
        });

    };

    //generate a base ID that will incremented and used to generate a unique ID for each add operation
    var generateBaseId = function(){
        //the base is the ID of the last ingredient + "_TEMP_" + "_" + a random number
        //get last ingredient
        var tmpId = $formulaTable.find("tbody:last").attr("id");

        baseId = tmpId + "_TEMP_" + (Math.floor(Math.random() * 9999999) + 1);
    };

    var generateTempId = function(){

        //augment the count
        addCount++;

        console.log("latest generated id : " + baseId + "_" + addCount);

        return baseId + "_" + addCount;
    };

    //Load the ingredient and the first-level of it's subingredients via un AJAX call
    var changeToEditMode = function(event, item){

        if($ingredientEdit){
            $.when(changeToReadMode($ingredientEdit)).done(function(){

                //remove if the current element isn't in the list
                if($currentIngredients.filter(item).length === 0){
                    $currentIngredients.remove();
                }

            });
        }

        //TODO : remove the mock ajax calls
        $.mockjax({
            //ingredients/save/{projectId}/{ingredient name or id}/{column name or id}
            url: "/ingredient/load/*",
            proxy: "edit-ingredient.html",
            status : 200 //put 500 here to simulate an error
        });

        //generate url for the ingredient
        var loadUrl = baseUrls.get + item.id;

        //get content for ingredient, ingredient in edit mode and first level of sub-ingredients
        var getContent = $.get(loadUrl);

        //handle when done, insert content in popin
        getContent.done(function(data){

            //add a class to each item added that will allow us to identify later those items so that we may remove them
            data = $(data).addClass("was-added");

            //replace the orginal row with the new content
            $(item).replaceWith(data);

            //get the element that we just inserted and store it
            $ingredientEdit = $formulaTable.find(".item-edit");

            //get the the ingredients that were just inserted, parent (in edit) and the sub-ingredients
            $currentIngredients = $formulaTable.find(".was-added").not(".item-edit");

            setupFieldComponents();

        });

//        //handle on error
//        getContent.fail(function(request, status, error){
//            //TODO : handle load errors
//        });
//
    };

    //Each time we leave "edit" mode for an item, we post the data of the item
    var changeToReadMode = function($item){

        var deferred = $.Deferred();

        var itemId = $item.attr("id");

        //get the inputs for the item
        var $inputs = $item.find("input, select, textarea");

        //serialize them
        var data = $inputs.serialize();

        //TODO : remove the mock ajax calls
        $.mockjax({
            //ingredients/save/{projectId}/{ingredient name or id}/{column name or id}
            url: "/ingredient/update/*",
            proxy: "read-ingredient.html",
            status : 200 //NOTE: you may put 500 here to simulate an error
        });

        //post them to the server
        var postUrl = baseUrls.post + itemId;
        var postData = $.post(postUrl, data);

        //handle when done, take the returned view and insert it in place of the current item and hide any sub-ingredients
        postData.done(function(data){

            //replace the edit item with the ingredient in read mode
            $ingredientEdit.replaceWith(data);

            //get item that was just added
            var ingredientId = $(data).attr("id");
            var ingredient = $formulaTable.find("#"+ingredientId);

            deferred.resolve(ingredient);

        });

        //handle on error
//        postData.fail(function(request, status, error){
//            //TODO : handle load errors
//        });

        return deferred.promise();

    };

    var getItemNumberClass = function(itemNumber){

        var itemNumberClass = "row-count-1";

        switch (itemNumber.length) {
            case 1:
                itemNumberClass = "row-count-1";
                break;
            case 3:
                itemNumberClass = "row-count-2";
                break;
            case 5:
                itemNumberClass = "row-count-3";
                break;
            case 7:
                itemNumberClass = "row-count-4";
                break;
            case 9:
                itemNumberClass = "row-count-5";
                break;
            case 11:
                itemNumberClass = "row-count-6";
                break;
            case 13:
                itemNumberClass = "row-count-7";
                break;
            case 15:
                itemNumberClass = "row-count-8";
                break;
            case 17:
                itemNumberClass = "row-count-9";
                break;
            case 19:
                itemNumberClass = "row-count-10";
                break;
            default:
                itemNumberClass = "row-count-EOF";
                break;
        }

        return itemNumberClass;

    };

    //generate the next item number
    var nextItemNumber = function(itemNumber, isFirstSubIngredient){

        var nextNumber;

        if(isFirstSubIngredient){
            nextNumber = itemNumber + ".1";
        } else {
            //get the number after the last decimal
            //split on decimal
            var arrValues = itemNumber.split(".");

            //get last number
            var last = arrValues.pop();

            //raise it by 1
            last++;

            //put it back in the array
            arrValues.push(last);

            nextNumber = arrValues.join(".");
        }

        return nextNumber;
    };

    //Add an ingredient
    var addIngredient = function(event, bt){

        //find the ingredient that is currently in edit mode
            //post its values to the server
            //server sends back updated view in read mode
            //replace the item in edit AND its sub-ingredients with the ingredient in read mode

        $.when(changeToReadMode($ingredientEdit)).done(function(item){

            //remove the sub-ingredients
            $currentIngredients.remove();

            //insert a new ingredient at the bottom of the current level and store it as the ingredient in edit mode

            //get the last ingredient for the current level
            var $lastIngredient = $formulaTable.find("tbody:last-of-type");
            var $lastNumberCell = $lastIngredient.find(".row-count").first();

            var itemNumberValue = nextItemNumber($lastNumberCell.text());
            var itemNumberClass = getItemNumberClass(itemNumberValue);

            //generate a unique id
            var itemId = generateTempId();

            var data = {
                itemId : itemId,
                itemNumber : {
                    class : itemNumberClass,
                    value : itemNumberValue
                }
            };

            //generate HTML for the new line with unique ID and item number

            /*jshint camelcase: false */
            var html = Mustache.to_html(ingredientTemplate, data, partials);

            //insert the new line at the bottom of the current level, and store it
            $ingredientEdit = $lastIngredient.after(html).siblings("#"+itemId);

            setupFieldComponents();
        });

    };

    //Add a sub-ingredient
    var addSubIngredient = function(event, bt){

        $.when(changeToReadMode($ingredientEdit)).done(function(item){

            //insert a new ingredient at the bottom of the current level and store it as the ingredient in edit mode

            //get the last ingredient for the current level

            var $lastNumberCell, itemNumberClass, itemNumberValue, isFirstSubIngredient=false;

            var $lastIngredient = item.nextAll(".was-added").last();

            //if there is no existing sub-ingredients, set flag
            if($lastIngredient.length < 1){
                isFirstSubIngredient = true;
                $lastIngredient = item.nextAll("tbody").last();
            }

            $lastNumberCell = $lastIngredient.find(".row-count").first();

            itemNumberValue = nextItemNumber($lastNumberCell.text(), isFirstSubIngredient);
            itemNumberClass = getItemNumberClass(itemNumberValue);

            //generate a unique id
            var itemId = generateTempId();

            //store the data so that we can generate a template
            var data = {
                itemId : itemId,
                itemNumber : {
                    class : itemNumberClass,
                    value : itemNumberValue
                }
            };

            //generate HTML for the new line with unique ID and item number

            /*jshint camelcase: false */
            var html = Mustache.to_html(ingredientTemplate, data, partials);

            //insert the new line at the bottom of the current level, and store it
            $ingredientEdit = $lastIngredient.after(html).siblings("#"+itemId);

            setupFieldComponents();
        });

    };

    //Delete an ingredient
    var deleteIngredient = function(event, bt){

        //TODO : NOTE : do we need to post the id of the ingredient to delete
        //hide the row of the ingredient and its sub-ingredients

        $ingredientEdit.remove();
        $currentIngredients.remove();

    };

    //Add a supplier
    var addSupplier = function(event, bt){

        //find the ingredient that is currently in edit mode
        //find the last supplier
        var $lastSupplier = $ingredientEdit.find(".item-edit-body").last();

        var $lastSupplierCell = $lastSupplier.find(".row-count").first();

        var itemNumberClasses = $lastSupplierCell.attr("class");

        //generate a unique id
        var supplierId = generateTempId();

        //store the data so that we can generate a template
        var data = {
            supplierId : supplierId,
            classes : itemNumberClasses
        };

        //generate HTML for the new line : TODO : genearte a fake ID ?
        /*jshint camelcase: false */
        var html = Mustache.to_html(supplierTemplate, data, partials);

        //insert a new line after it
        $lastSupplier.after(html);

        setupFieldComponents();

    };

    //Delete a supplier
    var deleteSupplier = function(event, bt){

        //get the row of the supplier
        var $supplierToDelete = $(bt).parents(".item-edit-body");

        //TODO : NOTE : do we need to post the id of the supplier that was deleted ? Or do we rely on the fact that the ingredient (suppliers included) will be posted when the row moves back to "read" mode

        //if this is the ingredient row, clear the fields
        if($supplierToDelete.find(".bt-delete-ingredient").length > 0){

            //clear the fields
            var $fields = $supplierToDelete.find(".is-supplier-field");
            $fields.val("");

            //delete the tags
            var $tags = $supplierToDelete.find(".tag");
            $tags.remove();

        } else {
            $supplierToDelete.remove();
        }
    };

    var toggleAll = function ($targets) {
        if (flagExpand) {
            $targets.addClass(isHiddenClass);
            flagExpand = false;
        }
        else {
            $targets.removeClass(isHiddenClass);
            flagExpand = true;
        }
    };

    //EVENT HANDLERS
    var setupHandlers = function(){

        //attach editmode handler
        $formulaTable.on("click", "tbody:not(.item-edit)", function(e){
            changeToEditMode(e, this);
        });

        //setup add ingredient handler
        $formulaTable.on("click", ".bt-add-ingredient", function(e){
            e.preventDefault();

            addIngredient(e, this);
        });

        //setup add sub-ingredient handler
        $formulaTable.on("click", ".bt-add-sub-ingredient", function(e){
            e.preventDefault();
            addSubIngredient(e, this);
        });

        //setup delete ingredient handler
        $formulaTable.on("click", ".bt-delete-ingredient", function(e){
            deleteIngredient(e, this);
        });

        //setup add supplier handler
        $formulaTable.on("click", ".bt-add-supplier", function(e){
            e.preventDefault();
            addSupplier(e, this);
        });

        //setup delete supplier handler
        $formulaTable.on("click", ".bt-delete-supplier", function(e){
            deleteSupplier(e, this);
        });


        $formulaTable.on("click", buttonCollapseAll, function(e) {

            e.preventDefault();

            var $targets = $formulaTable.find("tbody tr");

            //remove first level items
            var rowCountText;
            $targets = $targets.filter(function () {

                rowCountText = $(".row-count", this).text();

                //supplier rows don't have a number
                if (rowCountText === "") {
                    return true;
                }

                //if the row count contains a period, then the row isn't a first level
                return rowCountText.indexOf(".") !== -1;
            });

            if ($targets.length === 0) {
                return;
            }

            //toggle items that are NOT first level
            toggleAll($targets);
        });

    };

    //PUBLIC FUNCTIONS : will be public when they are added to the return clause

    //INITIALISATION
	var init = function(options) {

        if(!options || !options.tableId || !options.unitRefList || !options.urls)
        {
            return false;
        }

        //set variables
        if(options.tableId){
            $formulaTable = $("#"+options.tableId);
        }

        //store unit ref list
        if(options.unitRefList)
        {
            unitRefList = options.unitRefList;
        }

        if(options.urls){
            baseUrls = options.urls;
        }

        generateBaseId();

        setupHandlers();

    };

    //RETURN PUBLIC METHODS
    return {
        init : init
    };

}(jQuery));
