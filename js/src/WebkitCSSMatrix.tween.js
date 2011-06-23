/**
 * Tween between two matrices
 * @param {WebKitCSSMatrix} matrix The destination matrix
 * @param {float} progress A float value between 0-1, representing the percentage of completion
 * @param {function} fn An easing function following the prototype function(pos){}
 * @returns {WebKitCSSMatrix} A new matrix for the tweened state
 */

WebKitCSSMatrix.prototype.tween = function(matrix, progress, fn) {
	if(fn === undefined)
		fn = function(pos) {return pos;}; // Default to a linear easing
	
	var m = new WebKitCSSMatrix(), i=0, p = null,
		props = [	'a', 'b', 'c', 'd', 'e', 'f', 
					'm11', 'm12', 'm13', 'm14', 
					'm21', 'm22', 'm23', 'm24', 
					'm31', 'm32', 'm33', 'm34', 
					'm41', 'm42', 'm43', 'm44' ];
	
	for(i=0; i<props.length; i++)
	{
		p = props[i];
		m[p] = this[p] + ((matrix[p] - this[p]) * fn(progress));
	}
	
	return m;
};

var Geometry = {
	Point: function(x, y, z) {
		if(typeof x !== 'number' && x.length == 3)
		{
			this.x = x[0];
			this.y = x[1];
			this.z = x[2];
		}
		else
		{
			this.x = x;
			this.y = y;
			this.z = z;
		}
		
		
	},
	
	Vector: function(x, y, z, w) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
		this.z = z ? z : 0;
		this.w = w ? w : 0;
		
		this.checkValues = function() {
			this.x = this.x ? this.x : 0;
			this.y = this.y ? this.y : 0;
			this.z = this.z ? this.z : 0;
			this.w = this.w ? this.w : 0;
		};
		
		this.length = function() {
			this.checkValues();
			return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
		};
		
		this.normalise = function() {
			var len = this.length(),
				v = new Geometry.Vector(this.x / len, this.y / len, this.z / len);
			
			return v;
		};
		
		this.dot = function(v) {
			return this.x*v.x + this.y*v.y + this.z*v.z + this.w*v.w;
		};
		
		this.cross = function(v) {
			return new Geometry.Vector(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x);
		};
		
		// point combine(point a, point b, float ascl, float bscl)
		//   result[0] = (ascl * a[0]) + (bscl * b[0])
		//   result[1] = (ascl * a[1]) + (bscl * b[1])
		//   result[2] = (ascl * a[2]) + (bscl * b[2])
		//   return result
		
		this.combine = function(aPoint, ascl, bscl) {
			return new Geometry.Vector( (ascl * this.x) + (bscl * aPoint.x), 
										(ascl * this.y) + (bscl * aPoint.y), 
										(ascl * this.z) + (bscl * aPoint.z) );
		}
	}
};

WebKitCSSMatrix.prototype.tween = function(matrix, progress, fn) {
	if(fn === undefined)
		fn = function(pos) {return pos;}; // Default to a linear easing
	
	var m = new WebKitCSSMatrix,
		m1 = this.decompose(),
		m2 = matrix.decompose(),
		r = m.decompose();
	
	// Adjust the progress value based on the timing function
	progress = fn(progress);
	
	for(var index in m1)
		for(var i in {x:'x', y:'y', z:'z'})
			r[index][i] = (m1[index][i] + ( (m2[index][i] - m1[index][i]) * progress )).toFixed(5);

	
	// matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, perspective[0], perspective[1], perspective[2], perspective[3])
	// translate3d(translation[0], translation[1], translation[2])
	// rotateX(rotation[0]) rotateY(rotation[1]) rotateZ(rotation[2])
	// matrix3d(1,0,0,0, 0,1,0,0, 0,skew[2],1,0, 0,0,0,1)
	// matrix3d(1,0,0,0, 0,1,0,0, skew[1],0,1,0, 0,0,0,1)
	// matrix3d(1,0,0,0, skew[0],1,0,0, 0,0,1,0, 0,0,0,1)
	// scale3d(scale[0], scale[1], scale[2])
	
	var trans = 'matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, '+r.perspective.x+', '+r.perspective.y+', '+r.perspective.z+', '+r.perspective.w+') ' +
				'translate3d('+r.translate.x+'px, '+r.translate.y+'px, '+r.translate.y+'px) ' +
				'rotateX('+r.rotate.x+'rad) rotateY('+r.rotate.y+'rad) rotateZ('+r.rotate.z+'rad) ' +
				'matrix3d(1,0,0,0, 0,1,0,0, 0,'+r.skew.z+',1,0, 0,0,0,1) ' +
				'matrix3d(1,0,0,0, 0,1,0,0, '+r.skew.y+',0,1,0, 0,0,0,1) ' +
				'matrix3d(1,0,0,0, '+r.skew.x+',1,0,0, 0,0,1,0, 0,0,0,1) ' +
				'scale3d('+r.scale.x+', '+r.scale.y+', '+r.scale.z+')' +
				'';
				
	console.log(trans);
	
	m = new WebKitCSSMatrix(trans);
	
	return m;
};

