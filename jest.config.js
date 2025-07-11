module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js', 'svelte'],
  transform: {
    '^.+\\.svelte$': ['svelte-jester', { compilerOptions: { generate: 'ssr' } }],
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@sudoku/(.*)$': '<rootDir>/src/node_modules/@sudoku/$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,svelte}',
    '!src/**/*.test.js',
    '!src/main.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(svelte|@testing-library)/)'
  ]
}; 