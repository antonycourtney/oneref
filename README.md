# OneRef - A Minimalist Alternative To Flux

This repository contains the (tiny) support code for OneRef, an alternative to Facebook's Flux framework for use with React.

OneRef is based on storing all application state as purely functional (immutable) data structures defined using Immutable.js, stored in a single top-level mutable ref cell that will notify registered listeners when set.

The code in [src/oneRef.js](./src/OneRef.js) provides the (trivial) implementation of this mutable ref cell, and the one auxiliary support function (`refUpdater`) used to construct callbacks. 

See **blog post (TODO: link!)** and companion **examples repository(TODO: link!)** for details on how to use this library.

# Building the Library

The implementation is written in ES6 and transpiled with Babel.

To install necessary build dependencies:

  npm install

To compile the library to ES5 using Babel:

  npm run build

# License

This code is distributed under the MIT license, see the LICENSE file for complete information.
