import { useEffect, useState } from "react"

export const useFetch = (url, { initial, transform }) => {
  const [data, setData] = useState(initial)

  async function loadData() {
    if (!url) {
      return
    }

    const response = await fetch(url)
    const responseJson = await response.json()

    setData(transform ? transform(responseJson) : responseJson)
  }

  useEffect(() => {
    loadData()
  }, [url])

  return data
}
