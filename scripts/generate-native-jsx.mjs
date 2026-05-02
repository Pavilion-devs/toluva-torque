import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import HTMLtoJSX from "htmltojsx";

const projectRoot = process.cwd();
const sourcePath = path.resolve(
  projectRoot,
  "../fintech-saas.aura.build-content.html",
);

const mainSections = [
  ["CursorFollower", 0],
  ["HeroSection", 1],
  ["LogoStrip", 2],
  ["PaymentsPlatformSection", 3],
  ["BentoGridSection", 4],
  ["GlobalCommerceSection", 5],
  ["DarkMetricsSection", 6],
  ["CaseStudies", 7],
];

function buildComponentSource(componentName, jsxMarkup) {
  return `import React from "react";

export default function ${componentName}() {
  return (
${jsxMarkup
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  );
}
`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function serializeNode(node, level = 0) {
  const indent = "  ".repeat(level);

  if (node.nodeType === node.TEXT_NODE) {
    const text = node.textContent.replace(/\s+/g, " ").trim();
    return text ? `${indent}${escapeHtml(text)}` : "";
  }

  if (node.nodeType !== node.ELEMENT_NODE) {
    return "";
  }

  const tagName = node.tagName.toLowerCase();
  const attributes = Array.from(node.attributes)
    .map((attribute) => ` ${attribute.name}="${escapeAttribute(attribute.value)}"`)
    .join("");
  const children = Array.from(node.childNodes)
    .map((child) => serializeNode(child, level + 1))
    .filter(Boolean);

  if (children.length === 0) {
    return `${indent}<${tagName}${attributes}></${tagName}>`;
  }

  return [
    `${indent}<${tagName}${attributes}>`,
    children.join("\n"),
    `${indent}</${tagName}>`,
  ].join("\n");
}

function convertNode(converter, node) {
  return converter
    .convert(serializeNode(node))
    .replace(/<span data-aura-component-name="RevealText" \/>/g, '{" "}');
}

function buildMainContentSource() {
  const imports = mainSections
    .map(([componentName]) => `import ${componentName} from "./sections/${componentName}";`)
    .join("\n");
  const sectionMarkup = mainSections
    .map(([componentName]) => `      <${componentName} />`)
    .join("\n");

  return `import React from "react";
${imports}

export default function MainContent() {
  return (
    <main className="flex-grow" data-aura-component-name="App">
${sectionMarkup}
    </main>
  );
}
`;
}

async function run() {
  const htmlText = await fs.readFile(sourcePath, "utf8");
  const dom = new JSDOM(htmlText);
  const document = dom.window.document;
  const appContainer = document.querySelector("#root > div");

  if (!appContainer) {
    throw new Error("Could not find #root > div in source HTML");
  }

  const children = Array.from(appContainer.children);
  const converter = new HTMLtoJSX({
    createClass: false,
    outputClassName: false,
    hideComment: true,
  });

  await fs.mkdir(path.resolve(projectRoot, "src/components/stripe/sections"), {
    recursive: true,
  });

  const navNode = children[0];
  const mainNode = children[1];
  const footerNode = children[2];

  if (!navNode || !mainNode || !footerNode) {
    throw new Error("Expected nav, main, and footer root children in source HTML");
  }

  await fs.writeFile(
    path.resolve(projectRoot, "src/components/stripe/Navbar.jsx"),
    buildComponentSource("Navbar", convertNode(converter, navNode)),
    "utf8",
  );

  await fs.writeFile(
    path.resolve(projectRoot, "src/components/stripe/Footer.jsx"),
    buildComponentSource("Footer", convertNode(converter, footerNode)),
    "utf8",
  );

  await fs.writeFile(
    path.resolve(projectRoot, "src/components/stripe/MainContent.jsx"),
    buildMainContentSource(),
    "utf8",
  );

  const mainChildren = Array.from(mainNode.children);

  for (const [componentName, index] of mainSections) {
    const node = mainChildren[index];
    if (!node) {
      throw new Error(`Missing main child index ${index} for ${componentName}`);
    }

    await fs.writeFile(
      path.resolve(projectRoot, `src/components/stripe/sections/${componentName}.jsx`),
      buildComponentSource(componentName, convertNode(converter, node)),
      "utf8",
    );
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
