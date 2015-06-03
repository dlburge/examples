<%@ Import Namespace="SquishIt.Framework" %>
<%@ Page Language="C#" Inherits="System.Web.Mvc.ViewPage" %>

<!DOCTYPE html>
<head>
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <title>Prototype API Moviken</title>
	<style type="text/css">
		html { height:100%; }
		body { height:100%; margin:0; padding:0; }
		#sidebar { float: left; width: 25%; height:100%; overflow-y:scroll;}
		#map { height:100%; }
		#places 
		{
			margin : 5px 0;
			padding : 5px 0;
		}
		#places li
		{
			padding : 5px 0 25px 30px;
			list-style : none;
			background : transparent url(http://maps.gstatic.com/intl/en_us/mapfiles/marker_black.png) 0 0 no-repeat;
		}
		#places li.first {
			background : transparent url(http://maps.gstatic.com/intl/en_us/mapfiles/marker_grey.png) 0 0 no-repeat;
		}
		
		#results li 
		{
			padding-bottom: 5px; 
			padding-top:5px; 
		}
		
		#results li.recap 
		{
			list-style: none outside none; 
			margin-left: -35px;
			font-weight:bold;
		}
		
	</style>
</head>
<body>
	
	<div id="sidebar">
		
		<!-- DEBUT : Criteria -->
		<div id="criteria">
			<h1>Recherche par temps de transports en commun</h1>
			<form action="/search/v2" id="frmSearch">
				<fieldset>
					<span>Click on the map to add search points, 2 maximum</span>
					<ul id="places"></ul>
					<select name="maxminutes" id="maxminutes">
						<option value="15">less than 15 minutes</option>
						<option value="30">less than 30 minutes</option>
						<option value="45">less than 45 minutes</option>
						<option value="60">less than 1 hour</option>
						<option value="75">less than 1 hour 15 minutes</option>
						<option value="90">less than 1 hour 30 minutes</option>
					</select>
					<br />
					<br />
					
					<span>Modes de transport</span>
					<br />
					<input checked="checked" type="checkbox" name="metro" id="metro" /> <label for="metro">Métro</label>

					<input checked="checked" type="checkbox" name="rer" id="rer" /><label for="rer">RER</label>
					<input checked="checked" type="checkbox" name="train" id="train" /><label for="train">Train</label>
					<!-- TODO : for realistic results combine train and RER
					<input checked="checked" type="checkbox" name="rertrain" id="rertrain" /> <label for="rertrain">RER/Train</label>
					-->
					
					<input checked="checked" type="checkbox" name="bus" id="bus" /> <label for="bus">Bus</label>
					<input checked="checked" type="checkbox" name="tramway" id="tramway" /> <label for="tramway">Tramway</label>
					<br />
					<input type="checkbox" name="coach" id="coach" /><label for="coach">Autocar</label>
					<input type="checkbox" name="boat" id="boat" /><label for="boat">Bateau</label>
					<input type="checkbox" name="funicular" id="funicular" /><label for="funicular">Funiculaire</label>
					<br /><br />

					<button id="btSearch" type="submit">Search for public transportation stops</button>
				</fieldset>
			</form>
		</div>
		<!-- FIN : Criteria -->

		<!-- DEBUT : Results -->
		<div id="results">
			
			<a href="#" onclick="SearchByTransports.fitInMap();">Fit all on carte</a>

			<ul id="stops">
			</ul>
			<ul id="listings">
			</ul>
		</div>
		<!-- FIN : Results -->

	</div>

	<!-- DEBUT : Map -->
	<div id="map">
		MAP GOES HERE
	</div>
	<!-- FIN : Map -->
	<%= Bundle.JavaScript()
		.Add("~/Content/Js/jquery-1.6.2.js")
		.Add("~/Content/Js/classes.js")
		.Add("~/Content/Js/heatmapScale.js")
		.Add("~/Content/Js/PrototypeApiMoviken.js")
		//.ForceRelease()
		.Render("~/Content/Js/combined_#.js")
	%>
	<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?sensor=false"></script>
	<!--script type="text/javascript" src="https://www.google.com/jsapi"></script-->

	<script type="text/javascript">
	// <![CDATA[
		$(document).ready(function () {

			//google.load("maps", "2", { "callback": SearchByTransports.init() });

			SearchByTransports.init();
		});
	// ]]>
	</script>
</body>
</html>