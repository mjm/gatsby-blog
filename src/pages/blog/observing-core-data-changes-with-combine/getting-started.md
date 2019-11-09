---
templateKey: blog-post
date: 2019-11-08T20:00:00.000Z
title: Getting Started with Combine and Core Data
series: using Combine to observe Core Data changes
syndication:
  - "https://twitter.com/mjmoriarity/status/1193024362955231232"
---

Because Apple released [SwiftUI][] and [Combine][] together, you could be forgiven for ignoring Combine if you're only using UIKit in your app.
I certainly ignored it for a while, but I think Combine provides a huge opportunity to use better app architectures in your iOS app without feeling like UIKit is fighting you the entire time.

I want to demonstrate a progression I went through in my app for observing data changes from [Core Data][].
I think that this shows the power that's available in Combine if you're willing to embrace it.

[swiftui]: https://developer.apple.com/documentation/swiftui
[combine]: https://developer.apple.com/documentation/combine
[core data]: https://developer.apple.com/documentation/coredata

<!--more-->

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

So why did I do this?
Well, this wasn't the only part of my app that was starting to use Combine in interesting ways.
I'd only just begun.
The benefits of using Combine compound the more your app uses it, and eventually a little bit of cancellable management seems like a fine price to pay.
In [part two](/observing-core-data-changes-with-combine/creating-pipelines/), I'll show how I embraced Combine even further to create pipelines for the data in my app.

[anycancellable]: https://developer.apple.com/documentation/combine/anycancellable
[store-in]: https://developer.apple.com/documentation/combine/anycancellable/3333294-store
