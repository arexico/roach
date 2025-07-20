export type LogLevel = "INFO" | "WARN" | "ERROR";

export class BatchLogger {
  private static formatTimestamp(): string {
    return new Date().toISOString().substring(11, 19); // HH:MM:SS format
  }

  private static formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.formatTimestamp();
    const levelIcon = this.getLevelIcon(level);
    const levelColor = this.getLevelColor(level);
    
    return `${levelColor}[${timestamp}] ${levelIcon} ${level}${this.getResetColor()}: ${message}`;
  }

  private static getLevelIcon(level: LogLevel): string {
    switch (level) {
      case "INFO": return "ℹ️";
      case "WARN": return "⚠️";
      case "ERROR": return "❌";
    }
  }

  private static getLevelColor(level: LogLevel): string {
    switch (level) {
      case "INFO": return "\x1b[36m"; // Cyan
      case "WARN": return "\x1b[33m"; // Yellow
      case "ERROR": return "\x1b[31m"; // Red
    }
  }

  private static getResetColor(): string {
    return "\x1b[0m";
  }

  static info(message: string): void {
    console.log(this.formatMessage("INFO", message));
  }

  static warn(message: string): void {
    console.warn(this.formatMessage("WARN", message));
  }

  static error(message: string): void {
    console.error(this.formatMessage("ERROR", message));
  }

  static progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    const baseMessage = `Progress: ${current}/${total} (${percentage}%)`;
    const fullMessage = message ? `${baseMessage} - ${message}` : baseMessage;
    
    this.info(`${progressBar} ${fullMessage}`);
  }

  private static createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }

  static validationSummary(validCount: number, errorCount: number): void {
    if (errorCount === 0) {
      this.info(`Validation complete: ${validCount} valid entries found`);
    } else {
      this.warn(`Validation complete: ${validCount} valid, ${errorCount} invalid entries`);
    }
  }

  static processingComplete(resultsCount: number, processedCount: number): void {
    this.info(`Processing complete: ${resultsCount} results from ${processedCount} entries`);
  }
}