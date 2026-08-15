#!/bin/sh
set -e
mkdir -p dist
compile() {
  target=$1
  outfile=$2
  bun build --compile --target="$target" --outfile="$outfile" src/cli.ts
}

compile bun-linux-x64 dist/clinkctl-linux-x64
compile bun-linux-arm64 dist/clinkctl-linux-arm64
compile bun-darwin-arm64 dist/clinkctl-darwin-arm64
compile bun-darwin-x64 dist/clinkctl-darwin-x64
compile bun-windows-x64 dist/clinkctl-windows-x64.exe
