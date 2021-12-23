const Token = artifacts.require("Token");
const FoodVendor = artifacts.require("FoodVendor");


module.exports = async function (deployer) {
  // Deploy Token
  await deployer.deploy(Token);
  const token = await Token.deployed()

  // Deploy FoodVendor
  await deployer.deploy(FoodVendor, token.address);
  const foodVendor = await FoodVendor.deployed();

  function tokens(n) {
    return web3.utils.toWei(n, 'ether');
  }

  // Transfer all tokens to FoodVendor (1 million)
  await token.transfer(foodVendor.address, tokens('1000000'));
};


