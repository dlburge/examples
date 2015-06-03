﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PrototypeApiMoviken
{
	//Allows caching (output cache) of action results
	public class CacheFilterAttribute : ActionFilterAttribute
	{
		/// <summary>
		/// Gets or sets the cache duration in seconds. The default is 10 seconds
		/// </summary>
		/// <value>The cache duration in seconds.</value>
		public int Duration
		{
			get;
			set;
		}

		public CacheFilterAttribute()
		{
			Duration = 10;
		}

		public override void OnActionExecuted(ActionExecutedContext context)
		{
			if (Duration <= 0) return;

			HttpCachePolicyBase cache = context.HttpContext.Response.Cache;
			TimeSpan cacheDuration = TimeSpan.FromSeconds(Duration);

			cache.SetCacheability(HttpCacheability.Public);
			cache.SetExpires(DateTime.Now.Add(cacheDuration));
			cache.SetMaxAge(cacheDuration);
			cache.AppendCacheExtension("must-revalidate, proxy-revalidate");
		}
	}

}