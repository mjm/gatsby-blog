---
templateKey: blog-post
date: 2019-11-01T23:00:00Z
title: Observing Core Data Changes with Combine
---

Because Apple released [SwiftUI][] and [Combine][] together, you could be forgiven for ignoring Combine if you're only using UIKit in your app.
I certainly ignored it for a while, but I think Combine provides a huge opportunity to use better app architectures in your iOS app without feeling like UIKit is fighting you the entire time.

I want to demonstrate a progression I went through in my app for observing data changes from [Core Data][].
I think that this shows the power that's available in Combine if you're willing to embrace it.

[swiftui]: https://developer.apple.com/documentation/swiftui
[combine]: https://developer.apple.com/documentation/combine
[core data]: https://developer.apple.com/documentation/coredata

<!--more-->

## Let's start with NSFetchedResultsController

Core Data includes a very useful class called [NSFetchedResultsController][].
You give it a fetch request and a delegate, and it will let the delegate know when there are changes to objects matched by that fetch request.
It's been around for years now, and was originally designed around `UITableView`'s API, so that you could accurately tell a table view which rows had been inserted or deleted.
Now that I'm using [diffable data sources][diffable-data-source], a lot of the functionality isn't as useful to me anymore, but I still use it to know when to update my data source snapshots.

[nsfetchedresultscontroller]: https://developer.apple.com/documentation/coredata/nsfetchedresultscontroller
[diffable-data-source]: https://developer.apple.com/documentation/uikit/uitableviewdiffabledatasource

Initially, I was using a fetched results controller directly in my view controllers:

`embed:01-just-fetched-results-controller.swift`

This is super useful!
Now my snapshot gets updated any time rows are added or removed from the query results, so my app's UI stays consistent as the user makes changes.
I didn't show it, but I also used the [`controller(_:didChange:at:for:newIndexPath:)`][controller-did-change] delegate method to know when to update the content in existing cells.

[controller-did-change]: https://developer.apple.com/documentation/coredata/nsfetchedresultscontrollerdelegate/1622296-controller

Once I'd done this for a few different view controllers, the boilerplate got to me and I created a new abstraction called `FetchedObjectList`:

`embed:02-fetched-object-list-callbacks.swift`

All this object does is keep track of the current list of objects and listen for the fetched results controller delegate methods, which it then notifies the view controller about.
Using it from the view controller looks like this:

`embed:03-view-controller-with-fetched-object-list.swift`

This cuts down the boilerplate quite a bit, especially when repeating this pattern all over the app.

> I'm going to give you a quick spoiler: `FetchedObjectList` hangs around for a lot of this story, but it definitely dies in the end.

## Time to Combine

Currently, my app is using Combine nearly everywhere it's possible, but I didn't start there.
The adoption was gradual.
At some point I started thinking about whether I could power my Core Data changes from it, so I tweaked `FetchedObjectList` to stop taking callbacks and instead expose publishers for those notifications:

`embed:04-fetched-object-list-combine.swift`

The shape of this version is pretty similar to what I had before.
So what did I change?

1. I'm no longer passing in callbacks in the initializer.
2. I created a [PassthroughSubject][] to replace each callback. A [Subject][] in Combine can function as both a subscriber and a publisher, so it can both receive and publish objects. They're often used like I'm using them here: as a bridge from imperative code to reactive code. A `PassthroughSubject` in particular is a simple pipe: when you send it objects, it sends them on to any active subscribers, then promptly forgets about them. A good subsitute for a callback.
3. Instead of my fetched results controller delegate methods calling the callback functions, they now send equivalent messages to the appropriate subjects.
4. Each subject is exposed via a property as a type-erased [AnyPublisher][]. I don't want code that is using a `FetchedObjectList` to try to send objects to my subjects, so I mask their real types so they are exposed only as publishers.

[passthroughsubject]: https://developer.apple.com/documentation/combine/passthroughsubject
[subject]: https://developer.apple.com/documentation/combine/subject
[anypublisher]: https://developer.apple.com/documentation/combine/anypublisher

Now I can update my view controllers to use the new Combine-friendly fetched object lists:

`embed:05-view-controller-subscriptions.swift`

Honestly, I'm not sure if this version is an improvement over what I had before.
It's a bit more verbose than the previous version, but I also now have a little extra complexity because I'm using Combine.
Unlike the callbacks I used before, publishers don't retain their subscribers, so Combine gives an [AnyCancellable][] when you create a subscriber, which you need to keep a strong reference to somewhere or your subscription will be cancelled.

