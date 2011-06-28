var Tween = function(elem, css, opts) {
	var from = {},
		fromElem = document.createElement('div'),
		to = {},
		toElem = document.createElement('div'),
		
		length = function(val) {
			return val;
		},
		opacity = function(val){
			return 	val === "" ? 1 : parseFloat(val);
		},
		
		options = {
			timingFunction: 'ease',
			duration: null,
			increment: 0.01,
			debug: false
		},
		
	// Define all other var's used in the function
	i = rule = ruleName = camel = m1 = m2 = progress = frame = rule = transEvent = null,
	
	_this = this,
	
	// Event listener for the webkitAnimationEnd Event
	animationEndListener = function(event){
		// Dispatch a faux webkitTransitionEnd event to complete the appearance of this being a transition rather than an animation
		elem.removeEventListener('webkitAnimationEnd', animationEndListener, true);
		transEvent = document.createEvent("Event");
		transEvent.initEvent("webkitTransitionEnd", true, true);
		elem.dispatchEvent(transEvent);
	};
	
	// Setup the options	
	for(i in opts)
		options[i] = opts[i];
		
	// If timingFunction is a natively supported function then just trigger normal transition
	if(	options.timingFunction === 'ease' || 
		options.timingFunction === 'linear' || 
		options.timingFunction === 'ease-in' || 
		options.timingFunction === 'ease-out' ||
		options.timingFunction === 'ease-in-out' ||
		/^cubic-bezier/.test(options.timingFunction)) {
		
		elem.style.webkitTransitionDuration = options.duration;
		elem.style.webkitTransitionTimingFunction = options.timingFunction;
		
		for(rule in css) {
			camel = this.util.toCamel(rule);	
			elem.style[camel] = css[rule];
		}
		
		this.css = '';
		
		return;	
	}
	else
	{
		elem.style.webkitTransitionTimingFunction = null;
		elem.style.webkitTransitionDuration = 0;
	}
	
	for(rule in css)
	{
		camel = this.util.toCamel(rule);	
		
		toElem.style[camel] = css[rule];

		// Set the from/start state	
		from[this.util.toDash(camel)] = (camel == 'WebkitTransform') ? new WebKitCSSMatrix(elem.style.WebkitTransform) 	: elem.style[camel];
	
		// Set the to/end state
		to[this.util.toDash(camel)]	  = (camel == 'WebkitTransform') ? new WebKitCSSMatrix(toElem.style.WebkitTransform) : toElem.style[camel];
	}

	// --- At this point we know that our CSS values are in CSS style dash ----------------
	
	// Adds the CSS to the current page
	var addKeyframeRule = function(rule) {
		if (document.styleSheets && document.styleSheets.length)
			document.styleSheets[0].insertRule(rule, 0);
		else
		{
			var style = document.createElement('style');
			style.innerHTML = rule;
			document.head.appendChild(style);			
		}
	},
	
	// Produces a CSS string representation of the Keyframes
	createAnimationCSS = function(kf, name) {
		var str = '@-webkit-keyframes '+name+' {\n', f = pos = rule = null, fStr = '';
		
		for(pos in kf)
		{
			f = kf[pos];
			fStr = '\t'+pos+' {\n';
			
			
			for(rule in f)
				fStr += '\t\t'+_this.util.toDash(rule)+': '+f[rule]+';\n';
			
			fStr += "\t}\n\n";
			
			str += fStr;
		}
		
		return str + " }";
	},
	
	keyframes = {},
	
	// Create a unique name for this animation
	animName = 'anim'+(new Date().getTime());
	
	// Produce decompositions of matrices here so we don't have to redo it on each iteration
	// Decomposing the matrix is expensive so we need to minimise these requests
	if(from['-webkit-transform'])
	{
		m1 = from['-webkit-transform'].decompose();
		m2 = to['-webkit-transform'].decompose();
	}
	
	// Produce style keyframes
	for(progress = 0; progress <= 1; progress += options.increment) {
		// Use Shifty.js to work out the interpolated CSS state
		frame = Tweenable.util.interpolate(from, to, progress, options.timingFunction);
		
		// Work out the interpolated matrix transformation
		if(m1 !== null && m2 !== null)
			frame['-webkit-transform'] = m1.tween(m2, progress, Tweenable.prototype.formula[options.timingFunction]);
		
		keyframes[parseInt(progress*100)+'%'] = frame;
	}
	
	// Ensure the last frame has been added
	keyframes['100%'] = to;
	
	// Add the new animation to the document
	this.css = createAnimationCSS(keyframes, animName);
	addKeyframeRule(this.css);
	
	// Set the final position as this should be a transition not an animation & the element should end in the 'to' state
	for(rule in to) 
		elem.style[this.util.toCamel(rule)] = to[rule];
	
	// Trigger the animation
	elem.addEventListener('webkitAnimationEnd', animationEndListener);
	elem.style.webkitAnimationDuration = options.duration;
	elem.style.webkitAnimationTimingFunction = 'linear';
	elem.style.webkitAnimationName = animName;
	
	// Print the animation to the console if the debug switch is given
	if(options.debug && window.console && window.console.log)
		console.log(createAnimationCSS(keyframes, animName));
};