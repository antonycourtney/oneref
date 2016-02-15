# OneRef - Minimalist Unidirectional Data Flow for React 

This repository contains the support code for OneRef, a a minimalist approach to unidirectional data flow for React applications. 
OneRef is an extremely lightweight alternative to
Facebook's [Flux](http://facebook.github.io/flux/) application architecture.

OneRef is based on defining a composite purely functional (immutable) data type
with [Immutable.js](https://facebook.github.io/immutable-js/) to represent the entirety of
the current application state. A value of this type is stored in a single top-level mutable ref cell that will notify registered listeners when the ref cell is updated.

The code in [src/oneRef.js](src/oneRef.js) provides the (trivial) implementation of this mutable ref cell, and the one auxiliary support function (`refUpdater`) used to construct callbacks. 

See **blog post (TODO: link!)** and companion **examples repository(TODO: link!)** for details on how to use this library.

# Building the Library

The implementation is written in ES6 and transpiled with Babel.

To install necessary build dependencies:

    npm install

In addition to installing dependencies, that should automatically run the `prepublish` script to compile the library sources to ES5 using Babel.  If you need to redo this step for some reason:

    npm run prepublish

# License

This code is distributed under the MIT license, see the LICENSE file for complete information.
