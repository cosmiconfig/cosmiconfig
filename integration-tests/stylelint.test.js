'use strict';

const path = require('path');
const stylelint = require('stylelint');

test('stylelint integration', () => {
  return stylelint
    .lint({
      code: 'a { color: pink; }',
      configFile: path.join(__dirname, '.stylelintrc'),
    })
    .then(res => {
      expect(res).toMatchSnapshot('stylelint result');
    });
});
