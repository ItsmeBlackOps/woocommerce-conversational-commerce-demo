import { normalizeText } from "../utils/text.js";

export function shippingEstimate(destinationText, data) {
  const normalized = normalizeText(destinationText || "");
  const region = data.shipping.regions.find((item) => item.region_id === "us") || data.shipping.regions[0];
  let method = data.shipping.methods.find((item) => item.id === region.default_method) || data.shipping.methods[0];
  let minDays = method.min_days;
  let maxDays = method.max_days;

  for (const override of region.overrides || []) {
    if (normalized.includes(normalizeText(override.state))) {
      method = data.shipping.methods.find((item) => item.id === override.method) || method;
      minDays = override.min_days ?? method.min_days;
      maxDays = override.max_days ?? method.max_days;
      break;
    }
  }

  return {
    method: method.name,
    minDays,
    maxDays,
    note: data.shipping.common_answers?.final_source || method.note
  };
}
