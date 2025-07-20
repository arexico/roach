import { Box, Text } from "ink";
import type { PrefixData } from "@/types/api.ts";
import { getIRRColor, getRPKIStatusColor } from "@/utils/colors.ts";

interface ResultScreenProps {
  readonly data: PrefixData;
}

interface ASNInfo {
  readonly asn: number;
  irrDatabases: string[];
  rpkiStatus: string;
  readonly isBGPOrigin: boolean;
}

export function ResultScreen({ data }: ResultScreenProps) {
  // Collect ASN information with IRR database associations
  const asnMap = new Map<number, ASNInfo>();

  // Initialize with BGP origins
  data.bgpOrigins.forEach((asn) => {
    asnMap.set(asn, {
      asn,
      irrDatabases: [],
      rpkiStatus: "unknown",
      isBGPOrigin: true,
    });
  });

  // Add RPKI routes
  data.rpkiRoutes.forEach((route) => {
    const existing = asnMap.get(route.asn);
    if (existing) {
      existing.rpkiStatus = route.rpkiStatus.toLowerCase();
    } else {
      asnMap.set(route.asn, {
        asn: route.asn,
        irrDatabases: [],
        rpkiStatus: route.rpkiStatus.toLowerCase(),
        isBGPOrigin: false,
      });
    }
  });

  // Add IRR routes
  Object.entries(data.irrRoutes).forEach(([db, routes]) => {
    routes.forEach((route) => {
      const existing = asnMap.get(route.asn);
      if (existing) {
        if (!existing.irrDatabases.includes(db)) {
          existing.irrDatabases.push(db);
        }
        if (existing.rpkiStatus === "unknown") {
          existing.rpkiStatus = route.rpkiStatus.toLowerCase();
        }
      } else {
        asnMap.set(route.asn, {
          asn: route.asn,
          irrDatabases: [db],
          rpkiStatus: route.rpkiStatus.toLowerCase(),
          isBGPOrigin: false,
        });
      }
    });
  });

  const getStatusDisplay = (category: string) => {
    switch (category) {
      case "success":
        return { text: "VALID", color: "green", border: "green" } as const;
      case "warning":
        return { text: "WARNING", color: "yellow", border: "yellow" } as const;
      case "danger":
        return { text: "INVALID", color: "red", border: "red" } as const;
      case "info":
        return { text: "OK", color: "blue", border: "blue" } as const;
      default:
        return {
          text: category.toUpperCase(),
          color: "gray",
          border: "gray",
        } as const;
    }
  };

  const statusInfo = getStatusDisplay(data.categoryOverall);

  return (
    <Box flexDirection="column">
      {/* Compact header with status and prefix info */}
      <Box justifyContent="space-between" alignItems="center">
        <Box>
          <Text bold color="cyan">
            {data.prefix}
          </Text>
          <Text color="gray"> ({data.rir}) </Text>
          <Text bold color={statusInfo.color}>
            [{statusInfo.text}]
          </Text>
        </Box>
        <Text color="gray">
          Score:{" "}
          <Text bold color="white">
            {data.goodnessOverall}
          </Text>
        </Text>
      </Box>

      {/* Compact details section */}
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
      >
        {/* Origins */}
        <Box>
          <Text bold color="yellow">
            Origins:{" "}
          </Text>
          <Text>
            {Array.from(asnMap.values()).map((asnInfo, i) => {
              const sources = [];

              // Add IRR databases
              if (asnInfo.irrDatabases.length > 0) {
                sources.push(...asnInfo.irrDatabases);
              }

              // Add RPKI if this ASN has RPKI data
              const hasRPKI = data.rpkiRoutes.some(
                (r) => r.asn === asnInfo.asn,
              );
              if (hasRPKI) {
                sources.push("RPKI");
              }

              // If no IRR or RPKI sources, it's BGP-only
              if (sources.length === 0 && asnInfo.isBGPOrigin) {
                sources.push("BGP");
              }

              return (
                <Text key={`origin-${asnInfo.asn}`}>
                  {i > 0 && ", "}
                  <Text color="white">AS{asnInfo.asn}</Text>
                  {sources.length > 0 && (
                    <Text color="gray">({sources.join(", ")})</Text>
                  )}
                </Text>
              );
            })}
          </Text>
        </Box>

        {/* BGP */}
        <Box>
          <Text bold color="yellow">
            BGP:{" "}
          </Text>
          {data.bgpOrigins.length > 0 ? (
            <Text>
              {data.bgpOrigins.map((asn, i) => {
                // Check if this BGP origin is validated by RPKI
                const rpkiRoute = data.rpkiRoutes.find((r) => r.asn === asn);
                const isValid = rpkiRoute?.rpkiStatus === "VALID";

                return (
                  <Text key={`bgp-${asn}`}>
                    {i > 0 && ", "}
                    <Text color="white">AS{asn}</Text>
                    {isValid && <Text color="green">{"✓"}</Text>}
                  </Text>
                );
              })}
            </Text>
          ) : (
            <Text color="gray">None</Text>
          )}
        </Box>

        {/* RPKI */}
        <Box>
          <Text bold color="yellow">
            RPKI:{" "}
          </Text>
          {data.rpkiRoutes.length > 0 ? (
            <Text>
              {data.rpkiRoutes.map((route, i) => (
                <Text key={`rpki-${route.asn}-${i}`}>
                  {i > 0 && ", "}
                  <Text color={getIRRColor("RPKI")}>AS{route.asn}</Text>
                  <Text color={getRPKIStatusColor(route.rpkiStatus)}>
                    {route.rpkiStatus === "VALID" ? "✓" : "✗"}
                  </Text>
                  {route.rpkiMaxLength && (
                    <Text color="gray">/{route.rpkiMaxLength}</Text>
                  )}
                </Text>
              ))}
            </Text>
          ) : (
            <Text color="gray">None</Text>
          )}
        </Box>

        {/* IRR */}
        <Box>
          <Text bold color="yellow">
            IRR:{" "}
          </Text>
          {Object.keys(data.irrRoutes).length > 0 ? (
            <Text>
              {Object.entries(data.irrRoutes).map(([db, routes], i) => (
                <Text key={db}>
                  {i > 0 && ", "}
                  <Text color={getIRRColor(db)}>{db}</Text>
                  <Text color="gray">({routes.length})</Text>
                </Text>
              ))}
            </Text>
          ) : (
            <Text color="gray">None</Text>
          )}
        </Box>

        {/* Messages */}
        {data.messages.length > 0 && (
          <Box>
            <Text bold color="yellow">
              Messages:{" "}
            </Text>
            <Text>
              {data.messages.map((msg, i) => (
                <Text key={`msg-${i}-${msg.category}`}>
                  {i > 0 && " | "}
                  <Text
                    color={
                      msg.category === "success"
                        ? "green"
                        : msg.category === "warning"
                          ? "yellow"
                          : msg.category === "danger"
                            ? "red"
                            : "blue"
                    }
                  >
                    {msg.text}
                  </Text>
                </Text>
              ))}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
