/*
*	Main class, contains all logic for the prototype
*	THIS IS A SINGLETON !
*/

var SearchByTransports = function () {

	//private variables and functions

	//page structure
	var mapElem, criteriaElem, placesElem, resultsElem, stopsElem, listingsElem;

	//arrays containing the different objects used
	var maxPlaces = 2, //limited number of search points
		places = [], //our search criteria
		stops = [], //stops found 
		listings = []; //list of listings

	//other global variables
	var map, /*placeInfoWindow, stopInfoWindow*/infoWindow, geocoder,
		MAPFILES_URL = "http://labs.google.com/ridefinder/images/",
		btSearch, frmSearch, selectDuration,
		running = false,
		loader, //TODO : create loader
		bounds;

	var init = function () {

		mapElem = $("#map");
		criteriaElem = $("#criteria");
		placesElem = $("#places");
		resultsElem = $("#results");
		stopsElem = $("#stops");
		listingsElem = $("#listings");
		btSearch = $("#btSearch");
		frmSearch = $("#frmSearch");
		selectDuration = $("#maxminutes");

		//initialize map
		var mapCenter = new google.maps.LatLng(48.88511690174136, 2.3793661053657615); //48.8487, 2.3958); //48.83, 2.36);
		var options = {
			zoom: 16, //12,
			center: mapCenter,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(mapElem[0], options);

		//setup geocoder
		geocoder = new google.maps.Geocoder();

		//map limits 
		bounds = new google.maps.LatLngBounds();

		//setup infoWindow
		infoWindow = new google.maps.InfoWindow({
			maxWidth: 325
		});

		//setup form
		//attach ajax call
		frmSearch.submit(function () {

			if (stops.length > 0) {
				infoWindow.close();
				//easiest way, call clear for each stop
				for (var i = 0; i < stops.length; i++) {
					stops[i].clear();
				}
				stops.length = 0;
			}

			//generate query from places
			var query = generateQueryString();

			$.ajax({
				url: "/Search/GetStopsV2",
				dataType: "json",
				data: query,
				success: function (data) {

					//results for more than one query
					var place, points, html = "", stopId;

					for (var i = 0; i < data.length; i++) {

						place = places[i];
						points = data[i];
						stopId = "recap_" + i;

						html += "<li id=\"" + stopId + "\" class=\"recap\">Results for : " + place.getLabel() + "</li>";

						var point, info, coords, circle, circles = [], blob, _stop, line, transportlines, transportlinesCoords = [];

						for (var y = 0; y < points.length; y++) {

							point = points[y];

							//generate stop description - general description followed by "labels" for each stop
							info = "<i>" + point.duration + " min - " + point.city + " - " + "LatLng: (" + point.lat + ", " + point.long + ")</i><br/>" + point.label;

							//generate html for results view
							html += "<li>" + info + "</li>";

							//create latlng for the stop and store them
							coords = new google.maps.LatLng(point.lat, point.long);
							transportlinesCoords.push(coords);

							//create circle for each stopoint, use heatmap scale to vary opacity and size by duration
							blob = heatmapScale.getHeatmapValues(parseInt(selectDuration.val()), parseInt(point.duration));
							circle = new google.maps.Circle({ //TODO : do we need to create a new object each time ? 
								strokeColor: i == 0 ? "#FF0000" : "#00FF00",
								strokeOpacity: 0.50,
								strokeWeight: 1,
								fillColor: i == 0 ? "#FF0000" : "#00FF00",
								fillOpacity: blob.opacity, //0.50  this seems to be the minimum value for a single circle to be visible 
								map: map,
								center: coords,
								radius: blob.size * 5,
								title: info
							});
							circles.push(circle);

							//attach click event to show window info
							google.maps.event.addListener(circle, "click", showInfo);

							//add coords to bounds
							bounds.extend(coords);

							/*
								transportlines [
									line : line, linetype, coords[]
								]
							*/


						}

						//TODO :	TEST adding a polyline containing all of the coords, it should result in a MAP of the different lines
						//			Doesn't work... snif... anyway the interest would to be show DIFFERENT lines 
						transportlines = new google.maps.Polyline({
							path: transportlinesCoords,
							strokeColor: "#0000FF",
							strokeOpacity: 1.0,
							strokeWeight: 2/*, TODO : en cours de dev
							map: map*/
						});

						/*
						//TODO : BUILD a JSON object to represent the lines, use linetype + line as unique key to build a list of coords that may be used to create a polyline
							var map = new Object();
							map["Danone"] = new Object();
							map["Danone"]["Biens"] = "10";
							map["Danone"]["Services"] = "20";
							map["Nestlé"] = new Object();
							map["Nestlé"]["Biens"] = "25";
							map["Nestlé"]["Services"] = "11";
							alert(map["Danone"]["Biens"]); // 10
							alert(map["Nestlé"]["Services"]); // 11
						*/

						//create and store final object
						_stop = new stop(stopId, place, circles, transportlines);
						stops.push(_stop);

					}

					//show results
					stopsElem.append(html);

					//show "fit" button 

				},
				error: function (xhr, settings, exception) {
					//TODO 
				}
			});

			return false;
		});

		var generateQueryString = function () {
			var qs = "places=";
			for (var i = 0; i < places.length; i++) {
				qs += (i == 0 ? "" : ",") + places[i].getQuery();
			}
			qs += "&maxminutes=" + selectDuration.val();

			//transport modes
			qs += "&" + $("#criteria").find(":checkbox").serialize();

			return qs;
		}

		//setup click handler allowing the addition of search points
		google.maps.event.addListener(map, "click", addPlace);

		//click handler for deleting places when we click on them
		placesElem.delegate("a", "click", removePlace);

		//click handler for showing the infowindow for the clicked "stop" or "place"
		placesElem.delegate("li", "click", showInfo); //TODO : conflict between "see" and "delete" handlers, create a specifique delete button and attach to it, leave "see" on the li
		stopsElem.delegate("li", "click", showInfo);

		//event to hide windows
		google.maps.event.addListener(map, "click", function () {
			infoWindow.close();
		});

		//deactivate/activate button
		toggleSearchButton();
	}

	var addPlace = function (evt) {

		//if any process is running make them wait
		if (running) {
			return false;
		} else {
			running = true;
		}

		//Test that we haven't already reached the max number of places
		if (places.length == maxPlaces) {
			alert("You've reached the limit of places");
			return false;
		}

		var coords = evt.latLng;

		var isFirst = placesElem.find("li.first").length == 0 ? true : false;


		//TODO : update google maps API, the geocode doesn't work anymore :/
		//get address for the coords and update list
		var pos = new google.maps.LatLng(coords.lat(),coords.lng());
		geocoder.geocode({ "latLng":  pos}, function (results, status) {

		
		//geocoder.geocode({ "latLng": coords }, function (results, status) {

			if (status == google.maps.GeocoderStatus.OK && results.length > 0) {

				var address = results[0].formatted_address;

				var m = new google.maps.Marker({
					position: coords,
					map: map,
					title: address + " (" + coords.toUrlValue(4) + ")",
					icon: MAPFILES_URL + (isFirst ? "mm_20_gray.png" : "mm_20_black.png")
				});
				/*
				//attach click event to show window info
				google.maps.event.addListener(m, "click", showInfo);
				*/
				//create html for the place, insert it, and send back the DOM element
				var html = "<li" + (isFirst ? " class=first" : "") + ">" + address + " (" + coords.toUrlValue(4) + ") <a href=\"#\">delete</a></li>";
				var elem = placesElem.append(html).find("li:last")[0];

				//create final place object and store it
				var p = new place(coords, address, m, elem);
				places.push(p);
				
				//deactivate/activate button
				toggleSearchButton();

				running = false;

			} else {

				running = false;
				alert("Geocode was not successful for the following reason: " + status);

			}

		});

	}

	var removePlace = function () {

		infoWindow.close();

		//find the place object that matchs the clicked elem
		var placeToRemove = null;
		var elemLi = $(this).parent("li")[0];
		for (var i = 0; i < places.length; i++) {
			if (places[i].htmlElem == elemLi) {
				placeToRemove = { index: i, place: places[i] };
				break;
			}
		};

		//clear IHM
		placeToRemove.place.clear();

		//remove place from the array
		places.splice(placeToRemove.index, 1);

		//find stop object
		var stopToRemove = null;
		for (var i = 0; i < stops.length; i++) {
			if (stops[i].place == placeToRemove.place) {
				stopToRemove = { index: i, stop: stops[i] };
				break;
			}
		}

		//If stops exist for the place, remove results found and polylines 
		if (stopToRemove) {

			infoWindow.close();

			//clear IHM
			stopToRemove.stop.clear();

			//remove stop from the array
			stops.splice(stopToRemove.index, 1);

		}


		transportlines.setMap(null);

		//deactivate/activate button
		toggleSearchButton();

		//avoid triggering showinfo
		return false;
	}

	var showInfo = function () {

		var t = $(this);
		if (this.nodeType && t.is("li")) {
			var text = t.html().replace("delete", "").replace("Results for : ", "");
			var latlng = getLatLngFromTitle(text);
			infoWindow.setContent(text);
			infoWindow.setPosition(latlng);
			infoWindow.open(map);
		} else {
			//infoWindow.setContent(this.getTitle()); the method getTitle doesn't exist for the circle (marker only) but the attribute exists so we can use "this.title"
			infoWindow.setContent(this.title);
			var latlng = this.getCenter();
			infoWindow.setPosition(latlng);
			infoWindow.open(map); //, this);
		}

	}

	function getLatLngFromTitle(str) {

		var start = str.lastIndexOf('(') + 1;
		var end = str.lastIndexOf(')');
		var strLatLng = str.substring(start, end);
		var arr = strLatLng.split(',');

		return new google.maps.LatLng(parseFloat(arr[0]), parseFloat(arr[1]));
	}

	var toggleSearchButton = function () {
		if (places.length > 0) {
			btSearch[0].disabled = false;
		} else {
			btSearch[0].disabled = true;
		}
	}

	var fitInMap = function () {
		infoWindow.close();
		map.fitBounds(bounds);
	}

	//make certain functions public
	return {
		init: init,
		fitInMap: fitInMap
	}

} ();