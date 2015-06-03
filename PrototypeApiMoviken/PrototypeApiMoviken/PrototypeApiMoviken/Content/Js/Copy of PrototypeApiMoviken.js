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
		listings = [] //list of listings

	//other global variables
	var map, /*placeInfoWindow, stopInfoWindow*/ infoWindow, geocoder,
		MAPFILES_URL = "http://labs.google.com/ridefinder/images/",
		btSearch, frmSearch, selectDuration,
		running = false,
		loader; //TODO : create loader

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
		var mapCenter = new google.maps.LatLng(48.83, 2.36);
		var options = {
			zoom: 12,
			center: mapCenter,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(mapElem[0], options);

		//////////////////////////////////////////////////////////////////////////////
		/*
		//show limitations of the API : THIS WILL BE DELETED IN FINAL VERSION
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
		google.maps.event.addListener(searchLimits, "click", addPlace);
		*/
		//////////////////////////////////////////////////////////////////////////////

		//setup geocoder
		geocoder = new google.maps.Geocoder();

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
						points = data[i].stoppoints.stoppoint;
						stopId = "recap_" + i;

						html += "<li id=\"" + stopId + "\" class=\"recap\">Results for : " + place.getLabel() + "</li>";
						//107 Rue de Charonne, 75011 Paris, France (48.8547,2.3847)

						var point, info, coords, marker, markers = [], polygon, polygonCoords = [];

						for (var y = 0; y < points.length; y++) {

							point = points[y];

							//generate stop description
							//info = point.network + " - " + getLineType(point.linetype) + " " + point.line + " - " + point.name + " - " + point.city + " - " + "Lat: " + point.lat + ", Long: " + point.long + " - " + "Duration: " + point.duration + " min";
							//RATP - Métro Ligne 9 - Charonne - Paris - Lat: 48.855137, Long: 2.384597 - Duration: 0 min

							info = point.network + " - " + getLineType(point.linetype) + " " + point.line + " - " + point.name + " - " + point.city + " - " + "LatLng: (" + point.lat + ", " + point.long + ") - " + "Duration: " + point.duration + " min";

							//generate html for results view
							html += "<li>" + info + "</li>";

							//create latlng for the stop and store them
							coords = new google.maps.LatLng(point.lat, point.long);
							polygonCoords.push(coords);

							//create marker for each stoppoint, being careful to use the right icon 
							marker = new google.maps.Marker({
								position: coords,
								map: map,
								title: info,
								icon: i == 0 ? MAPFILES_URL + "mm_20_red.png" : MAPFILES_URL + "mm_20_green.png"
							});

							markers.push(marker);

							//attach click event to show window info
							google.maps.event.addListener(marker, "click", showInfo);

						}

						//sort coords before creating polygon
						coords = sortLatLng.sort(polygonCoords);

						//create polygon
						polygon = new google.maps.Polygon({
							strokeColor: i == 0 ? "#FF0000" : "#00FF00",
							strokeOpacity: 0.8,
							strokeWeight: 2,
							fillColor: i == 0 ? "#FF0000" : "#00FF00",
							fillOpacity: 0.35,
							geodesic: true
						});
						polygon.setPaths(polygonCoords); //how do we "order" the coords ?

						//show polygon
						polygon.setMap(map);

						//create and store final object
						var st = new stop(stopId, place, markers, polygon);
						stops.push(st);

					}

					//show results
					stopsElem.append(html);

				},
				error: function (xhr, settings, exception) {
					//TODO
					var y = "y";
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

		//get address for the coords and update list
		geocoder.geocode({ "latLng": coords }, function (results, status) {

			if (status == google.maps.GeocoderStatus.OK && results.length > 0) {

				var address = results[0].formatted_address;

				var m = new google.maps.Marker({
					position: coords,
					map: map,
					title: address + " (" + coords.toUrlValue(4) + ")",
					icon: MAPFILES_URL + (isFirst ? "mm_20_gray.png" : "mm_20_black.png")
				});

				//attach click event to show window info
				google.maps.event.addListener(m, "click", showInfo);

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

		//If stops exist for the place, remove results found and polygons 
		if (stopToRemove) {

			infoWindow.close();

			//clear IHM
			stopToRemove.stop.clear();

			//remove stop from the array
			stops.splice(stopToRemove.index, 1);

		}

		//deactivate/activate button
		toggleSearchButton();

		//avoid triggering showinfo
		return false;
	}

	var showInfo = function () {

		var t = $(this);
		if (this.nodeType && t.is("li")) {
			var text = t.text().replace("delete", "").replace("Results for : ", "");
			var latlng = getLatLngFromTitle(text);
			infoWindow.setContent(text);
			infoWindow.setPosition(latlng);
			infoWindow.setOptions({
				//pixelOffset: new google.maps.Size(0, -34)
				pixelOffset: new google.maps.Size(0, -20)
			});
			infoWindow.open(map);
		} else {
			infoWindow.setContent(this.getTitle());
			infoWindow.setOptions({
				pixelOffset: new google.maps.Size(0, 0)
			});
			infoWindow.open(map, this);
		}

	}

	function getLatLngFromTitle(str) {

		var start = str.lastIndexOf('(') + 1;
		var end = str.lastIndexOf(')');
		var strLatLng = str.substring(start, end);
		var arr = strLatLng.split(',');

		return new google.maps.LatLng(parseFloat(arr[0]), parseFloat(arr[1]));
	}

	function getLineType(type) {
		switch (type) {
			case "T":
				return "Train";
			case "R":
				//return "RER"; 
				return ""; //The linetype is included in the the station name for RER stations 
			case "M":
				return "Métro";
			case "W":
				return "Tramway";
			case "C":
				return "Autocar";
			case "B":
				return "Bus";
			case "F":
				return "Funiculaire";
			case "O":
				return "Bateau";
			default:
				return null;
		}
	}

	var toggleSearchButton = function () {
		if (places.length > 0) {
			btSearch[0].disabled = false;
		} else {
			btSearch[0].disabled = true;
		}
	}

	//make certain functions public
	return {
		init: init
	}

} ();