---
templateKey: blog-post
date: 2019-10-18T20:00:00Z
title: Share Menus with Mac Catalyst
pinned: true
---

I've been working on porting a new iOS app to the Mac using Catalyst.
Part of my app uses `UIActivityViewController` to support sharing projects you create in the app via a public URL.
I had trouble finding good resources about how to make share menus first-class in Catalyst, so I thought I would write up what I found from digging through API docs.

<!--more-->

## What happens if you do nothing?

Not to call them out, as I'm very happy that there's an official Twitter for Mac app again, but it's a good example of what happens if you just let Catalyst do its thing when you present a share sheet.

![Twitter for Mac presenting a share menu at the bottom right corner of the window](/media/2019/10/catalyst-share-no-changes.png)

**Good:** The UIKit `UIActivityViewController` was translated into the right Mac equivalent with **no code changes.**
That's very cool, because the equivalent on macOS has a pretty different API.

**The Bad:** The menu showed up in possibly the most ridiculous place it could have appeared.

This is totally fixable though.
Depending on how your app is structured, you have a few different options for how to present your share sheet.

## Just tell UIKit where to put it

If you're already supporting iPad for your app, you might already be doing the right thing here.

When you present a `UIActivityViewController` on iPhone, it's sufficient to just create it and present it, because it's going to do a fullscreen modal and doesn't need any more information to do that.

```swift
@IBAction func share(_ sender: Any?) {
    let items = [URL(string: "https://www.example.com/")!]
    let activityController = UIActivityViewController(activityItems: items,
                                                      applicationActivities: nil)
    present(activityController, animated: true)
}
```

But this actually doesn't work on iPad.
If you try to do it, your app will throw an exception and crash!
The reason will look something like this:

```
UIPopoverPresentationController (<UIPopoverPresentationController: 0x7fd60b5d3360>) should have a non-nil sourceView or barButtonItem set before the presentation occurs.
```

On iPad, the activity view controller is trying to present as a popover, but UIKit doesn't know where to show it.
You can tell it where by doing exactly what the exception is suggesting and setting a property on the popover presentation controller to indicate the source of the popover.

```swift
@IBAction func share(_ sender: Any?) {
    let items = [URL(string: "https://www.example.com/")!]
    let activityController = UIActivityViewController(activityItems: items,
                                                      applicationActivities: nil)

    // if the action is sent from a bar button item
    activityController.popoverPresentationController?.barButtonItem = sender as? UIBarButtonItem

    // if the action is sent from some other kind of UIView (a table cell or button)
    activityController.popoverPresentationController?.sourceView = sender as? UIView

    present(activityController, animated: true)
}
```

You may have to do a little more work than this to determine the source for your menu, but it should be doable.
If you do this, then your share menu should present from a much more sensible place in your app on macOS as well.

![Share menu presented from a source view](/media/2019/10/catalyst-share-source-view.png)

This is a huge improvement, and it might be where you stop, but there are some more Mac-specific ways to incorporate a share menu into your app.

## A share button in your toolbar

It's a pretty common pattern in Apple's own macOS apps to include a share button on the right side of an app's toolbar.
If your app supports sharing and includes a toolbar, I'd recommend you follow this pattern too.
Your first instinct might be to just create an `NSToolbarItem` in your `NSToolbarDelegate` that calls the action to present your sharing menu:

```swift
func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
    switch itemIdentifier {
    case .share:
        let item = NSToolbarItem(itemIdentifier: .share)
        item.image = UIImage(systemName: "square.and.arrow.up")
        item.isBordered = true
        item.action = #selector(RootViewController.share(_:))
        return item
    // ...other items
    }
}
```

This results in an icon that looks a little bit off, but it has an even worse problem: where do you present your popover from?
`NSToolbarItem` inherits from `NSObject`: it's not a `UIBarButtonItem` nor is it a `UIView`.
Your only other option would be to try to figure out the rect for the toolbar button and set that as the `sourceRect`, but let's not go down that road.
There's a better way to do this, and it's new to both AppKit and Mac Catalyst in Catalina: `NSSharingServicePickerToolbarItem`.

Let's try swapping out our toolbar item for this new one:

```swift
func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
    switch itemIdentifier {
    case .share:
        let item = NSSharingServicePickerToolbarItem(itemIdentifier: .share)
        item.action = #selector(RootViewController.share(_:))
        return item
    // ...other items
    }
}
```

Oh no! Now the icon looks right, but the button is always disabled.
It turns out `NSSharingServicePickerToolbarItem` doesn't use the `action` property at all.
Instead of performing an arbitrary action, this toolbar item will handle all the work if you just tell it how to get the items to share when it needs to.
You do this by setting `activityItemsConfiguration` to an object that implements the `UIActivityItemsConfigurationReading` protocol.

> **Aside:** The `activityItemsConfiguration` property is specific to Mac Catalyst. When using AppKit, you provide a `delegate` to the toolbar item instead, which has a different API.

UIKit provides a concrete implementation of this protocol called `UIActivityItemsConfiguration`, but I don't think it will be useful in this situation.
You have to provide the items to share at initialization time, and most applications want to change what is shareable based on where the user is in the application, so let's implement the protocol ourselves.
I think the root view controller for your window is a good candidate to implement this, as it's likely to have all the relevant state for where the user is in the app to know what should be shared.

The implementation can be as simple as implementing one method:

