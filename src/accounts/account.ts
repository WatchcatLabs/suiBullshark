import {Ed25519Keypair, fromB64} from '@mysten/sui.js';

export class Account {
    constructor() {
    }

    genAccount(): Ed25519Keypair{
        return Ed25519Keypair.generate()
    }

    getAccountViaPriKey(prikey: string): Ed25519Keypair {
        const privateKeyBase64 = (Buffer.from(prikey, 'hex')).toString('base64')
        return Ed25519Keypair.fromSecretKey(fromB64(privateKeyBase64))
    }

    getAccountViaMnemonic(mnemonic: string, index: number): Ed25519Keypair {
        const path = "m/44'/784'/"+index.toString()+"'/0'/0'"
        // console.log(path)
        return  Ed25519Keypair.deriveKeypair(mnemonic, path)
    }

    //TODO
    getAccountViaKeystore(): Ed25519Keypair {
        return
    }

}

