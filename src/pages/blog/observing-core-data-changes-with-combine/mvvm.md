---
templateKey: blog-post
date: 2019-11-08T22:00:00Z
title: Adopting MVVM with Combine and Core Data
series: using Combine to observe Core Data changes
---

In the [previous post](/observing-core-data-changes-with-combine/creating-pipelines/), I ended up with a [Combine][] publisher for the snapshots of data that my table view displays, so my table view was powered by a data pipeline.
This pipeline lives within my view controller class, but I actually think Combine really shines when you start using it to unwind the [Massive View Controller][] problem that is endemic to UIKit.

[combine]: https://developer.apple.com/documentation/combine
[core data]: https://developer.apple.com/documentation/coredata

<!--more-->

`UIViewController`s tend to have a lot of responsibilities, and while they do have "controller" in their name, from an MVC perspective they are inherently stuck interacting with view-layer concerns just by how UIKit is structured.
It's best to let them keep those responsibilities and find ways to extract the logic that controls the flow of data through your app into another place.
I think the [model-view-viewmodel][mvvm] (MVVM) architecture does this well with the concept of ViewModels, especially when using Combine.

[massive view controller]: http://khanlou.com/2015/12/massive-view-controller/
[mvvm]: https://en.wikipedia.org/wiki/Model–view–viewmodel

Briefly, a view model is a sort of translation layer between the domain model of the app (the [Core Data][] objects and methods in this case) and the view layer that displays UI to the user.
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
Thankfully, nothing is stopping me from writing one myself, so in [the final part of this series](/observing-core-data-changes-with-combine/custom-publisher/), that's exactly what I'll do.
