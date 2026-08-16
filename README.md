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

Until SDK 1.7 is on npm, this repo pins `@shocknet/clink-sdk` to git commit `4494c48` (`enroll-beacon`).

## Quick start

Default node is the experimental enroll-beacon Pub. Override with `--nprofile` or `CLINK_NPROFILE`.

```sh
clinkctl key
clinkctl beacon
clinkctl enroll
clinkctl invoice --amount 21
# pay needs a bolt11 this account can settle
clinkctl pay lnbc... --ndebit ndebit1...
```

Signing key: `--nsec`, `CLINK_NSEC`, or `~/.clinkctl/nsec` (created on first run). Last enroll pointers are saved to `~/.clinkctl/last.json` so `invoice` / `pay` can omit them.

`--json` writes one JSON object to stdout instead of human lines. Failures are `{ "ok": false, "error": "..." }` on stdout with exit code 1.
