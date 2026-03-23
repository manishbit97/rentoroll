import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaymentLogEntry } from "@/services/api";

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const DOT = 22;
const LAST_DOT = 30; // larger for the final entry
const RAIL_W = LAST_DOT; // rail is always wide enough for the biggest dot

interface Props {
  entries: PaymentLogEntry[];
  showEmail?: boolean;
}

export default function PaymentTimeline({ entries, showEmail = false }: Props) {
  if (!entries.length) return null;

  return (
    <View>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        const isCorrection = entry.action === "PAYMENT_UPDATED";
        const dotBg = isCorrection ? "#f59e0b" : "#10b981";
        const badgeBg = isCorrection ? "#fef3c7" : "#dcfce7";
        const badgeColor = isCorrection ? "#92400e" : "#166534";
        const label = isCorrection ? "Corrected" : "Recorded";
        const date = new Date(entry.at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <View key={i} style={t.row}>
            {/* ── Left rail: dot + connecting line ── */}
            <View style={t.rail}>
              {isLast ? (
                /* Final dot: glow ring + larger size */
                <View style={[t.dotRing, { borderColor: dotBg + "40" }]}>
                  <View
                    style={[
                      t.dot,
                      {
                        backgroundColor: dotBg,
                        width: LAST_DOT,
                        height: LAST_DOT,
                        borderRadius: LAST_DOT / 2,
                        borderWidth: 2.5,
                        borderColor: "#fff",
                        shadowColor: dotBg,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.55,
                        shadowRadius: 6,
                        elevation: 5,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isCorrection ? "pencil" : "check"}
                      size={12}
                      color="#fff"
                    />
                  </View>
                </View>
              ) : (
                /* Regular dot */
                <View style={[t.dot, { backgroundColor: dotBg }]}>
                  <MaterialCommunityIcons
                    name={isCorrection ? "pencil" : "check"}
                    size={10}
                    color="#fff"
                  />
                </View>
              )}
              {!isLast && <View style={t.line} />}
            </View>

            {/* ── Right: content ── */}
            <View
              style={[
                t.content,
                isLast && t.contentLast,
              ]}
            >
              {/* Action badge + "Current" chip (last only) + date */}
              <View style={t.header}>
                <View style={[t.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[t.badgeText, { color: badgeColor }]}>
                    {label}
                  </Text>
                </View>
                {isLast && (
                  <View style={t.currentChip}>
                    <View style={t.currentDot} />
                    <Text style={t.currentText}>Current</Text>
                  </View>
                )}
                <Text style={t.date}>{date}</Text>
              </View>

              {/* Amount row — new + strikethrough of old if corrected */}
              <View style={t.amtRow}>
                <Text style={[t.amount, isLast && { color: dotBg }]}>
                  {fmt(entry.amount)}
                </Text>
                {isCorrection &&
                  entry.prev_amount != null &&
                  entry.prev_amount > 0 && (
                    <Text style={t.prevAmt}>{fmt(entry.prev_amount)}</Text>
                  )}
              </View>

              {showEmail && (
                <Text style={t.email} numberOfLines={1}>
                  by {entry.by_email}
                </Text>
              )}
              {entry.note ? (
                <Text style={t.note}>{entry.note}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const t = StyleSheet.create({
  row: { flexDirection: "row" },

  rail: { width: RAIL_W, alignItems: "center" },

  dotRing: {
    width: LAST_DOT + 8,
    height: LAST_DOT + 8,
    borderRadius: (LAST_DOT + 8) / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    // shifts left so it centres within the RAIL_W
    marginLeft: -(LAST_DOT + 8 - RAIL_W) / 2,
  },

  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e7eb",
    minHeight: 12,
  },

  content: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 22,
  },
  contentLast: {
    paddingBottom: 4,
    // subtle left border to echo the final dot colour — applied inline
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
    flexWrap: "wrap",
  },

  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  currentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4f46e5",
  },
  currentText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  date: { fontSize: 12, color: "#9ca3af" },

  amtRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amount: { fontSize: 16, fontWeight: "800", color: "#111827" },
  prevAmt: {
    fontSize: 14,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },

  email: { fontSize: 11, color: "#9ca3af", marginTop: 3 },
  note: { fontSize: 12, color: "#6b7280", fontStyle: "italic", marginTop: 2 },
});
