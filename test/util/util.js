/* base util functions (work with balance) */

let BigNumber = require('bignumber.js');

export function etowei(amount) {
  return web3.toWei(amount, 'ether');
}

export function weitoe(amount) {
  return web3.fromWei(amount, 'ether');
}

export function getBigWeiBalance(address) {
  return new Promise(function(resolve , error) {
    return web3.eth.getBalance(address, function(err, result) {
      if(err) {
        return error(err);
      }

      let bigNumber = BigNumber(result);
      return resolve(bigNumber);
    });
  });
}
