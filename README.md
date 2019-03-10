# OneRef - Minimalist Unidirectional Data Flow for React

This repository contains the support code for OneRef, a
state management library for React.

OneRef is based on maintaining application state in a purely functional
(immutable) data structure, typically using a library such as [Immutable.js](https://facebook.github.io/immutable-js/). A value of this type is stored in a single top-level mutable ref cell.

See **blog post (TODO: link!)** and companion **examples repository(TODO: link!)** for details on how to use this library.

# Building the Library

The implementation is written in TypeScript and depends on React Hooks.

To install necessary build dependencies:

    npm install

To build the library in a form suitable for publishing:

    npm run build

# License

This code is distributed under the MIT license, see the LICENSE file for complete information.
