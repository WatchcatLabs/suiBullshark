import {
    Ed25519Keypair,
    JsonRpcProvider,
    RawSigner,
    TransactionBlock,
    Connection,
} from '@mysten/sui.js';
import {SuiAddress} from "@mysten/sui.js/src/types";

export class SuiClient {
    #provider: JsonRpcProvider;
    constructor(rpc: string) {
        this.#provider = this.getProvider(rpc)
    }

    getProvider(rpc: string): JsonRpcProvider {
        const connection = new Connection({
            fullnode: rpc,
        });
        return new JsonRpcProvider(connection);
    }

    setProvider(provider: JsonRpcProvider) {
        this.#provider = provider
    }

    async getAllBalance(address: SuiAddress){
        return this.#provider.getAllBalances({owner:address})
    }

    async getBalance(address: SuiAddress, coinType?: string | null) {
        return this.#provider.getBalance({owner: address, coinType: coinType})
    }

    async dispatchSui(account: Ed25519Keypair, recipients: string[], amount:number) {
        const signer = new RawSigner(account, this.#provider);
        const tx = new TransactionBlock();
        recipients.forEach(recipient => {
            const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
            tx.transferObjects([coin], tx.pure(recipient));
        });
        const result = await signer.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        if (result.effects?.status?.status === "failure") {
            console.error('dispatch failed', result)
        } else {
            console.log('dispatch succeed', amount, this.getExploreLink(result.digest.toString()))
        }
    }

    async transferSui(account: Ed25519Keypair, receipter: string, amount: number) {
        const signer = new RawSigner(account, this.#provider);
        const tx = new TransactionBlock();

        const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
        tx.transferObjects([coin], tx.pure(receipter));
        const result = await signer.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        if (result.effects?.status?.status === "failure") {
            console.log('failed transfer from %s address %sSUI to %s address',
                account.getPublicKey().toSuiAddress(),
                amount, receipter, result)
        } else {
            console.log('succeed transfer from %s address %sSUI to %s address, link: %s',
                account.getPublicKey().toSuiAddress(), amount, receipter,
                this.getExploreLink(result.digest.toString()))
        }
    }

    async transferERC20Token(account: Ed25519Keypair,
                                    receipter: string,
                                    amount: number,
                                    decimals: number) {
        const suiAddr = account.getPublicKey().toSuiAddress()
        console.log("address:", suiAddr)

        const signer = new RawSigner(account, this.#provider);
        const tx = new TransactionBlock();

        const splitUSDT = tx.splitCoins(
                tx.object('0xb5bb7e8202504970d2abde7f93e678b6028c88aacd3362787d11384a1e58e5ae'), [tx.pure(amount)])

        // amount to value
        tx.transferObjects(
            [splitUSDT],
            tx.pure(receipter),
        );

        const result = await signer.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        if (result.effects?.status?.status === "failure") {
            console.log('failed', result)
        } else {
            console.log('succeed', this.getExploreLink(result.digest.toString()))
        }
    }

    getExploreLink(digest: string): string {
        return 'https://explorer.sui.io/txblock/' + digest
    }
}

