---
templateKey: blog-post
date: 2019-11-08T21:00:00Z
title: Creating Pipelines with Combine and Core Data
series: using Combine to observe Core Data changes
---

In [the last post](/observing-core-data-changes-with-combine/getting-started/), I adapted my existing observation of [Core Data][] objects to use [Combine][] by replacing callbacks with publishers and subscriptions.
But Combine can do a lot more than just make your callbacks harder to use!
It's designed to let you build data pipelines, where different parts of your app can produce data that can be consumed and transformed in interesting ways,and decoupled ways by other parts.
If I really think about what's happening in my app, there is a flow of data from Core Data to the fetched results controller to my view controller and finally to the diffable data source.
I'd really like to model that data flow in Combine in a declarative way.

[combine]: https://developer.apple.com/documentation/combine
[core data]: https://developer.apple.com/documentation/coredata

<!--more-->

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

I see a pattern here that I think is going to be pretty common.
Almost all of my view controllers are going to want to publish a snapshot and apply it to a data source.
I'd like it to be easier to create that subscription in my view controllers.

Combine includes three built-in ways to create subscriptions to publishers:

- [sink][]: You've already seen this one: you provide a closure that is called every time the publisher has a new value. You can also [provide a second closure][sink-with-completion] to handle the completion of the stream, but so far I haven't needed that in this example since these publishers never complete.
- [assign][]: You provide a key path and a root object, and the latest value the publisher sent will be assigned to that key path on the object. This is useful for updating UI components with values from publishers or for keeping state around for when imperative code asks for it later.
- [subscribe][]: You provide a subject which is sent all of the events the publisher receives. Not as common as the other too, but it does have uses.

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

[combinelatest]: https://developer.apple.com/documentation/combine/publisher/3333677-combinelatest

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

So now I've got a nice little pipeline, but it's all living in my view controller.
In [part three](/observing-core-data-changes-with-combine/mvvm/), I'll rearchitect my app to use MVVM to separate the logic for what data my table should contain from the code that actually displays it.
If you've been put off by more complex iOS app architectures like MVP or MVVM before, please stick with me.
Combine is going to make this kind of architecture feel practical and helpful instead of burdensome.
