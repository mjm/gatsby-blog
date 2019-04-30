exports.mutateSource = async ({ markdownNode }, { baseURL }) => {
  const photos = markdownNode.frontmatter.photos
  if (photos && photos.length) {
    const photosContent = photos.map(
      photo =>
        `\n\n<figure><img src="${photoUrl(
          baseURL,
          photo
        )}" alt="" class="u-photo" /></figure>`
    )

    markdownNode.internal.content += photosContent.join("")
  }
}

function photoUrl(siteUrl, url) {
  // When developing, we want to load images from the local version.
  // However, in production it's ideal to have absolute URLs so that things reading the feed
  // will always be able to find the image.
  if (process.env.NODE_ENV === "development") {
    return url
  } else {
    return new URL(url, siteUrl).toString()
  }
}
