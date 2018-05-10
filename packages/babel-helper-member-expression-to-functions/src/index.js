import * as t from "@babel/types";

const handle = {
  handle(member) {
    const { node, parent, parentPath } = member;

    // MEMBER++   ->   _set(MEMBER, (_ref = (+_get(MEMBER))) + 1), _ref
    // ++MEMBER   ->   _set(MEMBER, (+_get(MEMBER)) + 1)
    if (parentPath.isUpdateExpression({ argument: node })) {
      const { operator, prefix } = parent;

      // Give the state handler a chance to memoize the member,
      // since we'll reference it twice.
      if (this.memoize) {
        this.memoize(member);
      }

      const value = t.binaryExpression(
        operator[0],
        t.unaryExpression("+", this.get(member)),
        t.numericLiteral(1),
      );

      if (prefix) {
        parentPath.replaceWith(this.set(member, value));
      } else {
        const { scope } = member;
        const ref = scope.generateUidIdentifierBasedOnNode(node);
        scope.push({ id: ref });

        value.left = t.assignmentExpression("=", t.cloneNode(ref), value.left);

        parentPath.replaceWith(
          t.sequenceExpression([this.set(member, value), t.cloneNode(ref)]),
        );
      }
      return;
    }

    // MEMBER = VALUE   ->   _set(MEMBER, VALUE)
    // MEMBER += VALUE   ->   _set(MEMBER, _get(MEMBER) + VALUE)
    if (parentPath.isAssignmentExpression({ left: node })) {
      const { operator, right } = parent;
      let value = right;

      if (operator !== "=") {
        // Give the state handler a chance to memoize the member,
        // since we'll reference it twice.
        if (this.memoize) {
          this.memoize(member);
        }

        value = t.binaryExpression(
          operator.slice(0, -1),
          this.get(member),
          value,
        );
      }

      parentPath.replaceWith(this.set(member, value));
      return;
    }

    // MEMBER(ARGS)   ->   _call(MEMBER, ARGS)
    if (parentPath.isCallExpression({ callee: node })) {
      const { arguments: args } = parent;

      parentPath.replaceWith(this.call(member, args));
      return;
    }

    // MEMBER   ->   _get(MEMBER)
    member.replaceWith(this.get(member));
  },
};

// We do not provide a default traversal visitor
// Instead, caller passes one, and must call `state.handle` on the members
// it wishes to be transformed.
// Additionally, the caller must pass in a state object with at least
// get, set, and call methods.
// Optionally, a memoize method may be defined on the state, which will be
// called when the member is a self-referential update.
export default function memberExpressionToFunctions(path, visitor, state) {
  path.traverse(visitor, {
    ...state,
    ...handle,
  });
}
