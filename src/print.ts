export const printJson = (value: unknown): void => {
    process.stdout.write(JSON.stringify(value, null, 2) + "\n")
}

export const fail = (message: string, json: boolean, extra?: unknown): never => {
    if (json) {
        printJson({ ok: false, error: message, ...((extra && typeof extra === "object") ? extra : {}) })
    } else {
        process.stderr.write(message + "\n")
    }
    process.exit(1)
    throw new Error(message)
}
