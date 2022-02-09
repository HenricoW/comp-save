//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./UserAccount.sol";
import "./IComptroller.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract W3Saver is Ownable {
  mapping(address => UserAccount) public userAccounts;
  address[] public userAddrList;
  UserAccount private _nullAcc = new UserAccount(address(0), address(0));

  IComptroller public comptroller;

  /// @param eoa - user address
  /// @param account - account address generated for user
  event AccountCreated(address indexed eoa, address account);

  constructor(address _comptroller) {
    comptroller = IComptroller(_comptroller);
  }

  function createAccount() external {
    if (userAccounts[msg.sender] == _nullAcc) return;

    UserAccount uAcc = new UserAccount(address(comptroller), msg.sender);
    userAddrList.push(msg.sender);
    userAccounts[msg.sender] = uAcc;

    emit AccountCreated(msg.sender, address(uAcc));
  }

  // helper functions
  function historicUserList() external view onlyOwner returns (address[] memory) {
    return userAddrList;
  }

  function getAccAddr(address uAddr) external view returns (address) {
    return address(userAccounts[uAddr]);
  }
}
