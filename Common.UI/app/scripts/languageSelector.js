var TraceOne = TraceOne || {};

TraceOne.LanguageSelector = TraceOne.LanguageSelector || (function ($) {

    "use strict";

    var $languageSelectorContainer;

    var setupHandlers = function () {
        $("ul li.active-language a", $languageSelectorContainer).click(function (e) {
            e.preventDefault();
        });

        $("ul", $languageSelectorContainer).click(function () {
            $(this).toggleClass("is-open");
        });
    };

    var init = function (args) {
        $languageSelectorContainer = $(args.languageSelectorContainer);
        setupHandlers();
    };

    return {
        Init: init
    };
}(jQuery));
