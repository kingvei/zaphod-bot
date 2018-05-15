/* ----- System Includes ---------------------------------------------------- */

#include <math.h>

/* ----- Local Includes ----------------------------------------------------- */
#include "kinematics.h"

#include "global.h"
#include "qassert.h"

/* ----- Defines ------------------------------------------------------------ */


//delta geometry defines
float f  = 50.0;    	// radius of motor shafts on base
float rf = 180.0;    	// base joint to elbow joint distance
float re = 330.0;    	// elbow joint to end affector joint
float e  = 32.0;    	// end effector joint radius

// cache common trig constants
float sqrt3;
float sin120;
float sin30;
float cos120;
float tan60;
float tan30;

float deg_to_rad;

//cache common calculations
float t;

/* ----- Private Variables -------------------------------------------------- */

PRIVATE KinematicsSolution_t
delta_angle_plane_calc( float x0, float y0, float z0, float *theta );


/* ----- Public Functions --------------------------------------------------- */

PUBLIC void
kinematics_init( )
{
	// calculate/cache common trig constants
	sqrt3  = sqrt( 3.0f );
	sin120 = sqrt3 / 2.0f;
	sin30  = 0.5f;
	cos120 = -0.5f;
	tan60  = sqrt3;
	tan30  = 1 / sqrt3;

	//cache common calculations
    deg_to_rad = M_PI / 180.0f;
    t = ( f-e ) * tan30/2;

}

/* -------------------------------------------------------------------------- */

/*
 * Accept a x/y/z cartesian input, write into provided pointer to angle structure
 * Returns 0 when OK, 1 for error
 *
 * Calculate the output motor angles with an IK solver
 * Bounds checks to ensure motors aren't being commanded past their practical limits
 * Set the target angles for the clearpath driver to then handle.
 *
 * Returns status
 */

PUBLIC KinematicsSolution_t
kinematics_point_to_angle( CartesianPoint_t input, JointAngles_t *output )
{
    uint8_t status = delta_angle_plane_calc( input.x, input.y, input.z, &output->a1 );

    if (status == _SOLUTION_VALID)
    {
    	// rotate +120 degrees
    	status = delta_angle_plane_calc( 	input.x*cos120 + input.y*sin120,
    										input.y*cos120 - input.x*sin120,
											input.z,
											&output->a2   );
    }

    if (status == _SOLUTION_VALID)
    {
    	// rotate -120 degrees
    	status = delta_angle_plane_calc( 	input.x*cos120 - input.y*sin120,
    										input.y*cos120 + input.x*sin120,
											input.z,
											&output->a3 );
    }

     return status;
}

/* -------------------------------------------------------------------------- */

/*
 * Accept angle 1,2,3 input, write into provided pointer to cartesian point structure
 * Returns 0 when OK, 1 for error
 *
 * Calculate the cartesian co-ordinates with the FK solver
 * Emit the XYZ co-ordinates
 */

PUBLIC KinematicsSolution_t
kinematics_angle_to_point( JointAngles_t input, CartesianPoint_t *output )
{
    input.a1 *= deg_to_rad;
    input.a2 *= deg_to_rad;
    input.a3 *= deg_to_rad;

    float y1 = -( t + rf*cos(input.a1) );
    float z1 = -rf * sin(input.a1);

    float y2 = ( t + rf*cos(input.a2) ) * sin30;
    float x2 = y2 * tan60;
    float z2 = -rf * sin(input.a2);

    float y3 = ( t + rf*cos(input.a3) ) * sin30;
    float x3 = -y3 * tan60;
    float z3 = -rf * sin(input.a3);

    float dnm = (y2-y1)*x3 - (y3-y1)*x2;

    float w1 = y1*y1 + z1*z1;
    float w2 = x2*x2 + y2*y2 + z2*z2;
    float w3 = x3*x3 + y3*y3 + z3*z3;

    // x = (a1*z + b1)/dnm
    float a1 = (z2-z1)*(y3-y1)-(z3-z1)*(y2-y1);
    float b1 = -((w2-w1)*(y3-y1)-(w3-w1)*(y2-y1))/2.0;

    // y = (a2*z + b2)/dnm;
    float a2 = -(z2-z1)*x3+(z3-z1)*x2;
    float b2 = ((w2-w1)*x3 - (w3-w1)*x2)/2.0;

    // a*z^2 + b*z + c = 0
    float a = a1*a1 + a2*a2 + dnm*dnm;
    float b = 2*(a1*b1 + a2*(b2-y1*dnm) - z1*dnm*dnm);
    float c = (b2-y1*dnm)*(b2-y1*dnm) + b1*b1 + dnm*dnm*(z1*z1 - re*re);

    // discriminant
    float d = b*b - (float)4.0*a*c;

    if (d < 0)
    {
    	return _SOLUTION_ERROR;
    }

    output->z = -(float)0.5*(b+sqrt(d))/a;
    output->x = (a1*output->z + b1) / dnm;
    output->y = (a2*output->z + b2) / dnm;

    return _SOLUTION_VALID;
}

