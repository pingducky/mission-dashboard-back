module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1, 
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
