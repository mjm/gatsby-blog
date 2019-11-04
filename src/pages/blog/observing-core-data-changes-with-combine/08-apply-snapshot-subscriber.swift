extension Publisher {
    func apply<Section, Item>(to dataSource: UITableViewDiffableDataSource<Section, Item>)
        -> AnyCancellable
    where Output == NSDiffableDataSourceSnapshot<Section, Item>, Failure == Never
    {
        sink { snapshot in
            dataSource.apply(snapshot)
        }
    }
}