import {Buffer} from "buffer";
import {Account} from "./account";
import {Ed25519Keypair} from "@mysten/sui.js";

export class SuiMnemonic {
    #mnemonic: string;
    constructor(mnemonic: string) {
        this.#mnemonic = mnemonic;
        if (this.check() === true) {
            throw new Error("mnemonic is null")
        }
    }

    check(): boolean {
        return this.#mnemonic == ""
    }

    getAccount(index: number) {
        const account = new Account()
        return account.getAccountViaMnemonic(this.#mnemonic, index)
    }

    showAddresses(start: number, end: number) {
        const account = new Account()
        for (let index= start; index <= end; index++) {
            const _account = account.getAccountViaMnemonic(this.#mnemonic, index)
            console.log("index %d address: %s", index, _account.getPublicKey().toSuiAddress())
        }
    }

    showPrivkeys(start: number, end: number) {
        const account = new Account()
        for (let index= start; index <= end; index++) {
            const _account = account.getAccountViaMnemonic(this.#mnemonic, index)
            const priKey = base64ToHex(_account.export().privateKey)  // base64 data
            console.warn("index %d address: %s privateKey: %s", index, _account.getPublicKey().toSuiAddress(), priKey)
        }
    }

    // TODO: generate mnemonic
}

// base64 格式的私钥转成字符串
function base64ToHex(base64: string): string {
    const buffer = Buffer.from(base64, 'base64');
    return buffer.toString('hex');
}