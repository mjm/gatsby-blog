import beeline from "honeycomb-beeline"

let result: any
if (process.env.NODE_ENV === "test") {
  console.log("Disabling Honeycomb instrumentation in testing")
  result = beeline({
    disableInstrumentation: true,
  })
} else {
  if (!process.env.HONEYCOMB_WRITE_KEY) {
    console.warn("No Honeycomb write key was provided")
  } else {
    console.log("Enabling Honeycomb instrumentation")
  }
  result = beeline({
    writeKey: process.env.HONEYCOMB_WRITE_KEY,
    dataset: "gatsby-blog",
    serviceName: "micropub",
  })
}

export default result
