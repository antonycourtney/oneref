
## 3 Jan 19 - Rethinking OneRef

Experience with Tabli taught us that our original model for OneRef wasn't really
sufficient. (Why?  Composing / sequencing of actions.)

### Some old notes from Tabli

Revisiting Tabli, 8/13/17

Attempting to implement URL de-dup'ing, I've again hit a case where we want to compose multiple independent actions that may update app state in response to a single external event.
(This isn't the first time -- the entire sequence of actions in main() in bgHelper had
 this issue at some point.)

I will probably kludge this for now because the surgery involved would be just too costly.
But my inclination about the right solution is something along the lines of a state monad
and / or Redux Saga.

What we want:
    - Composition of state updates: If we have two independents actions that update the global
      application state, we need to ensure that both state updates are applied (i.e. that
      neither update gets lost).
    - Asynchronous state handling:  We will often need to update state after an asynchronous
      action has been performed.  If the update depends on the current state (which it often
      will), we want to ensure that the state is read *after* the asynchronous action has
      been performed.

How things work now:

From OneRef, we get our hands on an explicit State Updater:

```
  refUpdater: (ref: Ref<A>) => (uf: (A) => A) => A
```

We pass this as an extra argument to all of our actions, for example:

```
  <input ... onChange={() => actions.updateText(item, text, stateRefUpdater)}
```

and then in `actions`, each action explicitly calls stateRefUpdater, like so:

```
export function updateText(item, text, updater) {
  const updatedItem = item.set('text',text)
  updater((state) => state.addItem(updatedItem))
}
```

What I think we want instead is something like a State Monad (SM) for OneRef.
Like a monad, actions would no longer perform the actions directly but instead
return a data structure or thunk that denotes a description of the interleaved
state updates and asynchronous actions to perform.
At the top level of a React event callback we would have a run() method to
execute an action.

So we'd get something like this:

```
  <input ... onChange={() => runAction(actions.updateText(item, text)) }
```
where `runAction` is passed down prop that is `oneref.run` partially applied to
the state ref.

Instead of returning `void`, each action would now have to return a
`state -> state` update function.

Questions:
   - Should wrapped type be: state => state, or (state => (state,a)) ?
   - How does 'async' (or possibly generator functions) fit here?
     It seems somewhat tempting to have an action be an async function that
     returns a State Transformer (state -> state function), but how will
     that work with sequences of async calls in the body of the async
     functions?
     Can actions, which return State Transformers, directly call other actions?
     How do we ensure that we are always operating on the latest state
     after an async call to either a platform API or another action?

### What we want

In some sense it seems like what we want is to run in an environment that would ensure
that we always have access to the current app state.

Could we imagine lifting every async operation into some kind of state monad that
would manage the app state, so that we'd always get the current state after an
async op?

(That could be tricky in general, since we will often want to hang on to bits of state
 from before performing an async op....)

 Thinking something like:

```
   async someAction(appSt: AppState, arg1: T1, ...):  ???
```

Already have a challenge. Should the return type be AppState, (AppState => AppState) ?

----
A vague thought (written hastily):

What if access to the app state in the action worked via hooks?

An interesting challenge is: How do we re-read the state after the underlying async
platform operation?

=======

1/8/19:

So what are the criteria we want for actions?

1. Support for asynchronous platform operations

The main implication of this is that, by the time the asynchronous operation completes, the application state may be out of date. We previously got around this by having each
action complete by invoking an `update` operation of type ((AppState => AppState) => void)

But that doesn't work well for composition or sequencing.  First, any caller of the
action would need to explicitly read from the ref cell to get the latest state.
Second, there's no mechanism to return an auxiliary value from the action, independent of
the state.

2. Composition and Chaining

