import aesjs from "aes-js"
import base32Encode from "base32-encode"
import base64url from "base64url"
import CryptoJS from "crypto-js"
import totp from "totp-generator"

// random string generator of length e
function generateRandom(e: number): string {
  for (var t = "", a = 0; a < e; a++) t += Math.floor(10 * Math.random())
  return t
}

// standard decoding for KAIST
function decode(inp: string): string {
  const t = CryptoJS.enc.Utf8.parse("DRfNfor672rSksX2")
  const a = CryptoJS.enc.Base64.parse(inp.split("^")[1])
  const n = CryptoJS.enc.Base64.stringify(a)
  const o = CryptoJS.AES.decrypt(n, t, {
    iv: CryptoJS.enc.Utf8.parse("1234567890123456"),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding
  })

  return o.toString(CryptoJS.enc.Utf8).split("$$")[0]
}

// standard encoding for KAIST
function encode(id: string): string {
  const t = CryptoJS.enc.Utf8.parse("DRfNfor672rSksX2"),
    a = CryptoJS.enc.Utf8.parse(id + "$$" + generateRandom(5)),
    n = CryptoJS.AES.encrypt(a, t, {
      iv: CryptoJS.enc.Utf8.parse("1234567890123456"),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding
    })

  return "enc^" + CryptoJS.enc.Base64.stringify(n.ciphertext)
}

// decrypt secret
function decrypt(encrypted: any): any {
  const key = "Zpv6hLyuLyM5WNa0"
  const iv = "Zpv6hLyuLyM5WNa0"

  const keyBytes = aesjs.utils.utf8.toBytes(key)
  const ivBytes = aesjs.utils.utf8.toBytes(iv)

  const aesCbc = new aesjs.ModeOfOperation.cbc(keyBytes, ivBytes)
  const encryptedBytes = base64url.toBuffer(encrypted)
  const decryptedBytes = aesCbc.decrypt(encryptedBytes)
  const chars = aesjs.utils.utf8.fromBytes(decryptedBytes) as string
  const res = chars.substring(0, chars.indexOf("}") + 1)
  if (res) {
    return JSON.parse(res)
  } else {
    return null
  }
}

// convert word array to uint8 array
function convert_word_array_to_uint8Array(wordArray: any): any {
  var len = wordArray.words.length,
    u8_array = new Uint8Array(len << 2),
    offset = 0,
    word: number,
    i: number
  for (i = 0; i < len; i++) {
    word = wordArray.words[i]
    u8_array[offset++] = word >> 24
    u8_array[offset++] = (word >> 16) & 0xff
    u8_array[offset++] = (word >> 8) & 0xff
    u8_array[offset++] = word & 0xff
  }
  return u8_array
}

// generate totp token from secret
function totpToken(secret: string): string {
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

export {
  generateRandom,
  decode,
  encode,
  decrypt,
  convert_word_array_to_uint8Array,
  totpToken
}
