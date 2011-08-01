/**
 * @preserve Morf v0.1.5 (pre release)
 * http://www.joelambert.co.uk/morf
 *
 * Copyright 2011, Joe Lambert.
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

var Morf = function(elem, css, opts) {
	var from = {}, to = {},
		
	fromElem = document.createElement('div'),
	toElem 	 = document.createElement('div'),
		
	options = {
		timingFunction: 'ease',
		duration: null,
		increment: 0.01,
		debug: false,
		optimise: true, // Whether the outputted CSS should be optimised
		decimalPlaces: 5 // How many decimal places to optimise the WebKitCSSMatrix output to
	},
		
	// Define all other var's used in the function
	i = rule = ruleName = camel = m1 = m2 = progress = frame = rule = transEvent = val = null, cacheKey = '',
	
	// Setup a scoped reference to ourselves
	_this = this,
	
	keyframes = {},
	
	// Create a unique name for this animation
	animName = 'anim'+(new Date().getTime()),
	

	/* --- Helper Functions ------------------------------------------------------------------- */
	
	// Event listener for the webkitAnimationEnd Event
	animationEndListener = function(event){
		elem.removeEventListener('webkitAnimationEnd', animationEndListener, true);
		
		// Dispatch a faux webkitTransitionEnd event to complete the appearance of this being a transition rather than an animation
		// TODO: Should we throw an event for each property changed? (event.propertyName = 'opacity' etc)
		transEvent = document.createEvent("Event");
		transEvent.initEvent("webkitTransitionEnd", true, true);
		elem.dispatchEvent(transEvent);
		
		// Reset transition effects after use
		elem.style.webkitTransitionTimingFunction = null;
		elem.style.webkitTransitionDuration = 0;
		
		if (options.callback) {
			options.callback(elem);
		}
	},
	
	// Adds the CSS to the current page
	addKeyframeRule = function(rule) {
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
		
		return options.optimise ? optimiseCSS(str+' }') : str+' }';
	},
	
	// Replaces scale(0) with 0.0001 to get around the inability to these decompose matrix
	sanityCheckTransformString = function(str) {
		var scale = str.match(/scale[Y|X|Z]*\([0-9, ]*0[,0-9 ]*\)/g),
			i = 0;
		
		if(scale)
		{
			// There might be multiple scale() properties in the string
			for(i = 0; i < scale.length; i++)
				str = str.replace(scale[i], scale[i].replace(/([^0-9])0([^0.9])/g, "$10.0001$2"));
		}
		
		return str;
	},
	
	// WebKitCSSMatrix toString() ALWAYS outputs numbers to 5 decimal places - this helps optimise the string
	optimiseCSS = function(str, decimalPlaces) {
		decimalPlaces = typeof options.decimalPlaces == 'number' ? options.decimalPlaces : 5;
		var matches = str.match(/[0-9\.]+/gm), 
			i = 0;
		
		if(matches)
		{
			for(i = 0; i < matches.length; i++)
				str = str.replace(matches[i], parseFloat( parseFloat(matches[i]).toFixed(decimalPlaces)));
		}
		
		return str;
	};
	
	/* --- Helper Functions End --------------------------------------------------------------- */	
	
	
	// Import the options	
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
		
		// Listen for the transitionEnd event to fire the callback if needed
		var transitionEndListener = function(event) {
			elem.removeEventListener('webkitTransitionEnd', transitionEndListener, true);
			
			// Clean up after ourself
			elem.style.webkitTransitionDuration = 0;
			elem.style.webkitTransitionTimingFunction = null;
			
			if (options.callback) {
				// Delay execution to ensure the clean up CSS has taken effect
				setTimeout(function() {
					options.callback(elem);
				}, 10);
			}
		};
		
		elem.addEventListener('webkitTransitionEnd', transitionEndListener, true);
		
		setTimeout(function() {
			for(rule in css) {
				camel = _this.util.toCamel(rule);	
				elem.style[camel] = css[rule];
			}
		}, 10);
		
		this.css = '';
		
		return;	
	}
	else
	{
		// Reset transition properties for this element
		elem.style.webkitTransitionTimingFunction = null;
		elem.style.webkitTransitionDuration = 0;
	}
	
	// Create the key used to cache this animation
	cacheKey += options.timingFunction;
	
	// Setup the start and end CSS state
	for(rule in css)
	{
		camel = this.util.toCamel(rule);
		
		toElem.style[camel] = css[rule];

		// Set the from/start state				
		from[rule] = (camel == 'WebkitTransform') ? new WebKitCSSMatrix( sanityCheckTransformString( window.getComputedStyle(elem)['-webkit-transform'] ) )	: window.getComputedStyle(elem)[rule];
	
		// Set the to/end state
		to[rule]   = (camel == 'WebkitTransform') ? new WebKitCSSMatrix( sanityCheckTransformString( toElem.style.WebkitTransform ) ) : toElem.style[camel];
		
		// Shifty requires numeric values to be a number rather than a string (e.g. for opacity)
		from[rule] = from[rule] == (val = parseInt(from[rule], 10)) ? val : from[rule];
		to[rule]   = to[rule] 	== (val = parseInt(from[rule], 10)) ? val : to[rule];
		
		// Update the cacheKey
		cacheKey += ';' + rule + ':' + from[rule] + '->' + to[rule];
	}
		
	// Check the cache to save expensive calculations
	if(Morf.cache[cacheKey])
	{
		this.css = Morf.cache[cacheKey].css;
		animName = Morf.cache[cacheKey].name;
	}
	else
	{
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

			keyframes[parseInt(progress*100, 10)+'%'] = frame;
		}

		// Ensure the last frame has been added
		keyframes['100%'] = to;

		// Add the new animation to the document
		this.css = createAnimationCSS(keyframes, animName);
		addKeyframeRule(this.css);

		Morf.cache[cacheKey] = {css: this.css, name: animName};
	}
	
	// Set the final position state as this should be a transition not an animation & the element should end in the 'to' state
	for(rule in to) 
		elem.style[this.util.toCamel(rule)] = to[rule];
	
	// Trigger the animation
	elem.addEventListener('webkitAnimationEnd', animationEndListener, true);
	elem.style.webkitAnimationDuration = options.duration;
	elem.style.webkitAnimationTimingFunction = 'linear';
	elem.style.webkitAnimationName = animName;
	
	// Print the animation to the console if the debug switch is given
	if(options.debug && window.console && window.console.log)
		console.log(this.css);
};


