#ifndef KINEMATICS_H
#define KINEMATICS_H

/* ----- Local Includes ----------------------------------------------------- */

#include "global.h"
#include <motion_types.h>

/* ----- Defines ------------------------------------------------------------ */

/* ----- Types ------------------------------------------------------------- */

/* ----- Public Functions --------------------------------------------------- */

PUBLIC void
kinematics_init( void );

/* -------------------------------------------------------------------------- */

PUBLIC KinematicsSolution_t
kinematics_point_to_angle( CartesianPoint_t input, JointAngles_t *output );

/* -------------------------------------------------------------------------- */

PUBLIC KinematicsSolution_t
kinematics_angle_to_point( JointAngles_t input, CartesianPoint_t *output );

/* -------------------------------------------------------------------------- */

#endif /* KINEMATICS_H */
