using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Net;
using System.IO;
using System.Web.Script.Serialization;
using System.Collections.Specialized;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;


/*
C:\Program Files\Reference Assemblies\Microsoft\Framework\Silverlight\v3.0\System.ServiceModel.Web.dll
C:\Program Files\Reference Assemblies\Microsoft\Framework\Silverlight\v3.0\System.Runtime.Serialization.dll
*/

namespace PrototypeApiMoviken.App.Controllers
{
    public class SearchController : Controller
    {

		
		//search page
		[CompressFilter(Order = 1)]
		[CacheFilter(Duration = 60, Order = 2)]
		public ActionResult V2()
		{
			return View();
		}

		//get data from moviken
		[CompressFilter(Order = 1)]
		[CacheFilter(Duration = 10, Order = 2)]
		public ActionResult GetStopsV2()
		{

			//parse qs and create requete for each place
			var qs = this.HttpContext.Request.QueryString;

			var queries = getApiQueries(qs);

			var results = new List<object>();

			//do each api call
			//TODO -	test if cutting the request into several "simpler" requests (cut by duration time, r1 = 0-15 minutes, r2=15-30 minutes, etc.)
			//			is more effecient or not (parallel request and aggregation might take longer than one request)
			foreach (string query in queries)
			{
				//create query object
				HttpWebRequest movikenApiRequest = HttpWebRequest.Create(query) as HttpWebRequest;
				movikenApiRequest.Method = WebRequestMethods.Http.Get;
				movikenApiRequest.Accept = "application/json";
				movikenApiRequest.ContentType = "application/json; charset=utf-8";

				
				// Get response
				JavaScriptSerializer JSS = new JavaScriptSerializer();

				string json = string.Empty;
				using (HttpWebResponse response = movikenApiRequest.GetResponse() as HttpWebResponse)
				{
					// Get the response stream  
					StreamReader reader = new StreamReader(response.GetResponseStream());

					//Get text
					json = reader.ReadToEnd();
				}

				//TODO : determine which object to cast to, do the merge accordingly
				if (json.Contains('[') && json.Contains(']')) //contains multiple results in an array
				{

					//convert the JSON string to an object
					var stops = JSS.Deserialize<StoppointResultsList>(json);

					//merge duplicates => WE ARE NOW USING MERGED STOPS AND NOT THE ORIGINAL
					stops.MergeStoppoints();

					//store results from request, ONLY SENDING BACK THE MERGED POINTS (TODO : we can optimize our objects)
					results.Add(stops.MergedStops);
				}
				else //either 1 or 0 results TODO : detect and handle empty results
				{
					var stops = JSS.Deserialize<StoppointResultsSingle>(json);

					//put the single result in a list for treatment client-side
					stops.MergeStoppoints();

					//store results from request
					results.Add(stops.MergedStops);
				}

				
			}

			return Json(results, JsonRequestBehavior.AllowGet);

		} 

		private string[] getApiQueries(NameValueCollection querystring){

			var maxminutes = querystring.GetValues("maxminutes").FirstOrDefault() ?? "15";

			//http://localhost:64846/Search/GetStopsV2?places=48.889630535073316|2.338542327880873&maxminutes=15&
			
			//transport modes
			
			var metro = querystring.GetValues("metro") != null ? "" : "&metro=no";
			var rer = querystring.GetValues("rer") != null ? "" : "&rer=no";
			var train = querystring.GetValues("train") != null ? "" : "&train=no";
			
			//for realistic results combine train and RER
			//var rertrain = querystring.GetValues("rertrain") != null ? "" : "&rer=no&train=no";
			var bus = querystring.GetValues("bus") != null ? "" : "&bus=no";
			var tramway = querystring.GetValues("tramway") != null ? "" : "&tramway=no";
			var coach = querystring.GetValues("coach") != null ? "" : "&coach=no";
			var boat = querystring.GetValues("boat") != null ? "" : "&boat=no";
			var funicular = querystring.GetValues("funicular") != null ? "" : "&funicular=no";
			
			//Todays date, at 8am
			var dt = DateTime.Today.AddHours(8);

			var baseUrl = "http://api.itransports.fr/transports/get_stoppoints_isochrone/?key=u7atumaz&return=json&date=" 
				//+ String.Format("{0:s}", DateTime.Now)		=> We need to decide a set time for the request, else the results change 
				+ String.Format("{0:s}", dt)				
				+ "&maxminutes=" + maxminutes
				+ metro
				+ "&" + rer
				+ "&" + train
				//+ rertrain
				+ bus
				+ tramway
				+ coach
				+ boat
				+ funicular;

			var places = querystring.GetValues("places").FirstOrDefault().Split(',');
			string[] queries = new string[places.Length];

			for (var i = 0; i < queries.Length; i++)
			{
				var latlng = places[i].Split('|'); 
				queries[i] = baseUrl + "&latitude=" + latlng[0] + "&longitude=" + latlng[1];
			}

			return queries;
		}

    }
}
