pragma solidity ^0.4.17;

contract Shopping {
  /* states contract */
  enum SellState {
    Open,
    WaitAccept,
    Closed
  }

  /* product info */
  struct Product  {
    address seller;        // address seller
    string productName;    // product name
    uint cost;             // product cost

    uint start;       // start block (~ now)
    uint ttl;              // ttl - blocks of expire
  }

  uint constant COMMISSION_PERCENT = 6; /* % */

  SellState sellState;         // it is state of contract
  address public owner;        // address for commision

  Product product;
  bytes32 secretHash;          // secret signature, in state WaitAccept

  modifier restricted() {
    require(msg.sender == owner);
    _;
  }

  modifier onlySeller() {
    require(msg.sender == product.seller);
    _;
  }

  modifier inState(SellState _state) {
    require(sellState == _state);
    _;
  }

  /**
    init product
    seller       ~ address of seller
    productName  ~ product name with data, maybe link
    cost         ~ amount of product (wei)
    ttl          ~ expire time (seconds)
  */
  function Shopping(address seller, string productName, uint cost, uint ttl) public {
    require(cost != 0 && ttl != 0);

    owner = msg.sender;

    sellState = SellState.Open;

    product = Product({
      seller: seller,
      productName: productName,
      cost: cost,
      start: now,
      ttl: ttl
    });
  }

  /**
    function in order to buy product
    sha256Hash ~ signature, use sha256sum tool or HTTPS online tool
    example hex of "secret" ~ 0x2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b
  */
  function buyProduct(bytes32 sha256Hash) external payable inState(SellState.Open) {
    require(msg.sender != owner && msg.sender != product.seller);
    require(msg.value >= product.cost);
    require(product.start + product.ttl >= now);

    sellState = SellState.WaitAccept;
    BuyProduct(msg.sender);

    /* return rest amount */
    if (msg.value > product.cost) {
      ReturnAmount(msg.sender, msg.value - product.cost);
      msg.sender.transfer(msg.value - product.cost);
    }

    /* save signature */
    secretHash = sha256Hash;
  }

  /**
    in order to get money by seller
    secret ~ secret string
  */
  function acceptReceive(string secret) external onlySeller inState(SellState.WaitAccept) {
    require(sha256(secret) == secretHash);

    sellState = SellState.Closed;
    CloseSelling();

    uint commission = (product.cost * COMMISSION_PERCENT) / 100;  // commission
    owner.transfer(commission);                                   // send amount to commission
    selfdestruct(product.seller);                                 // send amount to seller
  }

  event BuyProduct(address whobuyme);               // product was payed
  event ReturnAmount(address whobuyme, uint count); // if return
  event CloseSelling();                             // close selling
}
