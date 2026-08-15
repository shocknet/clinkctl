import { beaconIsFresh, newNdebitPaymentRequest } from "@shocknet/clink-sdk"
import { keyInfo, loadLastEnroll, saveLastEnroll, type LastEnroll } from "./config.js"
import { fail, printJson } from "./print.js"
import {
    decodeAny,
    formatBeacon,
    requireNdebit,
    requireNoffer,
    sdkFromNprofile,
    sdkFromPointer,
    withSdk,
} from "./sdk.js"

export const cmdKey = (secret: Uint8Array, created: boolean, json: boolean): void => {
    const info = { ...keyInfo(secret), created }
    if (json) {
        printJson(info)
        return
    }
    if (created) {
        process.stderr.write("created ~/.clinkctl/nsec\n")
    }
    process.stdout.write(`${info.npub}\n`)
}

export const cmdBeacon = async (nprofile: string, secret: Uint8Array, json: boolean): Promise<void> => {
    const sdk = sdkFromNprofile(nprofile, secret)
    const beacon = await withSdk(sdk, s => s.Nbeacon())
    if (beacon && !beaconIsFresh(beacon) && !json) {
        process.stderr.write("warning: beacon is stale\n")
    }
    formatBeacon(beacon, json)
}

export const cmdEnroll = async (
    nprofile: string,
    secret: Uint8Array,
    difficulty: number | undefined,
    json: boolean,
): Promise<void> => {
    const sdk = sdkFromNprofile(nprofile, secret)
    const res = await withSdk(sdk, s => s.Nenroll(difficulty === undefined ? undefined : { difficulty }))
    if (res.res !== "ok") {
        fail(res.error, json, res)
        return
    }
    const last: LastEnroll = {
        noffer: res.noffer,
        ndebit: res.ndebit,
        nmanage: res.nmanage,
        nprofile,
    }
    saveLastEnroll(last)
    if (json) {
        printJson(last)
        return
    }
    process.stdout.write(`noffer\t${res.noffer}\n`)
    process.stdout.write(`ndebit\t${res.ndebit}\n`)
    process.stdout.write(`nmanage\t${res.nmanage}\n`)
}

export const cmdInvoice = async (
    secret: Uint8Array,
    nofferRaw: string | undefined,
    amount: number | undefined,
    desc: string | undefined,
    json: boolean,
): Promise<void> => {
    const raw = nofferRaw || loadLastEnroll()?.noffer
    if (!raw) {
        fail("pass a noffer1... or run enroll first", json)
        return
    }
    const noffer = requireNoffer(raw)
    const sdk = sdkFromPointer(secret, noffer.pubkey, noffer.relay)
    const res = await withSdk(sdk, s => s.Noffer({
        offer: noffer.offer,
        amount_sats: amount,
        description: desc,
    }))
    if (!("bolt11" in res)) {
        fail(res.error, json, res)
        return
    }
    if (json) {
        printJson(res)
        return
    }
    process.stdout.write(`${res.bolt11}\n`)
}

export const cmdPay = async (
    secret: Uint8Array,
    bolt11: string | undefined,
    ndebitRaw: string | undefined,
    amount: number | undefined,
    json: boolean,
): Promise<void> => {
    if (!bolt11) {
        fail("pay requires a bolt11 invoice", json)
        return
    }
    const raw = ndebitRaw || loadLastEnroll()?.ndebit
    if (!raw) {
        fail("pass --ndebit or run enroll first", json)
        return
    }
    const debit = requireNdebit(raw)
    const sdk = sdkFromPointer(secret, debit.pubkey, debit.relay)
    const req = newNdebitPaymentRequest(bolt11, amount, debit.pointer, debit.k1)
    const res = await withSdk(sdk, s => s.Ndebit(req))
    if (res.res !== "ok") {
        fail(res.error, json, res)
        return
    }
    if (json) {
        printJson(res)
        return
    }
    process.stdout.write(res.preimage ? `${res.preimage}\n` : "ok\n")
}

export const cmdDecode = (raw: string | undefined, json: boolean): void => {
    if (!raw) {
        fail("decode requires noffer1 / ndebit1 / nmanage1 / nprofile / nsec / npub", json)
        return
    }
    try {
        printJson(decodeAny(raw))
    } catch (e) {
        fail((e as Error).message, json)
    }
}
