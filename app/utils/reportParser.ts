/**
 * Parse raw update text into a clean array of points.
 * Automatically removes bullet characters, numbers, and extra spaces.
 */
export function parseUpdatePoints(input: string): string[] {
  if (!input) return [];
  
  return input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove leading bullets: -, *, •, ➤, etc.
      // Also remove numbered list prefixes like 1. or 1)
      return line.replace(/^([-\*\+•➤\u2022]|\d+[\.\)]+)\s*/, "").trim();
    })
    .filter(line => line.length > 0);
}

/**
 * Format date using local time.
 * Supports: YYYY, YY, MMMM (uppercase), MMM (uppercase), MM, DD, D, etc.
 */
export function formatCurrentDate(formatStr: string, date: Date = new Date()): string {
  const years = date.getFullYear().toString();
  const yearShort = years.slice(-2);
  
  const monthNamesFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const monthIndex = date.getMonth();
  const monthFull = monthNamesFull[monthIndex];
  const monthShort = monthNamesShort[monthIndex];
  const monthNum = String(monthIndex + 1).padStart(2, "0");
  
  const dayNum = String(date.getDate()).padStart(2, "0");
  const dayNumShort = String(date.getDate());

  let result = formatStr;
  
  // Format tokens
  result = result.replace(/YYYY/g, years);
  result = result.replace(/YY/g, yearShort);
  result = result.replace(/MMMM/g, monthFull.toUpperCase());
  result = result.replace(/MMM/g, monthShort.toUpperCase());
  result = result.replace(/MM/g, monthNum);
  result = result.replace(/DD/g, dayNum);
  result = result.replace(/D/g, dayNumShort);
  
  return result;
}

/**
 * Scan template string for info placeholders (e.g. {{info:Ticket ID}})
 * Returns unique placeholder names found.
 */
export function scanInfoPlaceholders(templateStr: string): string[] {
  const regex = /\{\{info:([^\}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(templateStr)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  
  return matches;
}

/**
 * Process template, replacing all placeholders with their final values.
 */
export function generateReport({
  templateStr,
  points,
  infoValues = {},
  bulletPrefix = "➤",
  dateObj = new Date(),
  listStyle = "bullet",
  numberBase = 10,
}: {
  templateStr: string;
  points: string[];
  infoValues?: Record<string, string>;
  bulletPrefix?: string;
  dateObj?: Date;
  listStyle?: "bullet" | "numbered";
  numberBase?: number;
}): string {
  let output = templateStr;

  // 1. Replace date placeholders: {{date:FORMAT}}
  const dateRegex = /\{\{date:([^\}]+)\}\}/g;
  output = output.replace(dateRegex, (_, formatStr) => {
    return formatCurrentDate(formatStr, dateObj);
  });

  // 2. Replace info placeholders: {{info:PLACEHOLDER}}
  const infoRegex = /\{\{info:([^\}]+)\}\}/g;
  output = output.replace(infoRegex, (_, placeholderName) => {
    return infoValues[placeholderName] || "";
  });

  // 3. Replace points placeholder: {{points:PREFIX}} or {{points}}
  const pointsRegex = /\{\{points(?::([^\}]+))?\}\}/g;
  output = output.replace(pointsRegex, (_, customPrefix) => {
    if (listStyle === "numbered") {
      return points
        .map((pt, idx) => {
          const numStr = (idx + 1).toString(numberBase);
          return `${numStr}. ${pt}`;
        })
        .join("\n");
    }

    const prefixToUse = customPrefix !== undefined ? customPrefix : bulletPrefix;
    return points
      .map(pt => `${prefixToUse}${prefixToUse ? " " : ""}${pt}`)
      .join("\n");
  });

  return output;
}
