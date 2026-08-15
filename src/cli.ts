#!/usr/bin/env node
import { parseArgs } from "node:util"
import { setDebug } from "@shocknet/clink-sdk"
import { loadOrCreateKey, resolveNprofile } from "./config.js"
import { cmdBeacon, cmdDecode, cmdEnroll, cmdInvoice, cmdKey, cmdPay } from "./commands.js"
import { fail } from "./print.js"

const USAGE = `clinkctl <command>

Commands:
  key                 show the local signing npub (creates ~/.clinkctl/nsec if missing)
  beacon              fetch the node's clink-node beacon
  enroll              bind this key to an account on the node
  invoice [noffer]    request a BOLT11 (last enroll noffer if omitted)
  pay <bolt11>        pay via ndebit (last enroll or --ndebit)
  decode <string>     decode noffer / ndebit / nmanage / nprofile / nsec / npub

Flags:
  --nprofile          node nprofile (env CLINK_NPROFILE; default: test Pub)
  --nsec              signing key nsec or hex (env CLINK_NSEC)
  --amount            sats
  --desc              invoice description
  --difficulty        enroll PoW bits (omit to use beacon / probe)
  --ndebit            ndebit pointer for pay
  --json
  --debug
`

const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        nprofile: { type: "string" },
        nsec: { type: "string" },
        amount: { type: "string" },
        desc: { type: "string" },
        difficulty: { type: "string" },
        ndebit: { type: "string" },
        json: { type: "boolean", default: false },
        debug: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
    },
})

const json = values.json === true
const command = positionals[0]

if (values.help || !command) {
    process.stdout.write(USAGE)
    process.exit(command ? 0 : 1)
}

if (values.debug) {
    setDebug(true)
}

const parseAmount = (): number | undefined => {
    if (values.amount === undefined) {
        return undefined
    }
    const n = Number(values.amount)
    if (!Number.isInteger(n) || n < 0) {
        fail("amount must be a non-negative integer", json)
    }
    return n
}

const parseDifficulty = (): number | undefined => {
    if (values.difficulty === undefined) {
        return undefined
    }
    const n = Number(values.difficulty)
    if (!Number.isInteger(n) || n < 0) {
        fail("difficulty must be a non-negative integer", json)
    }
    return n
}

const run = async (): Promise<void> => {
    const { secret, created } = loadOrCreateKey(values.nsec)
    const nprofile = resolveNprofile(values.nprofile)

    switch (command) {
        case "key":
            cmdKey(secret, created, json)
            return
        case "beacon":
            await cmdBeacon(nprofile, secret, json)
            return
        case "enroll":
            await cmdEnroll(nprofile, secret, parseDifficulty(), json)
            return
        case "invoice":
            await cmdInvoice(secret, positionals[1], parseAmount(), values.desc, json)
            return
        case "pay":
            await cmdPay(secret, positionals[1], values.ndebit, parseAmount(), json)
            return
        case "decode":
            cmdDecode(positionals[1], json)
            return
        default:
            fail(`unknown command: ${command}`, json)
    }
}

run().catch(err => {
    fail(err instanceof Error ? err.message : String(err), json)
})
