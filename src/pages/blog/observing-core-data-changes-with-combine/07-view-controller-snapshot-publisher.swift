override func viewDidLoad() {
    super.viewDidLoad()

    // ...

    let dataSource = self.dataSource
    snapshot.sink { snapshot in
        dataSource.apply(snapshot)
    }.store(in: &cancellables)

    // ...
}

typealias Snapshot = NSDiffableDataSourceSnapshot<Section, ToDoItem>

var snapshot: AnyPublisher<Snapshot, Never> {
    toDoItemsList.objects.map { toDoItems in
        var snapshot = Snapshot()
        snapshot.appendSections([.items])
        snapshot.appendItems(toDoItems, toSection: .items)
        return snapshot
    }.eraseToAnyPublisher()
}