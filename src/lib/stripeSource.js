import rawHtml from "../../references/fintech-saas.aura.build-content.html.txt?raw";

let cached = null;
export const appClassName =
  "min-h-screen flex flex-col bg-white overflow-x-hidden relative";

function parseSource() {
  if (cached) {
    return cached;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const rootHost = doc.querySelector("#root");
  const appContainer = rootHost?.firstElementChild || null;

  const styles = Array.from(doc.querySelectorAll("style"))
    .map((style) => style.textContent || "")
    .join("\n");

  cached = {
    appClassName: appContainer?.getAttribute("class") || appClassName,
    styleText: styles,
  };

  return cached;
}

export function getStripeSourceParts() {
  return parseSource();
}
