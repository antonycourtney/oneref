# OneRef - Minimalist Unidirectional Data Flow for React

This repository contains the support code for OneRef, a
state management library for React.

OneRef is based on maintaining application state in a purely functional
(immutable) data structure, typically using a library such as [Immutable.js](https://facebook.github.io/immutable-js/). A value of this type is stored in a single top-level mutable ref cell.

OneRef is described in a pair of companion blog posts: [A Tutorial Introduction to OneRef](https://antsrants.dev/oneref-intro/) and [Asynchrony Support in OneRef](https://antsrants.dev/oneref-async/).
Also see the [oneref-examples repository](https://github.com/antonycourtney/oneref-examples) for several runnable examples.

# Building the Library

The implementation is written in TypeScript and depends on React Hooks.

To install necessary build dependencies:

    npm install

To build the library:

    npm run build

# License

This code is distributed under the MIT license, see the LICENSE file for complete information.
