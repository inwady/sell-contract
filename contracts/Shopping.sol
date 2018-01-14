pragma solidity ^0.4.17;

contract Shopping {
  enum SellState { Open, WaitAccept, Closed }

  address public owner;

  /* product info */
  SellState sell_state;

  address public seller;
  string public product_name;

  uint public cost;

  uint public start_block;
  uint public ttl;

  bytes32 secret_hash;

  event BuyProduct(address addr);
  event CloseProduct();

  modifier restricted() {
    require(msg.sender == owner);
    _;
  }

  modifier onlySeller() {
    require(msg.sender == seller);
    _;
  }

  modifier inState(SellState _state) {
    require(sell_state == _state);
    _;
  }

  function Shopping(address _seller, string _product_name, uint _cost, uint _ttl) public {
    owner = msg.sender;

    sell_state = SellState.Open;

    seller = _seller;
    product_name = _product_name;
    cost = _cost;
    start_block = block.number;
    ttl = _ttl;
  }

  /**
    use sha256sum or HTTPS online tool
  */
  function buyProduct(bytes32 sha256_hex_string) external payable inState(SellState.Open) {
    require(start_block + ttl > block.number);
    require(msg.value >= cost);
    if (msg.value > cost) {
      msg.sender.transfer(msg.value - cost);
    }

    secret_hash = sha256_hex_string;

    uint commission = (cost * 6) / 100;
    owner.transfer(commission);

    sell_state = SellState.WaitAccept;
    BuyProduct(msg.sender);
  }

  function acceptReceive(string secret) external onlySeller inState(SellState.WaitAccept) {
    require(sha256(secret) == secret_hash);

    sell_state = SellState.Closed;
    CloseProduct();

    selfdestruct(seller);
  }
}
