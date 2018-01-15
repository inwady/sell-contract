pragma solidity ^0.4.17;

contract Shopping {
  enum SellState { Open, WaitAccept, Closed }

  address public owner;         // address for commision

  /* product info */
  SellState sell_state;         // it is state of contract

  address public seller;        // address seller
  string public product_name;   // product name
  uint public cost;             // product cost

  uint public start_block;      // start block (~ now)
  uint public ttl;              // ttl - blocks of expire

  bytes32 secret_hash;          // secret signature, in state WaitAccept

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

  /**
    init all variables
    _seller ~ address of seller
    _product_name ~ product name with data, link
    _cost ~ amount of product (wei)
    _ttl ~ expire time (number of blocks)
  */
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
    function in order to buy product
    sha256_hash ~ sha256sum or HTTPS online tool
    example hex of "secret" ~ 0x2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b
  */
  function buyProduct(bytes32 sha256_hash) external payable inState(SellState.Open) {
    require(start_block + ttl >= block.number);
    require(msg.value >= cost);
    if (msg.value > cost) {
      ReturnAmount(msg.sender, msg.value - cost);
      msg.sender.transfer(msg.value - cost);
    }

    secret_hash = sha256_hash;

    sell_state = SellState.WaitAccept;
    BuyProduct(msg.sender);
  }

  /**
    need to get money
    secret ~ secret string
  */
  function acceptReceive(string secret) external onlySeller inState(SellState.WaitAccept) {
    require(sha256(secret) == secret_hash);

    sell_state = SellState.Closed;
    CloseSelling();

    uint commission = (cost * 6) / 100; /* commission is 6% */
    owner.transfer(commission); /* send amount to commission */
    selfdestruct(seller); /* send amount to seller */
  }

  event BuyProduct(address whobuyme);               // product was payed
  event ReturnAmount(address whobuyme, uint count); // if return
  event CloseSelling();                             // close selling
}
