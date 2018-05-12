/* ----- System Includes ---------------------------------------------------- */


/* ----- Local Includes ----------------------------------------------------- */

#include "app_background.h"
#include "event_subscribe.h"
#include "app_signals.h"
#include "button.h"
#include "hal_button.h"
#include "timer_ms.h"
#include "buzzer.h"
#include "fan.h"
#include "clearpath.h"

/* -------------------------------------------------------------------------- */

#define BACKGROUND_RATE_BUTTON_MS	50	//  20Hz
#define BACKGROUND_RATE_BUZZER_MS	10	// 100Hz
#define BACKGROUND_RATE_FAN_MS		250	//   4Hz

PRIVATE timer_ms_t 	button_timer 	= 0;
PRIVATE timer_ms_t 	buzzer_timer 	= 0;
PRIVATE timer_ms_t 	fan_timer 		= 0;

/* -------------------------------------------------------------------------- */

PUBLIC void
app_background_init( void )
{
	timer_ms_start( &button_timer, 	BACKGROUND_RATE_BUTTON_MS );
	timer_ms_start( &buzzer_timer, 	BACKGROUND_RATE_BUZZER_MS );
	timer_ms_start( &fan_timer, 	BACKGROUND_RATE_FAN_MS );

}

/* -------------------------------------------------------------------------- */

PUBLIC void
app_background( void )
{
	//rate limit less important background processes
    if( timer_ms_is_expired( &button_timer ) )
    {
        if( button_pattern_match( BUTTON_PATTERN_EMERGENCY_SHUTDOWN ) )
        {
            //todo stop the motors now or something
        }

        button_process();
    	timer_ms_start( &button_timer, BACKGROUND_RATE_BUTTON_MS );
    }

    if( timer_ms_is_expired( &buzzer_timer ) )
    {
        buzzer_process();
    	timer_ms_start( &buzzer_timer, BACKGROUND_RATE_BUZZER_MS );
    }

    if( timer_ms_is_expired( &fan_timer ) )
    {
        fan_process();
    	timer_ms_start( &fan_timer, BACKGROUND_RATE_FAN_MS );
    }

    servo_process( _CLEARPATH_1 );
    servo_process( _CLEARPATH_2 );
    servo_process( _CLEARPATH_3 );

#ifdef EXPANSION_SERVO
    servo_process( _CLEARPATH_4 );
#endif

}

/* ----- End ---------------------------------------------------------------- */

