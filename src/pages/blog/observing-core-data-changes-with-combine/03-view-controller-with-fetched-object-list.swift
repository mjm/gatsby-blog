class ToDoItemsViewController: UITableViewController {
    // ...

    private var toDoItemsList: FetchedObjectList<ToDoItem>!

    override func viewDidLoad() {
        super.viewDidLoad()

        // not shown: create the diffable data source

        toDoItemsList
            = FetchedObjectList(
                fetchRequest: ToDoItem.fetchRequest(),
                managedObjectContext: context,
                updateSnapshot: { [weak self] in
                    self?.updateSnapshot()
                },
                updateCell: { [weak self] toDoItem in
                    // look up the item's cell and update UI components from the new state
                }
            )

        updateSnapshot(animated: false)
    }

    private func updateSnapshot(animated: Bool = true) {
        var snapshot = NSDiffableDataSourceSnapshot<Section, ToDoItem>()
        snapshot.appendSections([.items])
        snapshot.appendItems(fetchedResultsController.fetchedObjects ?? [], toSection: .items)
        dataSource.apply(snapshot, animatingDifferences: animated)
    }
}