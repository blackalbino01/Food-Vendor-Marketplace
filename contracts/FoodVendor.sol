// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
import "./Token.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";


contract FoodVendor is Ownable{   
  uint public foodCount = 0;
  uint public rate = 100;
  ERC20 public foodvendortoken;

  mapping(uint => Food) public foods;

  struct Food {
      uint id;
      string name;
      uint price;
      address payable owner;
      address buyer;
      bool purchased;
  }


  event TokensPurchased(
    address buyer,
    address foodvendortoken,
    uint amount,
    uint rate
  );
  
  event foodCreated(
      uint id,
      string name,
      uint price,
      address owner,
      bool purchased
  );
  
  event foodPurchased(
      uint id,
      string name,
      uint price,
      address payable owner,
      address buyer,
      bool purchased
  );
  
  constructor (address _foodvendortoken){
  foodvendortoken = ERC20(_foodvendortoken);
    
  }



  function buyTokens() public payable {
    // Calculate the number of tokens to buy
    uint tokenAmount = msg.value * rate;

    // Require that FoodVendor has enough tokens
    require(foodvendortoken.balanceOf(address(this)) >= tokenAmount);

    // Transfer tokens to the user
    foodvendortoken.transfer(msg.sender, tokenAmount);

    // Emit an event
    emit TokensPurchased(msg.sender, address(foodvendortoken), tokenAmount, rate);
  }

    
  function createFood(string memory _name, uint _price, uint _qty) public onlyOwner{
    //valid name
    require(bytes(_name).length > 0);
    
    //valid price
    require(_price > 0);
    
    //increment food foodCount
    require(_qty > 0);
    
    for(uint i=0; i < _qty; i++){
      foodCount ++;
      
      //create food
      foods[foodCount].id = foodCount;
      foods[foodCount].name = _name;
      foods[foodCount].price =  _price;
      foods[foodCount].owner = payable(msg.sender);
      foods[foodCount].purchased = false;
      
      emit foodCreated(foodCount, _name, _price, msg.sender, false);
    }
  }
  
  function purchaseFood(uint _id) public payable{
    //fetch the food
    Food memory _food = foods[ _id];
    
    //check id validity
    require(_food.id > 0 && _food.id <= foodCount);
    
    //require enough balance
    require(foodvendortoken.balanceOf(msg.sender) > _food.price, "Insufficient balance");
    
    //require food not purchased
    require(!_food.purchased);

     //transfer ownership to buyer
    _food.buyer = msg.sender;
    
    //require seller not equal buyer
    require(_food.owner != _food.buyer);
    
   
    
    //mark as purchased
    _food.purchased = true;
    
    //update food
    foods[ _id] = _food;
    
    //pay the seller by sending foodvendortoken
    
    require(foodvendortoken.transferFrom(msg.sender, _food.owner, _food.price), 'Purchase failed');
    
    emit foodPurchased(foodCount, _food.name, _food.price, _food.owner, msg.sender, true);         
  }
  
  function removeFood(uint _id) public onlyOwner returns(bool){
    //fetch the  food
    Food memory _food = foods[ _id];
    
    //require food not purchased
    require(!_food.purchased);
    
    delete foods[ _id];
    
    foodCount --;

    return true;
  } 
  
  function checkFoodStatus(uint _id) public view returns(bool){
    //fetch the foods
    Food memory _food = foods[ _id];
    
    return _food.purchased;
  }
  
  function getFoodInfo(uint _id) public view returns(uint, string memory, uint){
    Food memory _food = foods[ _id];
    
    return(_food.id, _food.name, _food.price);
  }

  function withdraw() public onlyOwner {
    uint256 ownerBalance = address(this).balance;
    require(ownerBalance > 0, "Owner has not balance to withdraw");

    (bool sent,) = msg.sender.call{value: address(this).balance}("");
    require(sent, "Failed to send user balance back to the owner");
  }
  
}
