import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatReceiptAmount } from "@/lib/money";
import { amountInWordsBare } from "@/lib/amount-in-words";
import { formatDonationDate, formatDateTime } from "@/lib/dates";
import type { DonationWithRelations } from "@/lib/donations/service";
import type { TempleSettings } from "@/lib/settings";

// Noto Sans is bundled because the PDF standard fonts lack the ₹ glyph; Noto
// Sans Tamil renders the pre-printed Tamil form labels (fontkit shapes Tamil).
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

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
  Font.register({
    family: "NotoSansTamil",
    fonts: [
      { src: path.join(FONT_DIR, "NotoSansTamil-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "NotoSansTamil-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

let logoCache: Buffer | null | undefined;
function loadLogo(): Buffer | null {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = fs.readFileSync(LOGO_PATH);
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/** Brick-red ink of the temple's receipt book. */
const INK = "#8c2130";
const FILL = "#1c1917";
const MUTED = "#57534e";

const styles = StyleSheet.create({
  page: { fontFamily: "NotoSansTamil", fontSize: 10, color: INK, padding: 20, backgroundColor: "#ffffff" },
  outerFrame: { flex: 1, borderWidth: 2.5, borderColor: INK, borderRadius: 6, padding: 2.5 },
  innerFrame: { flex: 1, borderWidth: 0.75, borderColor: INK, borderRadius: 4, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 },
  regLine: { minHeight: 10, textAlign: "right", fontSize: 7.5 },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  logoBox: { width: 64, height: 64, borderWidth: 1, borderColor: INK, borderRadius: 4, overflow: "hidden", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  logo: { width: 62, height: 62, objectFit: "cover" },
  logoInitials: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 18 },
  header: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  templeTamil: { fontWeight: 700, fontSize: 15, textAlign: "center", lineHeight: 1.35 },
  templeEnglish: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", marginTop: 2, textAlign: "center" },
  templeEnglishOnly: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 16, textAlign: "center" },
  address: { fontSize: 8.5, marginTop: 3, textAlign: "center", lineHeight: 1.3 },
  contact: { fontFamily: "NotoSans", fontSize: 7.5, textAlign: "center", marginTop: 1 },
  metaRow: { flexDirection: "row", alignItems: "stretch", marginTop: 10, gap: 8 },
  box: { borderWidth: 1, borderColor: INK, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "baseline", gap: 4 },
  boxLabel: { fontSize: 8.5 },
  boxValue: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 11, color: FILL },
  titleBox: { flex: 1, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  title: { fontWeight: 700, fontSize: 15, letterSpacing: 0.5 },
  lines: { marginTop: 14, gap: 11 },
  line: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 4 },
  lineLabel: { fontSize: 10.5, paddingBottom: 1 },
  fill: { flex: 1, minWidth: 90, borderBottomWidth: 0.9, borderBottomColor: INK, borderBottomStyle: "dotted", paddingHorizontal: 4, paddingBottom: 1.5 },
  fillText: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 10.5, color: FILL, lineHeight: 1.3 },
  fillMuted: { fontFamily: "NotoSans", fontWeight: 400, fontSize: 8.5, color: MUTED },
  payment: { marginTop: 8, fontSize: 8 },
  paymentValue: { fontFamily: "NotoSans", color: MUTED },
  cancelledBanner: { marginTop: 6, borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2", padding: 5, borderRadius: 4, color: "#991b1b", fontFamily: "NotoSans", fontSize: 8 },
  bottomRow: { marginTop: "auto", paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  amountBox: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  rupee: { fontWeight: 700, fontSize: 13 },
  amount: { fontFamily: "NotoSans", fontWeight: 700, fontSize: 18, color: FILL },
  signatures: { flexDirection: "row", gap: 36 },
  signature: { alignItems: "center", width: 110 },
  signatureSpace: { height: 30 },
  signatureLabel: { fontSize: 9, fontWeight: 700 },
  footer: { marginTop: 8, borderTopWidth: 0.5, borderTopColor: INK, borderTopStyle: "dashed", paddingTop: 4, alignItems: "center" },
  thanks: { fontFamily: "NotoSans", fontSize: 7, color: MUTED, textAlign: "center" },
  fine: { fontFamily: "NotoSans", fontSize: 6.5, color: "#a8a29e", marginTop: 1 },
  watermark: { position: "absolute", top: 150, left: 150, fontFamily: "NotoSans", fontSize: 60, color: "#ef4444", opacity: 0.16, fontWeight: 700, transform: "rotate(-14deg)" },
});

function ReceiptDocument({ donation, settings, logo }: { donation: DonationWithRelations; settings: TempleSettings; logo: Buffer | null }) {
  const cancelled = donation.status === "CANCELLED";
  const amount = donation.amount.toString();
  const address = [settings.addressLine1, settings.addressLine2].filter(Boolean).join(", ");
  const contact = [settings.phone, settings.email, settings.website].filter(Boolean).join("  ·  ");
  const donorLine = [donation.donor.name, donation.donor.address].filter(Boolean).join(", ");
  const payment = donation.transactionReference
    ? `${PAYMENT_METHOD_LABELS[donation.paymentMethod]}  ·  Ref: ${donation.transactionReference}`
    : PAYMENT_METHOD_LABELS[donation.paymentMethod];
  const initials = settings.templeName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <Document title={`Receipt ${donation.receiptNumber}`} author={settings.templeName} creator="SMT Donation Management">
      <Page size="A5" orientation="landscape" style={styles.page}>
        {cancelled ? <Text style={styles.watermark}>CANCELLED</Text> : null}
        <View style={styles.outerFrame}>
          <View style={styles.innerFrame}>
            <Text style={styles.regLine}>
              {settings.registrationNumber ? (
                <>
                  பதிவு எண் : <Text style={{ fontFamily: "NotoSans" }}>{settings.registrationNumber}</Text>
                </>
              ) : (
                " "
              )}
            </Text>

            <View style={styles.headerRow}>
              <View style={styles.logoBox}>
                {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
                {logo ? <Image src={{ data: logo, format: "png" }} style={styles.logo} /> : <Text style={styles.logoInitials}>{initials}</Text>}
              </View>
              <View style={styles.header}>
                {settings.templeNameTamil ? (
                  <>
                    <Text style={styles.templeTamil}>{settings.templeNameTamil}</Text>
                    <Text style={styles.templeEnglish}>{settings.templeName}</Text>
                  </>
                ) : (
                  <Text style={styles.templeEnglishOnly}>{settings.templeName}</Text>
                )}
                {address ? <Text style={styles.address}>{address}</Text> : null}
                {contact ? <Text style={styles.contact}>{contact}</Text> : null}
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.box}>
                <Text style={styles.boxLabel}>எண் :</Text>
                <Text style={styles.boxValue}>{donation.receiptNumber}</Text>
              </View>
              <View style={[styles.box, styles.titleBox]}>
                <Text style={styles.title}>நன்கொடை இரசீது</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.boxLabel}>தேதி :</Text>
                <Text style={styles.boxValue}>{formatDonationDate(donation.donationDate)}</Text>
              </View>
            </View>

            <View style={styles.lines}>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>திரு./திருமதி</Text>
                <View style={styles.fill}>
                  <Text style={styles.fillText}>
                    {donorLine}
                    <Text style={styles.fillMuted}>{`   ${donation.donor.mobile}`}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.line}>
                <Text style={styles.lineLabel}>அவர்களிடமிருந்து ரூபாய்</Text>
                <View style={styles.fill}>
                  <Text style={styles.fillText}>{amountInWordsBare(amount)}</Text>
                </View>
                <Text style={styles.lineLabel}>மட்டும்</Text>
              </View>
              <View style={styles.line}>
                <View style={styles.fill}>
                  <Text style={styles.fillText}>{donation.category.name}</Text>
                </View>
                <Text style={styles.lineLabel}>நன்கொடையாக நன்றியுடன் பெற்றுக்கொண்டோம்.</Text>
              </View>
            </View>

            <Text style={styles.payment}>
              செலுத்திய முறை : <Text style={styles.paymentValue}>{payment}</Text>
            </Text>

            {cancelled && donation.cancelledAt ? (
              <Text style={styles.cancelledBanner}>
                This receipt was cancelled on {formatDateTime(donation.cancelledAt)} and is no longer valid.
              </Text>
            ) : null}

            <View style={styles.bottomRow}>
              <View style={[styles.box, styles.amountBox]}>
                <Text style={styles.rupee}>ரூ.</Text>
                <Text style={[styles.amount, cancelled ? { textDecoration: "line-through" } : {}]}>{formatReceiptAmount(amount)}</Text>
              </View>
              <View style={styles.signatures}>
                {settings.secondarySignatory ? (
                  <View style={styles.signature}>
                    <View style={styles.signatureSpace} />
                    <Text style={styles.signatureLabel}>{settings.secondarySignatory}</Text>
                  </View>
                ) : null}
                <View style={styles.signature}>
                  <View style={styles.signatureSpace} />
                  <Text style={styles.signatureLabel}>{settings.authorizedSignatory}</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              {settings.thankYouMessage ? <Text style={styles.thanks}>{settings.thankYouMessage}</Text> : null}
              <Text style={styles.fine}>Computer-generated receipt  ·  issued {formatDateTime(donation.createdAt)} IST</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(donation: DonationWithRelations, settings: TempleSettings): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<ReceiptDocument donation={donation} settings={settings} logo={loadLogo()} />);
}
