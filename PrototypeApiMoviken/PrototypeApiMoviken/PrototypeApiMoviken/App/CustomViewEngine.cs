using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PrototypeApiMoviken.App
{
	/// <summary>
	/// Override the default application root so that we may organize our application the way we want
	/// </summary>
	public class CustomViewEngine : WebFormViewEngine
	{

		public CustomViewEngine() 
		{
			
			MasterLocationFormats = new[] 
			{
				"~/App/Views/{1}/{0}.master",
				"~/App/Views/Shared/{0}.master"
			};

			ViewLocationFormats = new[] 
			{ 
				"~/App/Views/{1}/{0}.aspx", 
                "~/App/Views/{1}/{0}.ascx", 
                "~/App/Views/Shared/{0}.aspx", 
                "~/App/Views/Shared/{0}.ascx" 
			};

			PartialViewLocationFormats = ViewLocationFormats;

		}

	}
}