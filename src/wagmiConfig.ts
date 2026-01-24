import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { createPublicClient } from 'viem';

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;

export const chains = [sepolia];

const { connectors } = getDefaultWallets({
    appName: 'MyFirstZKVote',
    projectId: WC_PROJECT_ID,
    chains,
});

export const wagmiConfig = createConfig({
    chains,
    connectors,
    transports: {
        [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    },
    ssr: false,
})

// 创建 public client 用于读取链上数据
// 使用公共 Sepolia RPC 端点以提高稳定性
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
})
