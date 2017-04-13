# Neopreen [![Build Status](https://travis-ci.org/i-am-tom/neopreen.svg?branch=master)](https://travis-ci.org/i-am-tom/neopreen)

A **tiny** library of formatters and combinators to simplify working  with `neo4j-driver`'s returned structure.

```bash
npm install neopreen --save
```

## Example

```javascript
const np = require('neopreen')

const preen = np.row({
  person: np.node({
    name: np.string
  }),

  food: np.node({
    name: np.string,
    litres: np.real
  }),

  relation: np.relation({
    amount: np.string
  })
})

const data = sess.run(
  ` CREATE (person:Person { name: "Tom" })
    CREATE (food:Item { name: 'Sherbet lemonade'
                      , litres: 0.5 })
    CREATE (person)
      -[relation:LIKES { amount: "A LOT" }]
      ->(food)
    RETURN person, relation, food `)
.then(preen)
```

The resulting contents of `data`'s promise will look like this:

```javascript
{
  person: {
    name: 'Tom',
    $id: 14001, // Whatever Neo4j assigns.
    $labels: [ 'Person' ]
  },

  food: {
    name: 'Sherbet lemonade',
    litres: 0.5,
    $id: 14002, // Whatever Neo4j assigns.
    $labels: [ 'Item' ]
  },

  relation: {
    amount: 'A LOT',
    $from: 14001,
    $id: 59009, // Whatever Neo4j assigns.
    $to: 14002,
    $type: 'LIKES'
  }
}
```

## API

As we would all hope, this API treats data as **immutable**. It **won't** update the structure you pass in; it will, instead, return a _copy_ with the changes applied.

### Formatters

#### `int`

Take a Neo4j integer, and call `x.toNumber()` on it, returning the `int` value.

#### `float`

Cast the given value to a `float`. This is done with the unary `x => +x`.

#### `string`

Cast the given value to a `string` using `x => '' + x`.

#### `bool`

Cast the given value to a `bool` using `x => !!x`.

#### `array(formatter)`

Format an array, applying the given `formatter` to each element within. For example:

```javascript
// Returns [1.0, 2.0, 3.0]
np.array(np.float)([1, '2', 3.0])
```

#### `object(schema)`

Format an object according to the given schema. Missing keys will be denoted by `null`:

```javascript
const validator = np.object({
  name: np.string,
  cats: np.int,
  hat: np.string
})

// { name: 'Jeff', cats: 12, hat: null }
validator({
  name: 'Jeff',
  cats: require('neo4j-driver').v1.int(12)
})
```

### Structure Handlers

#### `node(formatter)`

Format a `Node` type from the `neo4j-driver` library. The result is an object with the node's properties formatted according to the provided formatter, along with two extra properties:

- `$id`, the Neo4j ID of the node (converted to `int`).
- `$labels`, the labels applied to the node (as a `string` array).

#### `relation(formatter)`

Format a `Relationship` type from the `neo4j-driver` library. The result is an object with the relationship's properties formatted according to the provided formatter, along with two extra properties:

- `$from`, the Neo4j ID of the _source_ node (converted to `int`).
- `$to`, the Neo4j ID of the _target_ node (converted to `int`).
- `$id`, the Neo4j ID of the _relationship_.
- `$type`, the label for the relationship.

#### `record(formatter)`

Format a `Record` type from the `neo4j-driver` library. This is useful for users consuming the output via `neo4j-driver`'s **observable** interface. Each record can be formatted according to the formatter as it arrives.

#### `one(formatter)`

If you're expecting one result (that is, a single returned row containing a single value), this function returns that structure. It is advised that this result is formatted with one of the original formatters (unless it's a `Node` or `Relationship`, in which case you can nest the `node` and `relation` formatters).

#### `many(formatter)`

For a result set of any number of rows with more than one field being returned per row. In the repository's main example, `row` is used as only one row is being returned. If that is not the case, chances are that `many` is what you want.

#### `row(formatter)`

Format the results of a query that returns multiple _fields_, but only one _row_ (such as the example at the top of this README).

#### `column(formatter)`

Format the results of a query that returns multiple _rows_, but only one _field_.

## Contributing

PRs are always welcome! There's a [code of conduct](https://wealljs.org/code-of-conduct), naturally, so be mindful!
