import { RouteComponentProps } from '@reach/router'
import {
  ProgressBar,
  Slider,
  Statistics,
  Statistic,
  Button,
  Switch,
} from '@electricui/components-desktop-blueprint'
import { Printer } from '@electricui/components-desktop'
import {
  Card,
  Divider,
  ButtonGroup,
  Label,
  Text,
  HTMLTable,
  Button as BlueprintButton,
  NumericInput,
} from '@blueprintjs/core'
import { Grid, Cell } from 'styled-css-grid'

import { useDarkMode } from '@electricui/components-desktop'
import {
  IntervalRequester,
  useHardwareState,
  StateTree,
} from '@electricui/components-core'

import { CALL_CALLBACK } from '@electricui/core'
import {
  SUPERVISOR_STATES,
  CONTROL_MODES,
} from './../../../../transport-manager/config/codecs'
import React, { useEffect, ReactElement, useState } from 'react'
import { useTriggerAction } from '@electricui/core-actions'

import { useExtractSceneName } from './../../../hooks/useExtractSceneName'
import { useOpenDialog } from './../../../hooks/useOpenDialog'

import CameraCard from './CameraCard'

const OpenSceneButton = () => {
  const [filePath, selectFile] = useOpenDialog('json', 'Open a scene file')
  const sceneName = useExtractSceneName(filePath)
  const triggerAction = useTriggerAction()!

  let RunSceneButton: ReactElement | null = null

  if (filePath !== '') {
    RunSceneButton = (
      <React.Fragment>
        <BlueprintButton
          onClick={() => {
            console.log('starting action')
            triggerAction('load_scene', { filePath })
              .catch(e => {
                console.error(e)
              })
              .then(() => {
                console.log('action finished')
              })
          }}
          style={{ marginLeft: 10 }}
        >
          Run {sceneName}
        </BlueprintButton>
        <BlueprintButton
          onClick={async () => {
            console.log('starting action')

            let height = 1

            for (let index = 0; index < 60; index++) {
              await triggerAction('load_scene', { filePath })
              await triggerAction('scale_height', height)

              height += 0.25
            }
          }}
          style={{ marginLeft: 10 }}
        >
          Run {sceneName} 10x with increasing height
        </BlueprintButton>
      </React.Fragment>
    )
  }

  return (
    <>
      <BlueprintButton onClick={selectFile} style={{ marginLeft: 10 }}>
        Open Scene
      </BlueprintButton>
      {RunSceneButton}
    </>
  )
}

const SceneSelectionButtons = () => {
  const [filePath, selectFolder] = useOpenDialog(
    'folder',
    'Select folder for saving',
  )

  const triggerAction = useTriggerAction()

  // Save the save path every time we select a new path
  useEffect(() => {
    triggerAction('set_save_path', filePath)
  }, [filePath])

  let filePathValid = true

  if (filePath === '') {
    filePathValid = false
  }

  return (
    <React.Fragment>
      <BlueprintButton onClick={selectFolder}>
        Select Camera Save Location
      </BlueprintButton>

      {filePathValid ? <OpenSceneButton /> : null}
    </React.Fragment>
  )
}

const SupervisorState = () => {
  const supervisor_state = useHardwareState(state => state.super.supervisor)
  const is_moving = useHardwareState(state => state.moStat.move_state)

  let supervisor_text: string = 'null'

  if (supervisor_state === SUPERVISOR_STATES[SUPERVISOR_STATES.ARMED]) {
    if (is_moving == 1) {
      supervisor_text = 'MOVING'
    } else {
      supervisor_text = 'ARMED'
    }
  } else {
    supervisor_text = supervisor_state || 'UNKNOWN'
  }

  return <div>{supervisor_text}</div>
}

const MotorSafetyMode = () => {
  const motor_state = useHardwareState(state => state.super.motors)
  var motors_are_active: string = 'null'

  switch (motor_state) {
    case 0: {
      motors_are_active = 'OFF'
      break
    }
    case 1: {
      motors_are_active = 'ON'
      break
    }
    default: {
      motors_are_active = 'INVALID'
      break
    }
  }

  return <div>{motors_are_active}</div>
}

const ArmControlButton = () => {
  const supervisor = useHardwareState<string>(state => state.super.supervisor)
  const control_mode = useHardwareState(state => state.super.mode)

  const modeNotSelected = control_mode === CONTROL_MODES[CONTROL_MODES.NONE]
  const isArmed = supervisor === SUPERVISOR_STATES[SUPERVISOR_STATES.ARMED]

  if (!isArmed) {
    if (modeNotSelected) {
      return (
        <Button
          fill
          large
          disabled
          intent="none"
          writer={{ disarm: CALL_CALLBACK }}
        >
          Select a mode before arming
        </Button>
      )
    } else {
      return (
        <Button fill large intent="warning" writer={{ arm: CALL_CALLBACK }}>
          Arm ({control_mode})
        </Button>
      )
    }
  }

  return (
    <Button fill large intent="primary" writer={{ disarm: CALL_CALLBACK }}>
      Disarm
    </Button>
  )
}

