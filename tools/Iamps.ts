import { encode } from "../functions/decoding"
import { redirectPost } from "./redirect"

const IampsLogin = async (id: string, token: string) => {
  const OTPData = {
    user_id: encode(id),
    otp: token,
    login_page: "L_P_IAMPS",
    param_id: "",
    auth_type_2nd: "motp",
    alrdln: "T"
  }

  const res = await fetch("https://iam2.kaist.ac.kr/api/sso/login", {
    credentials: "include",
    method: "POST",
    body: new URLSearchParams(OTPData)
  })
  window.location.href = "https://iam2.kaist.ac.kr/#/user/main"
}

export { IampsLogin }
