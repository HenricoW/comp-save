// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICToken {
  function mint(uint256 mintAmount) external returns (uint256);

  function redeem(uint256 redeemTokens) external returns (uint256);

  function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

  function borrow(uint256 borrowAmount) external returns (uint256);

  function repayBorrow(uint256 repayAmount) external returns (uint256);

  function underlying() external view returns (address);

  function balanceOfUnderlying(address owner) external view returns (uint256);
}
