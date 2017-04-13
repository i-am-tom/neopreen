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

// Given a relation, format it to the particular style.
exports.relation = structure => result =>
  Object.assign({}, format(structure, result.properties)
                  , { $from: result.start.toNumber()
                    , $id:   result.identity.toNumber()
                    , $to:   result.end.toNumber()
                    , $type: result.type })

// Format a record. Useful for the stream API.
exports.record = structure => record =>
  format(structure, record.toObject())

// Return a single record from a result.
exports.one = structure => result =>
  exports.column(structure)(result)[0]

// Return many records from a result.
exports.many = structure => ({ records }) =>
  records.map(exports.record(structure))

// Return a single dictionary from a result.
exports.row = structure => result =>
  exports.many(structure)(result)[0]

// Return a node from each record within a result.
exports.column = structure => ({ records }) =>
  records.map(x => x.toObject()).map(record => {
    for (const key in record)
      return structure(record[key])
  })

// Convert a Neo4j integer.
exports.int = x => x.toNumber()

// "Convert" a Neo4j float.
exports.float = x => +x

// "Convert" a Neo4j string.
exports.string = x => '' + x

// "Convert" a Neo4j bool.
exports.bool = x => !!x

// Apply a type to a Neo4j array.
exports.array = type => xs => xs.map(type)

// Apply a structure to a Neo4j object.
// We can just reuse `format`!
exports.object = structure => strMap =>
  format(structure, strMap)
