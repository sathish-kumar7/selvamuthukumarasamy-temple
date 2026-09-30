import "server-only";
import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatINR } from "@/lib/money";
import { amountInWords } from "@/lib/amount-in-words";
import { formatDonationDate, formatDateTime } from "@/lib/dates";
import type { DonationWithRelations } from "@/lib/donations/service";
import type { TempleSettings } from "@/lib/settings";

// Noto Sans is bundled because the PDF standard fonts do not include the ₹ glyph.
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: path.join(FONT_DIR, "NotoSans-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "NotoSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const SAFFRON = "#bd4a06";
const MAROON = "#741c3e";
const INK = "#1c1917";
const MUTED = "#57534e";
const LINE = "#e7e5e4";

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSans", fontSize: 10.5, color: INK, paddingTop: 40, paddingBottom: 40, paddingHorizontal: 44 },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: SAFFRON, paddingBottom: 14 },
  logoBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#fff8ed", alignItems: "center", justifyContent: "center", marginRight: 14 },
  logoText: { color: SAFFRON, fontSize: 20, fontWeight: 700 },
  kicker: { fontSize: 8, letterSpacing: 2, color: MAROON, fontWeight: 700, textTransform: "uppercase" },
  temple: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  sub: { fontSize: 9, color: MUTED, marginTop: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  metaLabel: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  table: { marginTop: 18, borderWidth: 1, borderColor: LINE, borderRadius: 8 },
  row: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  rowLast: { borderBottomWidth: 0 },
  cellLabel: { width: 160, color: MUTED },
  cellValue: { flex: 1 },
  amountBox: { marginTop: 18, backgroundColor: "#fff8ed", borderRadius: 8, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountWords: { fontSize: 9.5, color: INK, maxWidth: 300 },
  amount: { fontSize: 22, fontWeight: 700, color: "#79320d" },
  cancelledBanner: { marginTop: 12, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", padding: 8, borderRadius: 6, color: "#991b1b", fontSize: 9.5 },
  footer: { marginTop: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  thanks: { fontSize: 9.5, color: MUTED, maxWidth: 300, lineHeight: 1.4 },
  signature: { alignItems: "center", width: 170 },
  signatureLine: { width: 150, borderBottomWidth: 1, borderBottomColor: "#a8a29e", height: 40 },
  signatureLabel: { fontSize: 8.5, marginTop: 6, fontWeight: 700 },
  fine: { marginTop: 24, fontSize: 7.5, color: "#a8a29e", textAlign: "center" },
  watermark: { position: "absolute", top: 330, left: 90, fontSize: 64, color: "#ef4444", opacity: 0.18, fontWeight: 700, transform: "rotate(-18deg)" },
});

function ReceiptDocument({ donation, settings }: { donation: DonationWithRelations; settings: TempleSettings }) {
  const cancelled = donation.status === "CANCELLED";
  const amount = donation.amount.toString();
  const address = [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ");
  const contact = [settings.phone, settings.email, settings.website].filter(Boolean).join("  ·  ");
  const initials = settings.templeName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const rows: [string, string][] = [
    ["Received with thanks from", donation.donor.name],
    ["Mobile number", donation.donor.mobile],
    ...(donation.donor.address ? ([["Address", donation.donor.address]] as [string, string][]) : []),
    ["Donation towards", donation.category.name],
    [
      "Payment method",
      donation.transactionReference
        ? `${PAYMENT_METHOD_LABELS[donation.paymentMethod]}  ·  Ref: ${donation.transactionReference}`
        : PAYMENT_METHOD_LABELS[donation.paymentMethod],
    ],
  ];

  return (
    <Document title={`Receipt ${donation.receiptNumber}`} author={settings.templeName} creator="SMT Donation Management">
      <Page size="A4" style={styles.page}>
        {cancelled ? <Text style={styles.watermark}>CANCELLED</Text> : null}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Donation Receipt</Text>
            <Text style={styles.temple}>{settings.templeName}</Text>
            {address ? <Text style={styles.sub}>{address}</Text> : null}
            {contact ? <Text style={styles.sub}>{contact}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Receipt No.</Text>
            <Text style={styles.metaValue}>{donation.receiptNumber}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDonationDate(donation.donationDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          {rows.map(([label, value], i) => (
            <View key={label} style={[styles.row, i === rows.length - 1 ? styles.rowLast : {}]}>
              <Text style={styles.cellLabel}>{label}</Text>
              <Text style={[styles.cellValue, i === 0 ? { fontWeight: 700, fontSize: 11.5 } : {}]}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.amountBox}>
          <View>
            <Text style={styles.metaLabel}>Amount received</Text>
            <Text style={styles.amountWords}>{amountInWords(amount)}</Text>
          </View>
          <Text style={[styles.amount, cancelled ? { textDecoration: "line-through" } : {}]}>{formatINR(amount)}</Text>
        </View>

        {cancelled && donation.cancelledAt ? (
          <Text style={styles.cancelledBanner}>
            This receipt was cancelled on {formatDateTime(donation.cancelledAt)} and is no longer valid.
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.thanks}>{settings.thankYouMessage}</Text>
          <View style={styles.signature}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{settings.authorizedSignatory}</Text>
            <Text style={{ fontSize: 7.5, color: MUTED }}>{settings.templeName}</Text>
          </View>
        </View>

        <Text style={styles.fine}>
          This is a computer-generated receipt. Issued on {formatDateTime(donation.createdAt)} IST.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(donation: DonationWithRelations, settings: TempleSettings): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<ReceiptDocument donation={donation} settings={settings} />);
}