```swift
extension RootViewController: UIActivityItemsConfigurationReading {
    var itemProvidersForActivityItemsConfiguration: [NSItemProvider] {
        if let project = selectedProject {
            return [project.itemProvider]
        }

        return []
    }
}

// then in the toolbar delegate
func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
    switch itemIdentifier {
    case .share:
        let item = NSSharingServicePickerToolbarItem(itemIdentifier: .share)
        item.activityItemsConfiguration = rootViewController
        return item
    // ...other items
    }
}
```

Each sharable item is represented by an `NSItemProvider`, so you'll need a way to create one from the model objects you want to share (in this example, a `Project`).
If you've implemented drag-and-drop in table views or collection views, you've used NSItemProviders before.
They're a way to capture the various representations of an object in an app such that it can be sent to another app, which can then use whichever representation is appropriate.

It's a bit frustrating that we need to use `NSItemProvider` for this, since we already had to implement either `UIActivityItemSource` or `UIActivityItemProvider` to be able to use `UIActivityViewController`.
The implementations for these two different APIs are similar, but not similar enough to make it trivial, at least if you have meaningful work you need to do to produce the sharable item.

But this is what we must do, so let's define a way to create an item provider from a project.
If you already have everything you need in memory or on disk, you can probably just use one of the initializers for `NSItemProvider` to provide the sharable data, and this will be pretty simple.
In my case, I need to send some data to a server before the app can know what URL to share, so the item provider needs to be set up to do that on demand.

```swift
extension Project {
    var itemProvider: NSItemProvider {
        let itemProvider = NSItemProvider()
        itemProvider.registerObject(ofClass: NSURL.self, visibility: .all) { completion in
            let progress = Progress.discreteProgress(totalUnitCount: 1)
            
            self.publish { error in
                if error != nil {
                    completion(nil, error)
                } else {
                    progress.completedUnitCount = 1
                    completion(self.publishedURL as NSURL, nil)
                }
            }
            
            return progress
        }
        return itemProvider
    }
}
```

No matter how you implement it, your share button should be ready to go now.

![Share toolbar button with menu in the right spot](/media/2019/10/catalyst-share-toolbar-item.png)

There's a bonus to including a share button in your toolbar.
If you do still present a `UIActivityViewController` in your app without a source view or bar button item, the menu will now display near your toolbar button instead of at the bottom left corner of the window!
This is just a little bit of magic that UIKit does for Catalyst.

## Sharing from the menu bar

I've [written before](/2018/06/750/) about how I think supporting the menu bar is part of what helps make a Mac app good.
So if we've already gone the extra mile to support sharing in our app from the toolbar, we should also support it in the menu bar!
Your app's main menu can be defined by overriding `buildMenu(with:)` in your application delegate, so let's add a `Share…` command to our File menu:

```swift
override func buildMenu(with builder: UIMenuBuilder) {
    guard builder.system == .main else { return }

    builder.insertChild(UIMenu(title: "", options: .displayInline, children: [
        UICommand(title: "Share…", action: #selector(RootViewController.share(_:))),
    ]), atEndOfMenu: .file)
}
```

![A basic Share menu item in the File menu](/media/2019/10/catalyst-share-menu-command.png)

If you added a share button to your toolbar as described above, then when you choose the "Share…" item in the menu, your share menu will appear near your toolbar button.
Which is...okay, but not ideal.
Mac screens can be pretty large, so there might be a great deal of mouse travel needed to go from where the menu item was clicked to where the new menu showed up.

If you look at some of the built-in apps on your Mac, you'll notice that their File menus have a Share item that's actually a submenu.
This is a nicer way to share from the menu bar, and if you've already done the work to support the sharing toolbar button, there isn't much more you need to do to get a menu like this in your own app.

First, let's update our `UICommand` to include a special tag to indicate that it should be a share menu:

```swift
override func buildMenu(with builder: UIMenuBuilder) {
    guard builder.system == .main else { return }

    builder.insertChild(UIMenu(title: "", options: .displayInline, children: [
        UICommand(title: "Share",
                  action: #selector(RootViewController.share(_:)),
                  propertyList: UICommandTagShare),
    ]), atEndOfMenu: .file)
}
```

The `propertyList` on a `UICommand` allows arbitrary property list data to be associated with the command.
UIKit provides `UICommandTagShare` as an opaque piece of data that tells it to make the command into a share menu.
When you use this tag, the command's action, though still required, will be ignored.

If you run your app at this point, you might be a bit disappointed:

![A Share submenu with no sharable items](/media/2019/10/catalyst-share-menu-no-items.png)

We need to specify what is currently shareable in our app.
Just like `NSSharingServicePickerToolbarItem`, `UIResponder` also has an `activityItemsConfiguration` property, but it only seems to have an effect when used with your application delegate.

You can set this property when you connect to the scene for your macOS UI in your scene delegate.
For instance, if you implemented `UIActivityItemsConfigurationReading` on your root view controller:

```swift
func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    let scene = scene as! UIWindowScene
    let rootViewController = window!.rootViewController as! RootViewController
    
    (UIApplication.shared.delegate as! AppDelegate).activityItemsConfiguration = rootViewController
}
```

Now when you run your app, if you are in a state where something in your app is shareable, you should see a useful Share menu in your File menu:

![A Share submenu in the File menu with destinations](/media/2019/10/catalyst-share-submenu.png)

---

I hope this helps you make sharing in your iOS app feel first-class when running on macOS.
While it's a little bit of extra work to support correctly, I think it makes the experience a lot better for users of your app.