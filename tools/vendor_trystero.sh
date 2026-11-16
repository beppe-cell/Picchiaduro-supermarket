#!/bin/sh
# Ricostruisce assets/vendor/trystero-nostr.mjs: la libreria Trystero (strategia Nostr) in un solo file
# ES module, caricato dal gioco solo quando si apre ONLINE. Versioni bloccate: cambiarle qui e rilanciare.
# Serve Node (npm); lavora in una cartella temporanea e non tocca il progetto oltre al file finale.
set -e
DEST="$(cd "$(dirname "$0")/.." && pwd)/assets/vendor/trystero-nostr.mjs"
TMP="$(mktemp -d)"
cd "$TMP"
echo '{"name":"vendor","private":true}' > package.json
npm install --silent --no-audit --no-fund @trystero-p2p/nostr@0.26.0 esbuild@0.28.2
echo "export {joinRoom, selfId} from '@trystero-p2p/nostr'" > entry.mjs
./node_modules/.bin/esbuild entry.mjs --bundle --format=esm --minify --target=es2020 --outfile="$DEST"
echo "scritto $DEST"
