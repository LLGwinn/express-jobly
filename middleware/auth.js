"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const User = require("../models/user");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not logged in as admin, or if not logged in as correct user
 * on a user-specific route, raises Unauthorized.
 */

async function ensureLoggedIn(req, res, next) {
  try {
    // not logged in
    if (!res.locals.user) throw new UnauthorizedError();

    // isAdmin=false and it's not a user-specific route
    if (!res.locals.user.isAdmin && !res.req.params) throw new UnauthorizedError();

    // User-specific route, but not correct user
    if (res.req.params.username) {
      await User.get(res.req.params.username); //returns 404 if user not found

      if (res.req.params.username !== res.locals.user.username) throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
};
