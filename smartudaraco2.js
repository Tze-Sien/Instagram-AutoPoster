module.exports = function(dataBody){
	
	let	payload = dataBody.data,
		pm25,
		pm10,
		co2,
		temp,
		humidity,
		battery,
		parsedData = [],
		obj = {};


	function parseFloat(str) {
		var float = 0, sign, order, mantiss,exp,
			int = 0, multi = 1;
			int = parseInt(str,16);
			sign = (int>>>31)?-1:1;
			exp = (int >>> 23 & 0xff) - 127; 
			mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
			for (i=0; i<mantissa.length; i+=1){
				float += parseInt(mantissa[i])? Math.pow(2,exp):0;
				exp--;
			}
		return float*sign;
	}


	if (payload.length == 18) {

		var index = parseInt(payload.slice(0, 2), 16);

		if (index == 1) {
			pm25 = parseInt(payload.slice(2, 6), 16);
			pm10 = parseInt(payload.slice(6, 10), 16);
			co2 = parseFloat(payload.slice(10, 18)).toFixed(2);    

				// Store objects in parsedData array
			obj = {};
			obj.key = 'pm25';
			obj.value = pm25;
			obj.type = 'number';
			obj.unit = 'ug/m^3';
			parsedData.push(obj);
		
			obj = {};
			obj.key = 'pm10';
			obj.value = pm10;
			obj.type = 'number';
			obj.unit = 'ug/m^3';
			parsedData.push(obj);
			
			obj = {};
			obj.key = 'co2';
			obj.value = co2;
			obj.type = 'number';
			obj.unit = 'ppm';
			parsedData.push(obj);	
		}

		if (index == 2) {
			temp = parseFloat(payload.slice(2, 10)).toFixed(2);    
			humidity = parseFloat(payload.slice(10, 18)).toFixed(2);    

			// Store objects in parsedData array
			obj = {};
			obj.key = 'temp';
			obj.value = temp;
			obj.type = 'number';
			obj.unit = '°C';
			parsedData.push(obj);
		
			obj = {};
			obj.key = 'humidity';
			obj.value = humidity;
			obj.type = 'number';
			obj.unit = '%RH';
			parsedData.push(obj);		
		}
		return parsedData;
	}	

	else if (payload.length == 4) {
		battery = ((parseInt(payload, 16) * 0.003222) / 0.17).toFixed(2);
		
		obj = {};
		obj.key = 'battery';
		obj.value = battery;
		obj.type = 'number';
		obj.unit = 'V';
		parsedData.push(obj);
		return parsedData;
	}

}
