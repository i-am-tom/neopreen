const { equal } = require('assert')
const { driver, auth: { basic }, int } = require('neo4j-driver').v1
const assert = require('assert')
const np = require('.')

const conn = driver(
  'bolt://localhost',
  basic('neo4j', 'password'))

const sess = conn.session()

// API EXAMPLES
assert.deepEqual(
  np.array(np.float)([1, '2', 3.0]),
  [1.0, 2.0, 3.0],
  'array API example')

assert.deepEqual(
  np.object({
    name: np.string,
    cats: np.int,
    hat: np.string
  })({
    name: 'Jeff',
    cats: require('neo4j-driver').v1.int(12)
  }),
  { name: 'Jeff', cats: 12, hat: null },
  'object API example')

Promise.all([
  // DOCUMENTATION EXAMPLE
  sess.run(` CREATE (person:Person { name: "Tom" })
             CREATE (food:Item { name: 'Sherbet lemonade'
                               , litres: 0.5 })
             CREATE (person)
               -[relation:LIKES { amount: "A LOT" }]
               ->(food)
             RETURN person, relation, food `)
      .then(np.row({
        person:   np.node({ name: np.string }),
        food:     np.node({ name: np.string, litres: np.float }),
        relation: np.relation({ amount: np.string })
      }))
      .then(result => {
        assert.equal(result.person.name, 'Tom')
        assert.deepEqual(result.person.$labels, ['Person'])

        assert.equal(result.food.name, 'Sherbet lemonade')
        assert.equal(result.food.litres, 0.5)
        assert.deepEqual(result.food.$labels, ['Item'])

        assert.equal(result.relation.amount, 'A LOT')
        assert.equal(result.relation.$from, result.person.$id)
        assert.equal(result.relation.$to, result.food.$id)
        assert.equal(result.relation.$type, 'LIKES')
      }, 'Example works!')
      .then(_ => sess.run(` MATCH (p:Person)
                            MATCH (f:Item)
                            MATCH (p)-[r:LIKES]-(f)
                            DELETE p, f, r`)),

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

    // RELATION
    sess.run(` CREATE (n:NP_NODE_TEST { x: 2 })
               CREATE (n)-[r:NP_REL_TEST { y: 321 }]->(n)
               RETURN r`)
        .then(np.one(np.relation({ y: np.int })))
        .then(n => {
          assert.equal(n.$to, n.$from, 'Relation ends')
          assert.equal(n.$type, 'NP_REL_TEST')
          assert.ok(n.$id === n.$id | 0, 'Relation meta')
        })
  ])
  .then(_ => sess.run(` MATCH (n:NP_NODE_TEST)
                        MATCH ()-[r:NP_REL_TEST]-()
                        DELETE n DELETE r `)),

  // RECORD
  sess.run('RETURN 534231 AS x')
      .then(x => x.records[0])
      .then(np.record({ x: np.int }))
      .then(i => assert.equal(
          i.x, 534231, 'Record')),

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

  // ROW
  sess.run(` RETURN 123 AS x
                  , 321 AS y `)
      .then(np.row({ x: np.int, y: np.int }))
      .then(i => assert.deepEqual(
        i, { x: 123, y: 321 }, 'Row')),

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

  // FLOAT
  sess.run(`RETURN 0.0 AS x`)
      .then(({ records: [i] }) =>
        assert.deepEqual(
          np.float(i.toObject().x),
          0.0,
          'Float')),

  // STRING
  sess.run(`RETURN "hello" AS x`)
      .then(({ records: [i] }) =>
        assert.deepEqual(
          np.string(i.toObject().x),
          'hello',
          'String')),

  // BOOL
  sess.run(`RETURN true AS x`)
      .then(np.one(np.bool))
      .then(b => assert.ok(b, 'Bool')),

  // ARRAY
  sess.run(`RETURN [1, 2, 3] AS x`)
      .then(np.one(np.array(np.int)))
      .then(xs => assert.deepEqual(
        xs, [1, 2, 3], 'Array')),

  // OBJECT
  sess.run(`RETURN { x: 3 } AS x`)
      .then(np.one(np.object({ x: np.int })))
      .then(xs => assert.deepEqual(
        xs, { x: 3 }, 'Object')),

  // SHOULD ACCEPT 0 AS A VALUE (AND NOT FALSE/NULL/UNDEFINED)
  //    Only applies to relations, nodes, records and objects
  sess.run(` CREATE (person:Person { id: 0 })
             CREATE (food:Item { counter: 0 })
             CREATE (person)
               -[relation:LIKES { amount: 0 }]
               ->(food)
             RETURN person, relation, { x: 0 } as object`)
    .then(res => {
      let cfg = {
        person: np.node({id: np.int}),
        relation: np.relation({amount: np.int}),
        object: np.object({x: np.int}),
      }
      return [
        np.row(cfg)(res),
        np.record(cfg)(res.records[0])
      ]
    })
    .then(([row, record]) => {
      assert.strictEqual(row.person.id, 0, '0 on row Node')
      assert.strictEqual(row.relation.amount, 0, '0 on row Relation')
      assert.strictEqual(row.object.x, 0, '0 on row Object')

      assert.strictEqual(record.person.id, 0, '0 on record Node')
      assert.strictEqual(record.relation.amount, 0, '0 on record Relation')
      assert.strictEqual(record.object.x, 0, '0 on record Object')
    })
])
.then(_ => sess.run(
  `MATCH (n:Person)
   WHERE n:Person OR n:food
   OPTIONAL MATCH (n)-[r]-() 
   DELETE n,r`))
.then(_ => sess.close())
.then(_ => conn.close())
.catch(e => {
  console.error(e)
  process.exit(1)
})
