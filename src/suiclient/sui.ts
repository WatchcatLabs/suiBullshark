import {JsonRpcProvider, Ed25519Keypair} from "@mysten/sui.js";
import {SuiClient} from "./client"
import {SuiAddress} from "@mysten/sui.js/src/types";
import  {fromDecimalsAmount, toDecimalsAmount} from "../utils/decimals";

export class SuiTool {
    #rpc: string
    #client:SuiClient
    constructor(rpc: string) {
        this.#client = new SuiClient(rpc)
    }

    getRpc(): string {
        return this.#rpc
    }

    setRpc(rpc: string) {
        this.#client = new SuiClient(rpc)
    }

    // 在一笔交易里面分发 sui
    async dispatchSui(account: Ed25519Keypair, recipients: string[], amount: number) {
        await this.#client.dispatchSui(account, recipients, amount)
    }

    // 转账 sui
    async transferSui(account: Ed25519Keypair, receipter: string, amount: number) {
        await this.#client.transferSui(account, receipter, amount)
    }

    // 转账 erc20 token
    async transferERC20Token(account: Ed25519Keypair,
                             receipter: string,
                             amount: number,
                             decimals: number) {
        await this.#client.transferERC20Token(account, receipter, amount, decimals)
    }

    // 查询 sui 的余额
    async getBalance(address: string) {
        const balance = await this.#client.getBalance(address)
        return fromDecimalsAmount(balance.totalBalance, 9)
    }

    // 查询指定 token 的余额
    async getTokenBalance(address: string, tokenAddress: string, tokenDecimals: number) {
        return  await this.#client.getBalance(address, tokenAddress)
    }
}

