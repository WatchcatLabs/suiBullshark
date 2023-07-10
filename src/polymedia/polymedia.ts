import {JsonRpcProvider, Ed25519Keypair, RawSigner,TransactionBlock} from "@mysten/sui.js";

export class Polymedia{
    #provider: JsonRpcProvider
    constructor(provider) {
        this.#provider = provider
    }

    async chat(account: Ed25519Keypair, message: string) {
        const signer = new RawSigner(account, this.#provider);
        const packageObjectId = '0x9bccd22304e984ff1e565c2bd7ac8254b0ee2788190373daae33432ace873c18';
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${packageObjectId}::event_chat::send_message`,
            typeArguments: [],
            arguments: [
                tx.object("0x0b047c44f30a678e79ecd3122d6a80b585fdd2b583c4dae9d71b0d45501106b5"),
                tx.pure(Array.from(new TextEncoder().encode(message))),
            ],
        });

        const result = await signer.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        if (result.effects?.status?.status === "failure") {
            console.error('submit chat failed', result)
        } else {
            console.log('submit chat succeed', getExploreLink(result.digest.toString()))
        }
    }
}

function getExploreLink(digest: string): string {
    return 'https://explorer.sui.io/txblock/' + digest
}


