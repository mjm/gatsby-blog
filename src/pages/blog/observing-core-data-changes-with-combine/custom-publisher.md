---
templateKey: blog-post
date: 2019-11-08T23:00:00Z
title: Observing Core Data Changes with a Custom Combine Publisher
series: using Combine to observe Core Data changes
---

At the end of [the last post](/observing-core-data-changes-with-combine/mvvm/), I described the way I wanted to observe [Core Data][] changes in my app: with a stream of collection changes that I can apply to a list of view models to keep it in sync the current state of the managed object context.

In this post, I'll show how I can create a custom [Combine][] publisher that does exactly that.

[combine]: https://developer.apple.com/documentation/combine
[core data]: https://developer.apple.com/documentation/coredata

<!--more-->

> **Credit**: [Sergej Jaskiewicz][broadwaylamb] deserves a huge credit here for creating [OpenCombine][], an open source reimplementation of Combine for apps that need to deploy to older OS versions.
>
> OpenCombine's source code has been immensely helpful as I've tried to learn how Combine actually works.

[broadwaylamb]: https://github.com/broadwaylamb
[opencombine]: https://github.com/broadwaylamb/OpenCombine

When I did this the first time, I started by updating `FetchedObjectList` to expose a new publisher for the changes to the object list it was tracking.
This was working alright, but it had a subtle bug that would have caused issues if I had been using it a little differently.

The current `FetchedObjectList` fetches objects as soon as it's created, and any subscriber after that would get the list of model objects as they were at the time when they subscribed, followed by any changes after that.
When I started tracking collection changes, this got weird.

For the subscription I showed above to work correctly, it needs to receive the initial list of insertions to the list.
This keeps the list of models consistent with the actual list of model objects.
But it will only receive those insertions if it's subscribed when the `FetchedObjectList` sends the first update.
I was getting by alright because I was always subscribing to the list right away, but clearly this model has some issues.

At the same time, I was also starting to feel annoyed that I had to store the `FetchedObjectList` instance in my view models at all.
Most publishers don't require you to keep hanging on to the state that produced them.
I'm already storing the subscription in my view model: that should be sufficient to keep any state my publisher needs alive.
As a consumer of the publisher, I shouldn't need to worry about what that is.

Both of these problems can be solved by creating a new type of `Publisher`.
Let's start with the API that I'll use to create this publisher from my ViewModels:

`embed:15-managed-object-context-extension.swift`

This is mostly a shortcut to create new instances of the publisher in a way that reads nicely to the code that's subscribing.
It's similar to the API Apple exposes to create publishers for KVO or NotificationCenter notifications.

Notice that the input to the publisher is the same as what I had to pass in to `FetchedObjectList` to be able to create the fetched results controller.
That's because the subscriptions for this publisher are going to need to create one too.

`embed:16-changes-publisher.swift`

This is mostly just boilerplate, but notice a few things.
First, the typealiases: `Publisher` has two associated types, which you've seen me reference when defining operators.
`Output` is the type of objects the publisher will send to subscribers, and `Failure` is the type of errors it can finish with.
`Failure` can be `Never` for publishers that will never produce an error, and some subscribers like `assign` require the publisher to never fail.
This publisher will be able to produce errors, though, as you'll see soon.

Second, the `Publisher` is a `struct`, like most publishers, which means it's a value type.
Publishers in Combine are not usually responsible for doing the work to provide values to their subscribers.
They are discardable: in fact, as soon as something subscribes to this publisher, the publisher itself will go away.
Think of publishers as recipes for how to produce values for a subscriber.

`embed:17-changes-publisher-receive.swift`

The only method a `Publisher` needs to implement is [`receive(subscriber:)`][receive-subscriber].
All the other behavior and operators that a publisher exposes hangs off of that one method being implemented.

This is the hook that Combine uses to tell the publisher that there's a new interested subscriber.
The publisher's job, when it receives this, is to create a new [Subscription][] object for the subscriber, and pass it back to the subscriber using [`receive(subscription:)`][receive-subscription].
Conventionally, Combine's subscription classes seem to be called `Inner` and are namespaced within the type of the publisher, so I'm copying that convention here.

