// Print the text of a PDF using macOS PDFKit, with nothing to install.
//   osascript -l JavaScript pdf2txt.js /absolute/path/to/file.pdf > out.txt
// Used to read the datasheets in src/assets/docs before naming an asset's parts.
ObjC.import("PDFKit");
function run(argv) {
  const doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0]));
  if (!doc || doc.isNil()) return "FAILED " + argv[0];
  return ObjC.unwrap(doc.string);
}
