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
	
	group: Phaser.Physics.P2.CollisionGroup;
	
	friction: number;
	
	radius: number;
	diameter: number;
	
	min: number;
	
	constructor(public graph: GraphData) {
		this.game = new Phaser.Game('100%', '100%', Phaser.AUTO, $('body')[0], {
			preload: this.preload.bind(this),
			create: this.create.bind(this),
			update: this.update.bind(this),
			render: this.render.bind(this)
		}, false, true);
		this.game.forceSingleUpdate = true;
		
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
		
		this.colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
		this.bmps = {};
		
		this.friction = 100;
	}
	
	preload() {
		
	}
	
	create() {
		this.game.time.advancedTiming = true;
		this.game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
		this.game.stage.backgroundColor = '#FFFFFF';
		
		this.scale = Math.min(this.game.world.width, this.game.world.height) / 100;
		
		this.game.physics.startSystem(Phaser.Physics.P2JS);
		
		this.group = this.game.physics.p2.createCollisionGroup();
		
		this.radius = 0.5;
		this.radius *= this.scale;
		this.diameter = this.radius * 2;
		
		this.min = Math.min(this.game.world.width, this.game.world.height) - this.diameter;
		
		this.colors.forEach((color: string) => {
			var bmp = this.game.add.bitmapData(this.diameter, this.diameter);
			
			var width = 1;
			
			bmp.ctx.fillStyle = color;
			bmp.ctx.beginPath();
			bmp.ctx.arc(this.radius, this.radius, this.radius - width, 0, Math.PI * 2);
			bmp.ctx.closePath();
			bmp.ctx.fill();
			bmp.ctx.lineWidth = width;
			bmp.ctx.strokeStyle = 'black';
			bmp.ctx.stroke();
			
			this.bmps[color] = bmp;
		});
		
		this.graph.nodes.forEach((node: Node) => {
			var circle = this.createCircle(this.colors[Math.floor(Math.random() * this.colors.length)]);
			this.game.physics.p2.enable(circle);
			var body = <Phaser.Physics.P2.Body>circle.body;
			body.setCircle(.5 * this.scale);
			body.setCollisionGroup(this.group);
			node.sprite = circle;
		});
		
		this.graph.edges.forEach((edge: Edge) => {
			this.game.physics.p2.createDistanceConstraint(edge.sourceNode.sprite, edge.targetNode.sprite, edge.value * this.scale * 5);
		});
	}
	
	createCircle(color: string) {
		var center = new Phaser.Point(this.game.world.centerX, this.game.world.centerY);
		
		var move = new Phaser.Point((1 - Math.pow(Math.random(), 2)) * this.min / 2, 0);
		move.rotate(0, 0, Math.random() * Math.PI * 2);
		
		center.add(move.x, move.y);
		
		return this.game.add.sprite(center.x, center.y, this.bmps[color]);
	}
	
	update() {
		for (var i in this.nodes) {
			var node = this.nodes[i];
			var body = <Phaser.Physics.P2.Body>node.sprite.body;
			var force = new Phaser.Point(this.game.world.centerX - body.x, this.game.world.centerY - body.y);
			var zero = new Phaser.Point();
			var mult = Math.pow(zero.distance(force), 2);
			force.normalize();
			force.multiply(mult, mult);
			
			body.force.x = force.x - body.velocity.x * this.friction;
			body.force.y = force.y - body.velocity.y * this.friction;
		}
	}
	
	render() {
		// this.game.debug./
	}
}
export = Graph;