const ControlPage = (props: RouteComponentProps) => {
  const isDarkMode = useDarkMode()
  const control_mode = useHardwareState(state => state.super.mode)

  const [syncID, setSyncID] = useState(1)
  const [heightScale, setHeightScale] = useState(1)
  const triggerAction = useTriggerAction()

  return (
    <React.Fragment>
      <IntervalRequester
        interval={125}
        variables={['moStat', 'super', 'cpos', 'rgb']}
      />

      <Grid columns={2}>
        <Cell>
          <Card>
            <br />
            <br />
            <Grid columns={2}>
              <Grid columns={3}>
                <Cell />
                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        num_points: 1,
                        points: [[5, 0, 0]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    +x
                  </Button>
                </Cell>
                <Cell />
                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        num_points: 1,
                        points: [[0, 5, 0]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    +y
                  </Button>
                </Cell>
                <Cell />
                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        num_points: 1,
                        points: [[0, -5, 0]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    -y
                  </Button>
                </Cell>
                <Cell />
                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        num_points: 1,
                        points: [[-5, 0, 0]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    -x
                  </Button>
                </Cell>
                <Cell />
              </Grid>
              <Grid columns={1}>
                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        points: [[0, 0, 5]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    Up
                  </Button>
                </Cell>

                <Cell>
                  <Button
                    large
                    fill
                    writer={{
                      inmv: {
                        type: 0,
                        reference: 1,
                        id: 0,
                        duration: 400,
                        points: [[0, 0, -5]],
                      },
                      qumv: CALL_CALLBACK,
                    }}
                  >
                    Down
                  </Button>
                </Cell>
              </Grid>
            </Grid>

            <br />
            <br />
            <label>Height Scale</label>
            <br />
            <div style={{ display: 'inline-block' }}>
              <NumericInput
                value={heightScale}
                min={0}
                max={100}
                step={0.01}
                onValueChange={value => setHeightScale(value)}
              />
            </div>
            <div style={{ display: 'inline-block', marginLeft: 10 }}>
              <BlueprintButton
                onClick={() => triggerAction('scale_height', heightScale)}
              >
                Set Height
              </BlueprintButton>
            </div>
            <br />
            <br />
            <label>Sync ID</label>
            <br />
            <div style={{ display: 'inline-block' }}>
              <NumericInput
                value={syncID}
                min={0}
                max={255}
                onValueChange={value => setSyncID(value)}
              />
            </div>
            <div style={{ display: 'inline-block', marginLeft: 10 }}>
              <Button writer={{ syncid: syncID, sync: CALL_CALLBACK }}>
                Sync
              </Button>
            </div>

            <br />
            <br />
            <Button writer={{ stmv: CALL_CALLBACK }}>Start queue</Button>
            <Button writer={{ psmv: CALL_CALLBACK }}>Pause queue</Button>
            <Button writer={{ clmv: CALL_CALLBACK }}>Clear queue</Button>
            <br />
          </Card>
        </Cell>
        <Cell>
          <CameraCard />
          <Card>
            <h3>RGB</h3>
            <SceneSelectionButtons />
          </Card>
        </Cell>
        <Cell>
          <Card>
            <ButtonGroup fill>
              <Button writer={{ rmanual: CALL_CALLBACK }}>Manual</Button>
              <Button writer={{ revent: CALL_CALLBACK }}>Event</Button>
              <Button writer={{ rdemo: CALL_CALLBACK }}>Demo</Button>
              <Button writer={{ rtrack: CALL_CALLBACK }}>Track</Button>
            </ButtonGroup>
            <br />
            <ProgressBar accessor={state => state.moStat.move_progress} />
            <br />
            <Grid columns={2}>
              <Cell center middle>
                <Statistics>
                  <Statistic
                    value={<SupervisorState />}
                    label={<div>{control_mode} MODE</div>}
                  />
                </Statistics>
              </Cell>
              <Cell>
                <HTMLTable condensed style={{ minWidth: '100%' }}>
                  <tbody>
                    <tr>
                      <td>X</td>
                      <td>
                        <Printer accessor={state => state.cpos[0] / 1000} /> mm
                      </td>
                    </tr>
                    <tr>
                      <td>Y</td>
                      <td>
                        <Printer accessor={state => state.cpos[1] / 1000} /> mm
                      </td>
                    </tr>
                    <tr>
                      <td>Z</td>
                      <td>
                        <Printer accessor={state => state.cpos[2] / 1000} /> mm
                      </td>
                    </tr>
                  </tbody>
                </HTMLTable>
              </Cell>
            </Grid>
            <br />
            <Grid columns={2}>
              <Cell>
                <ArmControlButton />
              </Cell>
              <Cell>
                <Button
                  fill
                  large
                  intent="success"
                  writer={{ home: CALL_CALLBACK }}
                >
                  Home
                </Button>
              </Cell>
            </Grid>
          </Card>
        </Cell>
      </Grid>
    </React.Fragment>
  )
}

export default ControlPage
