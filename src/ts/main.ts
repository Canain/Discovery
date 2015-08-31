/// <reference path="references.d.ts" />

import Graph = require('./graph');

$(document).ready(() => {
	var today = new Date();
	var month = (today.getMonth() + 1).toString();
	if (month.length < 2) {
		month = '0' + month;
	}
	var date = today.getFullYear() + '-' + month + '-' + today.getDate();
	document.title = document.title + ' ' + date;
	$.getJSON('/api/topics/filter?day=' + date, (data, textStatus: string, jqXHR: JQueryXHR) => {
		var graph = window['graph'] = new Graph(data[0].graph);
	});
});