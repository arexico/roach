import { render } from "ink";
import { createElement } from "react";
import { QueryScreen } from "@/components/QueryScreen.tsx";
import { processBatchFile } from "@/utils/batch.ts";

interface CLIArgs {
  command: string | undefined;
  inputFile: string | undefined;
  outputFile: string | undefined;
}

function parseArgs(args: string[]): CLIArgs {
  const [command, inputFile, outputFile] = args;
  return { command, inputFile, outputFile };
}

function showHelp(): void {
  console.log("🪳  Roach - Route Origin Authorization Checker");
  console.log("");
  console.log("Usage:");
  console.log("  roach                    # Interactive TUI mode");
  console.log("  roach batch <in> <out>   # Batch processing mode");
  console.log("");
  console.log("Interactive mode:");
  console.log(
    "  Enter ASNs (AS1), IP addresses (1.1.1.1), or CIDRs (1.1.1.0/24)",
  );
  console.log("  Navigate results with arrow keys, press q or Esc to return");
  console.log("");
  console.log("Batch mode:");
  console.log("  <in>   Input file with IP prefixes/CIDRs, one per line");
  console.log("  <out>  Output CSV file with subnet,origin,rpki columns");
  console.log("  Note:  Only IP prefixes/CIDRs supported (no ASNs)");
  console.log("");
}

async function handleBatchMode(
  inputFile: string,
  outputFile: string,
): Promise<void> {
  try {
    await processBatchFile(inputFile, outputFile);
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Batch processing failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

function showBatchUsageError(): void {
  console.error("❌ Usage: roach batch <input.txt> <output.csv>");
  console.error(
    "   input.txt: File containing IP prefixes/CIDRs, one per line",
  );
  console.error("   output.csv: Output file for results");
  console.error("   Note: Only IP prefixes/CIDRs supported (no ASNs)");
  process.exit(1);
}

export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, inputFile, outputFile } = parseArgs(args);

  if (command === "batch") {
    if (!inputFile || !outputFile) {
      showBatchUsageError();
      return;
    }
    await handleBatchMode(inputFile, outputFile);
    return;
  }

  if (command === "--help" || command === "-h") {
    showHelp();
    process.exit(0);
  }

  render(createElement(QueryScreen));
}
