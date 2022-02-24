//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./IComptroller.sol";
import "./ICToken.sol";

contract UserAccount {
  IComptroller public comptroller;
  address public userAddress;

  /// @notice only the account holder may access these functions
  modifier onlyHolder() {
    require(msg.sender == userAddress, "Unauthorized access");
    _;
  }

  constructor(address _comptroller, address _userAddress) {
    comptroller = IComptroller(_comptroller);
    userAddress = _userAddress;
  }

  /// @notice anyone can add funds to the account
  /// @dev    relies on ERC20's balance check
  function fundAccount(address _token, uint256 amount) external {
    IERC20 token = IERC20(_token);
    token.transferFrom(msg.sender, address(this), amount);
  }

  /// @notice account owner withrawal from account
  /// @dev    no re-entrancy guard, only holds this user's funds - not pool that could be drained
  function drawDown(address _token, uint256 amount) external onlyHolder {
    IERC20 token = IERC20(_token);
    require(token.balanceOf(address(this)) > amount, "drawDown: Insufficient funds");
    token.transfer(userAddress, amount);
  }

  /// @notice deposit tokens
  function deposit(address cTokenAddr, uint256 uAmount) external onlyHolder {
    ICToken cToken = ICToken(cTokenAddr);
    IERC20 uToken = IERC20(cToken.underlying());
    uToken.approve(cTokenAddr, uAmount);

    uint256 result = cToken.mint(uAmount);
    require(result == 0, "cToken#mint() failed");
  }

  /// @notice redeem ctokens for tokens
  function withdraw(address cTokenAddr, uint256 uAmount) external onlyHolder {
    ICToken cToken = ICToken(cTokenAddr);
    require(cToken.balanceOfUnderlying(address(this)) > uAmount, "withdraw: Insufficient funds");

    uint256 result = cToken.redeemUnderlying(uAmount);
    require(result == 0, "redeemUnderlying() failed");
  }

  /// @notice borrow tokens
  /// @dev    enter markets only called when needed (opposed to with new deposit)
  function borrow(address cTokenAddr, uint256 uAmount) external onlyHolder {
    ICToken cToken = ICToken(cTokenAddr);

    address[] memory cTokens = new address[](1);
    cTokens[0] = cTokenAddr;

    uint256[] memory result = comptroller.enterMarkets(cTokens);
    require(result[0] == 0, "enterMarkets() failed");

    uint256 result2 = cToken.borrow(uAmount);
    require(result2 == 0, "cToken#borrow() failed");
  }

  /// @notice repay the borrowed tokens
  function repay(address cTokenAddr, uint256 uAmount) external onlyHolder {
    ICToken cToken = ICToken(cTokenAddr);
    IERC20 uToken = IERC20(cToken.underlying());
    uToken.approve(cTokenAddr, uAmount);

    uint256 result = cToken.repayBorrow(uAmount);
    require(result == 0, "cToken#repayBorrow() failed");
  }
}
