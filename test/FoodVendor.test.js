// Load dependencies
const { accounts, contract, web3  } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');


// Use the different accounts, which are unlocked and funded with Ether
const [ owner, buyer ] = accounts;

// Load compiled artifacts
const Token = contract.fromArtifact("Token");
const FoodVendor = contract.fromArtifact("FoodVendor");

//convert ether to wei
function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

describe("FoodVendor", function () {

  let token, foodVendor, receipt, createFoodReceipt, purchaseFoodReceipt

  beforeEach(async () => {
    token = await Token.new();
    foodVendor = await FoodVendor.new(token.address, { from: owner });
    // Transfer all tokens to FoodVendor (1 million)
    await token.transfer(foodVendor.address, tokens('1000000'));

    // Purchase tokens
    receipt = await foodVendor.buyTokens({ from: buyer, value: tokens('0.00000000000000001') });

    //Owner create food
    createFoodReceipt = await foodVendor.createFood("Rice", '20', 1, { from: owner});

  });


  it("contract has tokens", async () => {
    let balance = await token.balanceOf(foodVendor.address);
    expect(balance.toString()).to.equal(tokens('999999e24'));
  });


  it('Allows user to instantly purchase tokens from foodVendor for a fixed price', async () => {
    // Check buyer token balance after purchase
    let buyerBalance = await token.balanceOf(buyer);
    expect(buyerBalance.toString()).to.equal('1000');

    // Check foodVendor balance after purchase
    let foodVendorBalance
    foodVendorBalance = await token.balanceOf(foodVendor.address);
    expect(foodVendorBalance.toString()).to.equal(tokens('999999e24'));

    foodVendorBalance = await web3.eth.getBalance(foodVendor.address);
    expect(foodVendorBalance.toString()).to.equal(tokens('1'));
  });


  it('Token Purchased Event should emitted the correct data', async () => {
    // Check logs to ensure event was emitted with correct data
    expectEvent(receipt, 'TokensPurchased',
      { buyer: buyer, 
        foodvendortoken: token.address, 
        amount: '1000', 
        rate: '100'
      });
  });


  it('Food Created Event should emitted the correct data', async () => {
    // Check logs to ensure event was emitted with correct data
    expectEvent(createFoodReceipt, 'foodCreated',
     { id: '1', 
      name: 'Rice', 
      price: '20', 
      owner: owner, 
      purchased: false 
    });
  });


  it("Creating food should fails when called by a non-owner account", async function () {
    await expectRevert(await foodVendor.createFood("Rice", '20', 1, { from: buyer }), 
      "Unauthorized Account"
      );
  });

    
  it("Allow buyer to instantly purchase food", async function () {

    //approve food vendor contract
    await token.approve(foodVendor.address, '10000',{ from:owner });

    // purchase food
    purchaseFoodReceipt = await foodVendor.purchaseFood(1, { from: buyer });
    // Check buyer token balance after purchase
    let buyerBalance = await token.balanceOf(buyer);
    expect(buyerBalance.toString()).to.equal(tokens('100'));

    // Check foodVendor balance after purchase
    let foodVendorBalance
    foodVendorBalance = await token.balanceOf(foodVendor.address);
    expect(foodVendorBalance.toString()).to.equal(tokens('999999e24'));
  });


  it('Food Purchased Event should emitted the correct data', async () => {
    // Check logs to ensure event was emitted with correct data
    expectEvent(purchaseFoodReceipt, 'foodPurchased',
     { id: '1', 
      name: "Rice", 
      price: '20', 
      owner: owner, 
      buyer: buyer,
      purchased: true
    });
  });


  it("purchasing food should fails when called by an owner account", async function () {
    // Purchase tokens
    await foodVendor.buyTokens({ from: owner, value: tokens('1')});
    await expectRevert(await foodVendor.purchaseFood(1, { from: owner }), 
      "Not Allowed"
      ); 
  });


  it('Allow owner to remove food instantly', async function () {
    await foodVendor.removeFood(1, { from: owner });
    expect(true).to.equal(true);
  });


  it("removing food should fails when called by a non-owner account", async function () {
    await expectRevert(await foodVendor.removeFood(1, { from: buyer }), 
      "Unauthorized Account"
      );
  });


  it('Allow buyer to check food status', async () => {
    receipt = await foodVendor.checkFoodStatus(1, { from: buyer });
    expect(receipt).to.equal(false);
  });

  
  it('Allow buyer to view food info', async () => {
    receipt = await foodVendor.getFoodInfo(1, { from: buyer });
    expect(receipt[1]).to.equal('Rice');
    expect(receipt[2]).to.equal('20');
  });


  it('Allows owner to instantly withdraw ether from foodVendor', async () => {
    const balanceEth = await balance.current(foodVendor.address, 'ether')

    await foodVendor.withdraw({ from: owner, value: balanceEth });

    // Check foodVendor balance after withdraw
    let foodVendorBalance, ownerBalance
    foodVendorBalance = balanceEth;
    expect(foodVendorBalance).to.equal('0');

    ownerBalance = await balance.current(owner, 'ether');
    expect(ownerBalance).to.equal('1');
  });


  //non-owner shouldn't withdraw
  it("Fails when called by a non-owner account", async function () {
    const balanceEth = await balance.current(foodVendor.address, 'ether')

    await expectRevert( await foodVendor.withdraw({ from: buyer, value: balanceEth }), 
      "Unauthorized Account"
      );
  });


});
