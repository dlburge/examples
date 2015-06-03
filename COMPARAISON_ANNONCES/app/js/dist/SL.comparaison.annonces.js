var SelogerUI = SelogerUI || {};

Array.prototype.totalForProperty = function(prop){
    var total = 0;
    for (var i = 0, len = this.length; i < len; i++) {
        total += this[i][prop];
    }
    return total;
};

SelogerUI.AreaValues = function (values, d3ColorScale, index, id, label){
	
	this.values = values;
	this.label = label;
    this.color = d3ColorScale(index);
    
    //id de l'annonce pour pouvoir le masqué
    this.id = "area_"+id;
};



SelogerUI.Axis = function (label, dataField, values, color, length){
	
	this.label = label;
	this.values = values;
    this.color = color;
    this.length = length;
    this.id = "axis-"+dataField;
    
    //initialize
	this.init();
};

SelogerUI.Axis.prototype.init = function(){
	
	//order data and parse data (numeric)
    this.values = this.values.map(
        function(d){ 
            if(!isNaN(d)) {
                return parseFloat(d);
            } else {
                return parseFloat((d).replace(/\ /g, ""));
            }
        }).sort(d3.ascending);
    
    //identify min and max
    this.min = 0;
    this.max = (this.values[this.values.length-1]);    
};