/**
 * Convenience function for triggering a transition
 * @param {HTMLDom} elem The element to apply the transition to
 * @param {Object} css Key value pair of CSS properties
 * @param {Object} opts Additional configuration options
 * 
 * Configuration options
 * -	timingFunction: {String} Name of the easing function to perform
 * -	duration: {integer} Duration in ms
 * -	increment: {float} How frequently to generate keyframes (Defaults to 0.01, which is every 1%)
 * -	debug: {Boolean} Should the generated CSS Animation be printed to the console  
 *  
 * @returns {Morf} An instance of the Morf object
 */

Morf.transition = function(elem, css, opts){
	return new Morf(elem, css, opts);
};

/**
 * Object to cache generated animations
 */
Morf.cache = {};

/**
 * Current version
 */
Morf.version = '0.1.5 (pre release)';

// Utilities Placeholder
Morf.prototype.util = {};


/**
 * Converts a DOM style string to CSS property name
 * @param {String} str A DOM style string
 * @returns {String} CSS property name
 */

Morf.prototype.util.toDash = function(str){
	str = str.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
	return /^webkit/.test(str) ? '-'+str : str;
};


/**
 * Converts a CSS property name to DOM style string
 * @param {String} str A CSS property name
 * @returns {String} DOM style string
 */

