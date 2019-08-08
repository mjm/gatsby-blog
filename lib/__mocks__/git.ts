const git = jest.genMockFromModule("../git") as any

const files = new Map<string, string>()

export function __registerFile(branch: string, path: string, contents: string) {
  files.set(`${branch}___${path}`, contents)
}

export function __clearFiles() {
  files.clear()
}

export async function getFile(branch: string, path: string): Promise<string> {
  const file = files.get(`${branch}___${path}`)
  if (!file) {
    throw new Error("No file found")
  }

  return file
}

const { upload, commit } = git
export { upload, commit }
