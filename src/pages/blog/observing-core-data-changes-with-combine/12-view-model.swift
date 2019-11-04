class ToDoItemsViewModel {
    private let itemsList: FetchedObjectList<ToDoItem>
    
    init() {
        itemsList = FetchedObjectList(/* ... */)
    }
    
    typealias Snapshot = NSDiffableDataSourceSnapshot<Section, ToDoItem>

    var snapshot: AnyPublisher<Snapshot, Never> {
        itemsList.objects.map { toDoItems in
            var snapshot = Snapshot()
            snapshot.appendSections([.items])
            snapshot.appendItems(toDoItems, toSection: .items)
            return snapshot
        }.eraseToAnyPublisher()
    }
}

class ToDoItemsViewController: UITableViewController {
    let viewModel: ToDoItemsViewModel

    // I encourage you to make a superclass for these rather than declare them
    // in every view controller.
    var cancellables = Set<AnyCancellable>()
    @Published var animate = false

    // Create the view model when loading the controller from the storyboard
    required init?(coder: NSCoder) {
        viewModel = ToDoItemsViewModel()
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // ...create the data source...

        viewModel.snapshot.apply(to: dataSource, animate: $animate)
            .store(in: &cancellables)

        // ...more subscriptions...
    }
}