<%@ Page Language="C#" Inherits="System.Web.Mvc.ViewPage" %>

<!DOCTYPE html>
<head>
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <title>Prototype API Moviken</title>
	<script type="text/javascript" src="../../Content/Js/jquery-1.6.2.js"></script>
	<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?sensor=false"></script>
	<script type="text/javascript">
	// <![CDATA[
		var map = null;
		var geocoder = null;

		var btSearch = null;
		var frmSearch = null;

		var results = null;

		var searchPoints = [];
		var maxSearchpoints = 2;

		var stopInfoWindow = null;
		var stopmarker;
		
		var stopsPolygonCoords = [];
		var stopsPolygon;
		var polygons = [];
		var markers = [];

		//var MAPFILES_URL = "http://maps.gstatic.com/intl/en_us/mapfiles/";
		var MAPFILES_URL = "http://labs.google.com/ridefinder/images/";
		
		////////////////////////////////////////////////
		// Extend google latlng class to allow sorting
		////////////////////////////////////////////////
		google.maps.LatLng.prototype.x = function() {
			return (this.lng() + 180) * 360; //NOT SURE THIS IS NEEDED
		}

		google.maps.LatLng.prototype.y = function() {
			return (this.lat() + 90) * 180; //NOT SURE THIS IS NEEDED
		}

		google.maps.LatLng.prototype.distance = function(point) {
			var dX = point.x() - this.x();
			var dY = point.y() - this.y();
			return Math.sqrt((dX * dX) + (dY * dY));
		}

		google.maps.LatLng.prototype.slope = function (point) {
			var dX = point.x() - this.x();
			var dY = point.y() - this.y();
			return dY / dX;
		}

		//function determining the "highest/left" latlng in an array
		function getUpperLeftPoint(points) {
			var top = points[0];
			for (var i = 1; i < points.length; i++) {
				var temp = points[i];
				if (temp.y() > top.y() || (temp.y() == top.y() && temp.x() < top.x())) {
					top = temp;
				}
			}
			return top;
		}

		// A custom sort function that sorts p1 and p2 (latlng coords) based on the slope
		// formed between it and a reference point
		var referencePoint;
		function sortLatLng(p1, p2) {
			// Exclude the "referencePoint" point from the sort (which should come first).
			if (p1 == referencePoint) return -1;
			if (p2 == referencePoint) return 1;

			// Find the slopes of "p1" and "p2" when a line is 
			// drawn from those points through the "referencePoint" point.
			var m1 = referencePoint.slope(p1);
			var m2 = referencePoint.slope(p2);

			// "p1" and "p2" are on the same line towards "referencePoint".
			if (m1 == m2) {
				// The point closest to "referencePoint" will come first.
				return p1.distance(referencePoint) < p2.distance(referencePoint) ? -1 : 1;
			}

			// If "p1" is to the right of "referencePoint" and "p2" is the the left.
			if (m1 <= 0 && m2 > 0) return -1;

			// If "p1" is to the left of "referencePoint" and "p2" is the the right.
			if (m1 > 0 && m2 <= 0) return 1;

			// It seems that both slopes are either positive, or negative.
			return m1 > m2 ? -1 : 1;
		}

		////////////////////////////////////////////////

		function initialize() {
			
			var container = $("#map");

			//REAL paris center point : new google.maps.LatLng(48.8566, 2.3522)
			//Point that we may use with api due to limitations linked with test case : new google.maps.LatLng(48.83, 2.36)

			var mapCenter = new google.maps.LatLng(48.83, 2.36); //center on paris = Latitude = 48.8566, Longitude = 2.3522 
			var options = {
				zoom: 12,
				center: mapCenter,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			map = new google.maps.Map(container[0], options);

			stopInfoWindow = new google.maps.InfoWindow({
				maxWidth: 325
			});

			//PARIS
			/*
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(48.8566, 2.3522),
				map: map
			});
			*/

			//mark center of map (not center of limitation)
			/*
			var mapCenterMarker = new google.maps.Marker({
				position: mapCenter,
				map: map,
				icon: MAPFILES_URL + "mm_20_gray.png"
			});
			*/

			// add polygon marking limitations of API
			var searchLimitsCoords = [
				new google.maps.LatLng(48.83, 2.36),
				new google.maps.LatLng(48.83, 4.16),
				new google.maps.LatLng(50, 4.16),
				new google.maps.LatLng(50, 2.36),
			];

			var searchLimits = new google.maps.Polygon({
				paths: searchLimitsCoords,
				strokeColor: "#666666",
				strokeOpacity: 1,
				strokeWeight: 2,
				fillColor: "#FFFFFF",
				fillOpacity: 0
			});

			searchLimits.setMap(map);

			geocoder = new google.maps.Geocoder();

			//setup click handler allowing the addition of search points
			google.maps.event.addListener(map, "click", addSearchPoints);
			google.maps.event.addListener(searchLimits, "click", addSearchPoints);
			
			//event to hide window
			google.maps.event.addListener(map, "click", function () {
				stopInfoWindow.close();
			});
			
			$("#searchpoints").delegate("li", "click", function () {
				removeSearchPoint($(this));
			});
			
			//initialize form
			btSearch = $("#btSearch");
			frmSearch = $("#frmSearch");

			results = $("#results ul");
			results.delegate("li", "click", showStopInfo);

			//attach ajax call
			frmSearch.submit(function () {

				//clear previous results
				results.empty();
				//map.

				if (polygons.length > 0) {
					for (var i = 0; i < polygons.length; i++) {
						polygons[i].setMap(null);
					}
					polygons.length = 0;
				}

				if (markers.length > 0) {
					for (var i = 0; i < markers.length; i++) {
						markers[i].setMap(null);
					}
					polygons.length = 0;
				}

				//query params (ie the addresses selected)
				//launch request for each "query" 
				var query = generateQuery();
				for (var i = 0; i < query.length; i++) {
					getStopPoints(query[i], i);
				}

				return false;
			});

			toggleSearchButton();
		}
		
		function getStopPoints(query, count) {

			$.ajax({
				url: "/Search/GetStops",
				dataType: "json",
				data: query.query,
				success: function (data) {
					//treat data
					var html = "<li style=\"list-style: none outside none; padding-bottom: 5px; padding-top:5px; margin-left: -35px;\"><b>Results for : " + query.title + "</b></li>";
					var points = data.stoppoints.stoppoint;
					var stopinfo = "";
					var c;

					for (var i = 0; i < points.length; i++) {

						//generate stop description
						stopinfo = points[i].network + " - " + getLineType(points[i].linetype) + " " + points[i].line + " - " + points[i].name + " - " + points[i].city + " - " + "Lat: " + points[i].lat + ", Long: " + points[i].long + " - " + "Duration: " + points[i].duration + " min";

						//get coords
						c = new google.maps.LatLng(points[i].lat, points[i].long);

						stopsPolygonCoords.push(c);

						//create marker for each stoppoint 
						stopmarker = new google.maps.Marker({
							position: c,
							map: map,
							title: stopinfo,
							icon: count == 0 ? MAPFILES_URL + "mm_20_red.png" : MAPFILES_URL + "mm_20_green.png"
						});

						markers.push(stopmarker);

						//attach click event to show window info
						google.maps.event.addListener(stopmarker, "click", showStopInfo);


						//generate html for results view
						html += "<li>" + stopinfo + "</li>";
					}

					//show results
					results.append(html);

					//attach click event to show window info
					google.maps.event.addListener(stopmarker, "click", showStopInfo);

					//Sort polygon coords
					referencePoint = getUpperLeftPoint(stopsPolygonCoords);
					stopsPolygonCoords.sort(sortLatLng);

					//create polygon
					stopsPolygon = new google.maps.Polygon({
						strokeColor: count == 0 ? "#FF0000" : "#00FF00",
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: count == 0 ? "#FF0000" : "#00FF00",
						fillOpacity: 0.35,
						geodesic: true
					});
					stopsPolygon.setPaths(stopsPolygonCoords); //how do we "order" the coords ?

					polygons.push(stopsPolygon);

					//show polygon
					stopsPolygon.setMap(map);

				},
				error: function (xhr, settings, exception) {
					//TODO
				}
			});

		}

		function generateQuery() {
			var arrParams = [];
			var pos;
			for (var i = 0; i < searchPoints.length; i++) {
				pos = searchPoints[i].marker.getPosition();
				arrParams.push({
					title : searchPoints[i].elem.text(),
					query : "latitude=" + pos.lat() + "&longitude=" + pos.lng() + "&maxminutes=" + $("#maxminutes").val()
				});
			}
			return arrParams;
		}

		function showStopInfo() {
			var t = $(this);
			if (this.nodeType && t.is("li")) {
				var text = t.text();
				var latlng = getLatLngFromTitle(text);
				stopInfoWindow.setContent(text);
				stopInfoWindow.setPosition(latlng);
				stopInfoWindow.setOptions({
					pixelOffset: new google.maps.Size(0, -34)
				});
				stopInfoWindow.open(map);
			} else {
				stopInfoWindow.setContent(this.getTitle());
				stopInfoWindow.setOptions({
					pixelOffset: new google.maps.Size(0, 0)
				});
				stopInfoWindow.open(map, this);
			}
		}

		function getLatLngFromTitle(str) {
			var arr = str.split(":");
			return new google.maps.LatLng(parseFloat(arr[1]), parseFloat(arr[2]));
		}

		function getLineType(type) { 
			switch(type)
			{
				case "T" :
					return "Train";
				case "R":
					//return "RER"; 
					return ""; //The linetype is included in the the station name for RER stations 
				case "M" :
					return "Métro"; 
				case "W" :
					return "Tramway"; 
				case "C" :
					return "Autocar"; 
				case "B" :
					return "Bus"; 
				case "F" :
					return "Funiculaire"; 
				case "O" :
					return "Bateau";
				default:
					return null;
			}
		}

		
		function addSearchPoints(e) {

			//Test that we haven't already reached the max
			if(searchPoints.length == maxSearchpoints){
				alert("You've reached the limit of searchpoints");
				return false;
			}

			//get the coords
			var coords = e.latLng; 

			//get address for the coords and update list
			geocoder.geocode({"latLng": coords}, function(results, status){
				var address = results[0].formatted_address;
				updateSearchPoints(coords, address);
			});

		}
		
		function updateSearchPoints(coords, address) {
			var list = $("#searchpoints");

			if (list.length < 1)
				return false;

			//add the latest point to the list
			var i = parseInt((coords.lat() + coords.lng()) * 1000);
			var elem = "<li id=\"sp_" + i + "\">" + address + " (" + coords.toUrlValue(4) + ")</li>"; //the toUrlValue method takes a "precision" argument that allows us to control the number of places after the decimal, the default is 6 reducing it allows us to optimize the server time
			list.append(elem);

			//add a marker for the new point
			m = new google.maps.Marker({
				position: coords,
				map: map,
				icon: MAPFILES_URL + "mm_20_gray.png"
			});

			searchPoints.push({
				id:"sp_"+i,
				elem:$("#sp_"+i),
				marker:m
			});

			toggleSearchButton();
		}


		function removeSearchPoint(elem) {
			//get the index
			var id = elem.attr("id");

			//find searchPoint in array
			var toRemove = getSearchPointById(id);

			if (toRemove == null)
				return false;

			//remove the searchpoint from the list
			toRemove.sp.elem.remove();

			//remove the marker from map and array
			toRemove.sp.marker.setMap(null);

			//remove it from the array
			searchPoints.splice(toRemove.index, 1);

			toggleSearchButton();
		}

		function getSearchPointById(id) {
			for (var i = 0; i < searchPoints.length; i++) {
				if (searchPoints[i].id === id)
					return { sp: searchPoints[i], index: i };
			}
			return null;
		}

		function toggleSearchButton() {
			if (searchPoints.length > 0) {
				btSearch[0].disabled = false;
			} else {
				btSearch[0].disabled = true;
			}
		}

		$(document).ready(function () {
			
			//initialize map, etc.
			initialize();

		});

	// ]]>
	</script>
	<style type="text/css">
		html { height:100%; }
		body { height:100%; margin:0; padding:0; }
		#sidebar { float: left; width: 25%; height:100%; overflow-y:scroll;}
		#map { height:100%; }
		
		#criteria ul 
		{
			margin : 5px 0;
			padding : 5px 0;
		}
		#criteria ul li 
		{
			padding : 5px 0 25px 30px;
			background : transparent url(http://maps.gstatic.com/intl/en_us/mapfiles/marker.png) 0 0 no-repeat;
			list-style : none;
		}
	</style>
</head>
<body>
	
	<div id="sidebar">
		
		<!-- DEBUT : Criteria -->
		<div id="criteria">
			
			<h1>Recherche par temps de transports en commun</h1>

			<form action="/search/" id="frmSearch">
				<fieldset>
					<span>5 maximum, Click to remove</span>
					<ul id="searchpoints"></ul>
					<select name="maxminutes" id="maxminutes">
						<option value="15">less than 15 minutes</option>
						<option value="30">less than 30 minutes</option>
						<option value="45">less than 45 minutes</option>
						<option value="60">less than 1 hour</option>
						<option value="75">less than 1 hour 15 minutes</option>
						<option value="90">less than 1 hour 30 minutes</option>
					</select>
					<button id="btSearch" type="submit">Search for public transportation stops</button>
				</fieldset>
			</form>
		</div>
		<!-- FIN : Criteria -->

		<!-- DEBUT : Results -->
		<div id="results">
			<ul>
			</ul>
		</div>
		<!-- FIN : Results -->

	</div>

	<!-- DEBUT : Map -->
	<div id="map">
		MAP GOES HERE
	</div>
	<!-- FIN : Map -->

</body>
</html>