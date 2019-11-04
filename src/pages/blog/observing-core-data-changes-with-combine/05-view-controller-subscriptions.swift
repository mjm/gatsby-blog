private var cancellables = Set<AnyCancellable>()

override func viewDidLoad() {
    super.viewDidLoad()

    // ...

    toDoItemsList
        = FetchedObjectList(
            fetchRequest: ToDoItem.fetchRequest(),
            managedObjectContext: context
        )

    toDoItemsList.contentDidChange.sink { [weak self] in
        self?.updateSnapshot()
    }.store(in: &cancellables)

    toDoItemsList.objectDidChange.sink { [weak self] toDoItem in
        // find and update the cell
    }.store(in: &cancellables)

    // ...
}