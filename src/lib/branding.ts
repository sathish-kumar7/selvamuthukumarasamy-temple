/**
 * Static branding used on the sign-in page. Temple details that print on
 * receipts live in the database (Settings page); these are visual extras.
 * Wording follows the temple's official banner.
 */
export const BRANDING = {
  /** Invocation shown above the name. */
  invocationTamil: "॥ ஓம் சரவணபவ ॥",
  /** Honorific prefix. */
  prefixTamil: "அருள்மிகு",
  /** Temple name, line 1 (consorts). */
  nameLine1Tamil: "வள்ளி தெய்வானை உடனமர்",
  /** Temple name, line 2 (main deity). */
  nameLine2Tamil: "செல்வமுத்துகுமார சுவாமி திருக்கோவில்",
  /** Location line. */
  locationTamil: "கோண வாய்க்கால் பாளையம்",
  /** English tagline. */
  tagline: "Donation and receipt management",
  /** Quote shown at the bottom of the hero panel. */
  quoteTamil: "“இறைவன் அருளால் நேர்மையான திருக்கோவில் கணக்குகள்”",
  /**
   * Hero photograph. Place the file at public/login-hero.jpg (landscape or
   * portrait, 1600px+ on the long edge). Falls back to a gradient if missing.
   */
  heroImage: "/login-hero.jpg",
  /** Optional round logo. Place at public/logo.png (square, 512px). */
  logoImage: "/logo.png",
} as const;
