import aesjs from "aes-js"
import base32Encode from "base32-encode"
import base64url from "base64url"
import CryptoJS from "crypto-js"
import { resolve } from "path"
import type { PlasmoContentScript } from "plasmo"
import QrCode from "qrcode-reader"
import totp from "totp-generator"

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

console.log("Hello from background script!", window.location.href)

export const config: PlasmoContentScript = {
  matches: ["https://iam2.kaist.ac.kr//*"],
  run_at: "document_start"
}

// random string generator of length e
function S(e: number) {
  for (var t = "", a = 0; a < e; a++) t += Math.floor(10 * Math.random())
  return t
}

// standard decoding for KAIST
function decode(inp: any) {
  var string = inp
  string = string.split("^")[1]

  var t = CryptoJS.enc.Utf8.parse("DRfNfor672rSksX2")
  var a = CryptoJS.enc.Base64.parse(string)
  var n = CryptoJS.enc.Base64.stringify(a)
  var o = CryptoJS.AES.decrypt(n, t, {
    iv: CryptoJS.enc.Utf8.parse("1234567890123456"),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding
  })

  return o.toString(CryptoJS.enc.Utf8).split("$$")[0]
}

// standard encoding for KAIST
function encode(id: any) {
  var e = id
  e = e + "$$" + S(5)

  var t = CryptoJS.enc.Utf8.parse("DRfNfor672rSksX2"),
    a = CryptoJS.enc.Utf8.parse(e),
    n = CryptoJS.AES.encrypt(a, t, {
      iv: CryptoJS.enc.Utf8.parse("1234567890123456"),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding
    })

  return "enc^" + CryptoJS.enc.Base64.stringify(n.ciphertext)
}

// decrypt secret
function decrypt(encrypted: any) {
  var key = "Zpv6hLyuLyM5WNa0"
  var iv = "Zpv6hLyuLyM5WNa0"

  var keyBytes = aesjs.utils.utf8.toBytes(key)
  var ivBytes = aesjs.utils.utf8.toBytes(iv)

  var aesCbc = new aesjs.ModeOfOperation.cbc(keyBytes, ivBytes)
  var encryptedBytes = base64url.toBuffer(encrypted)
  var decryptedBytes = aesCbc.decrypt(encryptedBytes)
  return JSON.parse(aesjs.utils.utf8.fromBytes(decryptedBytes))
}

// convert word array to uint8 array
function convert_word_array_to_uint8Array(wordArray: any) {
  var len = wordArray.words.length,
    u8_array = new Uint8Array(len << 2),
    offset = 0,
    word,
    i
  for (i = 0; i < len; i++) {
    word = wordArray.words[i]
    u8_array[offset++] = word >> 24
    u8_array[offset++] = (word >> 16) & 0xff
    u8_array[offset++] = (word >> 8) & 0xff
    u8_array[offset++] = word & 0xff
  }
  return u8_array
}

// check if user is logged in
async function isLogin() {
  const resp = await fetch(
    "https://iam2.kaist.ac.kr/api/sso/isAlreadyLogined",
    {
      credentials: "include",
      method: "POST",
      body: new URLSearchParams({
        login_history: "Y"
      })
    }
  )
  const ia = await resp.json()
  if (ia.isAlreadyLogined == "false") {
    return false
  }

  return true
}

// generate totp token from secret
function totpToken(secret: string) {
  const result = decrypt(secret)
  const hash = CryptoJS.SHA256(result.userId + result.otpPin)
  const hashStr = base32Encode(
    convert_word_array_to_uint8Array(hash),
    "RFC3548"
  )
  const token = totp(hashStr, {
    digits: 6,
    algorithm: "SHA-512",
    period: 60,
    timestamp: Date.now()
  })

  return token
}

async function getSecret(info) {
  const resp = await fetch(
    "https://iam2.kaist.ac.kr/user/before/getKaistQrCode",
    {
      credentials: "include",
      method: "POST",
      body: new URLSearchParams({
        userId: encode(info.id)
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

  // var qr = new QrCode()

  // qr.callback = function (error, result) {
  //   if (error) {
  //     console.log(error)
  //     return
  //   }
  //   console.log(result)
  //   return result.result
  // }
  // qr.decode(qr_result)
}

// main function
async function main() {
  const url = window.location.href

  const login = await isLogin() // check if user is logged in, if logged in, end program

  const info = await storage.get("info")

  var sec = await storage.get("secret")

  if (login) {
    console.log("already", sec)
    if (!sec) {
      const pre = await getSecret(info)
      await storage.set("secret", pre)
      sec = pre
    }
  }

  console.log(sec)

  if (
    url.includes("#/commonLogin") ||
    url.includes("#/userLogin") ||
    url == "https://iam2.kaist.ac.kr/" // for some reason, chrome doesn't load the page properly, so we need to check this
  ) {
    if (info) {
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

      console.log("location", location)

      await fetch("https://iam2.kaist.ac.kr/api/sso/login", {
        credentials: "include",
        method: "POST",
        body: new URLSearchParams({
          user_id: encode(info.id),
          otp: token,
          login_page: "L_P_IAMPS",
          param_id: "",
          auth_type_2nd: "motp",
          alrdln: "T"
        })
      })

      console.log("redirecting to ", location)

      window.location.href = location
    }
  }
}

main()