// Do we need to mod this for Vector4?
WebKitCSSMatrix.prototype.transformVector = function(v) {
	var xOut = this.m11*v.x + this.m12*v.y + this.m13*v.z;
	var yOut = this.m21*v.x + this.m22*v.y + this.m23*v.z;
	var zOut = this.m31*v.x + this.m32*v.y + this.m33*v.z;
	
	return new Geometry.Vector(xOut, yOut, zOut);
};

WebKitCSSMatrix.prototype.transpose = function() {
	var matrix = new WebKitCSSMatrix();
	
	for (var n = 0; n <= 4-2; n++)
	{
		for (var m = n + 1; m <= 4-1; m++)
		{
			matrix['m'+(n+1)+(m+1)] = this['m'+(m+1)+(n+1)];
			matrix['m'+(m+1)+(n+1)] = this['m'+(n+1)+(m+1)];
		}
	}
	
	return matrix;
};

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

WebKitCSSMatrix.prototype.decompose = function() {
	var matrix = new WebKitCSSMatrix(this.toString());
	
	// Normalize the matrix.
	if (matrix.m33 == 0)
	    return false;


	for (i = 1; i <= 4; i++)
	    for (j = 1; j <= 4; j++)
	        matrix['m'+i+j] /= matrix.m44;

	// perspectiveMatrix is used to solve for perspective, but it also provides
	// an easy way to test for singularity of the upper 3x3 component.
	var perspectiveMatrix = matrix;

	for (i = 1; i <= 3; i++)
	    perspectiveMatrix['m'+i+'4'] = 0;

	perspectiveMatrix.m44 = 1;

	if (perspectiveMatrix.determinant() == 0)
	    return false;

	// First, isolate perspective.
	if (matrix.m14 != 0 || matrix.m24 != 0 || matrix.m34 != 0)
	{
	    // rightHandSide is the right hand side of the equation.
		var rightHandSide = new Geometry.Vector(matrix.m14, matrix.m24, matrix.m34, matrix.m44);
		
	    // Solve the equation by inverting perspectiveMatrix and multiplying
	    // rightHandSide by the inverse.
	    var inversePerspectiveMatrix 			= perspectiveMatrix.inverse();
	    var transposedInversePerspectiveMatrix 	= inversePerspectiveMatrix.transpose();
	    var perspective 						= transposedInversePerspectiveMatrix.transformVector(rightHandSide);

	     // Clear the perspective partition
	    matrix.m14 = matrix.m24 = matrix.m34 = 0;
	    matrix.m44 = 1;
	}
	else
	{
		// No perspective.
		var perspective = new Geometry.Vector(0,0,0,1);
	}

	// Next take care of translation
	var translate = new Geometry.Vector(matrix.m41, matrix.m42, matrix.m43);

	matrix.m41 = 0;
	matrix.m42 = 0;
	matrix.m43 = 0;	
	
	// Now get scale and shear. 'row' is a 3 element array of 3 component vectors
	var row = [
		new Geometry.Vector(), new Geometry.Vector(), new Geometry.Vector()
	];
	
	for (var i = 1; i <= 3; i++)
	{
		row[i-1].x = matrix['m'+i+'1'];
	    row[i-1].y = matrix['m'+i+'2'];
	    row[i-1].z = matrix['m'+i+'3'];
	}

	// Compute X scale factor and normalize first row.
	var scale = new Geometry.Vector(),
		skew = new Geometry.Vector();
	
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
	var pdum3 = row[1].cross(row[2])
	if (row[0].dot(pdum3) < 0)
	{
		for (var i = 0; i < 3; i++)
		{
	        scale.x *= -1;
	        row[i].x *= -1;
	        row[i].y *= -1;
	        row[i].z *= -1;	
		}
	}
	
	
	//   // Now, get the rotations out
	//   rotate[1] = asin(-row[0][2]);
	//   if (cos(rotate[1]) != 0)
	//      rotate[0] = atan2(row[1][2], row[2][2]);
	//      rotate[2] = atan2(row[0][1], row[0][0]);
	//   else
	//      rotate[0] = atan2(-row[2][0], row[1][1]);
	//      rotate[2] = 0;

	
	// Now, get the rotations out
	var rotate = new Geometry.Vector();
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
	
	
	return {
		perspective: perspective,
		translate: translate,
		skew: skew,
		scale: scale,
		rotate: rotate
	};
};