Frequently we want to compose some larger action out of simpler actions.
This may be motivated by modularity or because of a mismatch between the granularity
of operations provided by the platform API.
(Examples??  Perhaps look to main in bgHelper in Tabli, or event-handler responses,
particularly around de-dup'ing).

A reasonable example:

from `main`:
```
    await actions.loadPreferences(storeRef)
    await actions.syncChromeWindows(storeRef)
```

During initialization we want to load preferences before sync'ing Chrome windows, but then here are many places where we'll want to run `synchChromeWindows`, without first loading
preferences.

One issue to note here is that each of the above operations will trigger the event
listeners on the refcell, whereas we'd really like to only notify listeners once, when
the entire sequence completes.

Another example is `dedupeTabs`, where we want to invoke `actions.closeTab` to
close a specific tab (and update the application state).
But then *after that operation and state updae completes*, we want to perform some
additional action (specifically: activating the original tab that was duplicated).

Note, too, that to be really compositional, we want to be able to re-use actions
written for some narrower state type in a larger aggregate state...

## More Thoughts, 16 Jan 19:

Remember: ‘await’ is like monad bind.
Look into: continuation monad (and relation to async),
Monad transformers
Algebraic effect composition vs
Monad transformers.
Remember that right hand side of bind
Is a function b -> M c
That is: the (b ->) bit isn’t part of the definition of M.


May be worth looking at getify’s hooks outside React work,
What would that look like in Haskell?

---
Revisiting the State and Continuation monad definitions in Haskell:

From [https://wiki.haskell.org/All_About_Monads](Haskell Wiki / All About Monads):

```haskell
newtype State s a = State { runState :: (s -> (a,s)) } 

class MonadState m s | m -> s where 
    get :: m s
    put :: s -> m ()

 instance Monad (State s) where 
    return a        = State $ \s -> (a,s)
    (State x) >>= f = State $ \s -> let (v,s') = x s in runState (f v) s'

instance MonadState (State s) s where 
    get   = State $ \s -> (s,s) 
    put s = State $ \_ -> ((),s)
```

(Quick aside: What's the type of `f` in the `>>=` def above?)

If x :: s -> (a,s)
then
  (State x) :: State s a

so we should have:
 f :: a -> State s b

Recall that:

```haskell
-- bind is a function that combines a monad instance m a with a computation
-- that produces another monad instance m b from a's to produce a new
-- monad instance m b
(>>=) :: m a -> (a -> m b) -> m b
```

Note that this is really a *State Transformer* -- the denotation is a function from
state to state.
But is probably called informally the "State Monad".
And then that is used in the context of "State Monad Transformer", which should really
be parsed as "State (Monad Transformer)", a generalization of the State Transformer
monad for use in contexts where multiple monads need to be combined.

----
17 Jan 19:

Relationship between ticks and states in the presence of state updates.
In a state monad, every update to state only becomes visible in the next monadic action (function on rhs of bind). This is why it makes sense for hooks / react setState to apply asynchronously and keep state constant for current tick.

This works, but is perhaps overly pessimistic. In particular, there may be actions
that update state. Ideally we'd like to collapse any chained composition of such updates into a single tick.
If we conflate asynchrony with state, it's very easy for every state update to happen in
its own tick...

Enough talk!  Let's try and write a typed definition of oneRef and actions...

----
A couple of refs on using update form of setState for state maintenance:

https://medium.com/@wisecobbler/using-a-function-in-setstate-instead-of-an-object-1f5cfd6e55d1

https://github.com/facebook/react/issues/9066#issuecomment-282481742


-------

Started to think about:
/*
 * helper for async operations.
 * 
 * Usage:
 * 
 *    const runAsync = updateAsync(setState);
 * 
 *    ...
 * 
 *       onClick = {() => runAsync(actions.appAction(...))}
 */
export const updateAsync = <T extends {}>(setState: StateSetter<T>) => (pact: Promise<StateTransformer<T>>): void => {
    pact.then(setState);
}

/*
 * chain async actions sequentially (monadic bind operation):
 *
 */
type PST<T, A> = Promise<[StateTransformer<T>, A]>;
export const chainAction = async <T extends {},A extends {}, B extends {}> (m0: PST<T, A>, bf: (a: A) => PST<T, B>) => async (s0: T) => {
    const [stf0, a] = await m0;
    const s1 = stf0(s0);
    const []
}

/* 
 * ??? Should we possible move the A into StateTransformer, so
 * that instead of:
 *   export type StateTransformer<T> = (s: T) => T
 * we have:
 *   export type StateTransformer<T, A> = (s: T) => [T,A]
 * that would allow us to return values derived from the current state...
 */

/*
 * Hmmmm, we need to think very carefully here.
 * The whole point of using a synchronous (State => State) function returned
 * from an async operation is that the operation is performed atomically against
 * the current state.
 * 
 * What we really want when chaining op1 and op2 is:
 *    [x, stf1] = await op1;
 *    setState(stf1);
 *    [y, stf2] = await op2(x);
 *    setState(stf2);
 *    return y;
 * 
 * Alternatively, if the result value comes from the state transformer function, we could have:
 *    stf1 = await op1;
 *    x = updateState(stf1);
 *    stf2 = await op2(x);
 *    y = updateState(stf2);
 *    return y;
 * 
 * BUT is that a Promise<ST<S,Y>> ?  NO!  Because the state needs to be updated between the update ops. Grrr. :-(
 */

OK, we have a real challenge because React's setState() operation doesn't have a return value.
So our options seem to be:
   - Wrap an action's StateTransformer<T> result into a side-effecting one.
   - Use something like onChange effects to run the next action after the
     state update.  (Note that other state updates might happen first, but there is probably
     nothing we can do to avoid that.

A thought:

It's somewhat interesting that we pass setState() explicitly in to StateEffect<S>, but
we have most actions just return a StateTransformer<S>.
Interestingly, we can't alter the signature of StateEffect<S> to return a StateTransformer,
because the whole point is that effects often need to run async functions that only perform
their desired effect after the operation completes.

Also (as in the case of a subscription), there may be multiple calls to setState....

Hmmmmm....

What if we instead had a Stream<StateTransformer<S>> ?

Let's look at asynchronous iterators....

Hmmmm, so, at least for the simple subscription case, this could be exactly
covered by AsyncIterator<StateTransformer<S>>

Also:  What are the cases in Tabli where we need to read AppState in the middle of an
async operation?