I'm handling this by keeping a set of cancellables on my view controller for all of my subscriptions, and using the [`store(in:)`][store-in] method on `AnyCancellable` to dump them all in there.
When my view controller deinits, the set and all its contents will deinit as well and the subscriptions will be canceled.
It works, but it's definitely more management than what I was doing before.

However, this wasn't the only part of my app that was starting to use Combine in interesting ways, and this is just a small step along the way.
The benefits of using Combine compound the more your app uses it, and eventually a little bit of cancellable management seems like a fine price to pay.
For now, let's keep going and see what can be improved.

[anycancellable]: https://developer.apple.com/documentation/combine/anycancellable
[store-in]: https://developer.apple.com/documentation/combine/anycancellable/3333294-store

### Building pipelines

Combine can do so much more than just replace callbacks and make them harder to use!
It's designed to let you build data pipelines, where different parts of your app can produce data that can be consumed and transformed in interesting and decoupled ways by other parts.
If I really think about what's happening here in my app, there is a flow of data from Core Data to the fetched results controller to my view controller and finally to the diffable data source.
I'd really like to model that data flow in Combine in a declarative way.

The API of `FetchedObjectList` doesn't currently lend itself to that, largely due to its legacy from when it used callbacks.
When the list of objects changes, it's letting its subscribers know that it happened, but it's not telling them what the new list of objects actually is.
My view controllers still have to ask for the list again when they go to build the snapshot.
This is still very imperative, but I can fix that by changing it to publish some values!

`embed:06-fetched-object-list-send-objects.swift`

This is a pretty small change, but it's going to have a cascading impact on what I can do with Combine.
It's worth noting that in addition to now passing the list of objects to subscribers, I'm also using a [CurrentValueSubject][] instead of a `PassthroughSubject`. 
Its name probably gives a clue to the difference: `CurrentValueSubject` remembers the last value it was sent, and immediately sends that value to new subscribers.
I'm using this to ensure that when I connect my UI to this publisher, it immediately gets updated based on the current state and I don't risk missing a message and presenting empty lists.

I also need to be sure to send a first message after I get the fetched results controller to load its initial data.
This is because [`controllerDidChangeContent(_:)`][controller-did-change-content] is only called for later changes to the content: it doesn't get called for the initial fetch.
I didn't realize this at first and ended up with a bunch of empty lists in my app.
Since code that uses `FetchedObjectList` isn't going to ask it for the objects imperatively anymore, it's important the they get sent to subscribers and become part of the data pipeline.

[currentvaluesubject]: https://developer.apple.com/documentation/combine/currentvaluesubject
[controller-did-change-content]: https://developer.apple.com/documentation/coredata/nsfetchedresultscontrollerdelegate/1622290-controllerdidchangecontent

With this change in place, it's now possible to build my snapshots directly as part of a Combine pipeline, without having to ask something else for the current data:

`embed:07-view-controller-snapshot-publisher.swift`

Look at that, I've created a pipeline!
The fetched object list publishes a stream of lists of to-do items, and my view controller transforms that stream into a stream of snapshots using the `map` operator.
This creates a new publisher which I called `snapshot` and exposed as a computed property.
Now my subscription doesn't need to think about where the snapshots come from: it just says "I want a snapshot" and it will be notified anytime the snapshot needs to change.

### Extracting common patterns

I see a pattern here that I think is going to be pretty common.
Almost all of my view controllers are going to want to publish a snapshot and apply it to a data source.
I'd like it to be easier to create that subscription in my view controllers.

Combine includes three built-in ways to create subscriptions to publishers:

* [sink][]: You've already seen this one: you provide a closure that is called every time the publisher has a new value. You can also [provide a second closure][sink-with-completion] to handle the completion of the stream, but so far I haven't needed that in this example since these publishers never complete.
* [assign][]: You provide a key path and a root object, and the latest value the publisher sent will be assigned to that key path on the object. This is useful for updating UI components with values from publishers or for keeping state around for when imperative code asks for it later.
* [subscribe][]: You provide a subject which is sent all of the events the publisher receives. Not as common as the other too, but it does have uses.

[sink]: https://developer.apple.com/documentation/combine/publisher/3362666-sink
[sink-with-completion]: https://developer.apple.com/documentation/combine/publisher/3343978-sink
[assign]: https://developer.apple.com/documentation/combine/publisher/3235801-assign
[subscribe]: https://developer.apple.com/documentation/combine/publisher/3204757-subscribe

That's not a huge list of ways to subscribe, but they do cover the most common use cases.
There's nothing special about them, though: we can define our own operators to create subscriptions in other useful ways.
Generally, these can all be expressed in terms of `sink` since it is so general-purpose.

I'll define a new `apply` operator that creates a subscription that applies the latest snapshot in a stream to a diffable data source:

`embed:08-apply-snapshot-subscriber.swift`

