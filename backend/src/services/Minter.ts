import { ethers } from 'ethers';
const NATURO_ABI = [
    "function mint(address to, uint256 id, uint256 amount) external",
    "function totalMinted(uint256 id) view returns (uint256)",
    "function maxSupply(uint256 id) view returns (uint256)"
];

export class Minter {

    private readonly contract: ethers.Contract;
    private readonly provider: ethers.JsonRpcProvider;

    constructor() {
        const rpc = process.env.CHAIN_RPC_URL!;
        const pk = process.env.MINTER_PK!;
        const addr = process.env.NATURO_ADDRESS!;

        this.provider = new ethers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(pk, this.provider);

        this.contract = new ethers.Contract(addr, NATURO_ABI, wallet);
        console.log("RPC:", process.env.CHAIN_RPC_URL);
        console.log("NATURO_ADDRESS:", process.env.NATURO_ADDRESS);
        console.log("MINTER_PK exists:", !!process.env.MINTER_PK);
    }

    async submitMint(to: string, tokenId: number, quantity: number): Promise<string> {
        const tx = await this.contract.mint(to, tokenId, quantity);
        return tx.hash;
    }

    async getReceipt(txHash: string) {
        return await this.provider.getTransactionReceipt(txHash);
    }

    async getConfirmations(txHash: string): Promise<number> {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx?.blockNumber) return 0;

        const latest = await this.provider.getBlockNumber();
        return Math.max(0, latest - tx.blockNumber + 1);
    }

}