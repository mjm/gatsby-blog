import Typography from "typography";

const typography = new Typography({
  baseFontSize: "20px",
  baseLineHeight: 1.5,
  blockMarginBottom: 0.6,
  googleFonts: [
    { name: "Eczar", styles: ["400", "500"] },
    { name: "Gentium Basic", styles: ["400", "400i", "700", "700i"] }
  ],
  headerFontFamily: ["Eczar"],
  headerWeight: 500,
  bodyFontFamily: ["Gentium Basic"]
});

export default typography;
