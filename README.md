# Morf.js

Morf.js is a Javascript work-around for hardware accelerated CSS3 transitions with custom easing functions. Ever wanted to produce CSS transitions with more compelling effects than just `linear`, `ease`, `ease-out`, `ease-in` or `cubic-bezier`? Well now you can!

[View Demo](http://www.joelambert.co.uk/morf)

# Requirements
Morf requires the following:

- A WebKit browser capable of CSS Animations (Morf uses `@keyframes` animations under the hood)
- Shifty.js (>= 0.1.3) - Morf can be downloaded with or without Shifty pre-bundled

## Why is this WebKit only?

Although other browser vendors have started to add CSS Animations (e.g. Firefox 5) they do not yet have an alternative implementation for the `WebKitCSSMatrix` object which is used to calculate the interpolated matrix values.

# How do I use it?

Using it is simple but does require that you trigger the transition from Javascript. To transition an element to a new state you would do the following:
	
	// Get a reference to the element
	var elem = document.getElementById('elem');
	
	var trans = Morf.transition(elem, {
			// New CSS state
			'-webkit-transform': 'translate3d(300px, 0, 0) rotate(90deg)',
			'background-color': '#FF0000'
		}, {
			duration: '1500ms',
			timingFunction: 'bounce',
			callback: function () {
				// You can optionally add a callback option for when the animation completes.
			}
		});

Thats it! Your element will then transition right 300px, rotate 90deg & change colour to red using the `bounce` easing function.  If you would like to invoke a function when the animation completes, you can do so with the `callback` option or listen for the `webkitTransitionEnd` event.

##Using morf.js as a CSS3 Animation Generator

You may also just want to use Morf as a CSS animation generator, in which case you can get the generated keyframes in CSS format using the `.css` property. So, continuing the above example:

	console.log(trans.css);

You can then paste the `@keyframes` code straight into your stylesheet and use it as normal, without the need for Javascript.

##Available easing functions

All of [Robert Penner](http://www.robertpenner.com/easing/)'s easing functions are available (via [Shifty.js](https://github.com/jeremyckahn/shifty))

- `easeInQuad`
- `easeOutQuad`
- `easeInOutQuad`
- `easeInCubic`
- `easeOutCubic`
- `easeInOutCubic`
- `easeInQuart`
- `easeOutQuart`
- `easeInOutQuart`
- `easeInQuint`
- `easeOutQuint`
- `easeInOutQuint`
- `easeInSine`
- `easeOutSine`
- `easeInOutSine`
- `easeInExpo`
- `easeOutExpo`
- `easeInOutExpo`
- `easeInCirc`
- `easeOutCirc`
- `easeInOutCirc`
- `easeOutBounce`
- `easeInBack`
- `easeOutBack`
- `easeInOutBack`
- `elastic`
- `swingFromTo`
- `swingFrom`
- `swingTo`
- `bounce`
- `bouncePast`
- `easeFromTo`
- `easeFrom`
- `easeTo`

There are also a couple of handpicked formulas from [Thomas Fuch](http://mir.aculo.us)'s [Scripty2](http://scripty2.com/):

- `spring`
- `sinusoidal`

##How can I add my own?

Adding your own is easy, an easing function has the following prototype:

	// pos is the percentage of the way through the transition (0.0-1.0)
	function(pos) {
		var newPos = someMaths(pos)
		return newPos;
	};
	
Once you've written your function, you just need to load it into Shifty's available formulas. Here's how I add the Scripty2 functions:

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

# How does it work?

So you know how to use it but you want to know how it works? Well, what Morf actually does is create a CSS3 animation on the fly for the requested transition. In other words at the time that `Morf.transition` is called, all the necessary keyframes are generated to give the impression that a transition has taken place.

Even though this is actually a CSS Animation, Morf does its best to masquerade as a transition, even throwing a `webkitTransitionEnd` event when its finished.

## Tweening CSS
To work out all the interpolated CSS states, Morf uses the fantastic [Shifty.js](https://github.com/jeremyckahn/shifty) along with some custom code to handle matrix transformations. Shifty is responsible for working out all regular CSS tween values. e.g. `width`, `height`, `background-color`.

## Tweening Matrix Transformations
In order to tween the 3D matrix, I had to add some custom functions to the `WebKitCSSMatrix` object. The process of accurately tweening between two matrix states requires that the matrixes themselves be first decomposed into their composite parts (translate, rotate, scale etc). Once these composite parts are known, its a matter of tweening between each part of each state and then rebuilding the composite matrix.

The bulk of this calculation is done using the custom `WebKitCSSMatrix.decompose()` function. This function is a Javascript implementation of [pseudo code provided by the W3C](http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition). Its likely that this is pretty close to how WebKit produces tween values internally but in Javascript rather than native code, so not quite as quick.

In order to get the `decompose()` function working I also had to supplement the `WebKitCSSMatrix` object with some other helpful matrix functions and add a basic `Vector4` implementation. This may be of use to others so feel free to repurpose the code for your own projects.

***Note:** The `decompose()` function is fairly expensive so its only called once for the start and end state of each transition.*

# Morf.js Ports & Use Cases

- [**webOS Enyo Port**](https://github.com/germboy/MorfJS) - Morf.js ported for use with the Enyo framework for webOS devices such as the HP Touchpad.

# Contributing

Contribution is welcomed but to make it easier to accept a pull request here are some guidelines:

- 	Please make all changes into the source files found under `js/src`. You can then use the build tool (PHP script found at `./build/build`) to create the concatenated and minified files.

- 	Please [camelCase](http://en.wikipedia.org/wiki/CamelCase) your variables.

# Thanks

A big thanks to [Jeremy Kahn](https://twitter.com/#!/jeremyckahn) for his excellent [Shifty.js](https://github.com/jeremyckahn/shifty) micro-library & for modifying it to make it compatible with Morf!

# License

Morf is Copyright &copy; 2011 [Joe Lambert](http://www.joelambert.co.uk) and is licensed under the terms of the [MIT License](http://www.opensource.org/licenses/mit-license.php).