The subscription object is the one that will keep track of state for a particular subscriber, and it will be the one responsible for sending values.
I'm creating one by passing it the subscriber, as well as the input to the publisher that will be used to interact with Core Data.

[receive-subscriber]: https://developer.apple.com/documentation/combine/publisher/3229093-receive
[receive-subscription]: https://developer.apple.com/documentation/combine/subscriber/3213655-receive
[subscription]: https://developer.apple.com/documentation/combine/subscription

`embed:18-changes-subscription.swift`

Creating a subscription for this publisher looks _a lot_ like creating a `FetchedObjectList`.
That's good: my goal was to try to capture that state (the fetched results controller and its delegate) in the subscription itself instead of having to track it separately.
This is also how I'll prevent issues with missing messages, because:

- Each subscription will now have its own fetched results controller.
- That fetched results controller won't be created or start fetching until the subscriber is already listening.

By keeping this with the subscription, there's no way for any subscriber to miss messages because they weren't listening at the right time.

A few other differences from `FetchedObjectList`:

- I have to store the downstream subscriber, so that I can send it new values when they're available. It's kind of like when I was storing the `updateSnapshot` callback, but Combine is providing a lot of extra support around it.
- I'm not just logging the error anymore if the fetch request fails. Instead, I'm completing the subscription with a failure, so a subscriber can know when it's failed and explicitly handle it in some way (perhaps using the [catch][] or [assertNoFailure][] operator).

[catch]: https://developer.apple.com/documentation/combine/publisher/3204690-catch
[assertnofailure]: https://developer.apple.com/documentation/combine/publisher/3204686-assertnofailure

`embed:19-changes-subscription-request.swift`

Oh, this is new!
[`request(_:)`][request-demand] is part of the `Subscription` protocol.
It's what subscribers use to signal to a publisher that they want more values.
This supports a feature of Combine called ["backpressure,"][backpressure] which I'm not going to go into much other than to say that my subscription is going to respect the wishes of its subscribers and only send new lists of changes when the subscriber has said they want them.
If I see new object changes but the subscriber isn't ready for them, I'll have to keep them around, ready to go, in the subscription until I get a new request.

[request-demand]: https://developer.apple.com/documentation/combine/subscription/3213720-request
[backpressure]: https://www.caseyliss.com/2019/6/20/under-pressure

