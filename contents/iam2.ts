import type { PlasmoContentScript } from "plasmo"

import { Storage } from "@plasmohq/storage"

import { encode, totpToken } from "../functions/decoding"

const storage = new Storage()


interface Info {
  checked: boolean,
  id: string,
  secret: string
}

export const config: PlasmoContentScript = {
  matches: ["https://iam2.kaist.ac.kr//*"],
  run_at: "document_start"
}

// main function
async function main() {

  const url = window.location.href

  const info = <Info> await storage.get("info")

  if(!info.checked){
    return;
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

      let location = "https://iam2.kaist.ac.kr/#/user/main"

      if (url.includes("#/commonLogin")) {
        const param = url.split("=")[2]
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

      await fetch("https://iam2.kaist.ac.kr/api/sso/login", {
        credentials: "include",
        method: "POST",
        body: new URLSearchParams({
          user_id: encode(id),
          otp: token,
          login_page: "L_P_IAMPS",
          param_id: "",
          auth_type_2nd: "motp",
          alrdln: "T"
        })
      })

      window.location.href = location
    }
  }
}

main()