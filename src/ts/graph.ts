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
	connections?: Node[];
	node?: d3.layout.force.Node;
	sprite?: Phaser.Sprite;
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
	
	d3: {
		force: d3.layout.Force<d3.layout.force.Link<d3.layout.force.Node>, d3.layout.force.Node>;
		nodes: d3.layout.force.Node[];
		links: d3.layout.force.Link<d3.layout.force.Node>[];
	};
	
	constructor(public graph: GraphData) {
		this.game = new Phaser.Game('100%', '100%', Phaser.AUTO, $('body')[0], {
			preload: this.preload.bind(this),
			create: this.create.bind(this),
			update: this.update.bind(this),
			render: this.render.bind(this)
		}, false, true);
		// this.game.forceSingleUpdate = true;
		
		this.nodes = {};
		this.graph.nodes.forEach((node: Node) => {
			node.connections = [];
			this.nodes[node.id] = node;
		});
		
		this.graph.edges.forEach((edge: Edge) => {
			edge.sourceNode = this.nodes[edge.source];
			edge.targetNode = this.nodes[edge.target];
			edge.sourceNode.connections.push(edge.targetNode);
			edge.targetNode.connections.push(edge.sourceNode);
		});
		
		this.d3 = {
			force: d3.layout.force(),
			nodes: [],
			links: []
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
		
		this.colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
		this.bmps = {};
		
		this.stroke = 1;
	}
	
	preload() {
		
	}
	
	create() {
		this.game.time.advancedTiming = true;
		this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		this.game.stage.backgroundColor = '#FFFFFF';
		
		this.scale = Math.min(this.game.world.width, this.game.world.height) / 100;
		
		this.radius = 0.5;
		this.radius *= this.scale;
		this.diameter = this.radius * 2;
		
		this.min = Math.min(this.game.world.width, this.game.world.height) - this.diameter;
		
		this.d3.force
			.nodes(this.d3.nodes)
			.links(this.d3.links)
			// .size([this.game.world.width, this.game.world.width])
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
			bmp.ctx.strokeStyle = 'black';
			bmp.ctx.stroke();
			
			this.bmps[color] = bmp;
		});
		
		this.graph.nodes.forEach((node: Node) => {
			node.sprite = this.game.add.sprite(this.getNodeX(node.node), this.getNodeY(node.node), 
				this.bmps['#FF0000']);
		});
		
		// this.graph.edges.forEach((edge: Edge) => {
			
		// });
		this.d3.force.start();
	}
	
	getNodeX(node: d3.layout.force.Node) {
		return (node.x - 0.5) / 1500 * this.min + this.game.width / 2;
	}
	
	getNodeY(node: d3.layout.force.Node) {
		return (node.y - 0.5) / 1500 * this.min + this.game.height / 2;
	}
	
	update() {
		// (<any>this.d3.force).tick();
		// this.d3.force.stop();
		
		this.graph.nodes.forEach((node: Node) => {
			node.sprite.x = this.getNodeX(node.node);
			node.sprite.y = this.getNodeY(node.node);
		});
	}
	
	render() {
		
	}
}
export = Graph;