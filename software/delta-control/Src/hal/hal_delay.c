/* ----- System Includes ---------------------------------------------------- */

#include <stdint.h>
#include <stdbool.h>

/* ----- Local Includes ----------------------------------------------------- */

#include "global.h"
#include "qassert.h"
#include "hal_delay.h"
#include "stm32f4xx_hal.h"

/* -------------------------------------------------------------------------- */

/** Delay time in milli seconds. Uses a background timer for timing. */

PUBLIC void
hal_delay_ms( uint32_t delay_ms )
{
    HAL_Delay( delay_ms );
}

/* -------------------------------------------------------------------------- */

/** Delay time in micro seconds. */
/** Disable optimization for this function */
PUBLIC void
hal_delay_us( uint32_t delay_us ) __attribute__((optimize("-O0")));

PUBLIC void
hal_delay_us( uint32_t delay_us )
{
    uint32_t loop = delay_us * (SystemCoreClock / 1000000) / 5;

    /* Protect against this loop running when loop == 0 */
    if( loop > 0 )
    {
    	while( loop-- );
    }
}

/* -------------------------------------------------------------------------- */

/** Delay time in nano seconds. */

/** Disable optimisation for this function */
PUBLIC void
hal_delay_ns( uint32_t delay_ns ) __attribute__((optimize("-O0")));

PUBLIC void
hal_delay_ns( uint32_t delay_ns )
{
    uint32_t i = delay_ns / 36;
    while (i-- > 0)
    {
        asm("nop");
    }
}

/* ----- End ---------------------------------------------------------------- */
