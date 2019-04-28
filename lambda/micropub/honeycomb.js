if (process.env.NODE_ENV === "test") {
  module.exports = require("honeycomb-beeline")({
    disableInstrumentation: true,
  })
} else {
  module.exports = require("honeycomb-beeline")({
    writeKey: process.env.HONEYCOMB_WRITE_KEY,
    dataset: "gatsby-blog",
    serviceName: "micropub",
  })
}
