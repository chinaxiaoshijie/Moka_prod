declare module "pdf-parse" {
  interface PdfData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  function parse(buffer: Buffer): Promise<PdfData>;

  export = parse;
}
