/*
casper.start("http://localhost:9000/")
    .then(function() {
        phantomcss.screenshot("#todo-app", "Main app");
    })
    .then(function() {
        casper.fill("form.todo-form", 
            {
                todo: "Item1"
            }, true);

        phantomcss.screenshot("#todo-app", "Item added");
    })
    .then(function() {
        casper.click(".todo-done");
        phantomcss.screenshot("#todo-app", "Item checked off");
});

*/

casper.start("http://localhost:9000/")
    .then(function(){
        phantomcss.screenshot("#l-header", "header");
        phantomcss.screenshot(".page-summary", "page-summary");
        phantomcss.screenshot(".kpi-bar", "kpi-bar");
        phantomcss.screenshot(".l-grid", "dashboard-widgets");
        phantomcss.screenshot("#l-sidebar", "sidebar");
    });


