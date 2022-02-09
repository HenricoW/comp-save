import { ContractTransaction } from "ethers";

// ABIs
export const cTokenABI = [
  "function mint(uint256 mintAmount) external returns (uint256)",
  "function redeem(uint256 redeemTokens) external returns (uint256)",
  "function redeemUnderlying(uint256 redeemAmount) external returns (uint256)",
  "function borrow(uint256 borrowAmount) external returns (uint256)",
  "function repayBorrow(uint256 repayAmount) external returns (uint256)",
  "function underlying() external view returns (address)",
  "function balanceOfUnderlying(address owner) external view returns (uint256)",
  "function borrowBalanceCurrent(address account) external view returns (uint)",
  "function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint)",
];

export const compERC20ABI = [
  "function allocateTo(address _owner, uint256 value) public",
  "function balanceOf(address user) external view returns(uint)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
];

export const UserAccountABI = [
  "constructor(address _comptroller, address _userAddress)",
  "function userAddress() public view returns(address)",
  "function fundAccount(address _token, uint256 amount) external",
  "function drawDown(address _token, uint256 amount) external",
  "function deposit(address cTokenAddr, uint256 amount) external",
  "function withdraw(address cTokenAddr, uint256 cAmount) external",
  "function borrow(address cTokenAddr, uint256 uAmount) external",
  "function repay(address cTokenAddr, uint256 repayAmount) external",
  "function getStatus() external view returns (uint256)",
];

export const comptrollerABI = [
  "function markets(address cTokenAddress) view returns (bool, uint, bool)",
  "function getAccountLiquidity(address account) view returns (uint, uint, uint)",
];

// this not available in hardhat?? wtf?
export const eventOnTx = async (tx: ContractTransaction, evtName: string) => {
  const rec = await tx.wait();
  if (!rec.events) {
    return undefined;
  } else {
    const evt = rec.events.filter((evt) => evt.event === evtName)[0];
    return evt.args;
  }
};
