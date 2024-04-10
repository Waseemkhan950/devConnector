const jwt = require("jsonwebtoken");
const config = require("../config/default.json");
/*when user registers or login, he is given a jwt token.
 After that, when that user makes any request, he is varified by this middleware. 
 If he has valid token, he is allowed to access the specific route. 
 if he does not have a valid token, he is denied the access of that specific route.*/

module.exports = function (req, res, next) {
      //get token from header, as user sends token in header in each of his request
      const token = req.header("x-auth-token");
      //check if token not present
      if (!token) {
            return res
                  .status(401)
                  .json({ msg: "No token, authorization denied" });
      }
      // varify token
      try {
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = decoded.user;
            next(); // if the user is verified next() allow the user to access the route
      } catch (err) {
            res.status(401).json({ msg: "Token is not valid" });
      }
};