I'm keeping track of how much unfulfilled demand my subscriber has requested.
When I get a new request, I add that demand to the existing demand.
([Subscribers.Demand][subscribers-demand] isn't _exactly_ a number, but it does support math operations.)
Then I call a private helper to fulfill any outstanding demand.
We'll look at the implementation for that in a bit.

[subscribers-demand]: https://developer.apple.com/documentation/combine/subscribers/demand

But first, let's look at how I'm updating the subscription's state when the fetched results controller has new content.

`embed:20-changes-subscription-update-diff.swift`

The fetched results controller delegate method just calls the same `updateDiff()` method that my initializer calls, and now we can see how that's implemented.
`updateDiff()` prepares the value that will be sent to the subscriber if they have any demand, and it does this with two pieces of state.
`lastSentState` stores the version of `fetchedObjects` from the last time the subscriber received a message from us.
Before the subscriber receives any messages, this is the empty array.
`currentDifferences` reflects the difference between the current list of fetched objects and the `lastSentState`.
This is the content the subscription will send in its next message to the subscriber.

`updateDiff()` is called whenever there might be changes to the list of fetched objects.
It updates the state needed to know what it would send to the subscriber, then calls `fulfillDemand()`.
Remember this is the same helper that is called when a subscriber requests more items.
This is where I'll actually try to send messages, so let's see how that works.

`embed:21-changes-subscription-fulfill.swift`

This is where the magic happens.
The first thing `fulfillDemand()` does is check to see if there's anything that needs to be done.
Remember that `demand` reflects the outstanding demand: demand that the subscription hasn't fulfilled yet.
So if it reaches zero, then the subscriber doesn't want any more elements and there's nothing to do.

If this happens, I'm not going to alter the state in the subscription at all.
The `lastSentState` will stay what it was the last time a message was sent, and if I get more changes from the fetched results controller, `updateDiff()` will recompute the current diff against that old state.
This has the effect of letting changes "pile up" until the subscriber wants them, at which point it gets a collection with every change that happened since it was last notified, even if those came from multiple notifications.
I think it's very cool to wrap this behavior in the subscription, so it's transparent to subscribers.

I'm also not going to send a message if the diff is empty.
There's no point in notifying subscribers when there are no changes, so in this case I'll avoid sending a message until there's something interesting.

Assuming the subscriber wants more messages and there's something to send, I go ahead and send `currentDifferences` to the downstream subscriber.
When I do, I may get more demand, which I'll add to the outstanding demand that I'm tracking.
At this point, I'll reset `lastSentState` to be the current state of the fetched objects, so that future diffs don't include changes that were already sent to the subscriber.
I'll then reset `currentDifferences` to an empty collection by diffing `lastSentState` against itself.
And finally, I adjust demand by reducing it by one (for the message I just sent) and adding any new demand the subscriber requested.

That's everything that's needed to get messages sending for changes the way I wanted.
There's one last requirement to finish implementing the `Subscription`, because `Subscription` extends `Cancellable`.
I need to define what happens when the subscription is canceled by the subscriber.

`embed:22-changes-subscription-cancel.swift`

Honestly, I'm not actually sure if either of these are necessary to properly clean up.
I haven't done a deep-dive on the retain/release patterns for Combine subscriptions, so it's possible that the fetched results controller might get cleaned up automatically if the subscription gets deallocated shortly after being canceled.
Until I know more, I'm leaving them around just to be sure.
In particular, clearing the fetched results controller delegate will prevent getting more notifications for changes after cancellation.

That's it: a custom Publisher that can be used with Combine to track changes to a fetch request.
You can get [the complete publisher code as a gist](https://gist.github.com/mjm/750b20e1dfd5b1abc82b8295b54b3c74).
I'm considering expanding it a bit and publishing it as a Swift package.

Now let's see what it looks like to use it in our view model.
Remember that I left `itemChanges` as an unimplemented property for the publisher of the model changes, but now I can really implement it:

`embed:23-view-model-changes-publisher.swift`

How easy is that!?
There's no extra state for the view model to keep around to track these changes, because that's all tucked away in the subscription.
I can just ask the managed object context to publish the changes, and then use those in my pipelines like any other data that Combine already supports.
Using a `Publisher` also means that all existing operators exposed as extensions on `Publisher` (`map`, `filter`, `combineLatest`, `zip`, etc.) are all available.

Speaking of which, that initializer is bothering me.
I feel like it's not very obvious what is happening there.
Operating on streams of this shape and transforming them in this way (creating view models from object changes) is going to be a common pattern in my app, so it should be easy to do without boilerplate and it should be easy to recognize when looking at the code.
I think I can write an operator to abstract and name this transformation, and then use that operator in my view model instead.

`embed:24-applying-changes-operator.swift`

`applyingChanges(_:_:)` is shaped a lot like `zip` or `combineLatest`, though it's a much more specific way of combining two publishers.
It's available on publishers of collections that can be changed by integer indices (like arrays of view models, for instance).
It expects to be passed another publisher that outputs collections of changes to another type of object (like model objects) as well as a transform function that can convert between the types.
It produces a new publisher with the same output and failure types as the receiver, and this will publish the results of applying the changes.

This logic is very generic: while I'm intending to use it for model objects and view models, it could be used for any situation where you want to maintain a parallel collection in response to a stream of changes.

With this operator, the view model's subscription is much easier to write and understand:

`embed:25-view-model-applying-changes.swift`

Perfect! Wiring up a new view model is now **trivial**, and this mechanism encourages me to split responsibilities into child view models where appropriate, because now it's super easy to do.

---

I hope this series has demonstrated some of the ways you can use Combine in your UIKit apps to improve the flow of data and the architecture of the app:

- Use subjects or `@Published` properties to get data from imperative sources into reactive pipelines.
- Express common data transformations using custom operators.
- Separate concerns and simplify view controllers by binding UI to view models.
- Consider creating a custom `Publisher` to introduce new sources of data into your pipelines with complete control and strong encapsulation.
