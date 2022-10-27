import { encode } from "../functions/decoding"
import { redirectPost } from "./redirect"

const PwdLogin = async (id: string, pwd: string, param: string) => {
  const pwdData = {
    user_id: encode(id),
    login_page: "L_P_COMMON",
    param_id: param,
    pw: encode(pwd)
  }

  const res = await fetch("https://iam2.kaist.ac.kr/api/sso/login", {
    credentials: "include",
    method: "POST",
    body: new URLSearchParams(pwdData)
  })

  const json = await res.json()
  const redirectURL = json?.dataMap?.REDIRECT_URL

  // exits if login failed
  if (json.error || !redirectURL) {
    return false
  }

  const redirectData = {
    result: JSON.stringify(json),
    k_uid: json.dataMap.USER_INFO.kaist_uid,
    success: "true",
    user_id: id,
    state: json.dataMap.state
  }

  redirectPost(redirectURL, redirectData)
}

export { PwdLogin }
