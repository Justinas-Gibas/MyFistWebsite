# Rust-Inspired JavaScript/TypeScript Style Guide

A quick-reference memo to help you write JS/TS with the clarity, safety, and modularity of Rust. Treat this as both a cheat-sheet and a checklist.

---

## 1. Immutability by Default

* **Use `const` for all values**. Only use `let` when mutation is absolutely necessary.
* Avoid `var` entirely.
* For mutable state, wrap in explicitly named functions or blocks.

**Checklist:**

* [ ] No`var` declarations
* [ ] All top-level and inner variables use `const` unless explicitly mutated
* [ ] Mutable sections isolated in small `let` blocks

---

## 2. Expression-Based Structure

* Favor expressions over statements.
* Functions should always return values; minimize side-effects.
* Use arrow functions for concise expressions.

**Checklist:**

* [ ] No stand-alone statements that mutate outside scope
* [ ] Functions return values, not `void`
* [ ] Arrow functions for simple transforms

---

## 3. Algebraic Data Types (ADT)

* Simulate `Option<T>` and `Result<T, E>` with libraries (`neverthrow`, `fp-ts`, `oxide.ts`) or custom types.
* Handle absence and errors explicitly, no hidden `null`/`undefined`.

**Checklist:**

* [ ] No untyped `null` or `undefined`
* [ ] All optional values wrapped in `Option` or similar
* [ ] Errors returned as `Result` or thrown explicitly

---

## 4. Pattern Matching / Exhaustiveness

* Use exhaustive `switch` with a `never` default case or `ts-pattern` for type-safe matching.

**Checklist:**

* [ ] `switch` statements cover all variants
* [ ] `default` branch asserts `never`
* [ ] Or use `match` from `ts-pattern` with `.exhaustive()`

---

## 5. Modular Structure

* Organize code into small, single-responsibility modules/files.
* Use `import`/`export` clearly; mirror Rust’s `crate::module` structure.

**Checklist:**

* [ ] Each file exports one primary function/class
* [ ] Directory structure reflects logical modules
* [ ] No large monolithic files

---

## 6. Strong Tooling

* **ESLint**: Enforce rules (no `var`, prefer `const`, exhaustive `switch`).
* **Prettier**: Uniform formatting (like `rustfmt`).
* Integrate **TypeScript** strict settings (`strictNullChecks`, noImplicitAny).

**Checklist:**

* [ ] ESLint config with Rust-like rules
* [ ] Prettier config enforced on save
* [ ] TS strict mode enabled

---

## 7. Explicit Async & Error Handling

* Wrap Promises in `ResultAsync` (neverthrow) or use `async/await` with try/catch that returns `Result`.

**Checklist:**

* [ ] No unhandled promise rejections
* [ ] All async functions return `ResultAsync` or throw caught errors

---

## 8. Testing & Documentation

* Write tests for all modules using Jest or similar.
* Document public APIs with TSDoc, mirroring Rust’s doc comments (`///`).

**Checklist:**

* [ ] Jests tests exist for each function
* [ ] TSDoc comments on exports

---

## Quick To-Do / Cheat-List

* [ ] Configure ESLint + Prettier + TS strict
* [ ] Integrate `neverthrow` (or equivalent)
* [ ] Replace `==`/`!=` with `===`/`!==`
* [ ] Use arrow functions for pure transforms
* [ ] Ensure each module is < 200 LOC
* [ ] Add exhaustive pattern matches
* [ ] Wrap all optional values in `Option`
* [ ] Wrap errors in `Result`
* [ ] Document with TSDoc comments
* [ ] Write Jest tests for core modules

---

*Printed by Astra to keep your JS/TS code as robust as Rust!*
