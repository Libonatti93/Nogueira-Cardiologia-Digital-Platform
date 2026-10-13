"""One document per disposable, offline, resource-limited container. No host mounts."""
import base64
import json
import os
import re
import subprocess
import sys
from pathlib import Path


def run(args, timeout=45):
    return subprocess.run(args, check=True, capture_output=True, timeout=timeout).stdout


def render():
    extension = sys.argv[1]
    if extension not in ("pdf", "ppt", "pptx"):
        raise ValueError("Unsupported document")
    data = sys.stdin.buffer.read(40 * 1024 * 1024 + 1)
    if not data or len(data) > 40 * 1024 * 1024:
        raise ValueError("Document size")
    os.environ["XDG_CACHE_HOME"] = "/tmp/cache"
    os.environ["LC_ALL"] = "C"
    source = Path("/tmp/source." + extension)
    source.write_bytes(data)
    if extension != "pdf":
        profile = Path("/tmp/profile/user")
        profile.mkdir(parents=True)
        (profile / "registrymodifications.xcu").write_text('''<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry">
<item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item>
</oor:items>''')
        run(["libreoffice", "-env:UserInstallation=file:///tmp/profile", "--headless",
             "--nologo", "--nodefault", "--norestore", "--convert-to", "pdf:impress_pdf_Export",
             "--outdir", "/tmp", str(source)])
    pdf = Path("/tmp/source.pdf")
    info = run(["pdfinfo", str(pdf)]).decode("utf-8", errors="replace")
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    count = int(match[1]) if match else 0
    if not 1 <= count <= 100:
        raise ValueError("Use 1 to 100 pages")
    pages = []
    total = 0
    for page in range(1, count + 1):
        run(["pdftoppm", "-f", str(page), "-l", str(page), "-singlefile",
             "-scale-to", "1600", "-jpeg", "-jpegopt", "quality=85",
             str(pdf), "/tmp/page"], timeout=15)
        image = Path("/tmp/page.jpg").read_bytes()
        total += len(image)
        if len(image) > 3 * 1024 * 1024 or total > 32 * 1024 * 1024:
            raise ValueError("Rendered document too large")
        pages.append(base64.b64encode(image).decode("ascii"))
    sys.stdout.write(json.dumps({"pages": pages}))


try:
    render()
except Exception:
    print("Document conversion failed. Use an unencrypted document with up to 100 pages.", file=sys.stderr)
    sys.exit(1)
