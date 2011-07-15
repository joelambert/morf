/**
 * @preserve Morf v0.1
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
		debug: false
	},
		
	// Define all other var's used in the function
	i = rule = ruleName = camel = m1 = m2 = progress = frame = rule = transEvent = null,
	
	// Setup a scoped reference to ourselves
	_this = this,
	
	keyframes = {},
	
	// Create a unique name for this animation
	animName = 'anim'+(new Date().getTime());
	

	/* --- Helper Functions ------------------------------------------------------------------- */
	
	// Event listener for the webkitAnimationEnd Event
	animationEndListener = function(event){
		// Dispatch a faux webkitTransitionEnd event to complete the appearance of this being a transition rather than an animation
		elem.removeEventListener('webkitAnimationEnd', animationEndListener, true);
		transEvent = document.createEvent("Event");
		transEvent.initEvent("webkitTransitionEnd", true, true);
		elem.dispatchEvent(transEvent);
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
		
		return str + " }";
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
		
		for(rule in css) {
			camel = this.util.toCamel(rule);	
			elem.style[camel] = css[rule];
		}
		
		this.css = '';
		
		return;	
	}
	else
	{
		// Reset transition properties for this element
		elem.style.webkitTransitionTimingFunction = null;
		elem.style.webkitTransitionDuration = 0;
	}
	
	// Setup the start and end CSS state
	for(rule in css)
	{
		camel = this.util.toCamel(rule);	
		
		toElem.style[camel] = css[rule];

		// Set the from/start state	
		from[this.util.toDash(camel)] = (camel == 'WebkitTransform') ? new WebKitCSSMatrix(elem.style.WebkitTransform) 	: elem.style[camel];
	
		// Set the to/end state
		to[this.util.toDash(camel)]	  = (camel == 'WebkitTransform') ? new WebKitCSSMatrix(toElem.style.WebkitTransform) : toElem.style[camel];
	}

	
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
	
	// Set the final position state as this should be a transition not an animation & the element should end in the 'to' state
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
}

/**
 * Current version
 */
Morf.version = '0.1';;

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
};;

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
			
		var r = new CSSMatrixDecomposed(),
			i = index = null,
			trans = '';
		
		progress = fn(progress);

		for(index in components)
			for(i in {x:'x', y:'y', z:'z', w:'w'})
				r[index][i] = parseFloat((this[index][i] + (dm[index][i] - this[index][i]) * progress ).toFixed(10));

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
 * @returns {Object} An object with each of the components of the matrix (perspective, translate, skew, scale, rotate)
 */

WebKitCSSMatrix.prototype.decompose = function() {
	var matrix = new WebKitCSSMatrix(this.toString()),
		perspectiveMatrix = rightHandSide = inversePerspectiveMatrix = transposedInversePerspectiveMatrix =
		perspective = translate = row = i = scale = skew = pdum3 =  rotate = null;
	
	// Normalize the matrix.
	if (matrix.m33 == 0)
	    return false;


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
	    return false;

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


})();;

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
;

