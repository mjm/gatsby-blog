class ToDoItemsViewModel {
    @Published private(set) var itemViewModels: [ToDoItemCellViewModel] = []

    var itemChanges: AnyPublisher<CollectionDifference<ToDoItem>, Never> {
        // ...
    }

    init() {
        $itemViewModels.zip(itemChanges) { existingModels, changes in
            var newModels = existingModels
            for change in changes {
                switch change {
                case .remove(let offset, _, _):
                    newModels.remove(at: offset)
                case .insert(let offset, let toDoItem, _):
                    let model = ToDoItemCellViewModel(item: toDoItem)
                    newModels.insert(transformed, at: offset)
                }
            }
            return newModels
        }.assign(to: \.itemViewModels, on: self).store(in: &cancellables)
    }
}