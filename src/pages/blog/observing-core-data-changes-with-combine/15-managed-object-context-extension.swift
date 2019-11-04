extension NSManagedObjectContext {
    func changesPublisher<Object: NSManagedObject>(
        for fetchRequest: NSFetchRequest<Object>
    ) -> ManagedObjectChangesPublisher<Object> {
        ManagedObjectChangesPublisher(
            fetchRequest: fetchRequest,
            context: self
        )
    }
}