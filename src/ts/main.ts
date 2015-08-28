/// <reference path="references.d.ts" />

import Graph = require('./graph');

$(document).ready(() => {
	$.getJSON('/api/topics/filter?day=2015-08-27', (data, textStatus: string, jqXHR: JQueryXHR) => {
		var graph = window['graph'] = new Graph(data[0].graph);
	});
});