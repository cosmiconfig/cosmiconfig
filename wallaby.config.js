'use strict';

module.exports = wallaby => {
  return {
    files: [
      'src/**/*.js',
      'test/**/*.snap',
      {
        pattern: 'test/**/*',
        instrument: false,
      },
      '!test/**/*.test.js',
    ],

    tests: ['test/**/*.test.js'],

    compilers: {
      '**/*.js': wallaby.compilers.babel(),
    },

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest',

    setup(setupConfig) {
      /**
       * https://github.com/wallabyjs/public/issues/1268#issuecomment-323237993
       */
      if (setupConfig.projectCacheDir !== process.cwd()) {
        process.chdir(setupConfig.projectCacheDir);
      }

      process.env.NODE_ENV = 'test';
      const jestConfig = require('./package.json').jest;
      jestConfig.collectCoverage = false;
      delete jestConfig.coverageThreshold;
      delete jestConfig.collectCoverageFrom;
      setupConfig.testFramework.configure(jestConfig);
    },
  };
};
