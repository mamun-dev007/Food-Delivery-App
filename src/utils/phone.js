// Phone helpers for signup/login forms.

/** Keep only the digits of a phone input (strip +, -, spaces, letters…). */
export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Validate a phone number.
 * @param {string} phone
 * @param {{ required?: boolean }} [opts]
 * @returns {string} empty string when valid, otherwise an error message.
 */
const BD_PREFIXES = ["013", "014", "015", "016", "017", "018", "019"];

/**
 * Validate a phone number.
 * @param {string} phone
 * @param {{ required?: boolean }} [opts]
 * @returns {string} empty string when valid, otherwise an error message.
 */
export function validatePhone(phone, { required = true } = {}) {
  const digits = onlyDigits(phone);
  if (!digits) {
    return required ? "Please enter your phone number." : "";
  }
  if (digits.length !== 11) {
    return "Enter a valid 11-digit phone number.";
  }
  if (!BD_PREFIXES.includes(digits.slice(0, 3))) {
    return "Phone number must start with 013, 014, 015, 016, 017, 018 or 019.";
  }
  return "";
}