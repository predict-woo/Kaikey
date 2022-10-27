import { message } from "antd"
import { FaKey } from "react-icons/fa"

import { useStorage } from "@plasmohq/storage"

import buymeacoffee from "./assets/buymeacoffee.png"
import { decode } from "./functions/decoding"
import { getSecret, getUserInfoById, isLogin } from "./functions/fetch"
import "./index.less"
import "./popup.css"

interface Data {
  koreanName: string
}

function IndexPopup() {
  const [info, setInfo] = useStorage("info", {
    checked: false,
    id: "",
    secret: "",
    name: ""
  })

  const onChange = async ({ target }) => {
    if (target.checked) {
      const loggedIn = await isLogin()
      if (!loggedIn) {
        alert("카이스트 서비스에 로그인을 한 후 다시 시도해주세요!")
        return
      }
      console.log(loggedIn)
      const id = decode(loggedIn)
      console.log(id)
      const data = (await getUserInfoById(id)) as Data
      const name = decode(data.koreanName)
      const sec = await getSecret(id)
      console.log(sec)
      setInfo({ checked: true, id: id, secret: sec, name: name })
    } else {
      setInfo({ checked: false, id: "", secret: "", name: "" })
    }
  }

  const message = () => {
    if (info.checked) {
      return (
        <div className="message">
          사용을<div className="red">중지</div>하기 위해서 눌러주세요
        </div>
      )
    } else {
      return (
        <div className="message">
          <div
            onClick={() => {
              chrome.tabs.create({ url: "https://iam2.kaist.ac.kr/" })
            }}
            className="blue">
            iam2
          </div>
          로그인후 <div className="green">사용</div>하기 위해 눌러주세요
        </div>
      )
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}
      className="background">
      <div className="logo">
        Kai
        <FaKey className="icon" />
        Key
      </div>

      <div className="main">
        {message()}
        <input
          type="checkbox"
          id="switch"
          checked={info.checked}
          onChange={onChange}
        />
        <label htmlFor="switch">Toggle</label>
        <div className="info">현재 사용자: {info.name}</div>
      </div>
      <div className="footer">
        <div className="credit">
          <div className="author">made by 0ev with ❤️</div>
          <div
            className="coffee"
            onClick={() => {
              chrome.tabs.create({ url: "https://www.buymeacoffee.com/0evdev" })
            }}>
            <img src={buymeacoffee}></img>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
