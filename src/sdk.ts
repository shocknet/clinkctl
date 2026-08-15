import {
    ClinkSDK,
    decodeBech32,
    nip19,
    type ClinkBeacon,
} from "@shocknet/clink-sdk"
import { fail, printJson } from "./print.js"

export const withSdk = async <T>(sdk: ClinkSDK, fn: (sdk: ClinkSDK) => Promise<T>): Promise<T> => {
    try {
        return await fn(sdk)
    } finally {
        sdk.Stop()
    }
}

export const sdkFromNprofile = (nprofile: string, secret: Uint8Array): ClinkSDK => {
    return ClinkSDK.fromNprofile(nprofile, secret, { defaultTimeoutSeconds: 30 })
}

export const sdkFromPointer = (secret: Uint8Array, pubkey: string, relay: string): ClinkSDK => {
    return new ClinkSDK({
        privateKey: secret,
        relays: [relay],
        toPubKey: pubkey,
        defaultTimeoutSeconds: 30,
    })
}

export const requireNoffer = (raw: string) => {
    const decoded = decodeBech32(raw)
    if (decoded.type !== "noffer") {
        throw new Error("expected noffer1...")
    }
    return decoded.data
}

export const requireNdebit = (raw: string) => {
    const decoded = decodeBech32(raw)
    if (decoded.type !== "ndebit") {
        throw new Error("expected ndebit1...")
    }
    return decoded.data
}

export const decodeAny = (raw: string): unknown => {
    if (raw.startsWith("noffer1") || raw.startsWith("ndebit1") || raw.startsWith("nmanage1")) {
        return decodeBech32(raw)
    }
    return nip19.decode(raw)
}

export const formatBeacon = (beacon: ClinkBeacon | null, json: boolean): void => {
    if (!beacon) {
        fail("no beacon", json)
        return
    }
    if (json) {
        printJson(beacon)
        return
    }
    const c = beacon.content
    process.stdout.write(`name\t${c.name ?? ""}\n`)
    process.stdout.write(`created_at\t${beacon.created_at}\n`)
    if (c.fees) {
        process.stdout.write(`fees\tfloor=${c.fees.serviceFeeFloor} bps=${c.fees.serviceFeeBps}\n`)
    }
    if (c.enroll_difficulty !== undefined) {
        process.stdout.write(`enroll_difficulty\t${c.enroll_difficulty}\n`)
    }
    if (c.supported_kinds) {
        process.stdout.write(`supported_kinds\t${c.supported_kinds.join(",")}\n`)
    }
    if (c.relays) {
        process.stdout.write(`relays\t${c.relays.join(",")}\n`)
    }
    if (beacon.operator) {
        process.stdout.write(`operator\t${beacon.operator}\n`)
    }
}
