// # **BubbleView**
// A Backbone.View that displays a single level tree of data as a bubble plot.  The view should be bound to a 
// model such as a **PertCellBreakdownModel** that captures tree data in a *tree_object* attribute. 

// basic use:

//		bubble_view = new BubbleView({el: $("target_selector")});

// optional arguments:

// 3.  {string}  **fg\_color**  the hex color code to use as the foreground color of the view, defaults to *#1b9e77*
// 4.  {string}  **span\_class**  a bootstrap span class to size the width of the view, defaults to *"span4"*

//		bubble_view = new BubbleView({el: $("target_selector"),
//									fg_color: "#1b9e77",
//									span_class: "span4"});

Barista.Views.BubbleView = Backbone.View.extend({
	// ### name
	// give the view a name to be used throughout the View's functions when it needs to know what its class name is
	name: "BubbleView",

	// ### model
	// set up the view's default model
	model: new Barista.Models.PertCellBreakdownModel(),

	// ### initialize
	// overide the default Backbone.View initialize method to handle optional arguments, compile the view
	// template, bind model changes to view updates, and render the view
	initialize: function(){
		// set up color options.  default if not specified
		this.fg_color = (this.options.fg_color !== undefined) ? this.options.fg_color : "#1b9e77";

		// set up the span size
		this.span_class = (this.options.span_class !== undefined) ? this.options.span_class : "span4";

		// set up the plot height
		this.plot_height = (this.options.plot_height !== undefined) ? this.options.plot_height : 120;

		// set up the bubble minimum and maximum scale values
		this.min_val = (this.options.min_val !== undefined) ? this.options.min_val : undefined;
		this.max_val = (this.options.max_val !== undefined) ? this.options.max_val : undefined;

		// bind render to model changes
		this.listenTo(this.model,'change', this.update);

		// compile the default template for the view
		this.compile_template();

		// define the location where d3 will build its plot
		this.width = $("#" + this.div_string).outerWidth();
		this.height = $("#" + this.div_string).outerHeight();
		this.vis = d3.select("#" + this.div_string).append("svg")
						.attr("width",this.width)
						.attr("height",this.height);

		// render the vis
		this.render();

		// bind window resize events to redraw
		var self = this;
		$(window).resize(function() {self.render();} );
	},

	// ### compile_template
	// use Handlebars to compile the template for the view
	compile_template: function(){
		this.div_string = 'd3_target' + Math.round(Math.random()*1000000);
		this.$el.append(BaristaTemplates.d3_target({div_string: this.div_string,
												span_class: this.span_class,
												height: this.plot_height}));
	},

	// ### render
	// draw the view from scratch
	render: function(){
		// stuff this into a variable for later use
		var self = this;

		// set up the panel's width and height
		this.width = $("#" + this.div_string).outerWidth();
		this.height = $("#" + this.div_string).outerHeight();

		// rescale the width of the vis
		this.vis.transition().duration(1).attr("width",this.width);

		// grab the data from the model
		var data = this.model.get('tree_object').children;

		// set up some data scaling
		var max_count, min_count;
		if (this.max_val !== undefined){
			max_count = this.max_val;
		}else{
			max_count = _.max(_.pluck(data,'count'));
		}
		if (this.min_val !== undefined){
			min_count = this.min_val;
		}else{
			min_count = _.min(_.pluck(data,'count'));
		}
		this.data_scale = d3.scale.linear().domain([min_count,max_count])
						.range([5,30]);

		// define the force directed graph layout
		this.force = d3.layout.force()
						.nodes(data)
						.size([this.width, this.height])
						.on("tick",tick)
						.charge(function(d){return -Math.pow(self.data_scale(d.count),1.4);})
						.start();

		// draw the initial layout
		this.vis.selectAll("circle").data(this.force.nodes()).exit().remove();
		this.vis.selectAll("circle").data(this.force.nodes())
				.enter().append("circle")
				.attr("class",this.div_string + "_circle")
				.attr("fill",this.fg_color)
				.attr("cx", Math.random() * 300)
				.attr("cy", Math.random() * 300)
				.attr("stroke","white")
				.attr("_id",function(d){return d._id;})
				.attr("r",function(d){return Math.sqrt(self.data_scale(d.count)/Math.PI);});

		// specify the nodes selection so we don't have to repeat the selection on each tick
        this.nodes = this.vis.selectAll("circle");
        this.nodes.call(this.force.drag());

		// tick function for use in the force class
		function tick(){
			self.nodes.attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})
                .attr("r",function(d){return self.data_scale(d.count);});
        }
	},

	// ### update
	// update the plot with new data
	update: function(){
		// stuff this into a variable for later use
		var self = this;

		// grab the data from the model
		var data = this.model.get('tree_object').children;

		// set up some data scaling
		var max_count, min_count;
		if (this.max_val !== undefined){
			max_count = this.max_val;
		}else{
			max_count = _.max(_.pluck(data,'count'));
		}
		if (this.min_val !== undefined){
			min_count = this.min_val;
		}else{
			min_count = _.min(_.pluck(data,'count'));
		}
		this.data_scale = d3.scale.linear().domain([min_count,max_count])
						.range([5,30]);

		// define the force directed graph layout
		// this.force = d3.layout.force()
		//				.nodes(data)
		//				.size([this.width, this.height])
		//				.on("tick",tick)
		//				.charge(function(d){return -Math.pow(self.data_scale(d.count),1.4);})
		//				.start();

		// draw the initial layout
		this.force.nodes(data).start();
		bubble_selection = this.vis.selectAll("circle").data(this.force.nodes())
		bubble_selection.enter()
				.append("circle")
				.attr("class",this.div_string + "_circle")
				.attr("fill",this.fg_color)
				.attr("cx", Math.random() * 300)
				.attr("cy", Math.random() * 300)
				.attr("stroke","white")
				.attr("_id",function(d){return d._id;})
				.attr("r",function(d){return Math.sqrt(self.data_scale(d.count)/Math.PI);});

		// transition bubbles
		bubble_selection.transition().duration(500)
				.attr("r",function(d){return self.data_scale(d.count);});

		// remove bubbles with no data
		bubble_selection.exit().remove();

		// specify the nodes selection so we don't have to repeat the selection on each tick
        this.nodes = this.vis.selectAll("circle");
        this.nodes.call(this.force.drag());

		// tick function for use in the force class
		function tick(){
			self.nodes.attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})
                // .attr("r",function(d){return self.data_scale(d.count);});
        }

		// var self = this;
		// // grab the data from the model
		// var data = this.model.get('tree_object').children;

		// // set up some data scaling
		// var max_count, min_count;
		// if (this.max_val !== undefined){
		//	max_count = this.max_val;
		// }else{
		//	max_count = _.max(_.pluck(data,'count'));
		// }
		// if (this.min_val !== undefined){
		//	min_count = this.min_val;
		// }else{
		//	min_count = _.min(_.pluck(data,'count'));
		// }
		// this.data_scale = d3.scale.linear().domain([min_count,max_count])
		//				.range([5,30]);

		// this.force.nodes(data);

		// // plot new bubbles where we need them
		// bubble_selection = this.vis.selectAll("circle").data(this.force.nodes());
		// bubble_selection.enter().append("circle")
		//		.attr("class",this.div_string + "_circle")
		//		.attr("fill",this.fg_color)
		//		.attr("cx", Math.random() * 300)
		//		.attr("cy", Math.random() * 300)
		//		.attr("stroke","white")
		//		.attr("_id",function(d){return d._id;})
		//		.attr("r",function(d){return Math.sqrt(self.data_scale(d.count)/Math.PI);});

		// this.nodes = this.vis.selectAll("circle");
		// this.nodes.call(this.force.drag());

		// // transition bubbles
		// bubble_selection.transition().duration(500)
		//		.attr("class",this.div_string + "_circle")
		//		.attr("cx", Math.random() * 300)
		//		.attr("cy", Math.random() * 300)
		//		.attr("_id",function(d){return d._id;})
		//		.attr("r",function(d){return Math.sqrt(self.data_scale(d.count)/Math.PI);});

		// // remove bubbles with no data
		// bubble_selection.exit().remove();

		// // specify the nodes selection so we don't have to repeat the selection on each tick
  //       this.nodes = this.vis.selectAll("circle");
  //       this.nodes.call(this.force.drag());

		// // tick function for use in the force class
		// function tick(){
		//	self.nodes.attr("cx", function(d) {return d.x;})
  //               .attr("cy", function(d) {return d.y;})
  //               .attr("r",function(d){return self.data_scale(d.count);});
  //       }
	}
});