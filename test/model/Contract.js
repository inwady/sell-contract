import { getBigWeiBalance } from '../util/util';

class Contract {
  constructor(fromAccount) {
    this.contract = null;
    this.fromAccount = fromAccount;
  }

  initContract() { throw "need to implement this method"; }

  async getBigBalance() {
    assert.isNotNull(this.contract, "bad contract");

    return await getBigWeiBalance(this.contract.address);
  }

  _getGasUsed(block) {
    return block.receipt.gasUsed * web3.eth.getTransaction(block.tx).gasPrice;;
  }
}

export default Contract;
