import { HTMLTable, Icon, Intent } from '@blueprintjs/core'
import {
  IntervalRequester,
  useHardwareState,
} from '@electricui/components-core'

import React from 'react'
import { Composition, Box } from 'atomic-layout'
import { Statistic } from '@electricui/components-desktop-blueprint'
import { Printer } from '@electricui/components-desktop'

const SensorsActive = () => {
  const sensorEnabledState =
    useHardwareState<number>(state => state.sys.sensors_enable) === 1
  if (sensorEnabledState) {
    return <div>ADC Enabled</div>
  }

  return <div>ADC Disabled</div>
}

const ModuleActive = () => {
  const ExpansionModuleState =
    useHardwareState<number>(state => state.sys.module_enable) === 1
  if (ExpansionModuleState) {
    return <div>Add-in Module On</div>
  }

  return <div>Add-in Module Off</div>
}

const CPUText = () => {
  const cpu_percentage = useHardwareState(state => state.sys.cpu_load)
  let iconColour: Intent

  if (cpu_percentage >= 0 && cpu_percentage < 60) {
    iconColour = Intent.SUCCESS
  } else if (cpu_percentage > 60 && cpu_percentage < 85) {
    iconColour = Intent.WARNING
  } else {
    iconColour = Intent.DANGER
  }

  return (
    <div>
      <Icon icon="time" intent={iconColour} iconSize={50} /> {cpu_percentage}%
    </div>
  )
}

const CPUTemperature = () => {
  const cpu_temp = useHardwareState(state => state.sys.cpu_temp).toFixed(0)
  let iconColour: Intent

  if (cpu_temp >= 0 && cpu_temp < 40) {
    iconColour = Intent.SUCCESS
  } else if (cpu_temp > 40 && cpu_temp < 65) {
    iconColour = Intent.WARNING
  } else {
    iconColour = Intent.DANGER
  }

  return (
    <div>
      <Icon icon="snowflake" intent={iconColour} iconSize={50} /> {cpu_temp}º
    </div>
  )
}

export const CoreSystemsInfoCard = () => {
  const cpu_clock = useHardwareState(state => state.sys.cpu_clock)
  const last_reset_reason = useHardwareState(state => state.reset_type)

  const num_tasks: number | null = useHardwareState(
    state => (state.tasks || []).length,
  )

  return (
    <Composition
      templateCols="1fr 1fr"
      padding="30px"
      justifyItems="center"
      gap={30}
    >
      <Box>
        <IntervalRequester interval={200} variables={['sys', 'tasks']} />
        <Composition templateCols="auto" gap={20} justifyItems="center">
          <Box>
            <Statistic value={<CPUText />} label={`load at ${cpu_clock}MHz`} />
          </Box>
          <Box>
            <Statistic value={<CPUTemperature />} label="CPU Temp" />
          </Box>
          <Box>
            <Composition templateCols="1fr 1fr" justifyItems="center">
              <Box>
                <SensorsActive />
              </Box>
              <Box>
                <ModuleActive />
              </Box>
            </Composition>
          </Box>
          <Box>Last reset due to: {last_reset_reason}</Box>
        </Composition>
      </Box>
      <Box>
        <HTMLTable striped style={{ minWidth: '100%' }}>
          <tbody>
            <tr>
              <td>
                <b>Name</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.name} />
              </td>
            </tr>
            <tr>
              <td>
                <b>Branch</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.branch} />
              </td>
            </tr>
            <tr>
              <td>
                <b>Info</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.info} />
              </td>
            </tr>
            <tr>
              <td>
                <b>Type</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.type} />
              </td>
            </tr>
            <tr>
              <td>
                <b>Date</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.date} />
              </td>
            </tr>
            <tr>
              <td>
                <b>Time</b>
              </td>
              <td>
                <Printer accessor={state => state.fwb.time} />
              </td>
            </tr>
          </tbody>
        </HTMLTable>
      </Box>
      <Box>
        <HTMLTable striped style={{ minWidth: '100%' }}>
          <thead>
            <tr>
              <th>Task</th>
              <th>ID</th>
              <th>Ready</th>
              <th>Queue Usage</th>
              <th>Waiting Max</th>
              <th>Burst Max</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(new Array(num_tasks)).map((_, index) => (
              <>
                <tr>
                  <td>
                    <b>
                      <Printer accessor={state => state.tasks[index].name} />
                    </b>
                  </td>
                  <td>
                    <Printer accessor={state => state.tasks[index].id} />
                  </td>
                  <td>
                    <Printer accessor={state => state.tasks[index].ready} />
                  </td>
                  <td>
                    <Printer
                      accessor={state => state.tasks[index].queue_used}
                    />{' '}
                    /{' '}
                    <Printer accessor={state => state.tasks[index].queue_max} />
                  </td>
                  <td>
                    <Printer
                      accessor={state => state.tasks[index].waiting_max}
                    />
                  </td>
                  <td>
                    <Printer accessor={state => state.tasks[index].burst_max} />
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </HTMLTable>
      </Box>
    </Composition>
  )
}
