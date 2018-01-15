import ProductContract from './model/Product';
import { etowei, weitoe, getBigWeiBalance } from './util/util';

let BigNumber = require('bignumber.js');
let expectThrow = require('./util/expectThrow');

contract("Shopping", function(accounts) {
  const role = {
    store: accounts[0],
    seller: accounts[1],
    buyer: accounts[2],
    buyer2: accounts[3],

    getBigBalanceState: async function() {
      let result = {};
      for (let key in this)
        if (typeof this[key] === 'string')
          result[key] = await getBigWeiBalance(this[key]);

      return result;
    }
  };

  const secrets = {
    secret1: "secret",
    secret1Hash: "0x2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b",
    secret2: "secret2",
    secret2Hash: "0x35224d0d3465d74e855f8d69a136e79c744ea35a675d3393360a327cbf6359a2",
  }

  let tests;
  tests = [0.1, 5.5, 10];
  tests.forEach(function(ethereumPayment) {
    it("base smoketest for " + ethereumPayment + " ether", async function() {
      const payment = etowei(ethereumPayment);
      const bigPayment = new BigNumber(etowei(ethereumPayment));

      let contract = new ProductContract(role.store);
      await contract.initContract(role.seller, "Product 1", payment, 100);

      let state, beforeState = await role.getBigBalanceState();
      assert.isOk((await contract.getBigBalance()).equals(0), "bad contract, amount is not null");

      /* buy product */
      let gasForBuyer = await contract.buy(role.buyer, payment, secrets.secret1Hash);
      assert.isOk((await contract.getBigBalance()).equals(bigPayment), "contract has bad amount");

      state = await role.getBigBalanceState();

      /* accept product */
      let gasForSeller = await contract.accept(role.seller, secrets.secret1);

      state = await role.getBigBalanceState();

      assert.isOk(beforeState.buyer.minus(gasForBuyer).minus(payment).equals(state.buyer), "bad amount of buyer");

      let bigCommision = bigPayment.mul(6).div(100);

      assert.isOk(beforeState.store.plus(bigCommision).equals(state.store), "bad amount of store");
      assert.isOk(beforeState.seller.minus(gasForSeller).plus(payment).minus(bigCommision).equals(state.seller), "bad amount of seller");
    });
  });

  tests = [true, false];
  tests.forEach(function(isExpire) {
    it("selling " + ((isExpire) ? "is" : "is not") + " expired", async function() {
      let needPassBlocks = 10;

      let contract = new ProductContract(role.store);
      await contract.initContract(role.seller, "Product 1", etowei(1), needPassBlocks);

      /* generate easy blocks */
      let passBlocks = needPassBlocks - ((!isExpire) ? 1 : 0);
      for (let i = 0; i < passBlocks; ++i)
        web3.eth.sendTransaction({from: role.buyer2, to: role.buyer});

      let promise = contract.buy(role.buyer, etowei(5), secrets.secret1Hash);
      if (!isExpire) {
        await promise;
      } else {
        await expectThrow(promise);
      }
    });
  });

  it("pay not enough", async function() {
    let contract = new ProductContract(role.store);
    await contract.initContract(role.seller, "Product 1", etowei(2), 100);

    await expectThrow(contract.buy(role.buyer, etowei(1), secrets.secret1Hash));
  });

  it("get rest ethereum if greater", async function() {
    /* pass = cost + rest */
    let cost = etowei(1), pass = etowei(4);

    let contract = new ProductContract(role.store);
    await contract.initContract(role.seller, "Product 1", cost, 100);

    let state, beforeState = await role.getBigBalanceState();

    let gasUsed = await contract.buy(role.buyer, pass, secrets.secret1Hash);
    state = await role.getBigBalanceState();

    assert.isOk((await contract.getBigBalance()).equals(cost), "bad amount in contract");
    assert.isOk(beforeState.buyer.minus(state.buyer).minus(gasUsed).equals(cost), "bad amount of rest");
  });

  it("pass wrong signature", async function() {
    let contract = new ProductContract(role.store);
    await contract.initContract(role.seller, "Product 1", etowei(1), 100);

    await contract.buy(role.buyer, etowei(1), secrets.secret1Hash);

    await expectThrow(contract.accept(role.seller, secrets.secret2));
  });
})
