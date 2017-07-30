'use strict';

const test = require('tape');
const sinon = require('sinon');
const isPromise = require('is-promise');

const funcRunner = require('../lib/funcRunner');

function getFuncStub() {
  return sinon.stub().returns('some-value');
}

test('if isPromise(init), returns a promise', assert => {
  const init = Promise.resolve(1);
  const res = funcRunner(init, []);

  assert.true(isPromise(res), 'funcRunner returns a promise');
  assert.end();
});

test('if !isPromise(init), does not return a promise', assert => {
  const init = 1;
  const res = funcRunner(init, []);

  assert.true(!isPromise(res), 'funcRunner does not return a promise');
  assert.end();
});

test('if isPromise(init), calls funcs with .then', assert => {
  const init = Promise.resolve(1);
  const funcStub = getFuncStub();
  const pSpy = sinon.spy(init, 'then');

  const res = funcRunner(init, [funcStub]);

  assert.true(pSpy.calledOnce, 'init.then was called once');
  assert.true(
    pSpy.firstCall.calledWith(funcStub),
    'init.then was called with given func'
  );

  function teardown(assert, err) {
    pSpy.restore();
    assert.end(err);
  }

  res
    .then(val => {
      assert.equal(val, 'some-value', 'Resolved result matches expected');

      assert.true(funcStub.calledOnce, 'given func was called once');
      assert.true(
        funcStub.calledWith(1),
        "given func was called with init's resolved value"
      );

      teardown(assert);
    })
    .catch(err => {
      teardown(assert, err);
    });
});

test('if !isPromise(init), calls funcs in sync', assert => {
  const init = 1;
  const funcStub = getFuncStub();
  const res = funcRunner(init, [funcStub]);

  assert.equal(res, 'some-value', 'Returned result matches expected');
  assert.true(funcStub.calledOnce, 'given func was called once');
  assert.true(
    funcStub.calledWith(1),
    "given func was called with init's value"
  );

  assert.end();
});

test('if isPromise(init), chains function calls with .then', assert => {
  const init = Promise.resolve(1);
  const taskRes = Promise.resolve('blistering barnacles!');
  // var pSpy = sinon.spy(taskRes, 'then');
  function task(val) {
    assert.equal(val, 1, "task func called with init's resolved value");
    return taskRes;
  }
  const funcStub = getFuncStub();

  const res = funcRunner(init, [task, funcStub]);

  res.then(() => {
    // This test fails on node <= 4 for some reason
    // assert.true(pSpy.calledOnce, 'taskRes.then was called once');
    assert.true(funcStub.calledOnce, 'chained func was called once');
    assert.true(
      funcStub.calledWith('blistering barnacles!'),
      "chained func was called with taskRes's resolved value"
    );
    assert.end();
  });
});

test('if !isPromise(init), chains function calls', assert => {
  const init = 1;
  function task(val) {
    assert.equal(val, 1, "task func called with init's value");
    return 'blistering barnacles!';
  }
  const funcStub = getFuncStub();

  funcRunner(init, [task, funcStub]);

  assert.true(funcStub.calledOnce, 'chained func was called once');
  assert.true(
    funcStub.calledWith('blistering barnacles!'),
    "chained func was called with task func's returned value"
  );
  assert.end();
});
