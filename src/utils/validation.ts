const ASN_REGEX = /^(AS)?(\d{1,10})$/i;
const ASN_MIN = 1;
const ASN_MAX = 4294967295;

export function isValidASN(input: string): boolean {
  const match = input.match(ASN_REGEX);
  if (!match) {
    return false;
  }
  
  const asnNumber = parseInt(match[2]!, 10);
  return asnNumber >= ASN_MIN && asnNumber <= ASN_MAX;
}

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV4_OCTET_MAX = 255;
const IPV4_PREFIX_MAX = 32;

function isValidIPv4Octet(octet: string): boolean {
  const num = parseInt(octet, 10);
  return num >= 0 && num <= IPV4_OCTET_MAX;
}

export function isValidIPv4(input: string): boolean {
  const parts = input.split("/");
  const ip = parts[0]!;
  
  const match = ip.match(IPV4_REGEX);
  if (!match) {
    return false;
  }
  
  for (let i = 1; i <= 4; i++) {
    if (!isValidIPv4Octet(match[i]!)) {
      return false;
    }
  }
  
  if (parts.length === 2) {
    const prefix = parseInt(parts[1]!, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > IPV4_PREFIX_MAX) {
      return false;
    }
  } else if (parts.length > 2) {
    return false;
  }
  
  return true;
}

const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
const IPV6_COMPRESSED_REGEX = /^([0-9a-fA-F]{0,4}:)*::([0-9a-fA-F]{0,4}:)*[0-9a-fA-F]{0,4}$/;
const IPV6_PREFIX_MAX = 128;

export function isValidIPv6(input: string): boolean {
  const parts = input.split("/");
  const ip = parts[0]!;
  
  if (!IPV6_REGEX.test(ip) && !IPV6_COMPRESSED_REGEX.test(ip)) {
    return false;
  }
  
  if (parts.length === 2) {
    const prefix = parseInt(parts[1]!, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > IPV6_PREFIX_MAX) {
      return false;
    }
  } else if (parts.length > 2) {
    return false;
  }
  
  return true;
}

export type InputType = "asn" | "ipv4" | "ipv6" | "invalid";
export type SubnetType = "ipv4_subnet" | "ipv6_subnet" | "invalid";

export function detectInputType(input: string): InputType {
  if (isValidASN(input)) {
    return "asn";
  }
  if (isValidIPv4(input)) {
    return "ipv4";
  }
  if (isValidIPv6(input)) {
    return "ipv6";
  }
  return "invalid";
}

export function isValidIPv4Subnet(input: string): boolean {
  const parts = input.split("/");
  if (parts.length !== 2) {
    return false; // Must have prefix length
  }
  return isValidIPv4(input);
}

export function isValidIPv6Subnet(input: string): boolean {
  const parts = input.split("/");
  if (parts.length !== 2) {
    return false; // Must have prefix length
  }
  return isValidIPv6(input);
}

export function detectSubnetType(input: string): SubnetType {
  if (isValidIPv4Subnet(input)) {
    return "ipv4_subnet";
  }
  if (isValidIPv6Subnet(input)) {
    return "ipv6_subnet";
  }
  return "invalid";
}

export interface ValidationError {
  readonly line: number;
  readonly content: string;
  readonly reason: string;
}

export function validateBatchInput(content: string): { 
  validLines: string[], 
  errors: ValidationError[] 
} {
  const lines = content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const validLines: string[] = [];
  const errors: ValidationError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const subnetType = detectSubnetType(line);
    
    if (subnetType === "invalid") {
      const inputType = detectInputType(line);
      let reason: string;
      
      if (inputType === "asn") {
        reason = "ASNs are not supported in batch mode";
      } else if (inputType === "ipv4" || inputType === "ipv6") {
        reason = "IP addresses without prefix length are not supported (use CIDR notation like /24)";
      } else {
        reason = "Invalid format - expected IPv4 or IPv6 subnet in CIDR notation";
      }
      
      errors.push({
        line: lineNumber,
        content: line,
        reason
      });
    } else {
      validLines.push(line);
    }
  });

  return { validLines, errors };
}

const ASN_NORMALIZE_REGEX = /^(AS)?(\d+)$/i;

export function normalizeASN(input: string): string {
  const match = input.match(ASN_NORMALIZE_REGEX);
  if (!match) {
    throw new Error("Invalid ASN format");
  }
  return `AS${match[2]}`;
}