interface Edge {
	source: string;
	target: string;
	value: number;
	sourceNode?: Node;
	targetNode?: Node;
}

interface Node {
	group: string;
	id: string;
	img: string;
	keywords: string[];
	name: string;
	source: string;
	url: string;
	connections?: Connection[];
	node?: d3.layout.force.Node;
	sprite?: Phaser.Sprite;
	color?: string;
}

interface Connection {
	target: Node;
	distance: number;
}

interface NodeDictionary {
	[id: string]: Node;
}

interface GraphData {
	edges: Edge[];
	nodes: Node[];
}

interface BitmapDataDictionary {
	[color: string]: Phaser.BitmapData;
}

interface ColorDictionary {
	[group: string]: string;
}

interface Keyword {
	color: string;
	keyword: string;
	nodes: Node[];
	text?: Phaser.Text;
}

interface Group {
	group: string;
	color: string;
	nodes: Node[];
	keywords: KeywordDictionary;
}

interface GroupDictionary {
	[group: string]: Group;
}

interface KeywordDictionary {
	[keyword: string]: Keyword;
}

class Graph {
	
	game: Phaser.Game;
	
	scale: number;
	
	nodes: NodeDictionary;
	
	colors: string[];
	
	bmps: BitmapDataDictionary;
	
	radius: number;
	diameter: number;
	
	stroke: number;
	
	min: number;
	max: number;
	
	graphics: Phaser.Graphics;
	
	d3: {
		force: d3.layout.Force<d3.layout.force.Link<d3.layout.force.Node>, d3.layout.force.Node>;
		nodes: d3.layout.force.Node[];
		links: d3.layout.force.Link<d3.layout.force.Node>[];
		size: number;
	};
	
	groupColors: ColorDictionary;
	
	groups: GroupDictionary;
	
	keywordThreshold: number;
	
	devicePixelRatio: number;
	
	constructor(public graph: GraphData) {
		var w = $(window);
		var scrollbar = this.getScrollbarWidth();
		this.devicePixelRatio = window.devicePixelRatio === undefined ? 1 : window.devicePixelRatio;
		var width = w.width() - scrollbar;
		var height = w.height() - scrollbar;
		width *= this.devicePixelRatio;
		height *= this.devicePixelRatio;
		this.min = Math.min(width, height);
		this.max = Math.max(width, height);
		
		this.game = new Phaser.Game(width, width, Phaser.AUTO, $('body')[0], {
			preload: this.preload.bind(this),
			create: this.create.bind(this),
			update: this.update.bind(this),
			render: this.render.bind(this)
		}, false, false);
		this.game.forceSingleUpdate = true;
		
		this.nodes = {};
		this.graph.nodes.forEach((node: Node) => {
			node.connections = [];
			this.nodes[node.id] = node;
		});
		
		this.graph.edges.forEach((edge: Edge) => {
			edge.sourceNode = this.nodes[edge.source];
			edge.targetNode = this.nodes[edge.target];
			edge.sourceNode.connections.push({
				target: edge.targetNode,
				distance: edge.value
			});
			edge.targetNode.connections.push({
				target: edge.sourceNode,
				distance: edge.value
			});
		});
		
		this.d3 = {
			force: d3.layout.force(),
			nodes: [],
			links: [],
			size: 1500
		}
		
		this.graph.nodes.forEach((node: Node) => {
			node.node = {};
			this.d3.nodes.push(node.node);
		});
		
		this.graph.edges.forEach((edge: Edge) => {
			this.d3.links.push({
				source: edge.sourceNode.node,
				target: edge.targetNode.node
			});
		});
		
		this.colors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896',
			'#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22',
			'#dbdb8d', '#17becf', '#9edae5'];
		this.bmps = {};
		this.groupColors = {};
		this.groups = {};
		