Oh look, that's almost exactly what I was doing in my view controller, but with extra generics.
The `where` clauses here just restrict this to only apply to streams of snapshots that also can't fail.
Then the generics restrict it so the snapshot can only apply to a data source for the same types of sections and items.

With this operator, I can rewrite the subscription code in my `viewDidLoad` to be:

```swift
snapshot.apply(to: dataSource).store(in: &cancellables)
```

I think that reads incredibly nicely.
But one thing I've lost here is control over whether changes animate.
Previously, I avoided animating the first application of the snapshot, because it looks weird for rows to animate in when the view first appears.

One way to solve this is to make a publisher for whether changes should animate.
The easiest way to do this is to use the [`@Published`][published] property wrapper on a property on the view controller.

[published]: https://developer.apple.com/documentation/combine/published

```swift
@Published var animate = false

override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)

    animate = true
}
```

Now I'll have an `$animate` property available that is a publisher for changes to the `animate` property.
I can use `$animate` in my pipelines to know whether UI changes affected by them should be animated.
Let me modify the `apply` subscriber to take in an additional publisher to control animations:

`embed:11-apply-snapshot-animated-subscriber.swift`

[combineLatest][] publishes a tuple with the latest values of a group of publishers when any of them changes.
So when either the snapshot or the animate flag changes, the data source will get updated.
Technically, I only really care about when the snapshot changes, but as far as I can tell Combine doesn't inlude a built-in operator that will let me have the latest `animate` value without republishing when it changes.
So far it hasn't been a problem, but if it becomes one, it should be possible to create that operator.

[combineLatest]: https://developer.apple.com/documentation/combine/publisher/3333677-combinelatest

In my view controller, I can use my new `apply` subscriber with `$animate`:

```swift
snapshot.apply(to: dataSource, animate: $animate)
    .store(in: &cancellables)
```

Now my table view updates will not animate until the view has appeared, and my pipeline is extremely declarative.

You may have noticed that I seem to have totally forgotten about the `objectDidChange` publisher for updates to individual objects.
This was about the point where I discovered that using KVO with Combine is a much better way to keep individual cells up-to-date than watching for updates at the controller level.
When creating a cell, instead of setting a bunch of UI control properties to populate it, I will instead use `publisher(for:)` with `assign` to create subscriptions that will update the UI every time the properties of my Core Data objects changes.
Doing this means I don't need `objectDidChange` anymore and I can get rid of it.

## Separating concerns with ViewModels

So far, I've been using Combine within my view controller, but I actually think Combine really shines when you start using it to unwind the [Massive View Controller][] problem that is endemic to UIKit.
`UIViewController`s tend to have a lot of responsibilities, and while they do have "controller" in their name, they are inherently stuck interacting with view-layer concerns just by how UIKit is structured.
It's best to let them keep those responsibilities and find ways to extract the logic that controls the flow of data through your app into another place.
I think the [Model-view-viewmodel][mvvm] architecture does this well with the concept of ViewModels, especially when using Combine.

[massive view controller]: http://khanlou.com/2015/12/massive-view-controller/
[mvvm]: https://en.wikipedia.org/wiki/Model–view–viewmodel

Briefly, a view model is a sort of translation layer between the domain model of the app (the Core Data objects and methods in this case) and the view layer that displays UI to the user.
A view model will expose information about the model and about the state of the app in a way that is useful to the view.
This allows the view to not concern itself with logic about app data and app state: it just presents what the view model exposes, and tells the view model when the user does things that need to affect app state.

The way I've been implementing it, each view controller has a corresponding view model that it owns and binds to.
Using Combine, the view model can expose publishers for data that is useful to the view, and the view controller can subscribe to those publishers to keep its UI up-to-date.

> **Credit**: [Michał Cichecki][mcichecki] for publishing [a sample app][combine-mvvm-sample] showing how you might use Combine, UIKit, and MVVM together. It inspired to me to explore this path within my own app.

[mcichecki]: https://github.com/mcichecki
[combine-mvvm-sample]: https://github.com/mcichecki/Combine-MVVM

Splitting things up like this in my current example might look like this:

`embed:12-view-model.swift`

The rewards for this separation get bigger as the complexity of the app grows.
One thing I want to point out is that the view model is extremely testable.
The publishers don't care what is subscribed to them, so you can bind your view model to a fake view class and test the effects of different changes without creating any UI at all.

### Nesting view models

View models are also easier to nest than view controllers.
The cells for my to-do items are likely complex enough to deserve their own view model class: `ToDoItemCellViewModel`.
I'd like to have an instance of this class for each cell in my table.
It will expose publishers and actions for a specific to-do item, and the `UITableViewCell` subclass will bind to it.

