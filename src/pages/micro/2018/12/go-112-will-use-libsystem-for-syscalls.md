---
templateKey: microblog-post
date: '2018-12-20T15:00:20.980Z'
---

Go 1.12 will [use libSystem for syscalls on macOS/iOS](https://tip.golang.org/doc/go1.12#darwin): a bigger deal than it sounds. Go was impossible to use inside Apple because it wouldn't be compatible with unreleased OS versions. Going through libSystem fixes that!

