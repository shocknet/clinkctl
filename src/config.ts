import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { generateSecretKey, getPublicKey, nip19 } from "@shocknet/clink-sdk"

/** Experimental enroll-beacon Pub. Override with --nprofile or CLINK_NPROFILE. */
export const DEFAULT_NPROFILE =
    "nprofile1qy08wumn8ghj7ar9wd6z6un9d3shjtnvd9nksarwd9hxwtnsw43qqg8rqmz9ac98cae9grcaez9spaua95u3p075q3lfzpvynxx7nj0zhc7z748z"

export type LastEnroll = {
    noffer: string
    ndebit: string
    nmanage: string
    nprofile: string
}

const dir = () => join(homedir(), ".clinkctl")
const keyPath = () => join(dir(), "nsec")
const lastPath = () => join(dir(), "last.json")

const ensureDir = () => mkdirSync(dir(), { recursive: true, mode: 0o700 })

const hexToBytes = (hex: string): Uint8Array => {
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
        throw new Error("key must be nsec1... or 64-char hex")
    }
    const bytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
}

export const parseSecret = (raw: string): Uint8Array => {
    const trimmed = raw.trim()
    if (trimmed.startsWith("nsec1")) {
        const decoded = nip19.decode(trimmed)
        if (decoded.type !== "nsec") {
            throw new Error("expected nsec")
        }
        return decoded.data
    }
    return hexToBytes(trimmed)
}

export const loadOrCreateKey = (override?: string): { secret: Uint8Array, created: boolean } => {
    if (override) {
        return { secret: parseSecret(override), created: false }
    }
    const fromEnv = process.env.CLINK_NSEC
    if (fromEnv) {
        return { secret: parseSecret(fromEnv), created: false }
    }
    if (existsSync(keyPath())) {
        return { secret: parseSecret(readFileSync(keyPath(), "utf8")), created: false }
    }
    ensureDir()
    const secret = generateSecretKey()
    writeFileSync(keyPath(), nip19.nsecEncode(secret) + "\n", { mode: 0o600 })
    return { secret, created: true }
}

export const keyInfo = (secret: Uint8Array) => ({
    npub: nip19.npubEncode(getPublicKey(secret)),
    hex: getPublicKey(secret),
})

export const resolveNprofile = (flag?: string): string => {
    return flag || process.env.CLINK_NPROFILE || DEFAULT_NPROFILE
}

export const saveLastEnroll = (last: LastEnroll): void => {
    ensureDir()
    writeFileSync(lastPath(), JSON.stringify(last, null, 2) + "\n", { mode: 0o600 })
}

export const loadLastEnroll = (): LastEnroll | null => {
    if (!existsSync(lastPath())) {
        return null
    }
    return JSON.parse(readFileSync(lastPath(), "utf8")) as LastEnroll
}
