export async function fetchFontFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font (${response.status}): ${url}`);
  }
  return await response.arrayBuffer();
}