Morf.prototype.util.toCamel = function(str){
	return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

// Wrap this functionality up to prevent poluting the global namespace
(function(){


/**
 * A 4 dimensional vector
 * @author Joe Lambert
 * @constructor
 */

var Vector4 = function(x, y, z, w)
{
	this.x = x ? x : 0;
	this.y = y ? y : 0;
	this.z = z ? z : 0;
	this.w = w ? w : 0;
	
	
	/**
	 * Ensure that values are not undefined
	 * @author Joe Lambert
	 * @returns null
	 */
	
	this.checkValues = function() {
		this.x = this.x ? this.x : 0;
		this.y = this.y ? this.y : 0;
		this.z = this.z ? this.z : 0;
		this.w = this.w ? this.w : 0;
	};
	
	
	/**
	 * Get the length of the vector
	 * @author Joe Lambert
	 * @returns {float}
	 */
	
	this.length = function() {
		this.checkValues();
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	};
	
	
	/**
	 * Get a normalised representation of the vector
	 * @author Joe Lambert
	 * @returns {Vector4}
	 */
	
	this.normalise = function() {
		var len = this.length(),
			v = new Vector4(this.x / len, this.y / len, this.z / len);
		
		return v;
	};


	/**
	 * Vector Dot-Product
	 * @param {Vector4} v The second vector to apply the product to
	 * @author Joe Lambert
	 * @returns {float} The Dot-Product of this and v.
	 */

	this.dot = function(v) {
		return this.x*v.x + this.y*v.y + this.z*v.z + this.w*v.w;
	};
	
	
	/**
	 * Vector Cross-Product
	 * @param {Vector4} v The second vector to apply the product to
	 * @author Joe Lambert
	 * @returns {Vector4} The Cross-Product of this and v.
	 */
	
	this.cross = function(v) {
		return new Vector4(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x);
	};
	

	/**
	 * Helper function required for matrix decomposition
	 * A Javascript implementation of pseudo code available from http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
	 * @param {Vector4} aPoint A 3D point
	 * @param {float} ascl 
	 * @param {float} bscl
	 * @author Joe Lambert
	 * @returns {Vector4}
	 */
	
	this.combine = function(aPoint, ascl, bscl) {
		return new Vector4( (ascl * this.x) + (bscl * aPoint.x), 
							(ascl * this.y) + (bscl * aPoint.y), 
							(ascl * this.z) + (bscl * aPoint.z) );
	}
};


/**
 * Object containing the decomposed components of a matrix
 * @author Joe Lambert
 * @constructor
 */

var CSSMatrixDecomposed = function(obj) {
	obj === undefined ? obj = {} : null;
	var components = {perspective: null, translate: null, skew: null, scale: null, rotate: null};
	
	for(var i in components)
		this[i] = obj[i] ? obj[i] : new Vector4();

	/**
	 * Tween between two decomposed matrices
	 * @param {CSSMatrixDecomposed} dm The destination decomposed matrix
	 * @param {float} progress A float value between 0-1, representing the percentage of completion
	 * @param {function} fn An easing function following the prototype function(pos){}
	 * @author Joe Lambert
	 * @returns {WebKitCSSMatrix} A new matrix for the tweened state
	 */
		
	this.tween = function(dm, progress, fn) {
		if(fn === undefined)
			fn = function(pos) {return pos;}; // Default to a linear easing
		
		if(!dm)
			dm = new CSSMatrixDecomposed(new WebKitCSSMatrix().decompose());
		
		var r = new CSSMatrixDecomposed(),
			i = index = null,
			trans = '';
		
		progress = fn(progress);

		for(index in components)
			for(i in {x:'x', y:'y', z:'z', w:'w'})
				r[index][i] = (this[index][i] + (dm[index][i] - this[index][i]) * progress ).toFixed(5);

		trans = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, '+r.perspective.x+', '+r.perspective.y+', '+r.perspective.z+', '+r.perspective.w+') ' +
				'translate3d('+r.translate.x+'px, '+r.translate.y+'px, '+r.translate.y+'px) ' +
				'rotateX('+r.rotate.x+'rad) rotateY('+r.rotate.y+'rad) rotateZ('+r.rotate.z+'rad) ' +
				'matrix3d(1,0,0,0, 0,1,0,0, 0,'+r.skew.z+',1,0, 0,0,0,1) ' +
				'matrix3d(1,0,0,0, 0,1,0,0, '+r.skew.y+',0,1,0, 0,0,0,1) ' +
				'matrix3d(1,0,0,0, '+r.skew.x+',1,0,0, 0,0,1,0, 0,0,0,1) ' +
				'scale3d('+r.scale.x+', '+r.scale.y+', '+r.scale.z+')';

		try { r = new WebKitCSSMatrix(trans); return r; }
		catch(e) { console.error('Invalid matrix string: '+trans); return '' };
	};
};


/**
 * Tween between two matrices
 * @param {WebKitCSSMatrix} matrix The destination matrix
 * @param {float} progress A float value between 0-1, representing the percentage of completion
 * @param {function} fn An easing function following the prototype function(pos){}
 * @author Joe Lambert
 * @returns {WebKitCSSMatrix} A new matrix for the tweened state
 */

WebKitCSSMatrix.prototype.tween = function(matrix, progress, fn) {
	if(fn === undefined)
		fn = function(pos) {return pos;}; // Default to a linear easing
	
	var m = new WebKitCSSMatrix,
		m1 = this.decompose(),
		m2 = matrix.decompose(),
		r = m.decompose()
		trans = '',
		index = i = null;
	
	// Tween between the two decompositions
	return m1.tween(m2, progress, fn);
};


/**
 * Transform a Vector4 object using the current matrix
 * @param {Vector4} v The vector to transform
 * @author Joe Lambert
 * @returns {Vector4} The transformed vector
 */

WebKitCSSMatrix.prototype.transformVector = function(v) {
	// TODO: Do we need to mod this for Vector4?
	return new Vector4(	this.m11*v.x + this.m12*v.y + this.m13*v.z, 
						this.m21*v.x + this.m22*v.y + this.m23*v.z, 
						this.m31*v.x + this.m32*v.y + this.m33*v.z );
};


/**
 * Transposes the matrix
 * @author Joe Lambert
 * @returns {WebKitCSSMatrix} The transposed matrix
 */

WebKitCSSMatrix.prototype.transpose = function() {
	var matrix = new WebKitCSSMatrix(), n = m = 0;
	
	for (n = 0; n <= 4-2; n++)
	{
		for (m = n + 1; m <= 4-1; m++)
		{
			matrix['m'+(n+1)+(m+1)] = this['m'+(m+1)+(n+1)];
			matrix['m'+(m+1)+(n+1)] = this['m'+(n+1)+(m+1)];
		}
	}
	
	return matrix;
};


/**
 * Calculates the determinant
 * @author Joe Lambert
 * @returns {float} The determinant of the matrix
 */

WebKitCSSMatrix.prototype.determinant = function() {
	return 	this.m14 * this.m23 * this.m32 * this.m41-this.m13 * this.m24 * this.m32 * this.m41 -
			this.m14 * this.m22 * this.m33 * this.m41+this.m12 * this.m24 * this.m33 * this.m41 +
			this.m13 * this.m22 * this.m34 * this.m41-this.m12 * this.m23 * this.m34 * this.m41 -
			this.m14 * this.m23 * this.m31 * this.m42+this.m13 * this.m24 * this.m31 * this.m42 +
			this.m14 * this.m21 * this.m33 * this.m42-this.m11 * this.m24 * this.m33 * this.m42 -
			this.m13 * this.m21 * this.m34 * this.m42+this.m11 * this.m23 * this.m34 * this.m42 +
			this.m14 * this.m22 * this.m31 * this.m43-this.m12 * this.m24 * this.m31 * this.m43 -
			this.m14 * this.m21 * this.m32 * this.m43+this.m11 * this.m24 * this.m32 * this.m43 +
			this.m12 * this.m21 * this.m34 * this.m43-this.m11 * this.m22 * this.m34 * this.m43 -
			this.m13 * this.m22 * this.m31 * this.m44+this.m12 * this.m23 * this.m31 * this.m44 +
			this.m13 * this.m21 * this.m32 * this.m44-this.m11 * this.m23 * this.m32 * this.m44 -
			this.m12 * this.m21 * this.m33 * this.m44+this.m11 * this.m22 * this.m33 * this.m44;
};


/**
 * Decomposes the matrix into its component parts.
 * A Javascript implementation of the pseudo code available from http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
 * @author Joe Lambert
 * @returns {Object} An object with each of the components of the matrix (perspective, translate, skew, scale, rotate) or identity matrix on failure
 */

WebKitCSSMatrix.prototype.decompose = function() {
	var matrix = new WebKitCSSMatrix(this.toString()),
		perspectiveMatrix = rightHandSide = inversePerspectiveMatrix = transposedInversePerspectiveMatrix =
		perspective = translate = row = i = scale = skew = pdum3 =  rotate = null;
	
	if (matrix.m33 == 0)
	    return new CSSMatrixDecomposed(new WebKitCSSMatrix().decompose()); // Return the identity matrix

	// Normalize the matrix.
	for (i = 1; i <= 4; i++)
	    for (j = 1; j <= 4; j++)
	        matrix['m'+i+j] /= matrix.m44;

	// perspectiveMatrix is used to solve for perspective, but it also provides
	// an easy way to test for singularity of the upper 3x3 component.
	perspectiveMatrix = matrix;

	for (i = 1; i <= 3; i++)
	    perspectiveMatrix['m'+i+'4'] = 0;

	perspectiveMatrix.m44 = 1;

	if (perspectiveMatrix.determinant() == 0)
	    return new CSSMatrixDecomposed(new WebKitCSSMatrix().decompose()); // Return the identity matrix

	// First, isolate perspective.
	if (matrix.m14 != 0 || matrix.m24 != 0 || matrix.m34 != 0)
	{
	    // rightHandSide is the right hand side of the equation.
		rightHandSide = new Vector4(matrix.m14, matrix.m24, matrix.m34, matrix.m44);
		
	    // Solve the equation by inverting perspectiveMatrix and multiplying
	    // rightHandSide by the inverse.
	    inversePerspectiveMatrix 			= perspectiveMatrix.inverse();
	    transposedInversePerspectiveMatrix 	= inversePerspectiveMatrix.transpose();
	    perspective 						= transposedInversePerspectiveMatrix.transformVector(rightHandSide);

	     // Clear the perspective partition
	    matrix.m14 = matrix.m24 = matrix.m34 = 0;
	    matrix.m44 = 1;
	}
	else
	{
		// No perspective.
		perspective = new Vector4(0,0,0,1);
	}

	// Next take care of translation
	translate = new Vector4(matrix.m41, matrix.m42, matrix.m43);

	matrix.m41 = 0;
	matrix.m42 = 0;
	matrix.m43 = 0;	
	
	// Now get scale and shear. 'row' is a 3 element array of 3 component vectors
	row = [
		new Vector4(), new Vector4(), new Vector4()
	];
	
	for (i = 1; i <= 3; i++)
	{
		row[i-1].x = matrix['m'+i+'1'];
	    row[i-1].y = matrix['m'+i+'2'];
	    row[i-1].z = matrix['m'+i+'3'];
	}

	// Compute X scale factor and normalize first row.
	scale = new Vector4();
	skew = new Vector4();
	
	scale.x = row[0].length();
	row[0] = row[0].normalise();
	
	// Compute XY shear factor and make 2nd row orthogonal to 1st.
	skew.x = row[0].dot(row[1]);
	row[1] = row[1].combine(row[0], 1.0, -skew.x);
	
	// Now, compute Y scale and normalize 2nd row.
	scale.y = row[1].length();
	row[1] = row[1].normalise();
	skew.x /= scale.y;
	
	// Compute XZ and YZ shears, orthogonalize 3rd row
	skew.y = row[0].dot(row[2]);
	row[2] = row[2].combine(row[0], 1.0, -skew.y);
	skew.z = row[1].dot(row[2]);
	row[2] = row[2].combine(row[1], 1.0, -skew.z);
	
	// Next, get Z scale and normalize 3rd row.
	scale.z = row[2].length();
	row[2] = row[2].normalise();
	skew.y /= scale.z;
	skew.y /= scale.z;
	
	// At this point, the matrix (in rows) is orthonormal.
	// Check for a coordinate system flip.  If the determinant
	// is -1, then negate the matrix and the scaling factors.
	pdum3 = row[1].cross(row[2])
	if (row[0].dot(pdum3) < 0)
	{
		for (i = 0; i < 3; i++)
		{
	        scale.x *= -1;
	        row[i].x *= -1;
	        row[i].y *= -1;
	        row[i].z *= -1;	
		}
	}

	// Now, get the rotations out
	rotate = new Vector4();
	rotate.y = Math.asin(-row[0].z);
	if (Math.cos(rotate.y) != 0)
	{
		rotate.x = Math.atan2(row[1].z, row[2].z);
		rotate.z = Math.atan2(row[0].y, row[0].x);
	}
	else
	{
		rotate.x = Math.atan2(-row[2].x, row[1].y);
		rotate.z = 0;
	}
	
	return new CSSMatrixDecomposed({
		perspective: perspective,
		translate: translate,
		skew: skew,
		scale: scale,
		rotate: rotate
	});
};


})();

