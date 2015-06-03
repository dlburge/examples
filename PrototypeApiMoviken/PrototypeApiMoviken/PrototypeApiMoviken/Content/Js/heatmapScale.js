/*
*	Class containing the scale used to create heatmap blobs depending upon distance
*/

var heatmapScale = {

	getHeatmapValues: function (maxDuration, duration) {

		switch (maxDuration) {
			case 15:
				return this.getData(duration);
			case 30:
				return this.getData(duration / 2);
			case 45:
				return this.getData(duration / 3);
			case 60:
				return this.getData(duration / 4);
			case 75:
				return this.getData(duration / 5);
			case 90:
				return this.getData(duration / 6);
			default:
				//same as duration 15
				return this.getData(duration);
		}

	},

	//TODO : make this one private
	getData: function (duration) {

		
		if (duration <= 15 && duration > 14)
			return this.data[15];

		if (duration <= 14 && duration > 13)
			return this.data[14];

		if (duration <= 13 && duration > 12)
			return this.data[13];

		if (duration <= 12 && duration > 11)
			return this.data[12];

		if (duration <= 11 && duration > 10)
			return this.data[11];

		if (duration <= 10 && duration > 9)
			return this.data[10];

		if (duration <= 9 && duration > 8)
			return this.data[9];

		if (duration <= 8 && duration > 7)
			return this.data[8];

		if (duration <= 7 && duration > 6)
			return this.data[7];

		if (duration <= 6 && duration > 5)
			return this.data[6];

		if (duration <= 5 && duration > 4)
			return this.data[5];

		if (duration <= 4 && duration > 3)
			return this.data[4];

		if (duration <= 3 && duration > 2)
			return this.data[3];

		if (duration <= 2 && duration > 1)
			return this.data[2];
			
		if(duration <= 1 && duration >= 0)
			return this.data[1];

	},

	//TODO : make this private, the "opacity increases" and the "size decreases" as the duration increases
	data: {
		15: {
			opacity: 0.50,
			size: 15
		},
		14: {
			opacity: 0.47,
			size: 18
		},
		13: {
			opacity: 0.44,
			size: 23
		},
		12: {
			opacity: 0.41,
			size: 26
		},
		11: {
			opacity: 0.38,
			size: 29
		},
		10: {
			opacity: 0.35,
			size: 32
		},
		9: {
			opacity: 0.32,
			size: 35
		},
		8: {
			opacity: 0.29,
			size: 38
		},
		7: {
			opacity: 0.26,
			size: 41
		},
		6: {
			opacity: 0.23,
			size: 44
		},
		5: {
			opacity: 0.20,
			size: 47
		},
		4: {
			opacity: 0.17,
			size: 50
		},
		3: {
			opacity: 0.14,
			size: 53
		},
		2: {
			opacity: 0.12,
			size: 56
		},
		1: {
			opacity: 0.10,
			size: 59
		}
	}


}
