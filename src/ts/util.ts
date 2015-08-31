class Util {
	
	static repeatString(s: string, times: number) {
		var out = '';
		for (var i = 0; i < times; i++) {
			out += s;
		}
		return out;
	}
	
	static padNumber(num: number, pad: number) {
		var s = num.toString();
		return Util.repeatString('0', pad - s.length) + s;
	}
	
	static formatDate(date: Date) {
		return date.getFullYear() + '-' + 
			Util.padNumber(date.getMonth() + 1, 2) + '-' + Util.padNumber(date.getDate(), 2);
	}
	
}

export = Util;