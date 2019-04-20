---
templateKey: blog-post
date: 2019-04-14T16:00:00+00:00
title: Struggles with Typography.js and Tailwind
pinned: true
---

On this site, I'm currently using both [Tailwind](https://tailwindcss.com/) and [Typography.js](https://kyleamathews.github.io/typography.js/) for styling. I really like both of these projects, but they do not interact very well with each other. I want to lay out why that is and the challenges I've been having with it.

<!--more-->

## Why do I use these?

### Tailwind

I've been using Tailwind on many of my projects because, frankly, I'm not very good at CSS. Tailwind offers a bunch of things that lower the barrier to entry for me to make a good-looking web site/app: consistent color palettes, easy flexbox, speedy iteration. Especially when I was just getting back into web development, I needed this: plain CSS was beyond me, and heavier frameworks like Bulma or Bootstrap lacked the flexibility to create something outside-the-box.

### Typography.js

Typography.js is a newer discovery for me. It creates a set of styles that define the typographic system for your page. It establishes sizes for headers and body text, sets fonts appropriately for each, and controls spacing between elements. And it does it all with _math_.

This is really useful for web sites moreso than for web apps. For instance, the posts and pages on this site have a bunch of content written in Markdown, where it's not easy or desirable to try to stick Tailwind utility classes on everything. For this content, I want to be able to just use bare HTML elements and have it come out looking good. Typography.js does an excellent job with this.

## Competitive styling

Tailwind includes a pretty aggressive base style reset: no margins or padding for anything, for example, and all elements have their font sizes and stylings reset as well. This is a good thing: it means that Tailwind's utility classes can stay concerned with adding styling and not worry about what things they have to take away as well. You'll see later why this is important.

When I tried to include Typography.js styles on a page with this reset, I got: nothing! Tailwind's reset overrides every single thing Typography.js is trying to do.

One solution to this is to just forego Tailwind's CSS reset. Typography.js includes Normalize.css with it, which is also a large part of what Tailwind uses, so you're not _that far_ from where you want to be. That's what I've done on this site. But there are still some issues:

#### Spacing is all wrong

At least in its default configuration, Tailwind uses `rem` units for width, height, and spacing in its utility classes. When you're just using Tailwind, this is great. But because Typography.js adjusts the `font-size` of the root `html` element, a `rem` is not the same size that Tailwind expects. On this site, body text is `20px`, so all of those sizes are a little bit bigger than they're supposed to be. This also means that the gaps between sizes are a little too big, so it's harder to get precision in the layout.

I could certainly tweak the default config to adjust these values to compensate for different base font size, and that may be what I do. But part of the appeal of Tailwind is that the default config is already solid.

#### Borders and lists: missing resets

There are a few cases where the resets in Tailwind's base styles are needed for the utility classes to behave correctly. One case is borders. In Tailwind, you can add a border by applying two classes: one for the color, and one for width (and sides). So to add a 2px green border to the bottom of an element, it would look like this:

```html
<div class="border-green border-b-2">...</div>
```

Without the correct reset, this won't actually apply any border at all. This is because [Tailwind applies `border-style: solid` to all elements by default](https://github.com/tailwindcss/tailwindcss/blob/master/css/preflight.css#L438) and resets the `border-width` to 0. With that, the styles above are sufficient to apply a border. Without them, you actually have to do something much grosser:

```html
<div class="border-green border-0 border-b-2 border-solid">...</div>
```

Notice that we have to both apply the correct `border-style` and reset the width to 0 on the other edges. I could probably fix this particular issue by just copying this reset into my own stylesheet.

Lists (and other block elements) have a milder issue: Typography.js will have added a margin to them that may need to be reset to get the expected layout.

## Scoping Typography.js

What I really want is to be able to use Tailwind as-is for most of the site, and only have Typography.js styles for my blog content. So that's what I tried to do.

Typography.js doesn't have a way to do this built-in: it applies styles to `html` and `body`. So I tried to just generate the styles, dump them in a file, and then use SASS to scope them to a `.typography` selector. I promoted `html` and `body` styles to the `.typography` element itself. And I put back Tailwind's base styles.

And it kind of worked. My Tailwind styles returned to normal now that the font-size wasn't being messed with, and my `.typography` sections had the font I expected.

But a bunch of things were wrong: the spacing between paragraphs and the size of headers was not right. It turns out this is the exact reverse problem with the base `font-size`. Typography.js defines the font size of heading elements in terms of `rem`s, so since the root font-size of the page is not the expected 20px, every heading was smaller than it was supposed to be. The same was true for margins.

I tried switching the sizes to use `em`s, which would be relative to the right font size, but that also doesn't work. The headings all have bottom margins, and defining those in `em`s makes them relative to the headings font size. Since those are all different, it's hard to use a consistent value for margins when using `em`s.

So I've abandoned this approach.

---

As of now, I'm continuing to use these two together and tolerating some of the weirdness. I see two paths forward to improving the situation:

1. Make some of the config and stylesheet changes I mention above to workaround some of the more painful incompatibilities.
2. Stop using Tailwind, and write my own dang CSS. This could be an opportunity to explore some other approaches to styling in React/Gatsby.
