class FetchedObjectList<Object: NSManagedObject>: NSObject {
    // ...

    init(/* ... */) {
        // ...perform the initial fetch...

        sendCurrentObjects()
    }

    // ...

    private let onObjectsChange = CurrentValueSubject<[Object], Never>([])

    var objects: AnyPublisher<[Object], Never> { onObjectsChange.eraseToAnyPublisher() }

    private func sendCurrentObjects() {
        onObjectsChange.send(fetchedResultsController.fetchedObjects ?? [])
    }
}

extension FetchedObjectList: NSFetchedResultsControllerDelegate {
    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        sendCurrentObjects()
    }

    // ...
}