/* -------------------------------------------------------------------------- */

// helper functions, calculates angle theta1 (for YZ-pane)
PRIVATE KinematicsSolution_t
delta_angle_plane_calc(float x0, float y0, float z0, float *theta)
{
    float y1 = -0.5 * 0.57735 * f; 		// f/2 * tg 30
    y0 		 -= 0.5 * 0.57735 * e;      // shift center to edge

    // z = a + b*y
    float a = ( x0*x0 + y0*y0 + z0*z0 + rf*rf - re*re - y1*y1 ) / ( 2 * z0 );
    float b = ( y1 - y0 ) / z0;

    // discriminant
    float d = -( a+b * y1 )*( a+b * y1 ) + rf*( b*b * rf+rf );

    if (d < 0)
    {
    	return _SOLUTION_ERROR;
    }

    float yj = ( y1 - a*b - sqrt(d) ) / ( b*b + 1 ); // choose the outer point
    float zj = a + b*yj;

    *theta = 180.0 * atan( -zj/(y1 - yj) ) / M_PI + ( (yj > y1) ? 180.0 : 0.0 );

    return _SOLUTION_VALID;
}

/* -------------------------------------------------------------------------- */

// p[0], p[1] are the two points in 3D space
// rel_weight is the 0.0-1.0 percentage position on the line
// the output pointer is the interpolated position on the line

PUBLIC KinematicsSolution_t
kinematics_line_to_point( CartesianPoint_t p[], size_t points, float pos_weight, CartesianPoint_t *output )
{
	if(points < 2)
	{
		// need 2 points for a line
		return _SOLUTION_ERROR;
	}

	// exact start and end of splines don't need calculation as catmull curves _will_ pass through all points
	if(pos_weight == 0.0f)
	{
		output = &p[0];
		return _SOLUTION_VALID;
	}

	if(pos_weight == 1.0f)
	{
		output = &p[1];
		return _SOLUTION_VALID;
	}

    // Linear interpolation between two points (lerp)
	output->x = p[0].x + pos_weight*( p[1].x - p[0].x );
	output->y = p[0].y + pos_weight*( p[1].y - p[0].y );
	output->z = p[0].z + pos_weight*( p[1].z - p[0].z );

    return _SOLUTION_VALID;
}

/* -------------------------------------------------------------------------- */

// p[0], p[1], p[2], p[3] are the control points in 3D space
// rel_weight is the 0.0-1.0 percentage position on the curve between p1 and p2
// the output pointer is the interpolated position on the curve between p1 and p2

PUBLIC KinematicsSolution_t
kinematics_catmull_to_point( CartesianPoint_t p[], size_t points, float pos_weight, CartesianPoint_t *output )
{
	if(points < 4)
	{
		// need 4 points for solution
		return _SOLUTION_ERROR;
	}

	// exact start and end of splines don't need calculation as catmull curves _will_ pass through all points
	if(pos_weight == 0.0f)
	{
		output = &p[1];
		return _SOLUTION_VALID;	// todo add a 'end of range' flag?
	}

	if(pos_weight == 1.0f)
	{
		output = &p[2];
		return _SOLUTION_VALID;
	}

    /* Derivation from http://www.mvps.org/directx/articles/catmull/
     *
								[  0  2  0  0 ]   [ p0 ]
	q(t) = 0.5( t, t^2, t^3 ) * [ -1  0  1  0 ] * [ p1 ]
								[  2 -5  4 -1 ]   [ p2 ]
								[ -1  3 -3  1 ]   [ p3 ]
     */

	// pre-calculate
    float t = pos_weight;
    float t2 = t * t;
    float t3 = t2 * t;

	// todo consider accelerating with matrix maths (neon) if perf improvements required
	output->x = 0.5 * (
				( 2*p[1].x ) +
				(  -p[0].x   +   p[2].x ) * t +
				( 2*p[0].x   - 5*p[1].x   + 4*p[2].x - p[3].x) * t2 +
				(  -p[0].x   + 3*p[1].x   - 3*p[2].x + p[3].x) * t3 );

	output->y = 0.5 * (
				( 2*p[1].y ) +
				(  -p[0].y   +   p[2].y ) * t +
				( 2*p[0].y   - 5*p[1].y   + 4*p[2].y - p[3].y) * t2 +
				(  -p[0].y   + 3*p[1].y   - 3*p[2].y + p[3].y) * t3 );

	output->z = 0.5 * (
				( 2*p[1].z ) +
				(  -p[0].z   +   p[2].z ) * t +
				( 2*p[0].z   - 5*p[1].z   + 4*p[2].z - p[3].z) * t2 +
				(  -p[0].z   + 3*p[1].z   - 3*p[2].z + p[3].z) * t3 );

    return _SOLUTION_VALID;
}

/* ----- End ---------------------------------------------------------------- */