`embed:13-cell-view-model.swift`

Awesome, but how do I actually keep track of these view models and wire them up to the cells?
I think the easiest way to do this is to use the cell view models themselves as the items in your diffable data source snapshots.
It makes it easy for your view controller to get the model for an index path, and you don't have to do extra bookkeeping to map between IDs or model objects and the view model instances.

But if I do that, I have a new problem: how do I keep a consistent list of view models in response to changes in my Core Data objects?
I'd like to avoid recreating cell view models unnecessarily: ideally I would only create a view model the first time a particular to-do item appeared in the list, and then I would keep reusing that view model as long as it was there.

### Observing collection differences

It turns out that a stream of lists is not really the right model for this.
Instead, what I'd really like is a stream where each item is a collection of changes to the list of objects.
With this, I can observe when to-do items are added and removed, and I can add or remove cell view models as needed from an array that I maintain in the parent view model.

Before I create a publisher to provide this to me, let's see what it would look like to use a hypothetical one.
I'm taking advantage of some new APIs in the Swift 5.1 standard library to support [diffing two collections][difference-from] and returning a [collection of the differences][collectiondifference] between them.

[difference-from]: https://developer.apple.com/documentation/swift/bidirectionalcollection/3200721-difference
[collectiondifference]: https://developer.apple.com/documentation/swift/collectiondifference

`embed:14-view-model-changes-subscription.swift`

To keep the list of view models up-to-date, I start with an empty list of them in a `@Published` property.
I use [zip][] with a transform closure to create a new publisher that combines the current list of view models with the next list of to-do item changes to produce a new list of view models.
I use `assign` to store this new list of view models back into my published property.
This should cause it to publish a new value, which will then get combined with the next list of changes from `itemChanges` and keep the cycle going.

[zip]: https://developer.apple.com/documentation/combine/publisher/3333685-zip

To make it more concrete, let's look at an example of how things would flow through these streams:

1.  `$itemViewModels` receives a subscription and publishes its initial value, the empty array.
    For now, nothing happens in our zipped publisher, because `itemChanges` hasn't published a value.
2.  `itemChanges` receives a subscription and publishes an initial list of collection changes to populate the list of items from an empty state.
3.  `zip` pairs these two values and calls the transformer.
    It sees a bunch of `.insert`s in the list of changes and creates view models for each to-do item that was inserted.

    `zip` looks kind of like `combineLatest` and has a similar signature, but it works differently.
    `zip` is named that because it works kind of like a zipper: it pairs up elements from two streams, one-by-one.
    If one stream publishes a value before the other has one ready to go, it will wait and publish nothing until the other stream has something to pair with.

    I need that here, because I never want to replay a set of changes onto a list of view models that has already been updated.

4.  This new list of view models is published and assigned to `itemViewModels`.
    This list is published as a new value on `$itemViewModels`, and the `zip` waits for a new list of changes from `itemChanges`.

5.  Now, say the user removes an item from the list.
    When they do, `itemChanges` will publish a list with a single `.remove` change.

6.  The `zip` will now publish the pair of current view models and this new change.
    The transformer will remove the corresponding view model from the list and publish the new list.

7.  That new list gets assigned back to `itemViewModels`, and the cycle continues from (4) for any subsequent insertions and removals.

So now I've shown that if I can get a publisher to give me a stream of changes to my list of model objects, I can keep a consistent list of view models for them.
But currently, that publisher doesn't exist.
Thankfully, nothing is stopping me from writing one myself, so that's exactly what I'll do.

### A custom publisher for managed object changes

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

* Each subscription will now have its own fetched results controller.
* That fetched results controller won't be created or start fetching until the subscriber is already listening.

By keeping this with the subscription, there's no way for any subscriber to miss messages because they weren't listening at the right time.

A few other differences from `FetchedObjectList`:

* I have to store the downstream subscriber, so that I can send it new values when they're available. It's kind of like when I was storing the `updateSnapshot` callback, but Combine is providing a lot of extra support around it.
* I'm not just logging the error anymore if the fetch request fails. Instead, I'm completing the subscription with a failure, so a subscriber can know when it's failed and explicitly handle it in some way (perhaps using the [catch][] or [assertNoFailure][] operator).

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

I hope this has demonstrated some of the ways you can use Combine in your UIKit apps to improve the flow of data and the architecture of the app:

* Use subjects or `@Published` properties to get data from imperative sources into reactive pipelines.
* Express common data transformations using custom operators.
* Separate concerns and simplify view controllers by binding UI to view models.
* Consider creating a custom `Publisher` to introduce new sources of data into your pipelines with complete control and strong encapsulation.