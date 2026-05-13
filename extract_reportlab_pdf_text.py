import base64
import re
import sys
import zlib


def decode_pdf_string(raw: bytes) -> str:
    out = bytearray()
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch != 92:
            out.append(ch)
            i += 1
            continue

        i += 1
        if i >= len(raw):
            break
        esc = raw[i]
        i += 1
        if esc in b"nrtbf":
            out.append({110: 10, 114: 13, 116: 9, 98: 8, 102: 12}[esc])
        elif esc in b"()\\":
            out.append(esc)
        elif 48 <= esc <= 55:
            digits = bytes([esc])
            for _ in range(2):
                if i < len(raw) and 48 <= raw[i] <= 55:
                    digits += bytes([raw[i]])
                    i += 1
                else:
                    break
            out.append(int(digits, 8))
        elif esc in b"\r\n":
            if esc == 13 and i < len(raw) and raw[i] == 10:
                i += 1
        else:
            out.append(esc)

    return out.decode("latin-1", errors="replace")


def iter_strings(content: bytes):
    i = 0
    while i < len(content):
        if content[i] != 40:
            i += 1
            continue

        i += 1
        start = i
        depth = 1
        escaped = False
        buf = bytearray()
        while i < len(content) and depth:
            ch = content[i]
            if escaped:
                buf.extend(content[i - 1 : i + 1])
                escaped = False
            elif ch == 92:
                escaped = True
            elif ch == 40:
                depth += 1
                buf.append(ch)
            elif ch == 41:
                depth -= 1
                if depth:
                    buf.append(ch)
            else:
                buf.append(ch)
            i += 1

        if i > start:
            yield decode_pdf_string(bytes(buf))


def extract(path: str) -> str:
    data = open(path, "rb").read()
    pages = []
    for match in re.finditer(rb"stream\r?\n(?P<body>.*?)endstream", data, re.S):
        dictionary = data[max(0, match.start() - 300) : match.start()]
        body = match.group("body").strip()
        if b"ASCII85Decode" in dictionary and b"FlateDecode" in dictionary:
            try:
                body = zlib.decompress(base64.a85decode(body, adobe=True))
            except Exception:
                continue
        elif b"FlateDecode" in dictionary:
            try:
                body = zlib.decompress(body)
            except Exception:
                continue
        else:
            continue

        strings = [s.strip() for s in iter_strings(body)]
        strings = [s for s in strings if s]
        if strings:
            pages.append("\n".join(strings))

    return "\n\n--- PAGE ---\n\n".join(pages)


if __name__ == "__main__":
    print(extract(sys.argv[1]))
