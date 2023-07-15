import {Ed25519Keypair, JsonRpcProvider, RawSigner, TransactionBlock} from "@mysten/sui.js";
import { randomBytes } from '@noble/hashes/utils';
const {useOwnedObject} = require('./useOwnedObject.js');
import {toDecimalsAmount} from '../utils/decimals';

const BULLSHARK_NFT_TYPE = "0xee496a0cc04d06a345982ba6697c90c619020de9e274408c7819f787ff66e1a1::suifrens::SuiFren<0x8894fa02fc6f36cbc485ae9145d05f247a78e220814fb8419ab261bd81f08f32::bullshark::Bullshark>"

export class SuiCoinFlip {
    #provider: JsonRpcProvider
    constructor(provider) {
        this.#provider = provider
    }

    async start(account: Ed25519Keypair, choice: string, amount:number) {
        const signer = new RawSigner(account, this.#provider);
        const packageObjectId = '0x745a16ea148a7b3d1f6e68d0f16237f954e99197cd0ffb96e70c994c946d60d1';
        const tx = new TransactionBlock();
        const userRandomness = randomBytes(16);

        // balance to big number
        const balance = toDecimalsAmount(amount, 9)
        const coin = tx.splitCoins(tx.gas, [tx.pure(Number(balance))]);

        console.log("choice: %s, amount: %d", choice, amount)

        const {ownedObject: ownedBullsharkObject} = await useOwnedObject(
            account.getPublicKey().toSuiAddress(),
            BULLSHARK_NFT_TYPE
        );
        console.log("ownedObject:", ownedBullsharkObject)
        return

        // tx.moveCall({
        //     target: `${packageObjectId}::coin_flip::start_game_with_bullshark`,
        //     typeArguments: [],
        //     arguments: [
        //         tx.pure(ownedBullsharkObject.kiosk),
        //         tx.pure(ownedBullsharkObject.objectId),
        //         tx.pure(choice === 'heads' ? '1' : '0'),
        //         tx.pure(Array.from(userRandomness)),
        //         coin,
        //         tx.object("0xab34432c7137d33c62c26008a780da94a93855302dead229ff67d0a28a695942"),
        //     ],
        // });

        try {
            const result = await signer.signAndExecuteTransactionBlock({
                transactionBlock: tx,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                },
            });

            if (result.effects?.status?.status === "failure") {
                console.error('submit flip failed', result)
            } else {
                console.log('submit flip succeed', getExploreLink(result.digest.toString()))
            }
        } catch (e) {
            console.log("request JSONRPCError")
        }
    }
}

function getExploreLink(digest: string): string {
    return 'https://explorer.sui.io/txblock/' + digest
}