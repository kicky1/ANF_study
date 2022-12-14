import { createSlice, configureStore } from '@reduxjs/toolkit'
import { Provider, useDispatch, useSelector } from "react-redux"

import {
  AuthorizeDeviceChooseMethodView,
  AuthorizeDeviceAllowOnceTokenView,
  AuthorizeDeviceAddDeviceFormView,
  AuthorizeDeviceAddDeviceTokenView,
  AuthorizeDeviceAddDeviceConfirmationView,
} from 'ui/authorize-device/views'
import { getTokenInstruction, sendTokenCode, TokenInstruction } from 'api/token'
import { AuthorizeDeviceState } from "lessons/m6/authorize-device/types"
import { assertState } from "../../state-members"

import { Loader } from "ui/atoms"

// ACTIONS + REDUCER = SLICE

export const authorizeDeviceSlice = createSlice({
  name: 'authorizeDevice',
  initialState: {
    type: "CHOOSE_METHOD"
  } as AuthorizeDeviceState,
  reducers: {
    loading: state => ({ type: "LOADING" }),
    cancelChoice: state => ({ type: "CHOOSE_METHOD" }),
    chooseLogout: state => ({ type: "LOGGED_OUT" }),

    allowOnceSuccess: state => ({ type: "ALLOW_ONCE_SUCCESS" }),
    addDeviceSuccess: state => ({ type: "ADD_DEVICE_SUCCESS" }),
    addDeviceForm: state => ({ type: "ADD_DEVICE_FORM" }),
    allowOnceToken: (state, action: {
      payload: TokenInstruction & {
        error: boolean
      }
    }) => ({
      type: "ALLOW_ONCE_TOKEN",
      ...action.payload,
    }),
    addDeviceToken: (state, action: {
      payload: TokenInstruction & {
        deviceName: string,
        error: boolean
      }
    }) => ({
      type: "ADD_DEVICE_TOKEN",
      ...action.payload,
    }),
    addDeviceConfirmation: (state, action: {
      payload: {
        deviceName: string,
      }
    }) => ({
      type: "ADD_DEVICE_CONFIRMATION",
      deviceName: action.payload.deviceName,
    }),
  }
})

// CONFIG

export const actions = authorizeDeviceSlice.actions

export const getStore = () => configureStore({
  reducer: {
    authorizeDevice: authorizeDeviceSlice.reducer
  },
  devTools: { // https://redux-toolkit.js.org/api/configureStore#devtools
    name: "Authorize Device Process"
  }
})

export type AppStore = ReturnType<typeof getStore>
type RootState = ReturnType<AppStore['getState']>
type Dispatch = AppStore['dispatch']

// THUNKS

export const cancelChoice = () =>
  (dispatch: Dispatch) => {
    dispatch(actions.cancelChoice())
  }

export const chooseAllowOnce = () =>
  async (dispatch: Dispatch) => {
    dispatch(actions.loading())
    const tokenInstruction = await getTokenInstruction()
    dispatch(actions.allowOnceToken({
      ...tokenInstruction,
      error: false,
      // ???? nota bene ????
      // ???? przypomnijmy sobie "excessive property check" z TSa - odkomentujmy poni??sz?? linijk??:
      // unnecessaryProperty: 125 // ??? Object literal may only specify known properties bla bla
      // przydaje si?? o tyle - ??e nie wrzucimy nadmiarowych p??l na stan (przypadkowo go nie za??miecimy/nie nadpiszemy)
    }))
  }

export const chooseAddDevice = () =>
  (dispatch: Dispatch) => {
    dispatch(actions.addDeviceForm())
  }

// ???? thunk to dobre miejsce na rzucanie wyj??tk??w
// ???? reducer to Z??E miejsce na rzucanie wyj??tk??w

export const submitAllowOnce = (password: string, onSuccess: () => void) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const { authorizeDevice: state } = getState()
    assertState(state, "ALLOW_ONCE_TOKEN")

    dispatch(actions.loading())
    try {
      await sendTokenCode({ tokenId: state.tokenId, tokenCode: password })
      dispatch(actions.allowOnceSuccess())
      onSuccess()
    } catch (e: unknown) {
      dispatch(actions.allowOnceToken({ ...state, error: true }))
    }
  }

export const submitDeviceName = (deviceName: string) =>
  async (dispatch: Dispatch) => {
    dispatch(actions.loading())
    const tokenInstruction = await getTokenInstruction()
    dispatch(actions.addDeviceToken({
      deviceName,
      ...tokenInstruction,
      error: false,
    }))
  }

export const resetToken = () =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const { authorizeDevice: state } = getState()
    assertState(state, "ADD_DEVICE_TOKEN")

    dispatch(actions.loading())
    const tokenInstruction = await getTokenInstruction()
    dispatch(actions.addDeviceToken({
      deviceName: state.deviceName,
      ...tokenInstruction,
      error: false,
    }))
  }

