/* additional chai assert */

export function assertEvents(block, ...events) {
  for (var i = 0; i < block.logs.length; ++i) {
    assert.include(events, block.logs[i].event);
  }
}
