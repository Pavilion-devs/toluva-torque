import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import HTMLtoJSX from "htmltojsx";

const projectRoot = process.cwd();
const sourcePath = path.resolve(projectRoot, "../fintech-saas.aura.build-content.html");
const outputDir = path.resolve(projectRoot, "src/components/stripe/sections/bento");

const bentoCards = [
  ["UnifiedCheckoutCard", 0],
  ["UsageBillingCard", 1],
  ["AgenticCommerceCard", 2],
  ["IssuingCard", 3],
  ["CryptoCard", 4],
  ["EmbeddedPaymentsCard", 5],
];

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

function buildSectionSource() {
  const imports = bentoCards
    .map(([componentName]) => `import ${componentName} from "./bento/${componentName}";`)
    .join("\n");
  const cards = bentoCards
    .map(([componentName]) => `            <${componentName} />`)
    .join("\n");

  return `import React from "react";
${imports}

export default function BentoGridSection() {
  return (
    <section className="font-sans bg-white pt-24 pr-page-margin pb-24 pl-page-margin" data-aura-component-name="BentoGrid">
      <div className="max-w-[1200px] mx-auto" data-aura-component-name="BentoGrid">
        <div className="mb-12" data-aura-component-name="BentoGrid">
          <h2 className="text-[#0a2540] text-3xl font-medium tracking-tight mb-4" data-aura-component-name="BentoGrid">
            Modular solutions
          </h2>
          <p className="text-lg text-[#424770] max-w-2xl" data-aura-component-name="BentoGrid">
            Mix and match our products to create exactly the payment infrastructure you need.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-aura-component-name="BentoGrid">
${cards}
        </div>
      </div>
    </section>
  );
}
`;
}

async function run() {
  const htmlText = await fs.readFile(sourcePath, "utf8");
  const document = new JSDOM(htmlText).window.document;
  const bentoSection = document.querySelector('[data-aura-component-name="BentoGrid"].font-sans');
  const grid = bentoSection?.querySelector(".grid");

  if (!grid) {
    throw new Error("Could not find BentoGrid card grid in source HTML");
  }

  const converter = new HTMLtoJSX({
    createClass: false,
    outputClassName: false,
    hideComment: true,
  });

  await fs.mkdir(outputDir, { recursive: true });

  for (const [componentName, index] of bentoCards) {
    const node = grid.children[index];
    if (!node) {
      throw new Error(`Missing BentoGrid card index ${index} for ${componentName}`);
    }

    const jsxMarkup = converter.convert(serializeNode(node));
    await fs.writeFile(
      path.join(outputDir, `${componentName}.jsx`),
      buildComponentSource(componentName, jsxMarkup),
      "utf8",
    );
  }

  await fs.writeFile(
    path.resolve(projectRoot, "src/components/stripe/sections/BentoGridSection.jsx"),
    buildSectionSource(),
    "utf8",
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
