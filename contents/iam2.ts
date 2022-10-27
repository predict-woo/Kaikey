import type { PlasmoContentScript } from "plasmo"

import { Storage } from "@plasmohq/storage"

import { IampsLogin } from "~tools/Iamps"
import { OTPLogin } from "~tools/OTP"

import { encode, totpToken } from "../functions/decoding"

const storage = new Storage()

interface Info {
  checked: boolean
  id: string
  secret: string
  name: string
}

export const config: PlasmoContentScript = {
  matches: ["https://iam2.kaist.ac.kr/*"],
  run_at: "document_end"
}

// main function
async function main() {
  const url: string = window.location.href

  const info: Info = await storage.get("info")

  if (!info.checked) {
    return
  }

  const id = info.id
  const sec = info.secret

  if (
    url.includes("#/commonLogin") ||
    url.includes("#/userLogin") ||
    url == "https://iam2.kaist.ac.kr/" // for some reason, chrome doesn't load the page properly, so we need to check this
  ) {
    if (id) {
      const token = totpToken(sec)
      let isOTP = "Y"
      let param
      let location

      if (url.includes("#/commonLogin")) {
        param = url.split("=")[2]
        const location_resp = await fetch(
          "https://iam2.kaist.ac.kr/user/getClientName",
          {
            method: "POST",
            body: new URLSearchParams({
              paramId: encode(param)
            })
          }
        )
        const location_json = await location_resp.json()
        location = location_json.url
      }

      // using switch for expandability; i.e. if we want to add more custom login methods
      switch (url) {
        case "https://iam2.kaist.ac.kr/#/userLogin":
          console.log("detected iamps. using custom login sequence")
          await IampsLogin(id, token)
          break
        default:
          console.log("detected normal website. using default login sequence")
          await OTPLogin(id, token, param, location)
      }
    }
  }
}

main()
