func receive<S: Subscriber>(subscriber: S)
    where Output == S.Input, Failure == S.Failure
{
    let inner = Inner(
        downstream: subscriber,
        fetchRequest: fetchRequest,
        context: context
    )
    subscriber.receive(subscription: inner)
}