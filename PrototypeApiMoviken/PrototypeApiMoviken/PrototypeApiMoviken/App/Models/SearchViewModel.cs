using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PrototypeApiMoviken.App.Models
{
	//TODO : this is not yet used

	/// <summary>
	/// View model for the search engine
	/// </summary>
	public class SearchViewModel
	{

		private static string KEY = "u7atumaz";

		/// <summary>
		/// Constructor for the SearchViewModel
		/// Returns : class SearchViewModel
		/// </summary>
		public SearchViewModel() { }

		//criteria
		public string MovikenKey { 
			get 
			{
				return KEY;
			}
		}

		public DateTime DepartureTime
		{
			//Use default value for now
			get
			{
				return DateTime.Now;
			}
			//set; not settable for now
		}

		public string[] Addresses { get; set; }
		
		public string[] Stations { get; set; }
		
		//long, lat
		public IEnumerable<Tuple<int, int>> coords { get; set; }

		//TODO : other search criteria

		//map
		public string StopPointsJSON { get; set; }

		//results
		//TODO : the listings that match the search zone

	}

}