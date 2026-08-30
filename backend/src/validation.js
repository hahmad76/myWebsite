const LIMITS = {
  name: 120,
  phone: 40,
  email: 254,
  service: 120,
  service_select: 120,
  requirement: 5000,
  qualification: 200,
  subject: 160,
  opportunity: 120,
  details: 5000,
  school: 200,
  contact: 120,
  location: 200,
  type: 120,
  title: 200,
  category: 120,
  description: 5000
};

function cleanString(value, max) {
  if (typeof value !== "string") return value;
  return value.trim().slice(0, max);
}

export function sanitizeData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      output[key] = value;
    } else if (typeof value === "string") {
      output[key] = cleanString(value, LIMITS[key] ?? 5000);
    }
  }
  return output;
}

export function validateSubmission(type, data) {
  const errors = [];
  const required = {
    "Service Request": ["service_select", "name", "phone", "requirement"],
    "Teacher Career Interest": ["name", "phone", "qualification", "subject", "opportunity"],
    "Private School Requirement": ["school", "contact", "phone", "location", "type", "details"]
  }[type];

  if (required) {
    for (const field of required) {
      if (!data[field]) errors.push(`${field} is required`);
    }
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email is invalid");
  }

  if (data.phone && !/^[+()\-\s\d]{7,40}$/.test(data.phone)) {
    errors.push("phone is invalid");
  }

  return errors;
}
