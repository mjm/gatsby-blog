class FetchedObjectList<Object: NSManagedObject>: NSObject {
    let fetchedResultsController: NSFetchedResultsController<Object>

    private let onContentChange = PassthroughSubject<(), Never>()
    private let onObjectChange = PassthroughSubject<Object, Never>()

    init(
        fetchRequest: NSFetchRequest<Object>,
        managedObjectContext: NSManagedObjectContext
    ) {
        fetchedResultsController =
            NSFetchedResultsController(fetchRequest: fetchRequest,
                                       managedObjectContext: managedObjectContext,
                                       sectionNameKeyPath: nil,
                                       cacheName: nil)
        super.init()

        fetchedResultsController.delegate = self

        do {
            try fetchedResultsController.performFetch()
        } catch {
            NSLog("Error fetching objects: \(error)")
        }
    }

    var objects: [Object] {
        fetchedResultsController.fetchedObjects ?? []
    }

    var contentDidChange: AnyPublisher<(), Never> {
        onContentChange.eraseToAnyPublisher()
    }

    var objectDidChange: AnyPublisher<Object, Never> {
        onObjectChange.eraseToAnyPublisher()
    }
}

extension FetchedObjectList: NSFetchedResultsControllerDelegate {
    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        onContentChange.send()
    }

    func controller(_ controller: NSFetchedResultsController<NSFetchRequestResult>, didChange anObject: Any, at indexPath: IndexPath?, for type: NSFetchedResultsChangeType, newIndexPath: IndexPath?) {
        onObjectChange.send(anObject as! ObjectType)
    }
}