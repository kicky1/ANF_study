import React, { useState } from "react"

import {
  AuthorizeDeviceChooseMethodView,
  AuthorizeDeviceAllowOnceTokenView,
  AuthorizeDeviceAddDeviceFormView,
  AuthorizeDeviceAddDeviceTokenView,
  AuthorizeDeviceAddDeviceConfirmationView,
} from 'ui/authorize-device/views'
import { getTokenInstruction, sendTokenCode } from 'api/token'

import { Loader } from "ui/atoms"

interface AuthorizeDeviceProcessPrimitiveProps {
  onSuccess: () => void
  onLogout: () => void
}

/**
 * sp贸jrzmy krytycznie na AuthorizeDeviceState poni偶ej
 * 馃敟 馃 馃挘
 * je艣li mamy osobno jedn膮 zmienn膮 stringow膮, kt贸ra ma "CHOOSE_METHOD" | "ALLOW_ONCE_TOKEN" | "ADD_DEVICE_FORM" etc.
 * i osobno ca艂膮 reszt臋 (tuzin useState ni偶ej w komponencie) to wszystko jest porozklejane.
 * "DA SI臉" to zakodowa膰 poprawnie w tym podej艣ciu, ale kod b臋dzie bardziej chaotyczny, b臋dzie mn贸stwo miejsc, gdzie mo偶na si臋 pomyli膰
 * i wsp贸艂czujemy osobom, kt贸re kod napisany w takim stylu b臋d膮 utrzymywa艂y.
 * 
 * 馃敟 WA呕NE: poni偶sza implementacja Primitive to ANTYPATTERN 馃敟
 */
type AuthorizeDeviceState =
  | "CHOOSE_METHOD"
  | "LOGGED_OUT"
  | "ALLOW_ONCE_TOKEN"
  | "ALLOW_ONCE_SUCCESS"
  | "ADD_DEVICE_FORM"
  | "ADD_DEVICE_TOKEN"
  | "ADD_DEVICE_CONFIRMATION"
  | "ADD_DEVICE_SUCCESS"

