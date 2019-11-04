class ToDoItemCellViewModel {
    let item: ToDoItem

    init(item: ToDoItem) {
        self.item = item
    }

    var text: AnyPublisher<String, Never> {
        item.publisher(for: \.text).eraseToAnyPublisher()
    }

    var isChecked: AnyPublisher<Bool, Never> {
        item.publisher(for: \.isChecked).eraseToAnyPublisher()
    }

    func toggleChecked() {
        item.isChecked.toggle()
    }
}

class ToDoItemTableViewCell: UITableViewCell {
    var cancellables: Set<AnyCancellable>()
    var viewModel: ToDoItemCellViewModel?
    
    @IBOutlet var textLabel: UILabel!
    @IBOutlet var checkedButton: UIButton!

    func bind(to viewModel: ToDoItemCellViewModel) {
        self.viewModel = viewModel

        viewModel.text.assign(to: \.text, on: textLabel)
            .store(in: &cancellables)

        viewModel.isChecked
            .map { checked in checked ? "Checkbox_Checked" : "Checkbox" }
            .map { name in UIImage(named: name) }
            .sink { [checkedButton] image in
                checkedButton?.setImage(image, for: .normal)
            }.store(in: &cancellables)
    }

    @IBAction func toggleChecked() {
        viewModel?.toggleChecked()
    }

    override func prepareForReuse() {
        super.prepareForReuse()
        cancellables.removeAll()
    }
}