/** Counts parts in the raw body: under jsdom, request.formData() throws on the File objects. */
export async function countUploadedFiles(request: Request): Promise<number> {
  const raw = await request.text();
  const boundary = /^--[^\r\n]+/.exec(raw)?.[0];
  if (boundary === undefined) return 0;

  return raw.split(boundary).filter((part) => part.includes('name="files"'))
    .length;
}