export const submitAddDevice = (password: string) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    const { authorizeDevice: state } = getState()
    assertState(state, "ADD_DEVICE_TOKEN")

    dispatch(actions.loading())
    try {
      await sendTokenCode({ tokenId: state.tokenId, tokenCode: password })
      dispatch(actions.addDeviceConfirmation({
        deviceName: state.deviceName
      }))
    } catch (e: unknown){
      dispatch(actions.addDeviceToken({ ...state, error: true }))
    }
  }

export const handleLogout = (onLogout: () => void) =>
  (dispatch: Dispatch) => {
    dispatch(authorizeDeviceSlice.actions.chooseLogout())
    onLogout()
  }

export const confirmDeviceAdded = (onSuccess: () => void) =>
  (dispatch: Dispatch) => {
    dispatch(authorizeDeviceSlice.actions.addDeviceSuccess())
    onSuccess()
  }

// UI

interface AuthorizeDeviceProcessReduxProps {
  onSuccess: () => void
  onLogout: () => void
}

/**
 * UWAGA! ????
 *
 * w typowej aplikacji reduxowej komponenty osadzone g????boko w drzewie prawdopodobnie same subskrybowa??yby na reduxa
 * my tutaj robimy wyj??tek (wszystkie widoki Authorize Device pozostaj?? "dumb" components) tylko po to, aby nie robi?? zbyt wielu kopii tego samego
 * (wygoda podczas szkolenia - mamy 1 zestaw pomniejszych widok??w)
 * tzn. widoki same w ??rodku PRAWDOPODOBNIE wywo??ywa??yby useSelector i useDispatch.
 * a to sprawi??oby, ??e by??yby bardziej redux-specific - ale mniej prop-drilling
 * oraz ??e w poni??szym komponencie mog??oby ani useSelector ani useDispatch nie by??
 * kompromis: na ile chcemy aby komponenty ni??ej by??y niezale??ne od state-management, a na ile NIE chcemy prop-drilling
 */
export const AuthorizeDeviceProcessRedux = (props: AuthorizeDeviceProcessReduxProps) => {
  const { onSuccess, onLogout } = props
  const state = useSelector((rootState: RootState) => rootState.authorizeDevice)
  const dispatch: Dispatch = useDispatch()

  switch(state.type){
    case "LOADING":
      return <Loader />

    case "CHOOSE_METHOD":
      return <AuthorizeDeviceChooseMethodView
        onAddDeviceToTrusted={() => dispatch(chooseAddDevice())}
        onAllowDeviceOnce={() => dispatch(chooseAllowOnce())}
        onLogout={() => dispatch(handleLogout(onLogout))}
      />

    case "ALLOW_ONCE_TOKEN":
      return <AuthorizeDeviceAllowOnceTokenView
        onSubmit={(password) => dispatch(submitAllowOnce(password, onSuccess))}
        onCancel={() => dispatch(cancelChoice())}
        instruction={state.instruction}
        error={state.error}
      />

    case "ALLOW_ONCE_SUCCESS":
      return null

    case "ADD_DEVICE_FORM":
      return <AuthorizeDeviceAddDeviceFormView
        onSubmit={(deviceName) => dispatch(submitDeviceName(deviceName))}
      />

    case "ADD_DEVICE_TOKEN":
      return <AuthorizeDeviceAddDeviceTokenView
        deviceName={state.deviceName}
        instruction={state.instruction}
        onSubmit={(password) => dispatch(submitAddDevice(password))}
        onReset={() => dispatch(resetToken())}
        onCancel={() => dispatch(cancelChoice())}
        error={state.error}
      />

    case "ADD_DEVICE_CONFIRMATION":
      return <AuthorizeDeviceAddDeviceConfirmationView
        deviceName={state.deviceName}
        onClose={() => dispatch(confirmDeviceAdded(onSuccess))}
      />

    case "ADD_DEVICE_SUCCESS":
      return null

    case "LOGGED_OUT":
      return null

    default:
      const leftover: never = state
      return null
  }
}

/**
 * UWAGA! ????
 *
 * podobnie jak w "Module REDUX":
 * W normalnej aplikacji Redux powinien by?? GLOBALNY.
 * My tutaj robimy wyj??tek (i tworzymy store w g????bi drzewa) tylko z uwagi na organizacj?? kodu szkoleniowego
 * chcemy, aby przyk??ady by??y od siebie odseparowane, a gdyby??my kilka r????nych przyk??ad??w wrzucili do jednego reduxa, wymiesza??yby si??
 * w normalnej aplikacji tak by??my nie robili
 */
export const AuthorizeDeviceProcessReduxWithStore = (props: AuthorizeDeviceProcessReduxProps) => {
  return <Provider store={getStore()}>
    <AuthorizeDeviceProcessRedux {...props} />
  </Provider>
}
