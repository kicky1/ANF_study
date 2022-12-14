import React, { useEffect } from 'react';
import { reaction } from "mobx"
import { observer } from "mobx-react-lite"

import {
  AuthorizeDeviceChooseMethodView,
  AuthorizeDeviceAllowOnceTokenView,
  AuthorizeDeviceAddDeviceFormView,
  AuthorizeDeviceAddDeviceTokenView,
  AuthorizeDeviceAddDeviceConfirmationView,
} from 'ui/authorize-device/views'
import { AuthorizeDeviceStore } from './store/AuthorizeDeviceStore';
import { Loader } from 'ui/atoms';

interface AuthorizeDeviceProcessMobxProps {
  onSuccess: () => void
  onLogout: () => void
  store: AuthorizeDeviceStore
}

export const AuthorizeDeviceProcessMobx = observer<AuthorizeDeviceProcessMobxProps>(
  props => {
    const { store, onSuccess, onLogout } = props

    // 馃敟 reaction jest "odmian膮" autoruna, kt贸ra uruchamiana jest tylko dla (ZMIENIONEGO) kawa艂ka stanu
    // i na tym kawa艂ku jest potem uruchamiany side effect
    useEffect(() => { // 馃敟 reaktywno艣膰 WIDOKU
      return reaction( // 馃敟 reaktywno艣膰 STANU
        () => store.state,
        (state) => {
          if (state.type === 'ALLOW_ONCE_SUCCESS'){
            onSuccess()
          }
        }
      )
    }, [store, onSuccess])

    switch(store.state.type){
      case "LOADING":
        return <Loader />

      case "CHOOSE_METHOD":
        return <AuthorizeDeviceChooseMethodView
          onAddDeviceToTrusted={store.chooseAddDevice}
          onAllowDeviceOnce={store.chooseAllowOnce}
          onLogout={onLogout}
        />

      /**
       * 馃敟 UWAGA!
       * Lepiej dla szeroko poj臋tej wydajno艣ci by艂oby przekazywa膰 w d贸艂 do komponent贸w
       * NIE KONKRETNE WARTO艢CI (np. store.state.instruction) a referencj臋 na ca艂臋go store'a (patrz: slajd "MobX & React - dobre praktyki")
       * My tutaj robimy wyj膮tek tylko "szkoleniowo" - chcemy pozosta膰 przy 1 implementacji widok贸w (kt贸re s膮 state-agnostic), i kt贸re mo偶emy reu偶y膰 w wielu implementacjach (primitive obsession, state union, redux, xstate, mobx...)
       * Innymi s艂owy, naszym celem jest mie膰 5 rozwi膮za艅 dla procesu + 5 komponent贸w-widok贸w (reu偶ywalnych, dla czytelno艣ci) ZAMIAST 5 rozwi膮za艅 + 25 komponent贸w-widok贸w
       * 
       * Czyli w projekcie (nie-szkoleniowym) daliby艣my:
       * <AuthorizeDeviceAllowOnceTokenView store={store} /> - je艣li przekazujemy store'a przez propsy
       * lub
       * <AuthorizeDeviceAllowOnceTokenView /> - je艣li store ci膮gniemy przez Context API
       */
       case "ALLOW_ONCE_TOKEN":
        return <AuthorizeDeviceAllowOnceTokenView
          onSubmit={store.submitAllowOnce}
          onCancel={store.cancelChoice}
          instruction={store.state.instruction}
          error={store.state.error}
        />

      case "ALLOW_ONCE_SUCCESS":
        return null

      case "ADD_DEVICE_FORM":
        return <AuthorizeDeviceAddDeviceFormView
          onSubmit={store.submitDeviceName}
        />

      case "ADD_DEVICE_TOKEN":
        return <AuthorizeDeviceAddDeviceTokenView
          deviceName={store.state.deviceName}
          instruction={store.state.instruction}
          onSubmit={store.submitAddDevice}
          onReset={store.resetToken}
          onCancel={store.cancelChoice}
          error={store.state.error}
        />

      case "ADD_DEVICE_CONFIRMATION":
        return <AuthorizeDeviceAddDeviceConfirmationView
          deviceName={store.state.deviceName}
          onClose={onSuccess}
        />

      case "ADD_DEVICE_SUCCESS":
        return null

      case "LOGGED_OUT":
        return null

      default:
        const leftover: never = store.state
        return null
      }
  })
