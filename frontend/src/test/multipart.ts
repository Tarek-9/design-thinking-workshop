/**
 * How many `files` parts a multipart request carries, read from the raw body.
 * `request.formData()` cannot be used here: under jsdom the browser `File` is
 * not the one undici accepts, so parsing throws even though the request is
 * sent. The same cause means the parts arrive unnamed (`blob`), so a test can
 * count the files it sent but cannot check their names.
 */
export async function countUploadedFiles(request: Request): Promise<number> {
  const raw = await request.text();
  const boundary = /^--[^\r\n]+/.exec(raw)?.[0];
  if (boundary === undefined) return 0;

  return raw.split(boundary).filter((part) => part.includes('name="files"'))
    .length;
}
