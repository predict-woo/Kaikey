import { Switch } from "antd"
import { useEffect, useState } from "react"

import { Storage, useStorage } from "@plasmohq/storage"

import { decode, encode, totpToken } from "./functions/decoding"
import { getSecret, isLogin } from "./functions/fetch"
import "./index.less"

function IndexPopup() {
  const [info, setInfo] = useStorage("info", {
    checked: false,
    id: "",
    secret: ""
  })

  const onChange = async (c: boolean) => {
    if (c) {
      const loggedIn = await isLogin()
      if (!loggedIn) {
        alert("카이스트 서비스에 로그인을 한 후 다시 시도해주세요!")
        return
      }
      const id = decode(loggedIn)
      const sec = await getSecret(id)
      setInfo({ checked: true, id: id, secret: sec })
    } else {
      setInfo({ checked: false, id: "", secret: "" })
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>Auto-Login</h1>
      <Switch checked={info.checked} onChange={onChange} />
    </div>
  )
}

export default IndexPopup
