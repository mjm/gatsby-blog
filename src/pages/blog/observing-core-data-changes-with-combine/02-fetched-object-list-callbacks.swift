class FetchedObjectList<Object: NSManagedObject>: NSObject {
    let fetchedResultsController: NSFetchedResultsController<Object>
    let updateSnapshot: () -> Void
    let updateCell: (Object) -> Void

    init(
        fetchRequest: NSFetchRequest<Object>,
        managedObjectContext: NSManagedObjectContext,
        updateSnapshot: @escaping () -> Void,
        updateCell: @escaping (Object) -> Void
    ) {
        fetchedResultsController =
            NSFetchedResultsController(fetchRequest: fetchRequest,
                                       managedObjectContext: managedObjectContext,
                                       sectionNameKeyPath: nil,
                                       cacheName: nil)
        self.updateSnapshot = updateSnapshot
        self.updateCell = updateCell
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
}

extension FetchedObjectList: NSFetchedResultsControllerDelegate {
    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        updateSnapshot()
    }

    func controller(_ controller: NSFetchedResultsController<NSFetchRequestResult>, didChange anObject: Any, at indexPath: IndexPath?, for type: NSFetchedResultsChangeType, newIndexPath: IndexPath?) {
        updateCell(anObject as! ObjectType)
    }
}