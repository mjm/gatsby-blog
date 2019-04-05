---
templateKey: microblog-post
date: '2018-12-18T03:56:08.914Z'
---

Lesson learned: always set up a dead letter queue for your SQS queues. Otherwise, you may be like me and end up using 300,000+ message receives in a few days for what should be a really low traffic app.

