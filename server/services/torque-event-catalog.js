export const torqueEventSchemas = [
  {
    eventName: "token_launch_created",
    name: "Token Launch Created",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "pool_state", type: "string", label: "Raydium Pool State" },
      { fieldName: "verified", type: "boolean", label: "Verified" },
    ],
  },
  {
    eventName: "launch_page_shared",
    name: "Launch Page Shared",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "channel", type: "string", label: "Share Channel" },
    ],
  },
  {
    eventName: "referral_clicked",
    name: "Referral Clicked",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "referral_code", type: "string", label: "Referral Code" },
      { fieldName: "referrer", type: "string", label: "Referrer Wallet" },
    ],
  },
  {
    eventName: "wallet_connected_to_launch",
    name: "Wallet Connected To Launch",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "referral_code", type: "string", label: "Referral Code" },
    ],
  },
  {
    eventName: "first_buy_completed",
    name: "First Buy Completed",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "pool_state", type: "string", label: "Raydium Pool State" },
      { fieldName: "amount", type: "number", label: "Buy Amount" },
      { fieldName: "amount_usd", type: "number", label: "Buy Amount USD" },
      { fieldName: "tx_signature", type: "string", label: "Transaction Signature" },
    ],
  },
  {
    eventName: "buy_completed",
    name: "Buy Completed",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "pool_state", type: "string", label: "Raydium Pool State" },
      { fieldName: "amount", type: "number", label: "Buy Amount" },
      { fieldName: "amount_usd", type: "number", label: "Buy Amount USD" },
      { fieldName: "tx_signature", type: "string", label: "Transaction Signature" },
    ],
  },
  {
    eventName: "migration_threshold_hit",
    name: "Migration Threshold Hit",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "pool_state", type: "string", label: "Raydium Pool State" },
      { fieldName: "progress_pct", type: "number", label: "Migration Progress Percent" },
    ],
  },
  {
    eventName: "token_migrated",
    name: "Token Migrated",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "pool_state", type: "string", label: "Raydium Pool State" },
      { fieldName: "amm_pool", type: "string", label: "Migrated AMM Pool" },
    ],
  },
  {
    eventName: "reward_claim_started",
    name: "Reward Claim Started",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "campaign_id", type: "string", label: "Campaign ID" },
      { fieldName: "claim_id", type: "string", label: "Claim ID" },
      { fieldName: "reward_amount", type: "number", label: "Reward Amount" },
    ],
  },
  {
    eventName: "reward_claimed",
    name: "Reward Claimed",
    fields: [
      { fieldName: "source", type: "string", label: "Source" },
      { fieldName: "token", type: "string", label: "Token Symbol" },
      { fieldName: "launch_id", type: "string", label: "Launch ID" },
      { fieldName: "campaign_id", type: "string", label: "Campaign ID" },
      { fieldName: "reward_amount", type: "number", label: "Reward Amount" },
      { fieldName: "tx_signature", type: "string", label: "Transaction Signature" },
    ],
  },
];

export const TORQUE_MAX_STRING_FIELDS = 5;

export function getTorqueEventSchema(eventName) {
  return torqueEventSchemas.find((schema) => schema.eventName === eventName) || null;
}

export function getTorqueEventCatalogIssues() {
  return torqueEventSchemas.flatMap((schema) => {
    const issues = [];
    const stringFieldCount = schema.fields.filter((field) => field.type === "string").length;
    const fieldNames = new Set();

    if (stringFieldCount > TORQUE_MAX_STRING_FIELDS) {
      issues.push({
        eventName: schema.eventName,
        code: "too_many_string_fields",
        message: `${schema.eventName} has ${stringFieldCount} string fields; Torque allows ${TORQUE_MAX_STRING_FIELDS}.`,
      });
    }

    for (const field of schema.fields) {
      if (fieldNames.has(field.fieldName)) {
        issues.push({
          eventName: schema.eventName,
          code: "duplicate_field",
          fieldName: field.fieldName,
          message: `${schema.eventName} declares ${field.fieldName} more than once.`,
        });
      }

      fieldNames.add(field.fieldName);
    }

    return issues;
  });
}
