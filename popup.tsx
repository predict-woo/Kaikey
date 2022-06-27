import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage"

function IndexPopup() {
  const [id, setId] = useState("")
  const [pwd, setPwd] = useState("")
  const [info, setInfo] = useStorage("info", { id: "", pwd: "" })

  useEffect(() => {
    setId(info.id)
    setPwd(info.pwd)
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <input onChange={(e) => setId(e.target.value)} placeholder={info.id} />
      <input onChange={(e) => setPwd(e.target.value)} placeholder={info.pwd} />
      <button onClick={() => setInfo({ id: id, pwd: pwd })}>Login</button>
    </div>
  )
}

export default IndexPopup
