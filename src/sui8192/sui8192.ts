import {Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock} from "@mysten/sui.js";

export class Sui8192 {
    #provider: JsonRpcProvider
    #objectId: string
    constructor(provider, objectId) {
        this.#provider = provider
        this.#objectId = objectId
    }

    async game8192(account: Ed25519Keypair, direction: number) {
        const signer = new RawSigner(account, this.#provider);
        const packageObjectId = '0x225a5eb5c580cb6b6c44ffd60c4d79021e79c5a6cea7eb3e60962ee5f9bc6cb2';
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${packageObjectId}::game_8192::make_move`,
            typeArguments: [],
            arguments: [
                tx.object(this.#objectId),
                tx.pure(direction),
            ],
        });

        try {
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
        } catch (e) {
            console.log("request JSONRPCError")
        }
    }
}

function getExploreLink(digest: string): string {
    return 'https://explorer.sui.io/txblock/' + digest
}