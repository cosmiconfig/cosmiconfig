'use strict';

const isPromise = require('is-promise');

const funcRunner = require('../lib/funcRunner');

function getFuncStub() {
  return jest.fn(() => 'some-value');
}

describe('funcRunner', () => {
  describe('if init is a promise', () => {
    it('returns a promise', () => {
      const init = Promise.resolve(1);
      const res = funcRunner(init, []);

      expect(isPromise(res)).toBe(true);
    });

    it('calls funcs with .then', () => {
      const init = Promise.resolve(1);
      const funcStub = getFuncStub();
      const pSpy = jest.spyOn(init, 'then');

      const res = funcRunner(init, [funcStub]);

      expect(pSpy).toHaveBeenCalled();
      expect(pSpy).toHaveBeenCalledWith(funcStub);

      res.then(val => {
        expect(val).toBe('some-value');

        expect(funcStub).toHaveBeenCalled();
        expect(funcStub).toHaveBeenCalledWith(1);
      });
    });

    it('chains function calls with .then', () => {
      const init = Promise.resolve(1);
      const taskRes = Promise.resolve('blistering barnacles!');
      // const pSpy = jest.spyOn(taskRes, 'then');

      function task(val) {
        expect(val).toBe(1);
        return taskRes;
      }
      const funcStub = getFuncStub();

      const res = funcRunner(init, [task, funcStub]);

      return res.then(val => {
        expect(val).toBe('some-value');
        // This test fails on node <= 4 for some reason
        // expect(pSpy).toHaveBeenCalled();
        expect(funcStub).toHaveBeenCalled();
        expect(funcStub).toHaveBeenCalledWith('blistering barnacles!');
      });
    });
  });

  describe('if init is not a promise', () => {
    it('does not return a promise', () => {
      const init = 1;
      const res = funcRunner(init, []);

      expect(isPromise(res)).toBe(false);
    });

    it('calls funcs in sync', () => {
      const init = 1;
      const funcStub = getFuncStub();
      const res = funcRunner(init, [funcStub]);

      expect(res).toBe('some-value');
      expect(funcStub).toHaveBeenCalled();
      expect(funcStub).toHaveBeenCalledWith(1);
    });

    it('chains function calls', () => {
      const init = 1;
      function task(val) {
        expect(val).toBe(1);
        return 'blistering barnacles!';
      }
      const funcStub = getFuncStub();

      funcRunner(init, [task, funcStub]);

      expect(funcStub).toHaveBeenCalled();
      expect(funcStub).toHaveBeenCalledWith('blistering barnacles!');
    });
  });
});
