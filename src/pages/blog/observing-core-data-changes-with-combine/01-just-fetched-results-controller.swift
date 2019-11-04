class ToDoItemsViewController: UITableViewController {
    enum Section: Hashable {
        case items
    }

    // ...
    private var fetchedResultsController: NSFetchedResultsController<ToDoItem>!

    override func viewDidLoad() {
        super.viewDidLoad()

        // not shown: create the diffable data source

        fetchedResultsController
            = NSFetchedResultsController(
                fetchRequest: ToDoItem.fetchRequest(),
                managedObjectContext: context,
                sectionNameKeyPath: nil,
                cacheName: nil
            )

        fetchedResultsController.delegate = self

        do {
            try fetchedResultsController.performFetch()
            updateSnapshot(animated: false)
        } catch {
            NSLog("Could not fetch to-do items: \(error)")
        }
    }

    private func updateSnapshot(animated: Bool = true) {
        var snapshot = NSDiffableDataSourceSnapshot<Section, ToDoItem>()
        snapshot.appendSections([.items])
        snapshot.appendItems(fetchedResultsController.fetchedObjects ?? [], toSection: .items)
        dataSource.apply(snapshot, animatingDifferences: animated)
    }
}

extension ToDoItemsViewController: NSFetchedResultsControllerDelegate {
    func controllerDidChangeContent(_ controller: NSFetchedResultsController<NSFetchRequestResult>) {
        updateSnapshot()
    }
}