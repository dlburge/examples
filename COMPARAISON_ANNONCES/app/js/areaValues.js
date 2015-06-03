SelogerUI.AreaValues = function (values, d3ColorScale, index, id, label){
	
	this.values = values;
	this.label = label;
    this.color = d3ColorScale(index);
    
    //id de l'annonce pour pouvoir le masqué
    this.id = "area_"+id;
};


