class ToDoItemsViewModel {
    private let context: NSManagedObjectContext
    @Published private(set) var itemViewModels: [ToDoItemCellViewModel] = []

    var itemChanges: AnyPublisher<CollectionDifference<ToDoItem>, Never> {
        context.changesPublisher(for: ToDoItem.allItemsFetchRequest())
            .catch { _ in Empty() }
            .eraseToAnyPublisher()
    }

    init(context: NSManagedObjectContext = .view) {
        self.context = context

        $itemViewModels.applyingChanges(itemChanges) { toDoItem in
            ToDoItemCellViewModel(item: toDoItem)
        }.assign(to: \.itemViewModels, on: self).store(in: &cancellables)
    }
}