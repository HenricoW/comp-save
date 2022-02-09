//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./IComptroller.sol";
import "./ICToken.sol";

contract UserAccount {
  IComptroller public comptroller;
  address public userAddress;

  constructor(address _comptroller, address _userAddress) {
    comptroller = IComptroller(_comptroller);
    userAddress = _userAddress;
  }

  function fundAccount(address _token, uint256 amount) external {
    IERC20 token = IERC20(_token);
    token.transferFrom(msg.sender, address(this), amount);
  }

  function drawDown(address _token, uint256 amount) external {
    IERC20 token = IERC20(_token);
    require(token.balanceOf(msg.sender) > amount, "UserAccount#drawDown: Insufficient funds");
    token.transfer(msg.sender, amount);
  }

  // deposit tokens
  function deposit(address cTokenAddr, uint256 amount) external {
    ICToken cToken = ICToken(cTokenAddr);
    address underlying = cToken.underlying();
    IERC20 uToken = IERC20(underlying);
    uToken.approve(cTokenAddr, amount);

    uint256 result = cToken.mint(amount);
    require(result == 0, "cToken#mint() failed");

    // address[] memory cTokens = new address[](1);
    // cTokens[0] = cTokenAddr;
    // uint[] memory res = comptroller.enterMarkets(cTokens);
    // require(res[0] == 0, "enterMarkets() failed");
  }

  // redeem ctokens for tokens
  function withdraw(address cTokenAddr, uint256 amount) external {
    ICToken cToken = ICToken(cTokenAddr);
    // IERC20 uToken = IERC20(cToken.underlying());

    uint256 result = cToken.redeemUnderlying(amount);
    require(result == 0, "cToken#redeem() failed");
  }

  //  borrow tokens
  function borrow(address cTokenAddr, uint256 uAmount) external {
    ICToken cToken = ICToken(cTokenAddr);

    address[] memory cTokens = new address[](1);
    cTokens[0] = cTokenAddr;

    uint256[] memory result = comptroller.enterMarkets(cTokens);
    require(result[0] == 0, "Comptroller#enterMarkets() failed");

    uint256 result2 = cToken.borrow(uAmount);
    require(result2 == 0, "cToken#borrow() failed");
  }

  // repay the borrowed tokens
  function repay(address cTokenAddr, uint256 repayAmount) external {
    ICToken cToken = ICToken(cTokenAddr);
    IERC20 uToken = IERC20(cToken.underlying());
    uToken.approve(cTokenAddr, repayAmount);

    uint256 result = cToken.repayBorrow(repayAmount);
    require(result == 0, "cToken#repayBorrow() failed");
  }
}