// http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
// Input: matrix       ; a 4x4 matrix
// Output: translation ; a 3 component vector
//         rotation    ; Euler angles, represented as a 3 component vector
//         scale       ; a 3 component vector
//         skew        ; skew factors XY,XZ,YZ represented as a 3 component vector
//         perspective ; a 4 component vector
// Returns false if the matrix cannot be decomposed, true if it can
// 
//   Supporting functions (point is a 3 component vector, matrix is a 4x4 matrix):
//     float  determinant(matrix)          returns the 4x4 determinant of the matrix
//     matrix inverse(matrix)              returns the inverse of the passed matrix
//     matrix transpose(matrix)            returns the transpose of the passed matrix
//     point  multVecMatrix(point, matrix) multiplies the passed point by the passed matrix 
//                                         and returns the transformed point
//     float  length(point)                returns the length of the passed vector
//     point  normalize(point)             normalizes the length of the passed point to 1
//     float  dot(point, point)            returns the dot product of the passed points
//     float  cos(float)                   returns the cosine of the passed angle in radians
//     float  asin(float)                  returns the arcsine in radians of the passed value
//     float  atan2(float y, float x)      returns the principal value of the arc tangent of 
//                                         y/x, using the signs of both arguments to determine 
//                                         the quadrant of the return value
// 
//   Decomposition also makes use of the following function:
//     point combine(point a, point b, float ascl, float bscl)
//         result[0] = (ascl * a[0]) + (bscl * b[0])
//         result[1] = (ascl * a[1]) + (bscl * b[1])
//         result[2] = (ascl * a[2]) + (bscl * b[2])
//         return result
// 
// 
//   // Normalize the matrix.
//   if (matrix[3][3] == 0)
//       return false
// 
//   for (i = 0; i < 4; i++)
//       for (j = 0; j < 4; j++)
//           matrix[i][j] /= matrix[3][3]
// 
//   // perspectiveMatrix is used to solve for perspective, but it also provides
//   // an easy way to test for singularity of the upper 3x3 component.
//   perspectiveMatrix = matrix
// 
//   for (i = 0; i < 3; i++)
//       perspectiveMatrix[i][3] = 0
// 
//   perspectiveMatrix[3][3] = 1
// 
//   if (determinant(perspectiveMatrix) == 0)
//       return false
// 
//   // First, isolate perspective.
//   if (matrix[0][3] != 0 || matrix[1][3] != 0 || matrix[2][3] != 0)
//       // rightHandSide is the right hand side of the equation.
//       rightHandSide[0] = matrix[0][3];
//       rightHandSide[1] = matrix[1][3];
//       rightHandSide[2] = matrix[2][3];
//       rightHandSide[3] = matrix[3][3];
// 
//       // Solve the equation by inverting perspectiveMatrix and multiplying
//       // rightHandSide by the inverse.
//       inversePerspectiveMatrix = inverse(perspectiveMatrix)
//       transposedInversePerspectiveMatrix = transposeMatrix4(inversePerspectiveMatrix)
//       perspective = multVecMatrix(rightHandSide, transposedInversePerspectiveMatrix)
// 
//        // Clear the perspective partition
//       matrix[0][3] = matrix[1][3] = matrix[2][3] = 0
//       matrix[3][3] = 1
//   else
//       // No perspective.
//       perspective[0] = perspective[1] = perspective[2] = 0
//       perspective[3] = 1
// 
//   // Next take care of translation
//   translate[0] = matrix[3][0]
//   matrix[3][0] = 0
//   translate[1] = matrix[3][1]
//   matrix[3][1] = 0
//   translate[2] = matrix[3][2]
//   matrix[3][2] = 0
// 
//   // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
//   for (i = 0; i < 3; i++)
//       row[i][0] = matrix[i][0]
//       row[i][1] = matrix[i][1]
//       row[i][2] = matrix[i][2]
// 
//   // Compute X scale factor and normalize first row.
//   scale[0] = length(row[0])
//   row[0] = normalize(row[0])
// 
//   // Compute XY shear factor and make 2nd row orthogonal to 1st.
//   skew[0] = dot(row[0], row[1])
//   row[1] = combine(row[1], row[0], 1.0, -skew[0])
// 
//   // Now, compute Y scale and normalize 2nd row.
//   scale[1] = length(row[1])
//   row[1] = normalize(row[1])
//   skew[0] /= scale[1];
// 
//   // Compute XZ and YZ shears, orthogonalize 3rd row
//   skew[1] = dot(row[0], row[2])
//   row[2] = combine(row[2], row[0], 1.0, -skew[1])
//   skew[2] = dot(row[1], row[2])
//   row[2] = combine(row[2], row[1], 1.0, -skew[2])
// 
//   // Next, get Z scale and normalize 3rd row.
//   scale[2] = length(row[2])
//   row[2] = normalize(row[2])
//   skew[1] /= scale[2]
//   skew[2] /= scale[2]
// 
//   // At this point, the matrix (in rows) is orthonormal.
//   // Check for a coordinate system flip.  If the determinant
//   // is -1, then negate the matrix and the scaling factors.
//   pdum3 = cross(row[1], row[2])
//   if (dot(row[0], pdum3) < 0)
//       for (i = 0; i < 3; i++) {
//           scale[0] *= -1;
//           row[i][0] *= -1
//           row[i][1] *= -1
//           row[i][2] *= -1
// 
//   // Now, get the rotations ou
//   rotate[1] = asin(-row[0][2]);
//   if (cos(rotate[1]) != 0)
//      rotate[0] = atan2(row[1][2], row[2][2]);
//      rotate[2] = atan2(row[0][1], row[0][0]);
//   else
//      rotate[0] = atan2(-row[2][0], row[1][1]);
//      rotate[2] = 0;
// 
//   return true;