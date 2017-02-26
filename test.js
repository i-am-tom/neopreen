const { equal } = require('assert')
const { driver, auth: { basic }, int } = require('neo4j-driver').v1

const conn = driver('bolt://localhost', 'neo4j', 'neo4j')
const session = conn.session()

session.run(`RETURN 1`).then(x => {
  console.log('yay done')

  process.exit(0)
}).catch(x => console.error(x))
