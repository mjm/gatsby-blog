extension NSManagedObjectContext {
    // Make an easy accessor to grab the default view-layer (main thread) context
    // for your app.
    static var view: NSManagedObjectContext { /* ... */ }
}

class ToDoItemsViewModel {
    private let context: NSManagedObjectContext
    @Published private(set) var itemViewModels: [ToDoItemCellViewModel] = []

    var itemChanges: AnyPublisher<CollectionDifference<ToDoItem>, Never> {
        context.changesPublisher(for: ToDoItem.allItemsFetchRequest())
            .ignoreError() // converts Failure to Never, you could also handle with `catch`
            .eraseToAnyPublisher()
    }

    init(context: NSManagedObjectContext = .view) {
        self.context = context

        // this is the same as before
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