/**
Mifty - A custom build of Shifty for use with Morf.js.
By Jeremy Kahn - jeremyckahn@gmail.com
  v0.4.1

For instructions on how to use Shifty, please consult the README: https://github.com/jeremyckahn/shifty/blob/master/README.md

MIT Lincense.  This code free to use, modify, distribute and enjoy.

*/

(function(e){function a(){return+new Date}function b(a,c){for(var j in a)a.hasOwnProperty(j)&&c(a,j)}function h(a,c){b(c,function(c,f){a[f]=c[f]});return a}function k(a,c){b(c,function(c,f){typeof a[f]==="undefined"&&(a[f]=c[f])});return a}function i(a,c,j){var f,a=(a-c.timestamp)/c.duration;for(f in j.current)j.current.hasOwnProperty(f)&&c.to.hasOwnProperty(f)&&(j.current[f]=c.originalState[f]+(c.to[f]-c.originalState[f])*c.easingFunc(a));return j.current}function n(a,c,j,f){var b;for(b=0;b<c[a].length;b++)c[a][b].apply(j,
f)}function l(a,c,j){b(e.Tweenable.prototype.filter,function(b,e){b[e][a]&&b[e][a].apply(c,j)})}function m(d,c){var b;b=a();b<d.timestamp+d.duration&&c.isAnimating?(l("beforeTween",d.owner,[c.current,d.originalState,d.to]),i(b,d,c),l("afterTween",d.owner,[c.current,d.originalState,d.to]),d.hook.step&&n("step",d.hook,d.owner,[c.current]),d.step.call(c.current),c.loopId=setTimeout(function(){m(d,c)},1E3/d.owner.fps)):d.owner.stop(!0)}function g(a){a=a||{};this._hook={};this._tweenParams={owner:this,
hook:this._hook};this._state={};this._state.current=a.initialState||{};this.fps=a.fps||30;this.easing=a.easing||"linear";this.duration=a.duration||500;return this}g.prototype.tween=function(d,c,b,e,g){var i=this;if(!this._state.isAnimating)return this._state.loopId=0,this._state.pausedAtTime=null,c?(this._tweenParams.step=function(){},this._state.current=d||{},this._tweenParams.to=c||{},this._tweenParams.duration=b||this.duration,this._tweenParams.callback=e||function(){},this._tweenParams.easing=
g||this.easing):(this._tweenParams.step=d.step||function(){},this._tweenParams.callback=d.callback||function(){},this._state.current=d.from||{},this._tweenParams.to=d.to||d.target||{},this._tweenParams.duration=d.duration||this.duration,this._tweenParams.easing=d.easing||this.easing),this._tweenParams.timestamp=a(),this._tweenParams.easingFunc=this.formula[this._tweenParams.easing]||this.formula.linear,k(this._state.current,this._tweenParams.to),k(this._tweenParams.to,this._state.current),l("tweenCreated",
this._tweenParams.owner,[this._state.current,this._tweenParams.originalState,this._tweenParams.to]),this._tweenParams.originalState=h({},this._state.current),this._state.isAnimating=!0,setTimeout(function(){m(i._tweenParams,i._state)},1E3/this.fps),this};g.prototype.to=function(a,c,b,e){typeof c==="undefined"?(a.from=this.get(),this.tween(a)):this.tween(this.get(),a,c,b,e);return this};g.prototype.get=function(){return this._state.current};g.prototype.set=function(a){this._state.current=a||{};return this};
g.prototype.stop=function(a){clearTimeout(this._state.loopId);this._state.isAnimating=!1;a&&(h(this._state.current,this._tweenParams.to),this._tweenParams.callback.call(this._state.current));return this};g.prototype.pause=function(){clearTimeout(this._state.loopId);this._state.pausedAtTime=a();this._state.isPaused=!0;return this};g.prototype.resume=function(){var a=this;this._state.isPaused&&(this._tweenParams.timestamp+=this._state.pausedAtTime-this._tweenParams.timestamp);setTimeout(function(){m(a._tweenParams,
a._state)},1E3/this.fps);return this};g.prototype.hookAdd=function(a,c){this._hook.hasOwnProperty(a)||(this._hook[a]=[]);this._hook[a].push(c)};g.prototype.hookRemove=function(a,c){var b;if(this._hook.hasOwnProperty(a))if(c)for(b=this._hook[a].length;b>=0;b++)this._hook[a][b]===c&&this._hook[a].splice(b,1);else this._hook[a]=[]};g.prototype.filter={};g.util={now:a,each:b,tweenProps:i,applyFilter:l,simpleCopy:h};g.prototype.formula={linear:function(a){return a}};e.Tweenable=g})(this);
(function(e){e.Tweenable.util.simpleCopy(e.Tweenable.prototype.formula,{easeInQuad:function(a){return Math.pow(a,2)},easeOutQuad:function(a){return-(Math.pow(a-1,2)-1)},easeInOutQuad:function(a){if((a/=0.5)<1)return 0.5*Math.pow(a,2);return-0.5*((a-=2)*a-2)},easeInCubic:function(a){return Math.pow(a,3)},easeOutCubic:function(a){return Math.pow(a-1,3)+1},easeInOutCubic:function(a){if((a/=0.5)<1)return 0.5*Math.pow(a,3);return 0.5*(Math.pow(a-2,3)+2)},easeInQuart:function(a){return Math.pow(a,4)},easeOutQuart:function(a){return-(Math.pow(a-
1,4)-1)},easeInOutQuart:function(a){if((a/=0.5)<1)return 0.5*Math.pow(a,4);return-0.5*((a-=2)*Math.pow(a,3)-2)},easeInQuint:function(a){return Math.pow(a,5)},easeOutQuint:function(a){return Math.pow(a-1,5)+1},easeInOutQuint:function(a){if((a/=0.5)<1)return 0.5*Math.pow(a,5);return 0.5*(Math.pow(a-2,5)+2)},easeInSine:function(a){return-Math.cos(a*(Math.PI/2))+1},easeOutSine:function(a){return Math.sin(a*(Math.PI/2))},easeInOutSine:function(a){return-0.5*(Math.cos(Math.PI*a)-1)},easeInExpo:function(a){return a==
0?0:Math.pow(2,10*(a-1))},easeOutExpo:function(a){return a==1?1:-Math.pow(2,-10*a)+1},easeInOutExpo:function(a){if(a==0)return 0;if(a==1)return 1;if((a/=0.5)<1)return 0.5*Math.pow(2,10*(a-1));return 0.5*(-Math.pow(2,-10*--a)+2)},easeInCirc:function(a){return-(Math.sqrt(1-a*a)-1)},easeOutCirc:function(a){return Math.sqrt(1-Math.pow(a-1,2))},easeInOutCirc:function(a){if((a/=0.5)<1)return-0.5*(Math.sqrt(1-a*a)-1);return 0.5*(Math.sqrt(1-(a-=2)*a)+1)},easeOutBounce:function(a){return a<1/2.75?7.5625*
a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+0.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+0.9375:7.5625*(a-=2.625/2.75)*a+0.984375},easeInBack:function(a){return a*a*(2.70158*a-1.70158)},easeOutBack:function(a){return(a-=1)*a*(2.70158*a+1.70158)+1},easeInOutBack:function(a){var b=1.70158;if((a/=0.5)<1)return 0.5*a*a*(((b*=1.525)+1)*a-b);return 0.5*((a-=2)*a*(((b*=1.525)+1)*a+b)+2)},elastic:function(a){return-1*Math.pow(4,-8*a)*Math.sin((a*6-1)*2*Math.PI/2)+1},swingFromTo:function(a){var b=1.70158;return(a/=0.5)<
1?0.5*a*a*(((b*=1.525)+1)*a-b):0.5*((a-=2)*a*(((b*=1.525)+1)*a+b)+2)},swingFrom:function(a){return a*a*(2.70158*a-1.70158)},swingTo:function(a){return(a-=1)*a*(2.70158*a+1.70158)+1},bounce:function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+0.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+0.9375:7.5625*(a-=2.625/2.75)*a+0.984375},bouncePast:function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?2-(7.5625*(a-=1.5/2.75)*a+0.75):a<2.5/2.75?2-(7.5625*(a-=2.25/2.75)*a+0.9375):2-(7.5625*(a-=2.625/2.75)*
a+0.984375)},easeFromTo:function(a){if((a/=0.5)<1)return 0.5*Math.pow(a,4);return-0.5*((a-=2)*Math.pow(a,3)-2)},easeFrom:function(a){return Math.pow(a,4)},easeTo:function(a){return Math.pow(a,0.25)}})})(this);
(function(e){if(e.Tweenable)e.Tweenable.util.interpolate=function(a,b,h,k){var i;if(a&&a.from)b=a.to,h=a.position,k=a.easing,a=a.from;i=e.Tweenable.util.simpleCopy({},a);e.Tweenable.util.applyFilter("tweenCreated",i,[i,a,b]);e.Tweenable.util.applyFilter("beforeTween",i,[i,a,b]);h=e.Tweenable.util.tweenProps(h,{originalState:a,to:b,timestamp:0,duration:1,easingFunc:e.Tweenable.prototype.formula[k]||e.Tweenable.prototype.formula.linear},{current:i});e.Tweenable.util.applyFilter("afterTween",h,[h,a,
b]);return h},e.Tweenable.prototype.interpolate=function(a,b,h){a=e.Tweenable.util.interpolate(this.get(),a,b,h);this.set(a);return a}})(this);

/**
 * @preserve 
 * Extra easing functions borrowed from scripty2 (c) 2005-2010 Thomas Fuchs (MIT Licence) 
 * https://raw.github.com/madrobby/scripty2/master/src/effects/transitions/transitions.js
 */

(function(){
	var scripty2 = {
		spring: function(pos) {
			return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
		},

		sinusoidal: function(pos) {
			return (-Math.cos(pos*Math.PI)/2) + 0.5;
		}
	};
	
	// Load the Scripty2 functions
	for(var t in scripty2)
		Tweenable.prototype.formula[t] = scripty2[t];
})();


