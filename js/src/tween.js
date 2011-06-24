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
		
		// List of properties that can be modified and the function which handles the values
		allowedProps = {
			WebkitTransform: true,
			width: 			length,
			height: 		length,
			marginTop: 		length,
			marginBottom: 	length,
			marginLeft: 	length,
			marginRight: 	length,
			paddingTop: 	length,
			paddingBottom: 	length,
			paddingLeft: 	length,
			paddingRight: 	length,
			opacity: 		opacity,
			borderWidth: 	length 
		},
		options = {
			timingFunction: 'ease',
			duration: null,
			increment: 0.01,
			debug: false
		},
		
	// Define all other var's used in the function
	i = rule = ruleName = camel = m1 = m2 = progress = frame = rule = transEvent = null,
	
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
			camel = rule.toCamel();	
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
		camel = rule.toCamel();	
		
		toElem.style[camel] = css[rule];
		
		if(allowedProps[camel] !== undefined)
		{
			// Set the from/start state	
			from[camel] = (camel == 'WebkitTransform') ? new WebKitCSSMatrix(elem.style.WebkitTransform) : allowedProps[camel](elem.style[rule]);

			// Set the to/end state
			to[camel] 	= (camel == 'WebkitTransform') ? new WebKitCSSMatrix(toElem.style.WebkitTransform) : allowedProps[camel](css[rule]);
		}
	}
	
	// --- At this point we know that our CSS values are in DOM style camelCase ----------------
	
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
				fStr += '\t\t'+rule.toDash()+': '+f[rule]+';\n';
			
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
	if(from['WebkitTransform'])
	{
		m1 = from.WebkitTransform.decompose();
		m2 = to.WebkitTransform.decompose();
	}
	
	// Produce style keyframes
	for(progress = 0; progress <= 1; progress += options.increment) {
		frame = {};

		for(ruleName in from) {
			rule = from[ruleName];
			if(ruleName === 'WebkitTransform')
				frame[ruleName] = m1.tween(m2, progress, this.fn[options.timingFunction]);
			else
				frame[ruleName] = rule.tween(to[ruleName], progress, this.fn[options.timingFunction]);
		}
		
		keyframes[parseInt(progress*100)+'%'] = frame;
	}
	
	// Ensure the last frame has been added
	keyframes['100%'] = to;
	
	// Add the new animation to the document
	this.css = createAnimationCSS(keyframes, animName);
	addKeyframeRule(this.css);
	
	// Set the final position from as this should be a transition not an animation
	for(rule in to) 
		elem.style[rule] = to[rule];
	
	// Trigger the animation
	elem.addEventListener('webkitAnimationEnd', animationEndListener);
	elem.style.webkitAnimationDuration = options.duration;
	elem.style.webkitAnimationTimingFunction = 'linear';
	elem.style.webkitAnimationName = animName;

	if(options.debug && window.console && window.console.log)
		console.log(createAnimationCSS(keyframes, animName));
};

// Setup a placeholder to load custom easing functions
Tween.prototype.fn = {};



String.prototype.tween = function(dest, progress, fn){
	var v1 = parseInt(this), v2 = parseInt(dest);
	return parseInt(v1 + ((v2-v1) * fn(progress))) + "px";
};

Number.prototype.tween = function(dest, progress, fn){
	return parseFloat(this + ((dest-this) * fn(progress)));
};

String.prototype.toDash = function(){
	var str = this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
	return /^webkit/.test(str) ? '-'+str : str;
};

String.prototype.toCamel = function(){
	return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};