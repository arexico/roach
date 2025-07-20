import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { apiClient } from "@/api/client.ts";
import { detectInputType } from "@/utils/validation.ts";
import { ResultScreen } from "@/components/ResultScreen";
import type { PrefixData } from "@/types/api.ts";

type AppState = "input" | "loading" | "results" | "error";

const ROACH_ASCII_ART = [
  "██████╗  ██████╗  █████╗  ██████╗██   ██╗",
  "██╔══██╗██╔═══██╗██╔══██╗██╔════╝██   ██║",
  "██████╔╝██║   ██║███████║██║     ███████║",
  "██╔══██╗██║   ██║██╔══██║██║     ██╔══██║",
  "██║  ██║╚██████╔╝██║  ██║╚██████╗██║  ██║",
  "╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝",
  "",
  "╔═══════════════════════════════════════╗",
  "║ 🪳 Route Origin Authorization Checker ║",
  "╚═══════════════════════════════════════╝",
] as const;

export function QueryScreen() {
  const [state, setState] = useState<AppState>("input");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<PrefixData[]>([]);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    let warningTimer: NodeJS.Timeout;

    if (state === "loading") {
      warningTimer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 5000);
    } else {
      setShowSlowWarning(false);
    }

    return () => {
      if (warningTimer) {
        clearTimeout(warningTimer);
      }
    };
  }, [state]);

  useInput((input, key) => {
    if (state === "results") {
      if (key.leftArrow && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (key.rightArrow && currentIndex < results.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (input === "q" || key.escape) {
        setState("input");
        setResults([]);
        setInput("");
        setCurrentIndex(0);
      }
    } else if (
      state === "error" &&
      (input === "q" || key.escape || key.return)
    ) {
      setState("input");
      setError("");
      setInput("");
    } else if (state === "input" && (key.escape || input === "q")) {
      process.exit(0);
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    const inputType = detectInputType(value.trim());
    if (inputType === "invalid") {
      setError(
        "Invalid input. Please enter a valid ASN (AS12345), IPv4 (1.1.1.1), IPv6 (2001:db8::1), or CIDR (1.1.1.0/24)",
      );
      setState("error");
      return;
    }

    setState("loading");
    setError("");

    try {
      let data: PrefixData[];

      if (inputType === "asn") {
        const response = await apiClient.getASNData(value.trim());
        data = [...response.directOrigin, ...response.overlaps];
      } else {
        const response = await apiClient.getPrefixData(value.trim());
        data = [...response];
      }

      setResults(data);
      setCurrentIndex(0);
      setState("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setState("error");
    }
  };

  if (state === "loading") {
    return (
      <Box
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
      >
        <Box flexDirection="column" alignItems="center">
          <Box>
            <Text color="yellow">
              <Spinner type="dots" />
            </Text>
            <Text> Fetching route data...</Text>
          </Box>
          {showSlowWarning && (
            <Box paddingTop={1}>
              <Text color="orange">⏳ This is taking abnormally long...</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
      >
        <Box borderStyle="single" borderColor="red" padding={1}>
          <Text color="red">{error}</Text>
        </Box>
        <Box paddingTop={1}>
          <Text color="gray">Press Enter, Esc, or 'q' to continue</Text>
        </Box>
      </Box>
    );
  }

  if (state === "results" && results.length > 0) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        {/* Compact results navigation */}
        <Box justifyContent="space-between">
          <Text color="green">
            Result {currentIndex + 1} of {results.length}
          </Text>
          <Box>
            {results.length > 1 && <Text color="gray">← → navigate | </Text>}
            <Text color="gray">q/Esc return</Text>
          </Box>
        </Box>

        <ResultScreen data={results[currentIndex]!} />
      </Box>
    );
  }

  if (state === "results" && results.length === 0) {
    return (
      <Box
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
      >
        <Box borderStyle="single" borderColor="yellow" padding={1}>
          <Text color="yellow">⚠️ No results found</Text>
        </Box>
        <Box paddingTop={1}>
          <Text color="gray">Press 'q' or Esc to return</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingTop={1}>
      {/* Main content area with dark background */}
      <Box flexDirection="column" justifyContent="center" alignItems="center">
        {/* ASCII Art centered */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {ROACH_ASCII_ART.map((line, index) => (
            <Text key={index} color="yellow">
              {line}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Bottom input area with border */}
      <Box
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        paddingY={0}
        height={3}
        flexDirection="column"
      >
        <Box alignItems="center">
          <Text color="yellow">Check by ASN, prefix, or IP address</Text>
        </Box>
        {/* Input line with prompt */}
        <Box>
          <Text color="yellow">{">"} </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="AS1, 1.1.1.1, or 1.1.1.0/24"
            showCursor={true}
          />
        </Box>

        {/* Bottom status bar */}
        <Box justifyContent="space-between" paddingTop={0}>
          <Box display="flex" gap={3}>
            <Box display="flex">
              <Text color="white">enter </Text>
              <Text color="gray">check</Text>
            </Box>
            <Box display="flex">
              <Text color="white">esc </Text>
              <Text color="gray">quit</Text>
            </Box>
          </Box>
          <Text color="gray">powered by IRRexplorer</Text>
        </Box>
      </Box>
    </Box>
  );
}
