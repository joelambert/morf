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
