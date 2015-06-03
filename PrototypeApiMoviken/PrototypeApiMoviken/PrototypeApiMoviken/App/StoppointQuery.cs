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

namespace PrototypeApiMoviken.App
{
	
	public class StoppointResults
	{

		public IList<MergedStoppoint> MergedStops { get; set; }

		//Number of stops found (count before merge)
		public int Count
		{
			get; set;
		}

	}


	public class StoppointResultsList : StoppointResults 
	{
		public StoppointTop stoppoints { get; set; }

		public void MergeStoppoints()
		{

			//list of non-merged stops, the original
			IList<Stoppoint> stops = this.stoppoints.stoppoint;

			//set count for the number of non-merged stops
			this.Count = stops.Count;

			//list of merged stops, our results
			Dictionary<string, MergedStoppoint> merged = new Dictionary<string, MergedStoppoint>();

			//Unique key for each stop, used to identify duplicates
			string stopPointKey;

			foreach (Stoppoint stop in stops)
			{

				//generate key for first item

				//the latlng values are VERY precise, round them to X places after the decimal when grouping

				stopPointKey = Math.Round(stop.lat, 3).ToString() + Math.Round(stop.@long, 3).ToString() + stop.duration.ToString();

				//check if the key exists in "merged", add "stop" to the existing merged object
				if (merged.ContainsKey(stopPointKey))
				{
					merged[stopPointKey].duplicates.Add(stop);
				}

				//create the merged object and stock it 
				else
				{
					//creation
					MergedStoppoint mergedStoppoint = new MergedStoppoint()
					{
						lat = Math.Round(stop.lat, 3),
						@long = Math.Round(stop.@long, 3),
						duration = stop.duration,
						city = stop.city,
						duplicates = new List<Stoppoint>()
					};
					mergedStoppoint.duplicates.Add(stop);

					//stock it
					merged.Add(stopPointKey, mergedStoppoint);
				}

			}

			//store our merged results
			this.MergedStops = merged.Values.ToList();

		}
		
	}

	public class StoppointResultsSingle : StoppointResults 
	{
		public StoppointTopSingle stoppoints { get; set; }

		public void MergeStoppoints() {

			Stoppoint stop = this.stoppoints.stoppoint;

			this.Count = (stop == null) ? 0 : 1;

			//list of merged stops, our results
			Dictionary<string, MergedStoppoint> merged = new Dictionary<string, MergedStoppoint>();

			//Unique key for each stop, used to identify duplicates
			//the latlng values are VERY precise, round them to X places after the decimal when grouping
			string stopPointKey = Math.Round(stop.lat, 3).ToString() + Math.Round(stop.@long, 3).ToString() + stop.duration.ToString();

			//creation - using rounded lat/lng might be creating a decalage with the tiles of google maps (TODO : check !)
			MergedStoppoint mergedStoppoint = new MergedStoppoint()
			{
				lat = Math.Round(stop.lat, 3),
				@long = Math.Round(stop.@long, 3),
				duration = stop.duration,
				city = stop.city,
				duplicates = new List<Stoppoint>()
			};
			mergedStoppoint.duplicates.Add(stop);

			//stock it
			merged.Add(stopPointKey, mergedStoppoint);

			//store our merged results
			this.MergedStops = merged.Values.ToList();
		}

	}

}