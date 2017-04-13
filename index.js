// Given an object, apply as much of a structured transformer as is
// possible (ignoring any elements that are undefined).
const format = (structure, data) =>
  Object.keys(structure).reduce(
    (acc, key) => Object.assign({}, acc,
      { [key]: data[key] ? structure[key](data[key])
                         : null }),
    {})

// Given a node, format its contents according to a given structure,
// returning `null` for any missing elements.
exports.node = struct => ({ identity, labels, properties }) =>
  Object.assign({}, format(struct, properties), {
    $id: identity.toNumber(), $labels: labels })

// Given a relationship, format it to the particular style.
exports.relationship = structure => result =>
  Object.assign({}, format(structure, result.properties)
                  , { $from: result.start.toNumber()
                    , $id:   result.identity.toNumber()
                    , $to:   result.end.toNumber()
                    , $type: result.type })

// Return a single record from a result.
exports.one = structure => result =>
  exports.column(structure)(result)[0]

// Return many records from a result.
exports.many = structure => ({ records }) =>
  records.map(record => format(
    structure, record.toObject()))

// Return a node from each record within a result.
exports.column = structure => ({ records }) =>
  records.map(x => x.toObject()).map(record => {
    for (const key in record)
      return structure(record[key])
  })

// Convert a Neo4j integer.
exports.int = x => x.toNumber()

// "Convert" a Neo4j real.
exports.real = x => +x

// "Convert" a Neo4j string.
exports.string = x => '' + x

// "Convert" a Neo4j bool.
exports.bool = x => !!x
