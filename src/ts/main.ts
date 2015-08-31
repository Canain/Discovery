/// <reference path="reference.d.ts" />

import $ = require('jquery');
import Graph = require('./graph');
import Util = require('./util');

$(document).ready(() => {
	var date = Util.formatDate(new Date());
	document.title += ' ' + date;
	$.getJSON('/api/topics/filter?day=' + date, (data, textStatus: string, jqXHR: JQueryXHR) => {
		var graph = window['graph'] = new Graph(data[0].graph);
	});
});	