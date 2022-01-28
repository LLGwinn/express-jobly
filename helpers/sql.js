const { BadRequestError } = require("../expressError");


/** Returns values to insert into sql query.
 *  
 *  Maps keys from 'dataToUpdate' into array of strings containing column
 *  names and parameterized values to use for sql 'SET' query (setCols).
 *  (converts js vars to matching db column names if necessary: firstName => first_name)
 *
 *  Creates array of actual values to insert in sql 'SET' query (values).
 *  
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
