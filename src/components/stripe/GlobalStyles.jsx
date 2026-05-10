import React from "react";
import { getStripeSourceParts } from "../../lib/stripeSource";

export default function GlobalStyles() {
  const { styleText } = getStripeSourceParts();

  if (!styleText) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: styleText }} />;
}
