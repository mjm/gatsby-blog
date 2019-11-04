extension ManagedObjectChangesPublisher {
    private final class Inner<Downstream: Subscriber>: NSObject, Subscription, NSFetchedResultsControllerDelegate
        where Downstream.Input == CollectionDifference<Object>,
              Downstream.Failure == Error
    {
        private let downstream: Downstream
        private var fetchedResultsController: NSFetchedResultsController<Object>?

        init(
            downstream: Downstream,
            fetchRequest: NSFetchRequest<Object>,
            context: NSManagedObjectContext
        ) {
            self.downstream = downstream

            fetchedResultsController
                = NSFetchedResultsController(
                    fetchRequest: fetchRequest,
                    managedObjectContext: context,
                    sectionNameKeyPath: nil,
                    cacheName: nil)

            super.init()

            fetchedResultsController!.delegate = self

            do {
                try fetchedResultsController!.performFetch()
                updateDiff()
            } catch {
                downstream.receive(completion: .failure(error))
            }
        }
    }
}