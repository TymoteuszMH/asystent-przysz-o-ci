"""Extract main-document text from a DOCX file without unpacking its archive."""

import sys
import xml.etree.ElementTree as ET
import zipfile

MAX_XML_BYTES = 25 * 1024 * 1024
WORD_NAMESPACES = {
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "http://purl.oclc.org/ooxml/wordprocessingml/main",
}


class WordText:
    def __init__(self):
        self.parts = []
        self.in_text = False

    def start(self, tag, _attributes):
        namespace, _, name = tag.removeprefix("{").partition("}")
        if namespace not in WORD_NAMESPACES:
            return
        if name == "t":
            self.in_text = True
        elif name == "tab":
            self.parts.append("\t")
        elif name in {"br", "cr"}:
            self.parts.append("\n")

    def data(self, text):
        if self.in_text:
            self.parts.append(text)

    def end(self, tag):
        namespace, _, name = tag.removeprefix("{").partition("}")
        if namespace not in WORD_NAMESPACES:
            return
        if name == "t":
            self.in_text = False
        elif name == "p":
            self.parts.append("\n")

    def doctype(self, *_):
        raise ValueError("DTD is not allowed")

    def close(self):
        return "".join(self.parts)


def extract(path):
    with zipfile.ZipFile(path) as archive:
        entry = archive.getinfo("word/document.xml")
        if entry.file_size > MAX_XML_BYTES:
            sys.exit(2)
        parser = ET.XMLParser(target=WordText())
        with archive.open(entry) as xml:
            read_bytes = 0
            while chunk := xml.read(65536):
                read_bytes += len(chunk)
                if read_bytes > MAX_XML_BYTES:
                    sys.exit(2)
                parser.feed(chunk)
        return parser.close()


try:
    sys.stdout.buffer.write(extract(sys.argv[1]).encode("utf-8"))
except (KeyError, ValueError, ET.ParseError, RuntimeError, zipfile.BadZipFile):
    sys.exit(1)
