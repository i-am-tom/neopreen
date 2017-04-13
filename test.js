const { equal } = require('assert')
const { driver, auth: { basic }, int } = require('neo4j-driver').v1
const assert = require('assert')
const np = require('.')

const conn = driver(
  'bolt://localhost',
  basic('neo4j', 'neo4j'))

const sess = conn.session()

sess.run(` RETURN 1`)
    .then(console.log.bind(console))
    .catch(x => {console.error(x); process.exit(1)})
    .then(_ => sess.close())
    .then(_ => conn.close())

// INT

assert.strictEqual(
  np.int(int(5))
  , 5
  , 'Neo4jInt -> Int')

// REAL

assert.strictEqual(
  np.real(false)
  , 0.0
  , 'Bool -> Real')

assert.strictEqual(
  np.real('1.5'),
  1.5,
  'String -> Real')

assert.strictEqual(
  np.real(1.0),
  1.0,
  'Real -> Real')

// STRING

assert.strictEqual(
  np.string(1),
  '1',
  'Number -> String')

assert.strictEqual(
  np.string(true),
  'true',
  'Bool -> String')

assert.strictEqual(
  np.string({}),
  '[object Object]',
  'Object -> String')

// BOOL

assert.strictEqual(
  np.bool('false'),
  true,
  'String -> Bool')

assert.strictEqual(
  np.bool(0),
  false,
  'Int -> Bool')

assert.strictEqual(
  np.bool(1.1),
  true,
  'Float -> Bool')

assert.strictEqual(
  np.bool(false),
  false,
  'Bool -> Bool')
