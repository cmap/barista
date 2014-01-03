Barista.Views.FlatTreeMapView = Backbone.View.extend({
	// ### name
	// give the view a name to be used throughout the View's functions when it needs to know what its class name is
	name: "FlatTreeMapView",

		model: new Barista.Models.PertCellBreakdownModel(),

		initialize: function(){
		// set up color options.  default if not specified
		this.bg_color = (this.options.bg_color !== undefined) ? this.options.bg_color : "#d9d9d9";
		this.well_color = (this.options.well_color !== undefined) ? this.options.well_color : "#bdbdbd";
		this.fg_color = (this.options.fg_color !== undefined) ? this.options.fg_color : "#1b9e77";

		// set up the span size
		this.span_class = (this.options.span_class !== undefined) ? this.options.span_class : "span4";

		// bind render to model changes
		this.listenTo(this.model,'change', this.update_vis);

		// compile the default template for the view
		this.compile_template();

		// define the location where d3 will build its plot
		this.width = $("#" + this.div_string).width();
		this.height = $("#" + this.div_string).outerHeight();
		this.top_svg = d3.select("#" + this.div_string).append("svg")
						.attr("width",this.width)
						.attr("height",this.height);
		this.vis = this.top_svg.append("g");
		// this.vis_overlay = this.top_svg.append("g");

		// render the vis
		this.render();

		// bind window resize events to redraw
		var self = this;
		$(window).resize(function() {self.render();} );
	},

	compile_template: function(){
		this.div_string = 'd3_target' + Math.round(Math.random()*1000000);
		this.$el.append(BaristaTemplates.d3_target({div_string: this.div_string,
												span_class: this.span_class,
												height: 300}));
	},

	render: function(){
		// stuff this into a variable for later use
		var self = this;

		// set up the panel's width and height
		this.width = $("#" + this.div_string).width();
		this.height = $("#" + this.div_string).outerHeight();

		// rescale the width of the vis
		this.top_svg.transition().duration(1).attr("width",this.width);

		// define the treemap layout
		this.treemap = d3.layout.treemap()
						.size([this.width,this.height])
						.sticky(false)
						.round(true)
						.sort(function(a,b) { return a.count - b.count; })
						.value(function(d) {return d.count;});

		// grab the data from the model and plot the state of the treemap
		this.data = this.model.get('tree_object');

		// if there are no cildren in the tree_object, dim the view
		if (this.data.children[0] === undefined){
			this.top_svg.transition().duration(1).attr("opacity",0);
		}else{
			this.top_svg.transition().duration(500).attr("opacity",1);
		}

		// set up an alpha scaling
		this.min_count = _.min(_.pluck(this.data.children,'count'));
		this.max_count = _.max(_.pluck(this.data.children,'count'));
		this.opacity_map = d3.scale.linear()
							.domain([this.min_count,this.max_count,this.max_count+1])
							.range([1,1,0]);

		this.vis.data([this.data]).selectAll("rect").data([]).exit().remove();
		this.vis.data([this.data]).selectAll("rect").data(this.treemap.nodes)
			.enter().append("rect")
			.attr("class",this.div_string + "_cell")
			.attr("fill",this.fg_color)
			.attr("opacity",function(d){return self.opacity_map(d.value);})
			.attr("x", function(d) {return d.x;})
			.attr("y", function(d) {return d.y;})
			.attr("width", function(d) {return d.dx;})
			.attr("height", function(d) {return d.dy;})
			.attr("stroke", "white")
			.attr("stroke-width", 2);
		this.draw_text();

		// add an invisible overlay to catch mouse events
		// this.vis_overlay.data([this.data]).selectAll("rect").data([]).exit().remove();
		// this.vis_overlay.data([this.data]).selectAll("rect").data(this.treemap.nodes)
		// 	.enter().append("rect")
		// 	.attr("class",this.div_string + "_cell")
		// 	.attr("fill",this.fg_color)
		// 	.attr("opacity",0)
		// 	.attr("x", function(d) {return d.x;})
		// 	.attr("y", function(d) {return d.y;})
		// 	.attr("width", function(d) {return d.dx;})
		// 	.attr("height", function(d) {return d.dy;})
		// 	.attr("count", function(d) {return d.count;})
		// 	.attr("_id", function(d) {return d._id;})
		// 	.on("mousemove", function() { self.fadeIn_popover(d3.mouse(this),d3.select(d3.event.target)); })
		// 	.on("mouseout", function() { self.fadeOut_popover(); });

		// add a div for tooltips
		this.top_svg.selectAll("." + this.div_string + "tooltips").data([]).exit().remove();
		this.popover = this.top_svg.append("foreignObject")
			.attr("class", this.div_string + "tooltips")
			.attr("x", 0)
			.attr("y", 0)
			.attr("opacity",0)
			.attr("width", 600)
			.attr("height", 100)
			.append("xhtml:div")
			.html('<span class="label ' + this.div_string + 'sig_id_label"></span>')
			.append("xhtml:div")
			.html('<span class="label label-inverse  ' + this.div_string + 'pert_desc_label"></span>');

		// add a png export overlay
		this.top_svg.selectAll("." + this.div_string + "png_export").data([]).exit().remove();
		this.top_svg.selectAll("." + this.div_string + "png_export").data([1]).enter().append("text")
			.attr("class", this.div_string + "png_export")
			.attr("x",10)
			.attr("y",this.height - 10)
			.attr("opacity",0.25)
			.style("cursor","pointer")
			.text("png")
			.on("mouseover",function(){d3.select(this).transition().duration(500).attr("opacity",1);})
			.on("mouseout",function(){d3.select(this).transition().duration(500).attr("opacity",0.25);})
			.on("click",function(){self.savePng();});
	},

	update_vis: function(){
		var self = this;
		// grab the data from the model and plot the state of the treemap
		this.data = this.model.get('tree_object');

		// if there are no children in the tree_object, dim the view
		if (this.data.children[0] === undefined){
			this.top_svg.transition().duration(1).attr("opacity",0);
		}else{
			this.top_svg.transition().duration(500).attr("opacity",1);
		}

		// set up an alpha scaling
		this.min_count = _.min(_.pluck(this.data.children,'count'));
		this.max_count = _.max(_.pluck(this.data.children,'count'));
		this.opacity_map = d3.scale.linear().domain([this.min_count,this.max_count,this.max_count+1])
						.range([1,1,0]);

		//add new data if it is there
		this.vis.data([this.data]).selectAll("rect").data(this.treemap.nodes)
			.enter().append("rect")
			.attr("class",this.div_string + "_cell")
			.attr("fill",this.fg_color)
			.attr("opacity",function(d){return self.opacity_map(d.value);})
			.attr("x", function(d) {return d.x;})
			.attr("y", function(d) {return d.y;})
			.attr("width", function(d) {return d.dx;})
			.attr("height", function(d) {return d.dy;})
			.attr("stroke", "white")
			.attr("stroke-width", 2)
			// .on("mousemove", function() { self.fadeIn_popover(d3.mouse(this),d3.select(d3.event.target)); })
			// .on("mouseout", function() { self.fadeOut_popover(); });

		// //add new data if it is there 
		// this.vis_overlay.data([this.data]).selectAll("rect").data(this.treemap.nodes)
		// 	.enter().append("rect")
		// 	.attr("class",this.div_string + "_cell")
		// 	.attr("fill",this.fg_color)
		// 	.attr("opacity",0)
		// 	.attr("x", function(d) {return d.x;})
		// 	.attr("y", function(d) {return d.y;})
		// 	.attr("count", function(d) {return d.count;})
		// 	.attr("_id", function(d) {return d._id;})
		// 	.attr("width", function(d) {return d.dx;})
		// 	.attr("height", function(d) {return d.dy;})
		// 	.on("mousemove", function() { self.fadeIn_popover(d3.mouse(this),d3.select(d3.event.target)); })
		// 	.on("mouseout", function() { self.fadeOut_popover(); });

		// transition elements
		this.vis.data([this.data]).selectAll("rect")
			.transition().ease("cubic out").duration(500)
			.attr("opacity",function(d){return self.opacity_map(d.value);})
			.attr("x", function(d) {return d.x;})
			.attr("y", function(d) {return d.y;})
			.attr("width", function(d) {return d.dx;})
			.attr("height", function(d) {return d.dy;});

		// this.vis_overlay.data([this.data]).selectAll("rect")
		// 	.transition().ease("cubic out").duration(500)
		// 	.attr("x", function(d) {return d.x;})
		// 	.attr("y", function(d) {return d.y;})
		// 	.attr("width", function(d) {return d.dx;})
		// 	.attr("height", function(d) {return d.dy;});

		// exit old elements
		this.vis.data([this.data]).selectAll("rect").data(this.treemap.nodes).exit().remove();
		// this.vis_overlay.data([this.data]).selectAll("rect").data(this.treemap.nodes).exit().remove();

		// draw_text on the elements that have room for it
		this.clear_text();
		setTimeout(function(){ self.draw_text(); },500);
	},

	fadeIn_popover: function(point,rect){
		if (point[0] > this.width/2){
			d3.select("." + this.div_string + "tooltips").attr("x", point[0] - 60);
		}else{
			d3.select("." + this.div_string + "tooltips").attr("x", point[0]);
		}

		if (point[1] > this.height/2){
			d3.select("." + this.div_string + "tooltips").attr("y", point[1] - 50);
		}else{
			d3.select("." + this.div_string + "tooltips").attr("y", point[1] + 20);
		}

		d3.select("." + this.div_string + "sig_id_label").text(rect.attr("_id"));
		d3.select("." + this.div_string + "pert_desc_label").text(rect.attr("count"));
		d3.select("." + this.div_string + "tooltips").attr("opacity",1);
	},

	fadeOut_popover: function(){
		d3.select("." + this.div_string + "tooltips").attr("opacity",0);
	},

	clear_text: function(){
		this.vis.data([this.data]).selectAll("text.name").data([]).exit().remove();
		this.vis.data([this.data]).selectAll("text.count").data([]).exit().remove();
	},

	draw_text: function(){
		this.vis.data([this.data]).selectAll("text.name").data([]).exit().remove();
		this.vis.data([this.data]).selectAll("text.name").data(this.treemap.nodes)
			.enter().append("text")
			.attr("class","name")
			.text(function(d) {
				if (d.dy < 20 || d.dx < 80){
					return null;
				}else{
					return d.children ? null : d._id;
				}
			})
			.attr("text-anchor", "middle")
			.attr("x", function(d) {return d.x + d.dx/2;})
			.attr("y", function(d) {return d.y + d.dy/2;})
			.attr("font-family","'Helvetica Neue',Helvetica,Arial,sans-serif")
			.attr("font-weight","normal")
			.attr("font-size","12pt")
			.attr("fill","white")
			.attr("opacity",0)
			.transition().duration(500).attr("opacity",1);

		this.vis.data([this.data]).selectAll("text.count").data([]).exit().remove();
		this.vis.data([this.data]).selectAll("text.count").data(this.treemap.nodes)
			.enter().append("text")
			.attr("class","name")
			.text(function(d) {
				if (d.dy < 40 || d.dx < 80){
					return null;
				}else{
					return d.children ? null : d.count;
				}
			})
			.attr("text-anchor", "middle")
			.attr("x", function(d) {return d.x + d.dx/2;})
			.attr("y", function(d) {return d.y + d.dy/2 + 20;})
			.attr("font-family","'Helvetica Neue',Helvetica,Arial,sans-serif")
			.attr("font-weight","normal")
			.attr("font-size","12pt")
			.attr("fill","black")
			.attr("opacity",0)
			.transition().duration(500).attr("opacity",1);
	},

	savePng: function(){
		// build a canvas element to store the image temporarily while we save it
		var width = this.top_svg.attr("width");
		var height = this.top_svg.attr("height");
		var html_snippet = '<canvas id="tmpCanvas" width="' + width + 'px" height="' + height + 'px"></canvas>';
		$('body').append(html_snippet);

		// dim the png label on the image
		var png_selection = this.top_svg.selectAll("." + this.div_string + "png_export").data([1]);
		var png_opacity = png_selection.attr("opacity");
		png_selection.attr("opacity",0);

		// grab the content of the target svg and place it in the canvas element
		var svg_snippet = this.top_svg.node().parentNode.innerHTML;
		canvg(document.getElementById('tmpCanvas'), '<svg>' + svg_snippet + '</svg>', { ignoreMouse: true, ignoreAnimation: true });

		// save the contents of the canvas to file and remove the canvas element
		var canvas = $("#tmpCanvas")[0];
		var filename = "cmapTreeMap" + new Date().getTime() + ".png";
		if (canvas.toBlob){canvas.toBlob(function(blob){saveAs(blob,filename);})};
		$('#tmpCanvas').remove();

		// make the png label on the image visible again
		png_selection.attr("opacity",png_opacity);
	}
});