import { describe, expect, test } from 'vitest';
import { loadYaml } from '../src';

describe('loadYaml', () => {
  test('should throw error when not valid yaml', () => {
    expect(() =>
      loadYaml(
        'test.yaml',
        '{sdagasg&9776sd87gsda}dgasdgasdg:8799875935{]}][]',
      ),
    ).toThrow(`YAML Error in test.yaml:`);
  });
});
