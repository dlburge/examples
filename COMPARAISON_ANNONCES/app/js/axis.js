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