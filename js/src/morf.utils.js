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