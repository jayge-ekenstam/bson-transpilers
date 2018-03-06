const antlr4 = require('antlr4');
const ECMAScriptListener = require('../lib/ECMAScriptListener.js');

/**
 * This Listener walks the AST generated by the transformers and produces code.
 */
function Listener() {
  ECMAScriptListener.ECMAScriptListener.call(this);
  return this;
}

Listener.prototype = Object.create(ECMAScriptListener.ECMAScriptListener.prototype);
Listener.prototype.constructor = Listener;

Listener.prototype.buildAST = function(tree, ruleNames) {
  ruleNames = ruleNames || null;

  let s = antlr4.tree.Trees.getNodeText(tree, ruleNames);

  s = antlr4.Utils.escapeWhitespace(s, false);

  const c = tree.getChildCount();

  if (c === 0) {
    return s;
  }

  const res = {type: s};

  if (c > 0) {
    s = this.buildAST(tree.getChild(0), ruleNames);
    res.arguments = [...(res.arguments || []), s];
  }

  for (let i = 1; i < c; i++) {
    s = this.buildAST(tree.getChild(i), ruleNames);
    res.arguments = [...(res.arguments || []), s];
  }

  return res;
};

module.exports = Listener;
