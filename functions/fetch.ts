import QrCode from "qrcode-reader"

import { encode } from "../functions/decoding"

/**
 * checks if the user is logged in
 * @return {Promise<string>} returns the userId if logged in, else returns empty string
 */
async function isLogin(): Promise<string> {
  const resp = await fetch(
    "https://iam2.kaist.ac.kr/api/sso/isAlreadyLogined",
    {
      credentials: "include",
      method: "POST"
    }
  )
  const ia = await resp.json()
  if (ia.isAlreadyLogined == "false") {
    return ""
  } else {
    return ia.userId
  }
}

/**
 * fetches the user's info
 * @param {string} id - the id of the user
 * @return {Promise<object>} Brief description of the returning value here.
 */
async function getUserInfoById(id: string): Promise<object> {
  const res = await fetch("https://iam2.kaist.ac.kr/user/before/getUserById", {
    method: "POST",
    credentials: "include",
    body: new URLSearchParams({
      userId: encode(id)
    })
  })
  const data = await res.json()
  return data
}

/**
 * gets the user secret from the qr code
 * @param {string} id - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
 * @return {Promise<string>} Brief description of the returning value here.
 */
async function getSecret(id: string): Promise<string> {
  const resp = await fetch(
    "https://iam2.kaist.ac.kr/user/before/getKaistQrCode",
    {
      credentials: "include",
      method: "POST",
      body: new URLSearchParams({
        userId: encode(id)
      })
    }
  )

  const data = await resp.text()

  const qr_result = "data:image/png;base64," + data

  return new Promise((resolve, reject) => {
    var qr = new QrCode()
    qr.callback = function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result.result)
      }
    }
    qr.decode(qr_result)
  })
}

export { isLogin, getUserInfoById, getSecret }
