struct ManagedObjectChangesPublisher<
    Object: NSManagedObject
>: Publisher {
    typealias Output = CollectionDifference<Object>
    typealias Failure = Error

    let fetchRequest: NSFetchRequest<Object>
    let context: NSManagedObjectContext

    init(
        fetchRequest: NSFetchRequest<Object>,
        context: NSManagedObjectContext
    ) {
        self.fetchRequest = fetchRequest
        self.context = context
    }
}