export const AuthorizeDeviceProcessPrimitive = (props: AuthorizeDeviceProcessPrimitiveProps) => {
  const { onSuccess, onLogout } = props
  const [stateType, setStateType] = useState<AuthorizeDeviceState>("CHOOSE_METHOD")

  // 馃敟 pusty string troch臋 bez sensu, bo np. w "allow once" w og贸le nigdy nie b臋dzie istnia艂, ale jak zlikwiduj臋 stringa, to inne komponenty wybuchn膮.
  // Sk膮d problem? Bo "sp艂aszczaj膮c" wszystkie elementy stanu i wrzucaj膮c do jednego wora TS nie ma szansy widzie膰, 偶e w kroku 1 nie znamy device, ale w 3 ju偶 na pewno, wi臋c jest gwarantowane. Maj膮c worek typ贸w prymitywnych tracimy type safety.
  const [deviceName, setDeviceName] = useState<string>('')

  // 馃敟 pusty string troch臋 bez sensu
  // ale jego brak (pami臋tajmy - `useState<string>()` - rozszerza typ do "string | undefined") - r贸wnie偶 kiepski,
  // bo jak instruction (string) b臋dzie potrzebne, czego TS nie gwarantuje, to trzeba haczy膰 (np. `instruction!`)
  // generalnie jak nie spojrze膰 "d" z ty艂u, bo inicjalnie (na pocz膮tku procesu) instruction nie ma prawa istnie膰 i szukanie domy艣lnej warto艣ci _w tym momencie_ nie ma sensu
  // alternatywa (implementacje: Union, Redux, XState) bazuj膮 na tym, 偶e instruction (i inne kom贸rki) istniej膮 tylko wtedy, kiedy maj膮 sens - a gdyby mia艂y nie mie膰 sensu, to s膮 niszczone + kompilator to 艣ledzi
  const [instruction, setInstruction] = useState<string>()
  const [tokenId, setTokenId] = useState<string>()

  // 馃敟 error oraz loading jako osobne kom贸rki zwi臋kszaj膮 ryzyko pomy艂ki polegaj膮cej na stworzeniu niepoprawnego stanu (np. loading:true & error:true)
  const [isLoading, setLoading] = useState(false)
  // 馃敟 dodatkowo, error: boolean jest ma艂o precyzyjny. By膰 mo偶e jaki艣 kawa艂ek UI potrzebowa艂by wy艣wietli膰 np. szczeg贸艂y b艂臋du?
  const [error, setError] = useState(false)

  const cancelChoice = () => {
    setStateType("CHOOSE_METHOD")
  }

  const chooseAllowOnce = async () => {
    setLoading(true)
    setStateType("ALLOW_ONCE_TOKEN")
    // 馃 await zdecudowanie potrzebuje try..catcha. I co mu ustawi膰 - kom贸rk臋 error:true? W贸wczas error:true na ekranie z inputem oznacza b艂臋dnie wpisany przez u偶ytkownika kod, za艣 na innych ekranach oznacza 偶e np. API zdech艂o - a na jeszcze innych ekranach jeszcze co innego?
    // Zasadniczo, 1 kom贸rka pami臋ci kt贸ra reprezentuje zupe艂nie r贸偶ne rzeczy (r贸偶ne rodzaje b艂臋d贸w o r贸偶nych przyczynach) to kiepski pomys艂, bo b臋dzie trudno zrozumie膰 znaczenie/cel tej kom贸rki pami臋ci, utrzymuj膮c kod.
    const tokenInstruction = await getTokenInstruction()
    setTokenId(tokenInstruction.tokenId)
    setInstruction(tokenInstruction.instruction)
    setLoading(false)
  }

  const submitAllowOnce = async (password: string) => {
    setLoading(true)
    try {
      await sendTokenCode({ tokenId: tokenId!, tokenCode: password })
      setStateType("ALLOW_ONCE_SUCCESS")
      onSuccess()
    } catch (e: unknown) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const chooseAddDevice = () => {
    setStateType("ADD_DEVICE_FORM")
  }

  const submitDeviceName = async (currentDeviceName: string) => {
    setLoading(true)
    setDeviceName(currentDeviceName)
    // 馃 await zdecudowanie potrzebuje try..catcha. I co mu ustawi膰 - kom贸rk臋 error:true? W贸wczas error:true na ekranie z inputem oznacza b艂臋dnie wpisany przez u偶ytkownika kod, za艣 na innych ekranach oznacza 偶e np. API zdech艂o - a na jeszcze innych ekranach jeszcze co innego?
    // Zasadniczo, 1 kom贸rka pami臋ci kt贸ra reprezentuje zupe艂nie r贸偶ne rzeczy (r贸偶ne rodzaje b艂臋d贸w o r贸偶nych przyczynach) to kiepski pomys艂, bo b臋dzie trudno zrozumie膰 znaczenie/cel tej kom贸rki pami臋ci, utrzymuj膮c kod.
    const tokenInstruction = await getTokenInstruction()
    setTokenId(tokenInstruction.tokenId)
    setInstruction(tokenInstruction.instruction)
    setStateType("ADD_DEVICE_TOKEN")
    setLoading(false)
  }

  const resetToken = async () => {
    setLoading(true)
    const tokenInstruction = await getTokenInstruction()
    setTokenId(tokenInstruction.tokenId)
    setInstruction(tokenInstruction.instruction)
    setLoading(false)
    setError(false)
  }

  const submitAddDevice = async (password: string) => {
    setLoading(true)
    try {
      await sendTokenCode({ tokenId: tokenId!, tokenCode: password })
      setStateType("ADD_DEVICE_CONFIRMATION")
    } catch (e: unknown) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 馃槒 ca艂a implementacja "PRIMITIVE OBSESSION" jest tak 藕le zamodelowana, 偶e r贸wnie dobrze mo偶na by si臋 pozby膰 stan贸w finalnych (PS pami臋tajmy, ten plik to antypattern)
   */
  const handleLogout = () => {
    setStateType("LOGGED_OUT")
    onLogout()
  }

  const confirmDeviceAdded = () => {
    setStateType("ADD_DEVICE_SUCCESS")
    onSuccess()
  }

  if (isLoading){
    return <Loader />
  }

  switch(stateType){
    case "CHOOSE_METHOD":
      return <AuthorizeDeviceChooseMethodView
        onAddDeviceToTrusted={chooseAddDevice}
        onAllowDeviceOnce={chooseAllowOnce}
        onLogout={handleLogout}
      />

    case "ALLOW_ONCE_TOKEN":
      return <AuthorizeDeviceAllowOnceTokenView
        onSubmit={submitAllowOnce}
        onCancel={cancelChoice}
        instruction={instruction!} // 馃槼 oh no! `instruction` nie jest gwarantowane (bo jest typu `string | undefined`, a wymagane string). Ale 偶e my wiemy, 偶e w stanie `ADD_DEVICE_TOKEN` instruction powinno istnie膰 馃槒 to wyciszamy b艂膮d TSa... ale krzywo! (PS pami臋tajmy - ca艂y ten plik to antypattern)
        error={error}
      />

    case "ALLOW_ONCE_SUCCESS":
      return null

    case "ADD_DEVICE_FORM":
      return <AuthorizeDeviceAddDeviceFormView
        onSubmit={submitDeviceName}
      />

    case "ADD_DEVICE_TOKEN":
      return <AuthorizeDeviceAddDeviceTokenView
        deviceName={deviceName}
        instruction={instruction!} // 馃槼 analogicznie jak powy偶ej
        onSubmit={submitAddDevice}
        onReset={resetToken}
        onCancel={cancelChoice}
        error={error}
      />

    case "ADD_DEVICE_CONFIRMATION":
      return <AuthorizeDeviceAddDeviceConfirmationView
        deviceName={deviceName}
        onClose={confirmDeviceAdded}
      />

    case "ADD_DEVICE_SUCCESS":
      return null

    case "LOGGED_OUT":
      return null

    default:
      const leftover: never = stateType
      return null
  }
}
