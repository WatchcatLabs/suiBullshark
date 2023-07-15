import {Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock} from "@mysten/sui.js";
import * as trace_events from "trace_events";
const BigNumber = require('bignumber.js');

const contractAddress = "0x225a5eb5c580cb6b6c44ffd60c4d79021e79c5a6cea7eb3e60962ee5f9bc6cb2"
const maintainerAddress = "0x1d6d6770b9929e9d8233b31348f035a2a552d8427ae07d6413d1f88939f3807f"

export class Sui8192 {
    #provider: JsonRpcProvider
    #objectId: string
    constructor(provider, objectId) {
        this.#provider = provider
        this.#objectId = objectId
    }

    // async
    async createGame(account: Ed25519Keypair) {
        const signer = new RawSigner(account, this.#provider);
        const tx = new TransactionBlock();

        const fee = new BigNumber(200000000);
        const payment = tx.splitCoins(
            tx.gas,
            [tx.pure(fee)]
        );
        const coinVec = tx.makeMoveVec({ objects: [payment] });
        tx.moveCall({
            target: `${contractAddress}::game_8192::create`,
            typeArguments: [],
            arguments: [tx.object(maintainerAddress), coinVec]
        })

        try {
            const result = await signer.signAndExecuteTransactionBlock({
                transactionBlock: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showEvents: true,
                },
            });

            console.log("result:", result)
            if (result.effects?.status?.status === "failure") {
                console.error('submit create game8192 failed', result)
                return ""
            } else {
                console.log('submit create game8192 succeed', getExploreLink(result.digest.toString()))
                // result.events
                console.log("new game_id: %s", result.events[0].parsedJson["game_id"])
                return result.events[0].parsedJson["game_id"]
            }
        } catch (e) {
            console.log("request JSONRPCError")
            return ""
        }
    }

    async game8192(account: Ed25519Keypair, direction: number) {
        const signer = new RawSigner(account, this.#provider);
        const tx = new TransactionBlock();

        tx.moveCall({
            target: `${contractAddress}::game_8192::make_move`,
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
                console.error('account: %s, submit game8192 failed', account.getPublicKey().toSuiAddress(), result)
            } else {
                console.log('account: %s, submit game8192 succeed', account.getPublicKey().toSuiAddress(), getExploreLink(result.digest.toString()))
            }
        } catch (e) {
            console.log("account: %s, request JSONRPCError",account.getPublicKey().toSuiAddress(), )
        }
    }
}

function getExploreLink(digest: string): string {
    return 'https://explorer.sui.io/txblock/' + digest
}