const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate } = require("../../helpers/sql");
const { SECRET_KEY } = require("../../config");


async function beforeEach() {
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM companies");
    await User.register({
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        password: "password1",
        isAdmin: false,
      });
}

describe("sqlForPartialUpdate", function () {
  test("returns correct values", function () {
    const updateData = {firstName: "Petunia", email:"petunia@petunia.com"};
    const jsToSql = {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      }

    const { setCols, values } = sqlForPartialUpdate(updateData, jsToSql);

    expect(setCols).toEqual('"first_name"=$1, "email"=$2');
    expect(values).toEqual(["Petunia", "petunia@petunia.com"]);
  });
});

  
async function afterAll() {
    await db.end();
}