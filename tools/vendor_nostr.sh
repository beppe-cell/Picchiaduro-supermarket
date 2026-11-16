#!/bin/sh
# Ricostruisce assets/vendor/nostr-pure.mjs: le funzioni di nostr-tools per firmare e verificare gli eventi
# Nostr (chiavi secp256k1, firma Schnorr) in un solo file ES module. Il gioco lo carica solo quando apre la
# CLASSIFICA o finisce un set RANKED: la classifica globale e' fatta di eventi firmati salvati sui relay Nostr.
# Versioni bloccate: cambiarle qui e rilanciare. Serve Node (npm); lavora in una cartella temporanea.
set -e
DEST="$(cd "$(dirname "$0")/.." && pwd)/assets/vendor/nostr-pure.mjs"
TMP="$(mktemp -d)"
cd "$TMP"
echo '{"name":"vendor","private":true}' > package.json
npm install --silent --no-audit --no-fund nostr-tools@2.25.4 esbuild@0.28.2
echo "export {finalizeEvent, verifyEvent, generateSecretKey, getPublicKey} from 'nostr-tools/pure'" > entry.mjs
./node_modules/.bin/esbuild entry.mjs --bundle --format=esm --minify --target=es2020 --outfile="$DEST"
echo "scritto $DEST"
