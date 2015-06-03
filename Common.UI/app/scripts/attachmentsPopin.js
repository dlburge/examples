"use strict";

TraceOne.attachmentsPopin = (function ($) {
    
    //TODO : need a "hidden" field in the parent table to store the GUID of the selected file
    //TODO : we need a root file path for the attachments, passed in init as a variable or stored in a data-attribute on the radio ? 
    
    var attachmentLinkClass, popinId, $popin, dataAttribute = "link-elem", fileRootPath = "", defaultName="defaultFileName", callbacks = null;
    var linkTagTemplate = "<span class=\"tag-link\">" +
        "<a href=\"{{&link}}\" title=\"Open the file\">{{name}}</a>" +
        "<a class=\"delete\" href=\"#\" title=\"Remove the file\">&nbsp;</a>" +
        "<input type=\"hidden\" name=\"{{fieldId}}\" id=\"{{fieldId}}\" value=\"{{value}}\" >" +
    "</span>";
    
    var setupHandlers = function () {
        
        //attach click event for each, en delegate
        $("body").on("click", "." + attachmentLinkClass, function (e) {
            //pass the clicked link to the popin and open it
            $popin.data(dataAttribute, this).dialog("open");
            
            //deactivate "select file" button if no file is available
            var $fileRadio = $popin.find("input[type=radio]");
            if ($fileRadio.length < 1) {
                $("#button-select").button("disable");
            }
            
            e.preventDefault();
        });
        
        //when we click on the row, check the radio
        $popin.on("click", "tr", function (e) {
            
            //get the tr (look down first)
            var $tr = $(e.target).find("tr");
            
            //if nothing is found, look up
            if ($tr.length < 1) {
                $tr = $(e.target).parent("tr");
            }
            
            //get the radio 
            var $radio = $tr.find("input[type=radio]");
                
            //check the radio
            $radio.prop("checked", true);
            
        });
        
        //when we dblclick on the row, the radio will be selected by the "click" event
        $popin.on("dblclick", "tr", function (e) {
            e.preventDefault();
            updateParent();
            $popin.dialog("close");
        });
        
        $(".l-layout").on("click", ".tag-link .delete", function (e) {
            //prevent default
            e.preventDefault();

            //jquery wrap
            var $this = $(this);

            //get parent
            var $parent = $this.parent();

            //get the add link
            var $addLink = $parent.prev();
            
            if (callbacks && callbacks.deleteAttachment) {
                callbacks.deleteAttachment($(this));
            }
            
            //show the add file link
            $addLink.show();

            //remove
            $parent.remove();
        });
         
    };
    
    var updateParent = function () {
        
        //get selected radio
        var $fileRadio = $popin.find("input:checked");
        
        //if a file was selected, update the table
        if ($fileRadio.length > 0) {
            
            //get the row containing the selected file
            var $tr = $fileRadio.parents("tr");
            
            //NOTE : this will break if there is no label, BUT that is normal, if there is no label there is a problem in the HTML.
            //get the filename from the label tag
            var fileName = $tr.find("label").text();
            
            //id of the selected file
            var fileId = $fileRadio.val();
            
            //the path to the file
            var filePath = fileRootPath + fileId;
            
            //get parent link from data object
            var $parentLink = $($popin.data(dataAttribute));
            
            //get the id of the parent item, it will be used to generate the ID of the hidden field
            var parentItemId = $parentLink.attr("data-generated-name");
            if (parentItemId === undefined) {
                parentItemId = defaultName;
            }
            
            //update the Link
            var linkData = {
                value: fileId,
                name: fileName,
                link: filePath,
                fieldId: parentItemId
            };
            
            if (callbacks && callbacks.selectAttachment) {
                callbacks.selectAttachment
                (
                    $($popin.data(dataAttribute)),
                    $tr.find(".ExpiredDate").html(),
                    $tr.find(".ExpiredDate").attr("ToBePublished") === "True",
                    $tr.find(".Topic").html()
                );
            }
            
            /*jshint camelcase: false */
            var linkHtml = Mustache.to_html(linkTagTemplate, linkData);
            
            $parentLink.after(linkHtml);
            $parentLink.hide();
        }
        
    };
    
    var build = function () {
        
        //setup popin dialog
        $popin = $("#" + popinId).dialog({
            autoOpen: false,
            height: "auto",
            width: "auto",
            modal: true,
            buttons: [
                {
                    id: "button-select",
                    text: "Select file",
                    click: function () {
                        //call update of parent table/list
                        updateParent();
                        $(this).dialog("close");
                    }
                },
                {
                    id: "button-cancel",
                    text: "Cancel",
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ]
        });
        
        var $fileRadio = $popin.find("input");
        if ($fileRadio.length < 1) {
            $("#button-select").button("disable");
        }
        
    };
    
    var init = function (options) {
        
        //prevent creating multiple instances of the popin
        if ($popin) {
            $popin.remove();
            $popin = undefined;
        }
        
        if (!options || !options.attachmentLinkClass || !options.popinId || !options.fileRootPath) {
            return false;
        }
        
        if (options.callbacks) {
            callbacks = options.callbacks;
        }

        //set variables
        attachmentLinkClass = options.attachmentLinkClass;
        popinId = options.popinId;
        fileRootPath = options.fileRootPath;
        
        //build popin
        build();
        
        //setup link events
        setupHandlers();
        
    };

    return {
        init: init
    };
    
}(jQuery));
