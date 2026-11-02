#!/bin/sh
set -eu
cd "$(dirname "$0")"
mkdir -p dist

python3 - <<'PY'
import base64
import json
import pathlib
import subprocess

sprites = {
    image.stem: 'data:image/gif;base64,' + base64.b64encode(image.read_bytes()).decode()
    for image in sorted(pathlib.Path('neno').glob('*.gif'))
}
source = pathlib.Path('neno.js').read_text()
placeholder = 'const sprites = null;'
if source.count(placeholder) != 1:
    raise SystemExit('Expected one sprite placeholder in neno.js')
source = source.replace(placeholder, 'const sprites = ' + json.dumps(sprites) + ';')
result = subprocess.run(
    ['terser', '--compress', '--mangle', '--comments', 'false'],
    input=source, text=True, capture_output=True, check=True
)
pathlib.Path('dist/neno.min.js').write_text(result.stdout)
PY

cp demo/index.html dist/
