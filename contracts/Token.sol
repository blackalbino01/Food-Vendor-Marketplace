// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract Token is ERC20{
  constructor() ERC20("FoodVendor Token ", "FVT"){
    _mint(msg.sender, 1000000*10**18);
  }
   
}
