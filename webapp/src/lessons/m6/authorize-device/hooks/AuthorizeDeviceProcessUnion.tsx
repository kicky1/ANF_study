import React, { useState } from "react"

import {
  AuthorizeDeviceChooseMethodView,
  AuthorizeDeviceAllowOnceTokenView,
  AuthorizeDeviceAddDeviceFormView,
  AuthorizeDeviceAddDeviceTokenView,
  AuthorizeDeviceAddDeviceConfirmationView,
} from 'ui/authorize-device/views'
import { AuthorizeDeviceState } from "lessons/m6/authorize-device/types"
import { getTokenInstruction, sendTokenCode } from 'api/token'

import { Loader } from "ui/atoms"
import { assertState } from "../../state-members"

interface AuthorizeDeviceProcessUnionProps {
  onSuccess: () => void
  onLogout: () => void
}

export const AuthorizeDeviceProcessUnion = (props: AuthorizeDeviceProcessUnionProps) => {
  const { onSuccess, onLogout } = props

  /**
   * 馃 czy loading jako osobna kom贸rka stanu to dobry pomys艂?
   * Gdyby to by艂a osobna kom贸rka, to technicznie mo偶liwe jest ustawienie np. loading=false & state.type="SOMETHING" - i wiadomo jakie b臋d膮 konsekwencje. By艂by powr贸t do primitive obsession, czego nie chcemy
   * Zasadniczo, "loading" to stan naszej maszyny stanowej. Wi臋c likwidujemy osobn膮 kom贸rk臋 na loading, tj. pozbywamy si臋 tego:
   *    const [isLoading, setLoading] = useState(false)
   */

  const [state, setState] = useState<AuthorizeDeviceState>({
    type: "CHOOSE_METHOD"
  })

  const cancelChoice = async () => {
    setState({ type: "CHOOSE_METHOD" })
  }

  const chooseAllowOnce = async () => {
    setState({ type: "LOADING" })
    // 馃 tu te偶 potrzebny jest try..catch. Wprawdzie nie mamy osobnego ekranu, bo u偶ytkownik _jeszcze_ nie wpisa艂 nic do inputa - ale mo偶e by膰 b艂膮d techniczny (np. zawi艣nie API).
    // B臋dziemy to omawiali w module "Obs艂uga b艂臋d贸w"
    const tokenInstruction = await getTokenInstruction()
    setState({
      type: "ALLOW_ONCE_TOKEN",
      ...tokenInstruction,
      error: false,
    })
  }

  const submitAllowOnce = async (password: string) => {
    if (state.type !== "ALLOW_ONCE_TOKEN"){
      throw new Error(`Invalid State: ${state}`)
    }

    setState({ type: "LOADING" })
    try {
      // 馃 wprawdzie zmieniamy stan po drodze (loading powy偶ej) ale stan sprzed zmiany zosta艂 "domkni臋ty" (closure trzyma go w zmiennej `state`)
      // wi臋c state.tokenId ma poprawn膮 warto艣膰. ALE je艣li nie lubimy "stale closures" kt贸re podnosz膮 poziom trudno艣ci - mo偶emy zdestrukturyzowa膰 stan i u偶y膰 prostej zmiennej dla tokena
      await sendTokenCode({ tokenId: state.tokenId, tokenCode: password })
      setState({ type: "ALLOW_ONCE_SUCCESS" })
      onSuccess()
    } catch (e: unknown) {
      setState({ ...state, error: true })
    }
  }

  const chooseAddDevice = async () => {
    setState({
      type: "ADD_DEVICE_FORM"
    })
  }

  const submitDeviceName = async (currentDeviceName: string) => {
    setState({ type: "LOADING" })
    // 馃 tu te偶 potrzebny jest try..catch. Wprawdzie nie mamy osobnego ekranu, bo u偶ytkownik _jeszcze_ nie wpisa艂 nic do inputa - ale mo偶e by膰 b艂膮d techniczny (np. zawi艣nie API).
    // B臋dziemy to omawiali w module "Obs艂uga b艂臋d贸w"
    const tokenInstruction = await getTokenInstruction()
    setState({
      type: "ADD_DEVICE_TOKEN",
      deviceName: currentDeviceName,
      ...tokenInstruction,
      error: false,
    })
  }

  const resetToken = async () => {
    assertState(state, "ADD_DEVICE_TOKEN")
    setState({ type: "LOADING" })
    const tokenInstruction = await getTokenInstruction()
    setState(({ ...state, ...tokenInstruction, error: false }))
  }

  const submitAddDevice = async (password: string) => {
    // upewnijmy si臋, 偶e jeste艣my w odpowiednim stanie, aby TS "pozwoli艂" nam wej艣膰 w odpowiednie pola stanu
    // r臋cznie:
    if (state.type !== "ADD_DEVICE_TOKEN"){
      throw new Error(`Invalid State: ${state}`)
    }
    // bardziej zwi臋藕le:
    assertState<AuthorizeDeviceState['type']>(state, "ADD_DEVICE_TOKEN")

    setState({ type: "LOADING" })
    try {
      await sendTokenCode({ tokenId: state.tokenId, tokenCode: password })
      setState({
        type: "ADD_DEVICE_CONFIRMATION",
        deviceName: state.deviceName
      })
    } catch (e: unknown) {
      setState(({ ...state, error: true }))
    }
  }

  // 馃敟 dla stanu finalnego - wybieramy 1 z rozwi膮za艅:
  // - albo u偶ywamy stanu LOGGED_OUT i zmiana stanu jest zsynchronizowana z callbackiem - plusem jest to 偶e stan w pami臋ci zawsze odzwsierciedla "stan faktyczny" i 艂atwiej rozumie膰 implementacj臋/debugowa膰
  const handleLogout = () => {
    setState({ type: "LOGGED_OUT" })
    onLogout()
  }
  // - albo u偶ywamy stanu LOGGED_OUT i callback onLogout jest _REAKCJ膭_ na zmian臋 stanu (reactive) - plusem jest to 偶e stan steruje wszystkim, nic si臋 nie dzieje " z boku"
  // useEffect(() => {
  //   if (state.type === "LOGGED_OUT"){
  //     onLogout()
  //   }
  // }, [state, onLogout])
  // - albo w og贸le likwidujemy stan LOGGED_OUT - mamy mniej stan贸w, ale cz臋艣膰 logiki jest state-unaware i potencjalnie trudniej mo偶e by膰 rozumie膰 implementacj臋/debugowa膰
  // const handleLogout = onLogout // lub w og贸le u偶ywamy onLogout z propsa bezpo艣rednio, bez znaczenia
  // 馃敟 nie istnieje jedno "idealne" podej艣cie ( 汀掳 蜏蕱 汀掳) i w zale偶no艣ci od przypadku (wi臋kszy/mniejszy proces, bardziej/mniej skomplikowany, du偶o/ma艂o danych, s膮 dodatkowe side effecty lub nie ma, etc) b臋dziemy preferowali inne podej艣cia

  const handleSuccess = () => {
    setState({ type: "ADD_DEVICE_SUCCESS" })
    onSuccess()
  }
  // analogicznie jak handleLogout

switch(state.type){
  case "LOADING":
    return <Loader />

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
      instruction={state.instruction}
      error={state.error}
    />

  case "ALLOW_ONCE_SUCCESS":
    return null

  case "ADD_DEVICE_FORM":
    return <AuthorizeDeviceAddDeviceFormView
      onSubmit={submitDeviceName}
    />

  case "ADD_DEVICE_TOKEN":
    return <AuthorizeDeviceAddDeviceTokenView
      deviceName={state.deviceName}
      instruction={state.instruction}
      onSubmit={submitAddDevice}
      onReset={resetToken}
      onCancel={cancelChoice}
      error={state.error}
    />

  case "ADD_DEVICE_CONFIRMATION":
    return <AuthorizeDeviceAddDeviceConfirmationView
      deviceName={state.deviceName}
      onClose={handleSuccess}
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
