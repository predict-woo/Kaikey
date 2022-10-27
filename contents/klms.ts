import type { PlasmoContentScript } from "plasmo"

export const config: PlasmoContentScript = {
  matches: ["https://klms.kaist.ac.kr/*"],
  run_at: "document_start"
}

// main function
if (window.location.href === "https://klms.kaist.ac.kr/login/ssologin.php") {
  window.location.href = "https://klms.kaist.ac.kr/sso2/login.php"
}
