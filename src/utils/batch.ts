import { readFileSync, writeFileSync } from "fs";
import { apiClient } from "@/api/client.ts";
import { validateBatchInput, type ValidationError } from "@/utils/validation.ts";
import { extractBatchResults } from "@/utils/data.ts";
import { BatchLogger } from "@/utils/logger.ts";
import type { BatchResult } from "@/types/api.ts";

const API_DELAY_MS = 100;
const PROGRESS_INTERVAL = 10;

class BatchProcessingError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: ValidationError[]
  ) {
    super(message);
    this.name = "BatchProcessingError";
  }
}

function generateCSVContent(results: readonly BatchResult[]): string {
  const csvHeader = "subnet,origin,rpki\n";
  const csvRows = results
    .map(result => `"${result.subnet}",AS${result.origin},${result.rpki}`)
    .join("\n");
  
  return csvHeader + csvRows;
}

function formatValidationErrors(errors: ValidationError[]): string {
  const errorLines = errors.map(error => 
    `  Line ${error.line}: "${error.content}" - ${error.reason}`
  );
  
  return [
    "Validation failed with the following errors:",
    "",
    ...errorLines,
    "",
    "Please fix these issues and try again.",
    "Batch mode only accepts IPv4 and IPv6 subnets in CIDR notation (e.g., 192.168.1.0/24, 2001:db8::/32)"
  ].join("\n");
}

async function processSubnet(subnet: string): Promise<BatchResult[]> {
  try {
    const response = await apiClient.getPrefixData(subnet);
    // Filter to only include exact matches for the requested prefix
    const exactMatches = response.filter(data => data.prefix === subnet);
    
    return extractBatchResults(exactMatches);
  } catch (error) {
    BatchLogger.error(`Failed to process subnet ${subnet}: ${error instanceof Error ? error.message : error}`);
    return [];
  }
}

export async function processBatchFile(inputPath: string, outputPath: string): Promise<void> {
  BatchLogger.info(`Reading input file: ${inputPath}`);
  
  let content: string;
  try {
    content = readFileSync(inputPath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read input file: ${error instanceof Error ? error.message : error}`);
  }

  if (content.trim().length === 0) {
    throw new Error("Input file is empty");
  }

  BatchLogger.info("Validating input format...");
  const { validLines, errors } = validateBatchInput(content);

  if (errors.length > 0) {
    BatchLogger.error("Input validation failed");
    const errorMessage = formatValidationErrors(errors);
    throw new BatchProcessingError(errorMessage, errors);
  }

  BatchLogger.validationSummary(validLines.length, errors.length);
  BatchLogger.info(`Starting processing of ${validLines.length} subnets...`);
  
  const allResults: BatchResult[] = [];
  let processed = 0;

  for (const subnet of validLines) {
    try {
      const results = await processSubnet(subnet);
      allResults.push(...results);
      
      processed++;
      if (processed % PROGRESS_INTERVAL === 0 || processed === validLines.length) {
        BatchLogger.progress(processed, validLines.length, `Processing subnet: ${subnet}`);
      }

      // Rate limiting to be respectful to the API
      if (processed < validLines.length) {
        await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
      }
      
    } catch (error) {
      BatchLogger.error(`Unexpected error processing ${subnet}: ${error instanceof Error ? error.message : error}`);
    }
  }

  BatchLogger.info(`Writing ${allResults.length} results to: ${outputPath}`);
  
  try {
    const csvContent = generateCSVContent(allResults);
    writeFileSync(outputPath, csvContent, "utf-8");
  } catch (error) {
    throw new Error(`Failed to write output file: ${error instanceof Error ? error.message : error}`);
  }
  
  BatchLogger.info(`Batch processing completed successfully!`);
  BatchLogger.processingComplete(allResults.length, processed);
  BatchLogger.info(`Results saved to: ${outputPath}`);
}