		this.stroke = 1;
		this.keywordThreshold = 2;
	}
	
	preload() {
		
	}
	
	create() {
		this.game.time.advancedTiming = true;
		this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.game.stage.backgroundColor = '#FFFFFF';
		
		this.scale = Math.min(this.game.world.width, this.game.world.height) / 100;
		
		this.radius = 0.2;
		this.radius *= this.scale * this.devicePixelRatio;
		this.diameter = this.radius * 2;
		
		this.d3.force
			.nodes(this.d3.nodes)
			.links(this.d3.links)
			.size([this.d3.size, this.d3.size])
			.linkStrength(0.1)
			// .friction(0.9)
			.linkDistance(50)
			.charge(-40)
			// .gravity(0.1)
			// .theta(0.8)
			// .alpha(0.1)
		
		this.colors.forEach((color: string) => {
			var bmp = this.game.add.bitmapData(this.diameter, this.diameter);
			
			bmp.ctx.fillStyle = color;
			bmp.ctx.beginPath();
			bmp.ctx.arc(this.radius, this.radius, this.radius - this.stroke, 0, Math.PI * 2);
			bmp.ctx.closePath();
			bmp.ctx.fill();
			bmp.ctx.lineWidth = this.stroke;
			bmp.ctx.strokeStyle = '#7e7e7e';
			bmp.ctx.stroke();
			
			this.bmps[color] = bmp;
		});
		
		this.graphics = this.game.add.graphics(0, 0);
		
		this.graph.nodes.forEach((node: Node) => {
			var transversed: NodeDictionary = {};
			
			// var color = this.transverse(node, transversed);
			var color = this.groupColors[node.group];
			
			if (!color) {
				color = this.colors[Math.floor(Math.random() * this.colors.length)];
				// for (var i in transversed) {
				// 	transversed[i].color = color;
				// }
				this.groupColors[node.group] = color;
				node.color = color;
			}
			
			node.sprite = this.game.add.sprite(this.getNodeX(node.node), this.getNodeY(node.node), this.bmps[color]);
			node.sprite.anchor.setTo(0.5);
			
			var group = this.groups[node.group];
			if (!group) {
				group = {
					group: node.group,
					nodes: [],
					keywords: {},
					color: node.color
				};
				this.groups[group.group] = group;
			}
			group.nodes.push(node);
		});
		
		var textKeywords = [];
		
		for (var i in this.groups) {
			var group = this.groups[i];
			group.nodes.forEach((node: Node) => {
				node.keywords.forEach((word: string) => {
					var keyword = group.keywords[word];
					if (!keyword) {
						keyword = {
							color: group.color,
							keyword: word,
							nodes: []
						};
						group.keywords[keyword.keyword] = keyword;
					}
					keyword.nodes.push(node);
				});
			});
			for (var j in group.keywords) {
				var keyword = group.keywords[j];
				if (keyword.nodes.length < this.keywordThreshold) {
					continue;
				}
				
				textKeywords.push(keyword);
			}
		}
		
		textKeywords.sort((a: Keyword, b: Keyword) => {
			return a.nodes.length - b.nodes.length;
		});
		
		textKeywords.forEach((keyword: Keyword) => {
			var center = this.calculateCenter(keyword.nodes);
			
			keyword.text = this.game.add.text(center.x, center.y, keyword.keyword, {
				font: ((keyword.nodes.length * 1 + 20) * this.devicePixelRatio) + 'px Calibri',
				fill: keyword.color,
				align: 'center'
			});
			keyword.text.fontWeight = 'lighter';
			keyword.text.stroke = '#545454';
			keyword.text.strokeThickness = 2;
			keyword.text.anchor.setTo(Math.random(), Math.random());
			// keyword.text.alpha = 0.9;
		});
	}
	
	getScrollbarWidth() {
		var outer = document.createElement("div");
		outer.style.visibility = "hidden";
		outer.style.width = "100px";
		outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
	
		document.body.appendChild(outer);
	
		var widthNoScroll = outer.offsetWidth;
		// force scrollbars
		outer.style.overflow = "scroll";
	
		// add innerdiv
		var inner = document.createElement("div");
		inner.style.width = "100%";
		outer.appendChild(inner);        
	
		var widthWithScroll = inner.offsetWidth;
	
		// remove divs
		outer.parentNode.removeChild(outer);
	
		return widthNoScroll - widthWithScroll;
	}
	
	calculateCenter(nodes: Node[]) {
		var x = 0;
		var y = 0;
		nodes.forEach((node: Node) => {
			x += node.sprite.x;
			y += node.sprite.y;
		});
		x /= nodes.length;
		y /= nodes.length;
		
		return new Phaser.Point(x, y);
	}
	
	transverse(node: Node, transversed: NodeDictionary) {
		if (transversed[node.id]) {
			return node.color;
		} else {
			if (node.color) {
				return node.color;
			}
			transversed[node.id] = node;
			node.connections.forEach((connection: Connection) => {
				var color = this.transverse(connection.target, transversed);
				if (color) {
					return color;
				}
			});
			return null;
		}
	}
	
	getNodeX(node: d3.layout.force.Node) {
		return (node.x - this.d3.size / 2) / this.d3.size * this.max + this.game.width / 2;
	}
	
	getNodeY(node: d3.layout.force.Node) {
		return (node.y - this.d3.size / 2) / this.d3.size * this.max + this.game.height / 2;
	}
	
	update() {
		this.d3.force.start();
		(<any>this.d3.force).tick();
		this.d3.force.stop();
		
		this.graph.nodes.forEach((node: Node) => {
			node.sprite.x = this.getNodeX(node.node);
			node.sprite.y = this.getNodeY(node.node);
		});
		
		this.graphics.clear();
		
		this.graph.edges.forEach((edge: Edge) => {
			this.graphics.lineStyle(1, 0, 0.2);
			var source = edge.sourceNode.sprite;
			var target = edge.targetNode.sprite;
			this.graphics.moveTo(source.x, source.y);
			this.graphics.lineTo(target.x, target.y);
		});
		
		for (var i in this.groups) {
			var group = this.groups[i];
			for (var j in group.keywords) {
				var keyword = group.keywords[j];
				if (keyword.text) {
					var center = this.calculateCenter(keyword.nodes);
					keyword.text.x = center.x;
					keyword.text.y = center.y;
				}
			}
		}
	}
	
	render() {
		
	}
}
export = Graph;