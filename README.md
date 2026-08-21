# clinkctl

Command-line tool for CLINK. Point it at a Lightning node to enroll, invoice, and pay from a shell, script, or agent.

Uses [`@shocknet/clink-sdk`](https://github.com/shocknet/ClinkSDK).

## Install

Grab a binary from [Releases](https://github.com/shocknet/clinkctl/releases):

```sh
# Linux x64 example
curl -L https://github.com/shocknet/clinkctl/releases/latest/download/clinkctl-linux-x64 -o clinkctl
chmod +x clinkctl
sudo mv clinkctl /usr/local/bin/
```

Also published: `linux-arm64`, `darwin-arm64`, `darwin-x64`, `windows-x64.exe`.

Build one yourself:

```sh
bun install
bun run build:bin          # native binary at dist/clinkctl
bun run build:binaries     # all targets under dist/
```

## Quick start

Default node is the experimental enroll-beacon Pub. Override with `--nprofile` or `CLINK_NPROFILE`.

```sh
clinkctl key
clinkctl beacon
clinkctl enroll
clinkctl invoice --amount 21
clinkctl invoice --amount 21 --receipt
# pay needs a bolt11 this account can settle
clinkctl pay lnbc... --ndebit ndebit1...
```

Signing key: `--nsec`, `CLINK_NSEC`, or `~/.clinkctl/nsec` (created on first run). Enroll caches pointers in `~/.clinkctl/last.json` so `invoice` / `pay` can omit them. `clinkctl last` reprints the same three lines enroll printed.

`--receipt` prints the bolt11, then stays until the offer receipt arrives (`ok` or a preimage). With `--json`, that is two JSON objects: the invoice, then the receipt.

Without `--receipt`, `--json` writes one JSON object. Failures are `{ "ok": false, "error": "..." }` on stdout with exit code 1.
