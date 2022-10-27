import { encode } from "../functions/decoding"
import { redirectPost } from "./redirect"

const OTPLogin = async (
  id: string,
  token: string,
  param: string,
  url: string
) => {
  const OTPData = {
    user_id: encode(id),
    otp: token,
    login_page: "L_P_COMMON",
    param_id: param,
    auth_type_2nd: "motp",
    alrdln: "T"
  }

  const res = await fetch("https://iam2.kaist.ac.kr/api/sso/login", {
    credentials: "include",
    method: "POST",
    body: new URLSearchParams(OTPData)
  })

  const json = await res.json()
  const redirectURL = json?.dataMap?.REDIRECT_URL
  const isEnc = json?.enc

  // exits if login failed
  if (json.error || !redirectURL) {
    return false
  }

  if (isEnc) {
    window.location.href = url
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

export { OTPLogin }
