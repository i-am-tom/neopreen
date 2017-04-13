const { equal } = require('assert')
const { driver, auth: { basic }, int } = require('neo4j-driver').v1
const assert = require('assert')
const np = require('.')

const conn = driver(
  'bolt://localhost',
  basic('neo4j', 'password'))

const sess = conn.session()

Promise.all([
    Promise.all([
      // NODE
      sess.run(` CREATE (n:NP_NODE_TEST { x: 1 })
                 RETURN n`)
          .then(np.one(np.node({ x: np.int })))
          .then(n => {
            assert.deepEqual(n.x, 1, 'Node value')
            assert.ok(n.$id === n.$id | 0, 'Node meta')

            assert.deepEqual(
              n.$labels,
              ['NP_NODE_TEST'],
              'Node labels')
          }),

      // NODE
      sess.run(` CREATE (n:NP_NODE_TEST { x: 2 })
                 CREATE (n)-[r:NP_REL_TEST { y: 321 }]->(n)
                 RETURN r`)
          .then(np.one(np.relationship({ y: np.int })))
          .then(n => {
            assert.equal(n.$to, n.$from, 'Relation ends')
            assert.equal(n.$type, 'NP_REL_TEST')
            assert.ok(n.$id === n.$id | 0, 'Node meta')
          })
      ])
      .then(_ => sess.run(` MATCH (n:NP_NODE_TEST)
                            MATCH ()-[r:NP_REL_TEST]-()
                            DELETE n DELETE r `)),

    // ONE
    sess.run('RETURN 123 AS x')
        .then(np.one(np.int))
        .then(i => assert.equal(
            i, 123, 'One')),

    // MANY
    sess.run(` UNWIND [1, 2, 3] AS num
               RETURN num + 1 AS x
                    , num - 1 AS y `)
        .then(np.many({ x: np.int, y: np.int }))
        .then(i => assert.deepEqual(
          i, [ { x: 2, y: 0 }
             , { x: 3, y: 1 }
             , { x: 4, y: 2 } ],
          'Many')),

    // MANY
    sess.run('RETURN 123 AS x')
        .then(np.one(np.int))
        .then(i => assert.equal(
            i, 123, 'One')),

    // COLUMN
    sess.run(`UNWIND [5, 2, 4, 1]
                  AS number
              RETURN number`)
        .then(np.column(np.int))
        .then(indices =>
          assert.deepStrictEqual(
            indices, [5, 2, 4, 1],
            'np.column')),

    // PRIMITIVES
    sess.run(`RETURN 5 AS x`)
        .then(({ records: [i] }) =>
          assert.strictEqual(
            np.int(i.toObject().x),
            5,
            'Int')),

    // REAL
    sess.run(`RETURN 0.0 AS x`)
        .then(({ records: [i] }) =>
          assert.deepEqual(
            i.toObject().x,
            0.0,
            'Real')),

    // STRING
    sess.run(`RETURN "hello" AS x`)
        .then(({ records: [i] }) =>
          assert.deepEqual(
            i.toObject().x,
            'hello',
            'String')),

    // BOOL
    sess.run(`RETURN true AS x`)
        .then(({ records: [i] }) =>
          assert.ok(
            i.toObject().x,
            'Bool'))
  ])
  .then(_ => sess.close())
  .then(_ => conn.close())
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
