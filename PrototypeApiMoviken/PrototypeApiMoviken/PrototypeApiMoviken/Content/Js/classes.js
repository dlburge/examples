/*
*	Class used to define the PLACES used in the search
*   latlng is a google.maps.LatLng instance
*	marker is a google.maps.Marker instance
*/
function place (latlng, address, marker, htmlElem) {
	this.latlng = latlng;
	this.address = address;
	this.marker = marker; //the google marker associated with this place
	this.htmlElem = htmlElem; //might not be needed
	this.label;
	this.query;
};

place.prototype.getQuery = function () {
	if (!this.query) {
		this.query = this.latlng.lat() + "|" + this.latlng.lng(); //What separation character can I use ?
	}
	return this.query;
};

place.prototype.getLabel = function () {
	if (!this.label) {
		this.label = this.address + " (" + this.latlng.toUrlValue(4) + ")";
	}
	return this.label;
}

place.prototype.clear = function () {

	//remove marker from map
	this.marker.setMap(null);

	//remove place from IHM
	$(this.htmlElem).remove();

}

/*
*	Class used to define the stops found
*	place is a reference to the place object used in the query
*	circles is an array of google.maps.Cirlce instances 
*	array of transportline objects
*/
function stop(id, place, circles, transportlines) {
	this.id = id; //unique id used to identify the htmlelements associated with this stop
	this.label;
	this.place = place;
	this.circles = circles;
	this.htmlElems;
	this.lines = transportlines;
}

stop.prototype.getLabel = function(){
	if (!this.label) {
		this.label = "Results for : " + this.place.address + " (" + this.place.latlng.toUrlValue(4) + ")";
	}
	return this.label;
};

stop.prototype.getHtmlElems = function () {
	if (!this.htmlElems) {
		//get the parent li
		var recapElem = $("#" + this.id);

		//get the siblings that are linked
		var elems = recapElem.nextUntil("li.recap");

		//include the recap elem
		elems.push(recapElem[0]);

		//store them
		this.htmlElems = elems;
	}
	return this.htmlElems;
};

stop.prototype.clear = function () {
	
	//remove circles
	for (var i = 0; i < this.circles.length; i++) {
		this.circles[i].setMap(null);
	}

	//remove transportlines
	for (var i = 0; i < this.lines.length; i++) {
		this.lines[i].polyline.setMap(null);
	}

	//clear stops from html
	this.getHtmlElems().remove();

}

function transportline(line, linetype, polyline) {
	this.line = line;
	this.linetype = linetype;
	this.polyline = polyline;
}
