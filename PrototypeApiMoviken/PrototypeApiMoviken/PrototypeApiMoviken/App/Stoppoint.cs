using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Runtime.Serialization;

namespace PrototypeApiMoviken.App
{
	public class StoppointTop 
	{
		public List<Stoppoint> stoppoint { get; set; }
	}

	public class StoppointTopSingle 
	{
		public Stoppoint stoppoint { get; set; }
	}

	public class Stoppoint
	{
		
		public double lat { get; set; }

		public double @long { get; set; }

		public string name { get; set; }

		public string city { get; set; }

		public string line { get; set; }

		public string linetype { get; set; }

		public string network { get; set; }

		public int duration { get; set; }

		public string label { 
			get {
				return this.network + " - " + this.GetLineTypeLabel() + " " + this.line + " - " + this.name;// +" - " + this.city + " - " + "LatLng: (" + this.lat + ", " + this.@long + ") - Duration:" + this.duration + " min"; 
			}
		}

		public string GetLineTypeLabel() 
		{

			switch (this.linetype)
			{
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

	}

	public class MergedStoppoint 
	{

		public double lat { get; set; }

		public double @long { get; set; }

		public int duration { get; set; }

		public string city { get; set; }
		
		public IList<Stoppoint> duplicates { get; set; }

		public string label { 
			get {
				var label = "";
				foreach (Stoppoint stop in this.duplicates) {
					label += string.IsNullOrEmpty(label) ? stop.label : "<br/>" + stop.label;
				}
				return label;
			}
		}

	}

}