SelogerUI.Axis.prototype.scale = function(value){
    //TODO : add "clamp"
    var s = d3.scale.linear().domain([this.min, this.max]).range([0, this.length]);
    return s(value);
};
SelogerUI.RadarChart = (function (d3) {
    
    //PRIVATE ATTRIBUTES
	var svgContainer, svgCanvas, inputData, areaValues = [], axisCfg, axis = [], controlsContainer;
    
    //initiate color scale, used for generating randomly the stroke and fill colors
    var colorScale = d3.scale.category10();
    
    var chartCfg = {
        canvasWidth : 600,
        canvasHeight : 600,
        canvasPadding : 35,
        axisColor : "#000",
        nodeColor : "#222",
        areaStrokeWidth : "3px",
        nodeRadius : 3.5,
        radians: 2 * Math.PI,
        polyOpacity : 0.5,
        polyOpacityOff : 0.1,
        polyOpacityOn : 0.7        
    };
	
	//PRIVATE FUNCTIONS
    var drawChart = function(){
        buildBase();
        plotAxis();
        plotValues();
    };
    
    var buildBase = function(){
        //create canvas
        svgCanvas = svgContainer.append("svg:g").attr("id", "canvas");
        //set center
        svgCanvas.attr("transform", "translate(" + (chartCfg.canvasWidth/2) + " ," + (chartCfg.canvasHeight/2) + ")");
    };
    
    var plotAxis = function(){
        
        //container "group" for each axis
        var svgAxisGroups = svgCanvas.selectAll(".axis")
            .data(axis)
            .enter().append("svg:g")
            .attr("transform", function(d,i){
                return "rotate(" + ((i / axis.length * 360) - 90) + ")translate(" + d.scale(d.max) + ")";
            })
            .attr("class","axis");
        
        //draw the axis line inside of the group
        svgAxisGroups.append("svg:line")
            .attr("x2", function(d,i){
                return -1 * d.scale(d.max);
            })
            .style("stroke", function(d){ 
                return d.color; 
            })
            .style("fill", "none");
        
        //attach label for the axis
        svgAxisGroups.append("svg:text")
            .text(function(d){
                return d.label;
            })
            .attr("text-anchor", function(d, i){
                var r = i / axis.length * 360;
                if(r===0 || r===180)
                {
                    return "middle";
                }                
                return r < 0 || r > 180 ? "end" : "start";
            })
            .attr("dy", function(d, i){
                var r = i / axis.length * 360;
                return r < 90 || r > 270 ? "-1.00em" : "1.25em";
            })
            .attr("transform", function(d, i){
                return "rotate("+((i / axis.length * 360) - 90) * -1+")";
            });
        
    };
    
    var plotValues = function(){
        
        //create a group to hold each polygon
        var svgValueGroups = svgCanvas.selectAll(".values")
            .data(areaValues)
            .enter().append("svg:g")
            .attr("class", "values")
            .attr("id", function(d,i){
                return d.id;
            });
        
        //create lines (areas)
        var svgValueLines = svgValueGroups.append("svg:path").attr("class", "lines")
            //set color (calculated in areaValue object)
            .style("fill", function(d, i){
                return d.color;
            })
            .style("stroke", function(d, i){
                return d.color;
            })
            //set opacity and stroke width, chart config
            .style("fill-opacity", chartCfg.polyOpacity)
            .style("stroke-width", chartCfg.areaStrokeWidth)
            
            .on("mouseover", function (){
                svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacityOff);
                var poly = d3.select(this);
                var polyParent = d3.select(this.parentElement);
                var polyValueNodes = polyParent.selectAll(".nodeValue");
                var polyValueLabels = polyParent.selectAll(".nodeLabel");
                poly.transition(200).style("fill-opacity", chartCfg.polyOpacityOn);
                polyValueNodes.transition(200).style("fill-opacity", 1.0);
                polyValueLabels.transition(200).style("fill-opacity", 1.0);
            })
            .on("mouseout", function(){
                svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacity);
                var polyParent = d3.select(this.parentElement);
                var polyValueNodes = polyParent.selectAll(".nodeValue");
                var polyValueLabels = polyParent.selectAll(".nodeLabel");
                polyValueNodes.transition(400).style("fill-opacity", 0.0);
                polyValueLabels.transition(400).style("fill-opacity", 0.0);
            })
            //Restructure the data for the radial.radius line generator
            .data(areaValues.map(
                function(d){
                    return d.values;
                })
            )
            //draw the path
            .attr("d", d3.svg.line.radial().radius(
                function (d, i) {
                    return d.scaledValue;
                }).angle(function (d, i) {
                    if (i === axis.length) {
                        i = 0;
                    } 
                    //close the line
                    return (i / axis.length) * 2 * Math.PI;
                }).interpolate("cardinal-closed")
            );
        
        
//ORIGINAL CODE        
/*        
      ORIGINAL //
        
        var svgValueGroups = svgCanvas.selectAll(".values")
            .data(arrValues)
            .enter().append("svg:g")
            .attr("class", "values");
        
        var svgValueLines = svgValueGroups.append("svg:path")
            .attr("class", "lines")
            .attr("d", d3.svg.line.radial().radius(
                function (d, i) {
                    //console.log("d : "+d);
                    return d.scaledValue;
                    //return d;
                }).angle(function (d, i) {
                    if (i === axis.length) {
                        i = 0;
                    } 
                    //close the line
                    return (i / axis.length) * 2 * Math.PI;
                }).interpolate("cardinal-closed")
            )
            
            .style("fill", function(d, i){
                return color(i);
            })
            .style("fill-opacity", chartCfg.polyOpacity)
            
            .style("stroke-width", "3px") //TODO : put in config
            .style("stroke", function(d, i){
                return color(i);
            })
        
            .on("mouseover", function (){
                
                svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacityOff);
                
                var poly = d3.select(this);
                var polyParent = d3.select(this.parentElement);
                var polyValueNodes = polyParent.selectAll("circle");
                var polyValueLabels = polyParent.selectAll("text");
                
                poly.transition(200).style("fill-opacity", chartCfg.polyOpacityOn);
                polyValueNodes.transition(200).style("fill-opacity", 1.0);
                polyValueLabels.transition(200).style("fill-opacity", 1.0);
                
            })
            .on("mouseout", function(){
                svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacity);
                
                var polyParent = d3.select(this.parentElement);
                var polyValueNodes = polyParent.selectAll("circle"); //TODO : use class names
                var polyValueLabels = polyParent.selectAll("text");
                
                polyValueNodes.transition(400).style("fill-opacity", 0.0);
                polyValueLabels.transition(400).style("fill-opacity", 0.0);
                
            });
*/

        //node value groups
        var svgNodeValueGroups = svgValueGroups.append("svg:g").attr("class", "nodes").attr("transform", "rotate(180)");
        
        //node values
        var cx, cy;
        var svgNodeValues = svgNodeValueGroups.selectAll(".nodeValue")
            .data(function(d){
                return d.values.map(function(i){
                    return i.scaledValue;
                });
            })
            .enter().append("svg:circle")
            .attr("class", "nodeValue")
            .attr("cx", function(d, i){
                cx = -((d)*Math.sin(i*(chartCfg.radians/axis.length)));
                return cx;
            })
            .attr("cy", function(d, i){
                cy = ((d)*Math.cos(i*chartCfg.radians/axis.length));
                return cy;
            })
            .attr("r", chartCfg.nodeRadius)
            .style("fill", chartCfg.nodeColor)
            .style("fill-opacity", 0.0); //hidden by default
        
        
        //node label 
        var x, y;
        svgNodeValueGroups.selectAll(".nodeLabel")
            .data(function(d){
                return d.values.map(function(i){
                    return i;
                });
            })
            .enter().append("svg:text")
            .attr("class", "nodeLabel")
            
            .attr("x", function(d, i){
                x = ((d.scaledValue)*Math.sin(i*(chartCfg.radians/axis.length)));
                return x;
            })
            .attr("y", function(d, i){
                y = -((d.scaledValue)*Math.cos(i*chartCfg.radians/axis.length));
                return y;
            })
            .attr("transform", "rotate(180)")
            .text(function(d){
                return d.value;
            })
            .attr("text-anchor", function(d, i){
                var r = i / axis.length * 360;            
                return r < 0 || r > 180 ? "end" : "start";
            })
            .attr("dy", function(d, i){
                var r = i / axis.length * 360;
                return r < 90 || r > 270 ? "1.25em" : "-1.00em";
            })
            .style("fill-opacity", 0.0); //hidden by default
            
    };
    
    var drawChartControls = function(){
        
        //TODO : add span with bgcolor matching area color
        var data = {
            "values" : areaValues
        };
        
        //mustache template for checkboxes 
        var controlsTemplate = "{{#values}}<li id=\"li_{{id}}\"><span style=\"background-color:{{color}}\">&nbsp;</span> <input checked=\"checked\" type=\"checkbox\" name=\"checkbox_{{id}}\" id=\"checkbox_{{id}}\" value=\"{{id}}\" /> <label for=\"checkbox_{{id}}\">{{label}}</label></li>{{/values}}";
        
        //render HTML
        var controlsHtml = Mustache.to_html(controlsTemplate, data);
        
        //append HTML
        controlsContainer.html(controlsHtml);
        
        //attach events for toggling visibility
        controlsContainer.selectAll("input").on("change", function(){
            var areaGroupId = this.value;
            var displayValue = (this.checked ? "block" : "none");
            document.getElementById(areaGroupId).style.display = displayValue;
        });
        
        //attach events for hightlighting area during hover of control
        controlsContainer.selectAll("li").on("mouseover", function(){
            
            svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacityOff); 
            
            var areaGroupId = this.id.replace("li_", "");
            
            var areaGroup = d3.select(document.getElementById(areaGroupId));
            
            var poly = areaGroup.select("path");
            var polyValueNodes = areaGroup.selectAll(".nodeValue");
            var polyValueLabels = areaGroup.selectAll(".nodeLabel");
            
            poly.transition(200).style("fill-opacity", chartCfg.polyOpacityOn);
            polyValueNodes.transition(200).style("fill-opacity", 1.0);
            polyValueLabels.transition(200).style("fill-opacity", 1.0);
            
        }).on("mouseout", function(){
            
            svgCanvas.selectAll("path").transition(200).style("fill-opacity", chartCfg.polyOpacity); 
            
            var areaGroupId = this.id.replace("li_", "");
            
            var areaGroup = d3.select(document.getElementById(areaGroupId));
            
            var poly = areaGroup.select("path");
            var polyValueNodes = areaGroup.selectAll(".nodeValue");
            var polyValueLabels = areaGroup.selectAll(".nodeLabel");
            
            poly.transition(200).style("fill-opacity", chartCfg.polyOpacityOff);
            polyValueNodes.transition(200).style("fill-opacity", 0);
            polyValueLabels.transition(200).style("fill-opacity", 0);
            
        });
        
    };
    
    var createAreaValues = function(){
        
        //get the axis values for each listing
        var arrValues = [], tmpAreaValues, tmpInputData, arr=[], tmpValue, tmpScaledValue, tmpAxis, tmpId, tmpLabel;
        //loop over data items
        for(var i=0; i<inputData.length; i++){
            //store a reference to current item
            tmpInputData = inputData[i];
            tmpId = tmpInputData["idannonce"];
            tmpLabel = tmpInputData["label"];
            
            arr = [];
            //loop over properties of the item
            for (var key in tmpInputData) {
                if (tmpInputData.hasOwnProperty(key)) {
                    //loops over axis comparing current property to axis datafields
                    for(var j=0; j<axis.length; j++){
                        tmpAxis = axis[j];
                        if(tmpAxis.id === "axis-"+key){
                        //if match between axis datafield and current property
                            //format value
                            tmpValue = tmpInputData[key];
                            tmpValue = parseFloat((tmpValue).replace(/\ /g, ""));
                            tmpScaledValue = tmpAxis.scale(tmpValue);
                            //stock values
                            arr.push({
                                value : tmpValue,
                                scaledValue : tmpScaledValue
                            });
                            
                        }
                    }
                    
                }
            }
            
            arrValues.push(arr);
            
            //create areavalues object
            tmpAreaValues = new SelogerUI.AreaValues(arr, colorScale, i, tmpId, tmpLabel);
            
            //stock it
            areaValues.push(tmpAreaValues);
        }
        
        //sort values smallest "area" (total of array values) to largest (we have no control over z-index, must draw them in order so that the hover is possible)
        areaValues.sort(function (a,b){
            if (a.values.totalForProperty("scaledValue") > b.values.totalForProperty("scaledValue")){
                return -1;
            }
            if (a.values.totalForProperty("scaledValue") < b.values.totalForProperty("scaledValue")){
                return 1;
            }
            // a is equal to b
            return 0;
        });
        
    };
    
	var createAxis = function(){
		
        var tmpLabel, tmpDataField, tmpValues=[], tmpAxis;
		
        for(var i=0; i<axisCfg.length; i++){
            
            //clear data array
            tmpValues=[];
            
            //get label
            tmpLabel = axisCfg[i].label;
            
            //get datafield
            tmpDataField = axisCfg[i].dataField;
            
			//get corresponding data from data
            for(var j=0; j<inputData.length; j++){
                tmpValues.push(inputData[j][tmpDataField]);
            }
            
			//create axis
            tmpAxis = new SelogerUI.Axis(tmpLabel, tmpDataField, tmpValues, chartCfg.axisColor, (chartCfg.canvasHeight/2) - (chartCfg.canvasPadding*2));
            
            //store it 
			axis.push(tmpAxis);
        }
        
	};
    
    var update = function(options){
        
        if(!options || !options.data && !options.axis){
            return false;
            //TODO : handle config error
		}
        
        //store new data
        if(options.data)
        {
            inputData = options.data;
        }
        
        //store new axisCfg
        if(options.axis)
        {
            axisCfg = options.axis;
        }
        
        //clear the canvas SVG
        svgCanvas.remove();        
        
        //reinitialize variables
        axis = [];
        
        //create axis objects : label, min, max and data
		createAxis();
        
        //draw chart
        drawChart();
        
        //draw chart controls : build checkbox list allowing us to hide/show the values for a specific listing
        drawChartControls();
    };
    
	//INITIALISATION
	var init = function(options) {
		
		if(!options || !options.container || !options.data || !options.axis){
				return false;
				//TODO : handle config error
		}
		
        //TODO : override default options (size, etc.)
        if(options.config){}
        
        if(options.controlsContainer){
            controlsContainer = d3.select(options.controlsContainer);
        }
        
        //setup common variables
		svgContainer = d3.select(options.container).append("svg:svg");
		
        //set width and height
        svgContainer.attr("width", chartCfg.canvasWidth).attr("height", chartCfg.canvasHeight).attr("id", "container");
        
        //store input data
		inputData = options.data;
		
        //store axis config (needed for update eventuel)
        axisCfg = options.axis;
        
        //create axis objects : label, min, max and data
		createAxis();
        
        //create area values objects
        createAreaValues();
        
        //draw chart
        drawChart();
        
        //draw chart controls : build checkbox list allowing us to hide/show the values for a specific listing
        drawChartControls();
    
	};

	//PUBLIC
	return {
		//Return pointers for methods that need to be public
		init: init,
        update: update
	};

}(d3));
