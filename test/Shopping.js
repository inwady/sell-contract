var Shopping = artifacts.require("Shopping");

function etowei(amount) {
  return web3.toWei(amount, 'ether');
}

function weitoe(amount) {
  return web3.fromWei(amount, 'ether');
}

function getWeiBalance(address) {
  return new Promise(function(resolve , error) {
    return web3.eth.getBalance(address, function(err, hashValue) {
      if(err) {
        return error(err);
      }

      return resolve(hashValue.toNumber());
    }) ;
  });
}

function assertEvents(block, ...events) {
  for (var i = 0; i < block.logs.length; ++i) {
    assert.include(events, block.logs[i].event);
  }
}

contract("Shopping", function(accounts) {
  const role = {
    store: accounts[0],
    seller: accounts[1],
    buyer: accounts[2],
  };

  it("smoke test", async function() {
    const product = await Shopping.new(role.seller, "Product 1", etowei(10), 100, {from: role.store});
    let block;

    let before = await getWeiBalance(role.buyer);

    block = await product.buyProduct("0x2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b", {
      from: role.buyer,
      to: product.address,
      value: etowei(10),
    });

    assertEvents(block, "BuyProduct");

    let gasUsed = block.receipt.gasUsed;
    let afterBuyWithOutGas = await getWeiBalance(role.buyer);

    // console.log("final value " + weitoe(before - afterBuyWithOutGas));

    block = await product.acceptReceive("secret", {
      from: role.seller,
    });

    assertEvents(block, "CloseProduct");
  })
})
