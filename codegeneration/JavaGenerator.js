const CodeGenerator = require('./CodeGenerator.js');

/**
 * This Visitor walks the tree generated by parsers and produces Java code.
 *
 * @returns {object}
 */
function Visitor() {
  CodeGenerator.call(this);
  return this;
}
Visitor.prototype = Object.create(CodeGenerator.prototype);
Visitor.prototype.constructor = Visitor;

/////////////////////////////////
// Nodes that differ in syntax //
/////////////////////////////////

Visitor.prototype.visitStringLiteral = function(ctx) {
  ctx.type = this.types.STRING;
  return this.doubleQuoteStringify(this.visitChildren(ctx));
};

Visitor.prototype.visitObjectLiteral = function(ctx) {
  let doc = 'new Document()';
  
  for (let i = 1; i < ctx.getChildCount() - 1; i++) {
    doc += this.visit(ctx.getChild(i));
  }
  ctx.type = this.types.OBJECT;
  return doc;
};

Visitor.prototype.visitPropertyNameAndValueList = function(ctx) {
  return this.visitChildren(ctx, {step: 2});
};

Visitor.prototype.visitPropertyExpressionAssignment = function(ctx) {
  const key = this.doubleQuoteStringify(this.visit(ctx.getChild(0)));
  const value = this.visit(ctx.getChild(2));
  return `.append(${key}, ${value})`;
};

Visitor.prototype.visitArrayLiteral = function(ctx) {
  ctx.type = this.types.ARRAY;
  return 'Arrays.asList(' + this.visit(ctx.getChild(1)) + ')';
};

/**
 * Ignore the new keyword because JS could either have it or not, but we always
 * need it in Java so we'll add it when we call constructors.
 */
Visitor.prototype.visitNewExpression = function(ctx) {
  return this.visitChildren(ctx, { start: 1 });
};

Visitor.prototype.visitBSONCodeConstructor = function(ctx) {
  const arguments = ctx.getChild(1);
  if(arguments.getChildCount() !== 3) {
    return "Error: Code requires one argument";
  }
  /* NOTE: we have to visit the subtree first before type checking or type may
     not be set. We might have to just suck it up and do two passes, but maybe
     we can avoid it for now. */
  const args = this.visit(arguments.getChild(1));
  if(arguments.getChild(1).type !== this.types.STRING) {
    return "Error: Code requires a string argument";
  }
  return 'new Code(' + args + ')';
};

/**
 *  This evaluates the code in a sandbox and gets the hex string out of the
 *  ObjectId.
 */
Visitor.prototype.visitBSONObjectIdConstructor = function(ctx) {
  const code = 'new ObjectId(';
  const arguments = ctx.getChild(1);
  if(arguments.getChildCount() === 2) {
    return code + ')';
  }
  // TODO: do we even have to visit the children?
  let hexstr;
  try {
    hexstr = this.executeJavascript(ctx.getText()).toHexString();
    console.log(hexstr);
  } catch (error) {
    return error.message;
  }
  return 'new ObjectId(' + this.doubleQuoteStringify(hexstr) + ')';
};

module.exports = Visitor;
