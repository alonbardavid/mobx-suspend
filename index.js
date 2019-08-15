"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./mobx-suspend.cjs.production.js");
} else {
  module.exports = require("./mobx-suspend.cjs.development.js");
}
