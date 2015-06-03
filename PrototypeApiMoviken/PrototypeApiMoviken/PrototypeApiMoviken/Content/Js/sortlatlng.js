/*
*	Class for sorting an array of google maps latlng coordinates, google maps api is necessary 
*	and must be loaded before
*	IMPORTANT : THIS IS A SINGLETON !
*/

/////////////////////////////////////////////////////
// Extend google latlng class to allow for sorting
////////////////////////////////////////////////////
google.maps.LatLng.prototype.x = function () {
	return (this.lng() + 180) * 360; //NOT SURE THIS IS NEEDED
};

google.maps.LatLng.prototype.y = function () {
	return (this.lat() + 90) * 180; //NOT SURE THIS IS NEEDED
};

google.maps.LatLng.prototype.distance = function (point) {
	var dX = point.x() - this.x();
	var dY = point.y() - this.y();
	return Math.sqrt((dX * dX) + (dY * dY));
};

google.maps.LatLng.prototype.slope = function (point) {
	var dX = point.x() - this.x();
	var dY = point.y() - this.y();
	return dY / dX;
};

/**	Class for sorting an array of google maps latlng coordinates, google maps api is necessary *	and must be loaded before*	IMPORTANT : THIS IS A SINGLETON !*/
var sortLatLng = {

	referencePoint : null,
	points : [],

	//function determining the "highest/left" latlng in an array
	findReferencePoint : function () {
		var top = this.points[0];
		for (var i = 1; i < this.points.length; i++) {
			var temp = this.points[i];
			if (temp.y() > top.y() || (temp.y() == top.y() && temp.x() < top.x())) {
				top = temp;
			}
		}
		this.referencePoint = top;
	},

	// Sort function that sorts p1 and p2 (latlng coords) based on the slope
	// formed between it and a reference point
	compareLatLng : function (p1, p2) {

		// Exclude the "referencePoint" point from the sort (which should come first).
		if (p1 == sortLatLng.referencePoint) return -1;
		if (p2 == sortLatLng.referencePoint) return 1;

		// Find the slopes of "p1" and "p2" when a line is 
		// drawn from those points through the "referencePoint" point.
		var m1 = sortLatLng.referencePoint.slope(p1);
		var m2 = sortLatLng.referencePoint.slope(p2);

		// "p1" and "p2" are on the same line towards "referencePoint".
		if (m1 == m2) {
			// The point closest to "referencePoint" will come first.
			return p1.distance(sortLatLng.referencePoint) < p2.distance(sortLatLng.referencePoint) ? -1 : 1;
		}

		// If "p1" is to the right of "referencePoint" and "p2" is the the left.
		if (m1 <= 0 && m2 > 0) return -1;

		// If "p1" is to the left of "referencePoint" and "p2" is the the right.
		if (m1 > 0 && m2 <= 0) return 1;

		// It seems that both slopes are either positive, or negative.
		return m1 > m2 ? -1 : 1;
	},

	sort : function(arrLatLng) {

		this.points = arrLatLng;

		//find reference point
		this.findReferencePoint();

		//call sort method
		return this.points.sort(this.compareLatLng);

	}

}