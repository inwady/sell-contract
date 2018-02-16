'use strict';

import Contract from './Contract';
import { assertEvents } from '../util/assert';

let Shopping = artifacts.require("Shopping");

class ProductContract extends Contract {
  constructor(fromAccount) {
    super(fromAccount);
    this.sellerAccount = null;
    this.cost = -1;
  }

  async initContract(sellerAccount, name, cost, blockTime) {
    this.contract = await Shopping.new(sellerAccount, name, cost, blockTime, {from: this.fromAccount});
    this.cost = cost;
  }

  async buy(buyerAccount, payment, hash) {
    assert.isNotNull(this.contract, "bad contract");

    let block = await this.contract.buyProduct(hash, {
      from: buyerAccount,
      to: this.contract.address,
      value: payment,
    });

    let events = ["BuyProduct"];
    if (payment > this.cost)
      events.push("ReturnAmount");

    assertEvents(block, ...events);
    return this._getGasUsed(block);
  }

  async accept(sellerAccount, secret) {
    assert.isNotNull(this.contract, "bad contract");
    let block = await this.contract.acceptReceive(secret, {
      from: sellerAccount,
    });

    assertEvents(block, "CloseSelling");
    return this._getGasUsed(block);
  }
}

export default ProductContract;
